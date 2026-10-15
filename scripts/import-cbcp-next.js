/**
 * One-time bulk import: pulls artwork + images out of the old cbcp-next
 * (Next.js) app's data files and public/images folder, and creates
 * Category + Artwork entries for them in Contentful.
 *
 * Source -> category mapping (mirrors cbcp-next's own nav structure):
 *   main-data.js       -> Prints (top-level)
 *   books-data.js      -> Artist Books (subcategory of Prints); each book
 *                         becomes one Artwork entry, coverImage = its first
 *                         page image, images[] = the full spread
 *   drawings-data.js   -> Drawings (top-level)
 *   commission-data.js -> every commission image already exists in
 *                         drawings-data.js (verified: 16/16 overlap), so no
 *                         separate entries are created for it. Instead, the
 *                         matching Drawings entries also get the Commissions
 *                         category tag — one asset, one entry, two tags.
 *
 * Idempotent / resumable:
 *  - Each image is uploaded once; local path -> Contentful asset id is
 *    cached in .import-data/asset-cache.json, so reruns skip re-uploading.
 *  - Each artwork/category gets a deterministic entry id (slug-based), and
 *    existing entries are skipped, so a failed/interrupted run can just be
 *    re-invoked.
 *
 * Usage: node scripts/import-cbcp-next.js
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const contentfulManagement = require('contentful-management');

const SPACE_ID = process.env.REACT_APP_CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID = process.env.REACT_APP_CONTENTFUL_ENVIRONMENT || 'master';
const CMA_TOKEN = process.env.CONTENTFUL_CMA_TOKEN;
const LOCALE = 'en-US';

const NEXT_APP_DIR = 'C:/Users/joshj/Documents/Workspace/Repos/cbcp-next';
const PUBLIC_DIR = path.join(NEXT_APP_DIR, 'public');
const IMPORT_DATA_DIR = path.join(__dirname, '.import-data');
const ASSET_CACHE_PATH = path.join(IMPORT_DATA_DIR, 'asset-cache.json');

if (!SPACE_ID || !CMA_TOKEN) {
  console.error('Missing REACT_APP_CONTENTFUL_SPACE_ID or CONTENTFUL_CMA_TOKEN in .env.local');
  process.exit(1);
}

const { mainData } = require(path.join(IMPORT_DATA_DIR, 'main-data.js'));
const { booksData } = require(path.join(IMPORT_DATA_DIR, 'books-data.js'));
const { commissionData } = require(path.join(IMPORT_DATA_DIR, 'commission-data.js'));
const { drawingsData } = require(path.join(IMPORT_DATA_DIR, 'drawings-data.js'));

// -----------------------------------------------------------------------
// small utils
// -----------------------------------------------------------------------

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[’'"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, { attempts = 5, baseDelayMs = 1000 } = {}) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (err) {
      const status = err.status || err.response?.status;
      const isLast = i === attempts - 1;
      if (status === 429 && !isLast) {
        const wait = baseDelayMs * 2 ** i;
        console.log(`  (rate limited, retrying in ${wait}ms)`);
        // eslint-disable-next-line no-await-in-loop
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  return undefined;
}

function loadAssetCache() {
  if (!fs.existsSync(ASSET_CACHE_PATH)) return {};
  return JSON.parse(fs.readFileSync(ASSET_CACHE_PATH, 'utf8'));
}

function saveAssetCache(cache) {
  fs.writeFileSync(ASSET_CACHE_PATH, JSON.stringify(cache, null, 2));
}

const CONTENT_TYPE_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
};

// -----------------------------------------------------------------------
// asset upload (with local-path -> asset-id cache)
// -----------------------------------------------------------------------

const assetCache = loadAssetCache();

async function uploadAsset(client, localUrl, title) {
  if (assetCache[localUrl]) return assetCache[localUrl];

  const filePath = path.join(PUBLIC_DIR, localUrl);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPE_BY_EXT[ext];
  if (!contentType) throw new Error(`Unsupported image extension for ${localUrl}`);

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const params = { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID };

  const asset = await withRetry(() =>
    client.asset.createFromFiles(params, {
      fields: {
        title: { [LOCALE]: title },
        description: { [LOCALE]: '' },
        file: { [LOCALE]: { contentType, fileName, file: fileBuffer } },
      },
    })
  );

  // createFromFiles only registers the upload — processing (which produces
  // the real asset URL) has to be triggered and waited on explicitly.
  const processed = await withRetry(() => client.asset.processForAllLocales(params, asset));

  const published = await withRetry(() =>
    client.asset.publish({ ...params, assetId: processed.sys.id }, processed)
  );

  assetCache[localUrl] = published.sys.id;
  saveAssetCache(assetCache);
  console.log(`  uploaded asset: ${localUrl} -> ${published.sys.id}`);
  return published.sys.id;
}

// -----------------------------------------------------------------------
// categories
// -----------------------------------------------------------------------

const CATEGORY_DEFS = [
  { id: 'cat-prints', name: 'Prints', slug: 'prints', parentId: null },
  { id: 'cat-artist-books', name: 'Artist Books', slug: 'artist-books', parentId: 'cat-prints' },
  { id: 'cat-drawings', name: 'Drawings', slug: 'drawings', parentId: null },
  { id: 'cat-commissions', name: 'Commissions', slug: 'commissions', parentId: null },
];

async function ensureCategories(client) {
  const params = (contentTypeId) => ({
    spaceId: SPACE_ID,
    environmentId: ENVIRONMENT_ID,
    contentTypeId,
  });

  for (const def of CATEGORY_DEFS) {
    const entryParams = { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID, entryId: def.id };
    try {
      // eslint-disable-next-line no-await-in-loop
      await client.entry.get(entryParams);
      console.log(`- category "${def.id}" already exists, skipping.`);
      // eslint-disable-next-line no-continue
      continue;
    } catch (err) {
      const notFound = err.name === 'NotFound' || err.status === 404 || err.response?.status === 404;
      if (!notFound) throw err;
    }

    const fields = {
      name: { [LOCALE]: def.name },
      slug: { [LOCALE]: def.slug },
    };
    if (def.parentId) {
      fields.parentCategory = {
        [LOCALE]: { sys: { type: 'Link', linkType: 'Entry', id: def.parentId } },
      };
    }

    // eslint-disable-next-line no-await-in-loop
    const entry = await withRetry(() =>
      client.entry.createWithId(
        { ...entryParams, contentTypeId: 'category' },
        { fields }
      )
    );
    // eslint-disable-next-line no-await-in-loop
    await withRetry(() => client.entry.publish({ ...entryParams }, entry));
    console.log(`+ created category "${def.id}" (${def.name}).`);
  }
}

// -----------------------------------------------------------------------
// artwork entries
// -----------------------------------------------------------------------

async function ensureArtwork(client, { id, title, categoryIds, description, medium, size, edition, coverAssetId, imageAssetIds }) {
  const entryParams = { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID, entryId: id };

  try {
    await client.entry.get(entryParams);
    console.log(`- artwork "${id}" already exists, skipping.`);
    return;
  } catch (err) {
    const notFound = err.name === 'NotFound' || err.status === 404 || err.response?.status === 404;
    if (!notFound) throw err;
  }

  const fields = {
    title: { [LOCALE]: title },
    categories: {
      [LOCALE]: categoryIds.map((cid) => ({ sys: { type: 'Link', linkType: 'Entry', id: cid } })),
    },
    coverImage: { [LOCALE]: { sys: { type: 'Link', linkType: 'Asset', id: coverAssetId } } },
  };
  if (description) fields.description = { [LOCALE]: description };
  if (medium) fields.medium = { [LOCALE]: medium };
  if (size) fields.size = { [LOCALE]: size };
  if (edition) fields.edition = { [LOCALE]: edition };
  if (imageAssetIds && imageAssetIds.length > 0) {
    fields.images = {
      [LOCALE]: imageAssetIds.map((aid) => ({ sys: { type: 'Link', linkType: 'Asset', id: aid } })),
    };
  }

  const entry = await withRetry(() =>
    client.entry.createWithId({ ...entryParams, contentTypeId: 'artwork' }, { fields })
  );
  await withRetry(() => client.entry.publish(entryParams, entry));
  console.log(`+ created artwork "${id}" (${title}).`);
}

// -----------------------------------------------------------------------
// main
// -----------------------------------------------------------------------

async function main() {
  const client = contentfulManagement.createClient({ accessToken: CMA_TOKEN }, { type: 'plain' });

  console.log('--- Categories ---');
  await ensureCategories(client);

  // Commission image urls, used to tag matching Drawings entries with the
  // Commissions category too (see header comment — no duplicate entries).
  const commissionUrls = new Set(commissionData.map((c) => c.url));

  console.log('\n--- Prints (main-data.js) ---');
  for (const item of mainData) {
    const id = `artwork-prints-${slugify(item.name)}`;
    // eslint-disable-next-line no-await-in-loop
    const coverAssetId = await uploadAsset(client, item.url, item.name);
    // eslint-disable-next-line no-await-in-loop
    await ensureArtwork(client, {
      id,
      title: item.name,
      categoryIds: ['cat-prints'],
      medium: item.med,
      size: item.size,
      edition: item.ed,
      coverAssetId,
    });
  }

  console.log('\n--- Artist Books (books-data.js) ---');
  for (const book of booksData) {
    const id = `artwork-books-${slugify(book.name)}`;
    const imageAssetIds = [];
    for (const [i, url] of book.image.entries()) {
      // eslint-disable-next-line no-await-in-loop
      const assetId = await uploadAsset(client, url, `${book.name} ${i + 1}`);
      imageAssetIds.push(assetId);
    }
    // eslint-disable-next-line no-await-in-loop
    await ensureArtwork(client, {
      id,
      title: book.name,
      categoryIds: ['cat-artist-books'],
      medium: book.med,
      size: book.size,
      edition: book.ed,
      coverAssetId: imageAssetIds[0],
      imageAssetIds,
    });
  }

  console.log('\n--- Drawings (drawings-data.js), tagging Commissions overlap ---');
  for (const item of drawingsData) {
    const id = `artwork-drawings-${slugify(item.name)}`;
    const categoryIds = commissionUrls.has(item.url)
      ? ['cat-drawings', 'cat-commissions']
      : ['cat-drawings'];
    // eslint-disable-next-line no-await-in-loop
    const coverAssetId = await uploadAsset(client, item.url, item.name);
    // eslint-disable-next-line no-await-in-loop
    await ensureArtwork(client, {
      id,
      title: item.name,
      categoryIds,
      medium: item.med,
      size: item.size,
      coverAssetId,
    });
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Import failed:', err.message || err);
  process.exit(1);
});
