/**
 * One-time migration: removes the old "stock" field from the "shopItem"
 * content type. Stock now lives in the API's inventory collection (per
 * size) - copy it there first with server/scripts/migrate-stock-to-inventory.js,
 * or the old numbers are lost.
 *
 * Contentful removes a field in two steps: mark it omitted (hidden from the
 * API), then deleted. Existing entries' stock values go with it.
 *
 * Requires CONTENTFUL_CMA_TOKEN in .env.local (same as setup-contentful.js).
 * Runs against REACT_APP_CONTENTFUL_ENVIRONMENT (default master) and asks for
 * --confirm when that's master.
 *
 * Usage: node scripts/remove-shop-item-stock.js [--confirm]
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
if (ENVIRONMENT_ID === 'master' && !process.argv.includes('--confirm')) {
  console.error('This removes shop item stock from "master" (the live site). Migrate stock to the prod inventory first, then re-run with --confirm.');
  process.exit(1);
}

async function main() {
  const client = contentfulManagement.createClient({ accessToken: CMA_TOKEN }, { type: 'plain' });
  const params = { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID, contentTypeId: 'shopItem' };

  let contentType = await client.contentType.get(params);
  const field = contentType.fields.find((f) => f.id === 'stock');
  if (!field) {
    console.log(`"shopItem" in "${ENVIRONMENT_ID}" has no stock field - nothing to do.`);
    return;
  }

  if (!field.omitted) {
    field.omitted = true;
    contentType = await client.contentType.update(params, contentType);
    contentType = await client.contentType.publish(params, contentType);
    console.log('Step 1: stock field hidden (omitted).');
  }

  contentType.fields.find((f) => f.id === 'stock').deleted = true;
  contentType = await client.contentType.update(params, contentType);
  contentType = await client.contentType.publish(params, contentType);
  console.log(`Step 2: stock field deleted. "${ENVIRONMENT_ID}" shopItem fields: ${contentType.fields.map((f) => f.id).join(', ')}`);
}

main().catch((err) => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});
