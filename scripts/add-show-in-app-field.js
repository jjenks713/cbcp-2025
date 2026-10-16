/**
 * One-time migration: adds a "showInApp" Boolean to every content type, so
 * content can be added ahead of time and only appear on the site once it's
 * switched on (from the admin panel's table).
 *
 * - New entries default to false (hidden) - the field's defaultValue covers
 *   Contentful's own web app; the admin panel sends false explicitly.
 * - Existing entries are backfilled to TRUE: they're live on the site
 *   today, and the site only shows entries with showInApp = true, so
 *   leaving them unset would empty the site.
 * - An entry with unpublished draft edits is skipped (and reported):
 *   republishing it would push those half-finished edits live.
 *
 * Safe to re-run: only adds the field where missing, only backfills
 * entries that don't have a value yet.
 *
 * Requires CONTENTFUL_CMA_TOKEN in .env.local (same as setup-contentful.js).
 *
 * Usage: node scripts/add-show-in-app-field.js [--dry-run]
 *   --dry-run  report what would change, without writing anything
 */

require('dotenv').config({ path: '.env.local' });
const contentfulManagement = require('contentful-management');

const SPACE_ID = process.env.REACT_APP_CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID = process.env.REACT_APP_CONTENTFUL_ENVIRONMENT || 'master';
const CMA_TOKEN = process.env.CONTENTFUL_CMA_TOKEN;
const LOCALE = 'en-US';
const DRY_RUN = process.argv.includes('--dry-run');

if (!SPACE_ID || !CMA_TOKEN) {
  console.error('Missing REACT_APP_CONTENTFUL_SPACE_ID or CONTENTFUL_CMA_TOKEN in .env.local');
  process.exit(1);
}

const CONTENT_TYPE_IDS = ['artwork', 'category', 'artist', 'shopCategory', 'shopItem', 'faq'];

const SHOW_IN_APP_FIELD = {
  id: 'showInApp',
  name: 'Show in App',
  type: 'Boolean',
  required: false,
  localized: false,
  defaultValue: { [LOCALE]: false },
};

// Published with nothing pending: version is exactly one past the published one.
const hasPendingDraft = (entry) => entry.sys.publishedVersion && entry.sys.version > entry.sys.publishedVersion + 1;

async function addField(client, env, contentTypeId) {
  const params = { ...env, contentTypeId };
  const ct = await client.contentType.get(params);
  if (ct.fields.some((f) => f.id === 'showInApp')) {
    console.log(`- ${contentTypeId}: field already exists.`);
    return;
  }
  if (DRY_RUN) {
    console.log(`+ ${contentTypeId}: would add showInApp.`);
    return;
  }
  ct.fields.push(SHOW_IN_APP_FIELD);
  const updated = await client.contentType.update(params, ct);
  await client.contentType.publish(params, updated);
  console.log(`+ ${contentTypeId}: added showInApp.`);
}

async function backfill(client, env, contentTypeId) {
  const { items } = await client.entry.getMany({ ...env, query: { content_type: contentTypeId, limit: 1000 } });
  let updatedCount = 0;
  const skipped = [];

  for (const entry of items) {
    if (entry.fields.showInApp?.[LOCALE] !== undefined) continue;
    if (hasPendingDraft(entry)) {
      skipped.push(entry.sys.id);
      continue;
    }
    updatedCount += 1;
    if (DRY_RUN) continue;
    const wasPublished = Boolean(entry.sys.publishedVersion);
    entry.fields.showInApp = { [LOCALE]: true };
    const updated = await client.entry.update({ ...env, entryId: entry.sys.id }, entry);
    if (wasPublished) await client.entry.publish({ ...env, entryId: entry.sys.id }, updated);
  }

  console.log(`  ${contentTypeId}: ${DRY_RUN ? 'would backfill' : 'backfilled'} ${updatedCount} of ${items.length} entries to true.`);
  if (skipped.length) {
    console.log(`  ! ${contentTypeId}: skipped ${skipped.length} with unpublished draft edits: ${skipped.join(', ')}`);
  }
}

async function main() {
  const client = contentfulManagement.createClient({ accessToken: CMA_TOKEN }, { type: 'plain' });
  const env = { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID };

  if (DRY_RUN) console.log('Dry run - nothing will be written.');
  for (const id of CONTENT_TYPE_IDS) await addField(client, env, id);
  for (const id of CONTENT_TYPE_IDS) await backfill(client, env, id);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});
