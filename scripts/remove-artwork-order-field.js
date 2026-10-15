/**
 * One-time migration: removes the "order" (Display Order) field from the
 * "artwork" content type. Artwork is now ordered by sys.createdAt (date
 * added) instead of a manually-maintained display order — see
 * getArtworks() in src/lib/contentful.ts.
 *
 * Contentful requires a field to be omitted (and that change published)
 * before it can be deleted, so this runs as two publish steps.
 *
 * Requires CONTENTFUL_CMA_TOKEN in .env.local (same as setup-contentful.js).
 *
 * Usage: node scripts/remove-artwork-order-field.js
 */

require('dotenv').config({ path: '.env.local' });
const contentfulManagement = require('contentful-management');

const SPACE_ID = process.env.REACT_APP_CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID = process.env.REACT_APP_CONTENTFUL_ENVIRONMENT || 'master';
const CMA_TOKEN = process.env.CONTENTFUL_CMA_TOKEN;

if (!SPACE_ID || !CMA_TOKEN) {
  console.error('Missing REACT_APP_CONTENTFUL_SPACE_ID or CONTENTFUL_CMA_TOKEN in .env.local');
  process.exit(1);
}

async function main() {
  const client = contentfulManagement.createClient({ accessToken: CMA_TOKEN }, { type: 'plain' });
  const params = { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID, contentTypeId: 'artwork' };

  let contentType = await client.contentType.get(params);
  const field = contentType.fields.find((f) => f.id === 'order');

  if (!field) {
    console.log('"order" field not found on "artwork" — nothing to do.');
    return;
  }

  console.log('Omitting "order" field...');
  field.omitted = true;
  contentType = await client.contentType.update(params, contentType);
  contentType = await client.contentType.publish(params, contentType);

  console.log('Deleting "order" field...');
  contentType.fields = contentType.fields.filter((f) => f.id !== 'order');
  contentType = await client.contentType.update(params, contentType);
  await client.contentType.publish(params, contentType);

  console.log('Done — "order" removed from "artwork".');
}

main().catch((err) => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});
