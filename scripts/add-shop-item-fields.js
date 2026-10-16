/**
 * One-time migration: adds "itemId" and "images" to the "shopItem" content
 * type, ahead of building the in-app shop.
 *
 * - itemId: stable identifier the shop/orders will reference. Required,
 *   unique, and limited to lowercase slugs (e.g. "custom-prints") so it's
 *   safe in URLs.
 * - images: product photos (shown as a carousel), same shape as artwork's
 *   "Additional Images".
 *
 * Also drops the stale "(iconify id ...)" hint from the icon field's name -
 * Iconify is gone; the admin panel offers the supported icons as a list.
 *
 * Safe to re-run: fields that already exist are left alone.
 *
 * Requires CONTENTFUL_CMA_TOKEN in .env.local (same as setup-contentful.js).
 *
 * Usage: node scripts/add-shop-item-fields.js
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

const NEW_FIELDS = [
  {
    id: 'itemId',
    name: 'Item ID',
    type: 'Symbol',
    required: true,
    localized: false,
    validations: [
      { unique: true },
      {
        regexp: { pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' },
        message: 'Lowercase letters, numbers and single hyphens only, e.g. custom-prints',
      },
    ],
  },
  {
    id: 'images',
    name: 'Images',
    type: 'Array',
    required: false,
    localized: false,
    items: {
      type: 'Link',
      linkType: 'Asset',
      validations: [{ linkMimetypeGroup: ['image'] }],
    },
  },
];

// New fields go right after "name" so the admin form reads top-down:
// name, item id, photos, then the rest.
const INSERT_AFTER = 'name';

async function main() {
  const client = contentfulManagement.createClient({ accessToken: CMA_TOKEN }, { type: 'plain' });
  const params = { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID, contentTypeId: 'shopItem' };

  const contentType = await client.contentType.get(params);
  const existingIds = new Set(contentType.fields.map((f) => f.id));
  const toAdd = NEW_FIELDS.filter((f) => !existingIds.has(f.id));

  const icon = contentType.fields.find((f) => f.id === 'icon');
  const renameIcon = icon && icon.name !== 'Icon';

  if (!toAdd.length && !renameIcon) {
    console.log('"shopItem" already up to date — nothing to do.');
    return;
  }

  if (renameIcon) icon.name = 'Icon';

  const insertAt = contentType.fields.findIndex((f) => f.id === INSERT_AFTER) + 1;
  contentType.fields.splice(insertAt, 0, ...toAdd);

  console.log(`Adding fields: ${toAdd.map((f) => f.id).join(', ') || '(none)'}${renameIcon ? '; renaming icon field' : ''}`);
  const updated = await client.contentType.update(params, contentType);
  await client.contentType.publish(params, updated);

  console.log('Done — "shopItem" updated and published.');
}

main().catch((err) => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});
