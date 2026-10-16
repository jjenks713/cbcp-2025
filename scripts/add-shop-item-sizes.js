/**
 * One-time migration: adds an optional "sizes" list to the "shopItem"
 * content type (e.g. ["5x7", "8x10"] or ["S", "M", "L"]). When an item
 * has sizes, the shop asks the customer to pick one before adding it to
 * the cart. Every size shares the item's price and stock for now.
 *
 * Placed after "stock" so the admin form reads name, category, price,
 * stock, sizes, images...
 *
 * Safe to re-run: does nothing if the field already exists.
 *
 * Requires CONTENTFUL_CMA_TOKEN in .env.local (same as setup-contentful.js).
 *
 * Usage: node scripts/add-shop-item-sizes.js
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

const SIZES_FIELD = {
  id: 'sizes',
  name: 'Sizes',
  type: 'Array',
  required: false,
  localized: false,
  items: {
    type: 'Symbol',
    validations: [{ size: { min: 1, max: 30 }, message: 'Each size must be 1-30 characters' }],
  },
};

async function main() {
  const client = contentfulManagement.createClient({ accessToken: CMA_TOKEN }, { type: 'plain' });
  const params = { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID, contentTypeId: 'shopItem' };

  const contentType = await client.contentType.get(params);
  if (contentType.fields.some((f) => f.id === SIZES_FIELD.id)) {
    console.log(`"shopItem" in "${ENVIRONMENT_ID}" already has sizes - nothing to do.`);
    return;
  }

  const insertAt = contentType.fields.findIndex((f) => f.id === 'stock') + 1 || contentType.fields.length;
  contentType.fields.splice(insertAt, 0, SIZES_FIELD);

  const updated = await client.contentType.update(params, contentType);
  await client.contentType.publish(params, updated);
  console.log(`"${ENVIRONMENT_ID}": added sizes. Field order: ${updated.fields.map((f) => f.id).join(', ')}`);
}

main().catch((err) => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});
