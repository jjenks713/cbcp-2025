const express = require('express');
const multer = require('multer');

const { client, envParams, isConfigured, LOCALE } = require('../lib/contentfulAdmin');
const { unwrapFields, wrapFields, applyFields, normalizeContentType } = require('../lib/contentfulFields');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(requireAuth, requireAdmin);

router.use((req, res, next) => {
  if (!isConfigured) {
    return res
      .status(503)
      .json({ error: 'Contentful admin is not configured (CONTENTFUL_SPACE_ID/CONTENTFUL_CMA_TOKEN)' });
  }
  next();
});

// contentful-management errors carry the API response as a JSON string in
// err.message. For validation failures (422), turn its details into a
// readable message - e.g. "itemId: must be unique" - instead of the bare
// "Validation error".
function parseContentfulError(err) {
  let body;
  try {
    body = JSON.parse(err.message);
  } catch {
    return null;
  }
  const problems = (body.details?.errors || []).map((e) => {
    const field = Array.isArray(e.path) && e.path[0] === 'fields' ? e.path[1] : null;
    const reason = e.name === 'unique' ? 'must be unique - another entry already uses this value' : e.details || e.name;
    return field ? `${field}: ${reason}` : reason;
  });
  return { status: body.status, message: problems.length ? problems.join('; ') : body.message };
}

// Lets each route just `await` Contentful calls without a try/catch of its own.
function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/** An entry as the admin UI sees it - flat field values plus the timestamps it sorts/shows by. */
function toEntryDto(entry, fieldDefs) {
  return {
    id: entry.sys.id,
    createdAt: entry.sys.createdAt,
    updatedAt: entry.sys.updatedAt,
    fields: unwrapFields(entry.fields, fieldDefs),
  };
}

async function getFieldDefs(contentTypeId) {
  const contentType = await client.contentType.get({ ...envParams, contentTypeId });
  return normalizeContentType(contentType).fields;
}

router.get(
  '/content-types',
  asyncHandler(async (req, res) => {
    const result = await client.contentType.getMany(envParams);
    res.json({ contentTypes: result.items.map(normalizeContentType) });
  })
);

// Used to resolve asset Link fields (e.g. artwork's cover image) to a URL
// the admin UI can preview, and to populate the asset-picker on the form.
router.get(
  '/assets',
  asyncHandler(async (req, res) => {
    const result = await client.asset.getMany({ ...envParams, query: { limit: 1000 } });
    res.json({
      assets: result.items.map((a) => ({
        id: a.sys.id,
        title: a.fields.title?.[LOCALE] ?? '',
        url: a.fields.file?.[LOCALE]?.url ? `https:${a.fields.file[LOCALE].url}` : null,
      })),
    });
  })
);

router.get(
  '/entries/:contentTypeId',
  asyncHandler(async (req, res) => {
    const { contentTypeId } = req.params;
    const fieldDefs = await getFieldDefs(contentTypeId);
    const result = await client.entry.getMany({
      ...envParams,
      query: { content_type: contentTypeId, limit: 1000 },
    });
    res.json({
      entries: result.items.map((item) => toEntryDto(item, fieldDefs)),
    });
  })
);

router.post(
  '/entries/:contentTypeId',
  asyncHandler(async (req, res) => {
    const { contentTypeId } = req.params;
    const fieldDefs = await getFieldDefs(contentTypeId);
    const fields = applyFields({}, wrapFields(req.body.fields || {}, fieldDefs));
    const created = await client.entry.create({ ...envParams, contentTypeId }, { fields });
    let published;
    try {
      published = await client.entry.publish({ ...envParams, entryId: created.sys.id }, created);
    } catch (err) {
      // Some validations (e.g. unique) only run at publish - don't leave the
      // rejected entry behind as an orphaned draft.
      await client.entry.delete({ ...envParams, entryId: created.sys.id }).catch(() => {});
      throw err;
    }
    res.status(201).json({ entry: toEntryDto(published, fieldDefs) });
  })
);

router.put(
  '/entries/:contentTypeId/:entryId',
  asyncHandler(async (req, res) => {
    const { contentTypeId, entryId } = req.params;
    const fieldDefs = await getFieldDefs(contentTypeId);
    const current = await client.entry.get({ ...envParams, entryId });
    const fields = wrapFields(req.body.fields || {}, fieldDefs);
    const updated = await client.entry.update(
      { ...envParams, entryId },
      { ...current, fields: applyFields(current.fields, fields) }
    );
    const published = await client.entry.publish({ ...envParams, entryId }, updated);
    res.json({ entry: toEntryDto(published, fieldDefs) });
  })
);

// Refuses while other entries still link here (e.g. a category artworks
// are tagged with) - deleting it would leave them with broken links on the
// live site. The admin has to unlink or delete those first.
router.delete(
  '/entries/:contentTypeId/:entryId',
  asyncHandler(async (req, res) => {
    const { contentTypeId, entryId } = req.params;
    const entry = await client.entry.get({ ...envParams, entryId });
    if (entry.sys.contentType.sys.id !== contentTypeId) {
      return res.status(404).json({ error: `No ${contentTypeId} entry ${entryId}` });
    }

    const referrers = await client.entry.getMany({ ...envParams, query: { links_to_entry: entryId, limit: 100 } });
    if (referrers.items.length) {
      const typeNames = new Map();
      const labels = [];
      for (const ref of referrers.items.slice(0, 5)) {
        const typeId = ref.sys.contentType.sys.id;
        if (!typeNames.has(typeId)) typeNames.set(typeId, await client.contentType.get({ ...envParams, contentTypeId: typeId }));
        const type = typeNames.get(typeId);
        labels.push(`${ref.fields[type.displayField]?.[LOCALE] ?? 'Untitled'} (${type.name})`);
      }
      const more = referrers.total > labels.length ? `, and ${referrers.total - labels.length} more` : '';
      return res.status(409).json({
        error: `Can't delete - still used by ${referrers.total} ${referrers.total === 1 ? 'entry' : 'entries'}: ${labels.join(', ')}${more}. Remove it from those first.`,
      });
    }

    if (entry.sys.publishedVersion) await client.entry.unpublish({ ...envParams, entryId });
    await client.entry.delete({ ...envParams, entryId });
    res.status(204).end();
  })
);

router.post(
  '/assets',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'file is required' });

    const created = await client.asset.createFromFiles(envParams, {
      fields: {
        title: { [LOCALE]: req.body.title || req.file.originalname },
        file: {
          [LOCALE]: {
            contentType: req.file.mimetype,
            fileName: req.file.originalname,
            file: req.file.buffer,
          },
        },
      },
    });

    // createFromFiles only uploads + creates the asset - it never triggers
    // processing, so the CDN url (required to publish) would never appear.
    // processForAllLocales kicks processing off and polls until it's done.
    let processed;
    try {
      processed = await client.asset.processForAllLocales(envParams, created);
    } catch (err) {
      if (err.name === 'AssetProcessingTimeout') err.status = 504;
      throw err;
    }

    const published = await client.asset.publish({ ...envParams, assetId: processed.sys.id }, processed);
    res.status(201).json({
      asset: {
        id: published.sys.id,
        url: published.fields.file?.[LOCALE]?.url ? `https:${published.fields.file[LOCALE].url}` : null,
      },
    });
  })
);

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('[admin-contentful]', err);
  const contentful = parseContentfulError(err);
  res
    .status(contentful?.status || err.status || 500)
    .json({ error: contentful?.message || err.message || 'Contentful request failed' });
});

module.exports = router;
