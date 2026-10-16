/**
 * One-time migration: shop categories.
 *
 * Before: "shopItem" entries were really the homepage's shop *category*
 * cards (Stickers, Custom Prints, ...) with an icon/link/order each.
 * After:
 *   - New "shopCategory" type, nestable one level via parentCategory
 *     (Stickers -> Pokemon Stickers). Top-level categories carry the icon,
 *     description and order the homepage shop cards are built from.
 *   - "shopItem" becomes an actual product: gains a required "category"
 *     link (normally a subcategory) and loses icon/path/order, which now
 *     live on the category.
 *   - Seeds the four top-level categories the homepage currently shows from
 *     its hardcoded fallback, so switching it to Contentful changes nothing
 *     visible.
 *
 * Safe to re-run: every step checks whether it's already been done.
 * Requires CONTENTFUL_CMA_TOKEN in .env.local (same as setup-contentful.js).
 *
 * Usage: node scripts/add-shop-categories.js
 */

require('dotenv').config({ path: '.env.local' });
const contentfulManagement = require('contentful-management');

const SPACE_ID = process.env.REACT_APP_CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID = process.env.REACT_APP_CONTENTFUL_ENVIRONMENT || 'master';
const CMA_TOKEN = process.env.CONTENTFUL_CMA_TOKEN;
const LOCALE = 'en-US';

if (!SPACE_ID || !CMA_TOKEN) {
  console.error('Missing REACT_APP_CONTENTFUL_SPACE_ID or CONTENTFUL_CMA_TOKEN in .env.local');
  process.exit(1);
}

const SLUG_VALIDATION = {
  regexp: { pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' },
  message: 'Lowercase letters, numbers and single hyphens only, e.g. pokemon-stickers',
};

const SHOP_CATEGORY = {
  name: 'Shop Category',
  description: 'Shop category, or a subcategory when Parent Category is set. Top-level categories are the homepage shop cards.',
  displayField: 'name',
  fields: [
    { id: 'name', name: 'Name', type: 'Symbol', required: true, localized: false },
    {
      id: 'slug',
      name: 'Slug',
      type: 'Symbol',
      required: true,
      localized: false,
      validations: [{ unique: true }, SLUG_VALIDATION],
    },
    {
      id: 'parentCategory',
      name: 'Parent Category',
      type: 'Link',
      linkType: 'Entry',
      required: false,
      localized: false,
      validations: [{ linkContentType: ['shopCategory'] }],
    },
    { id: 'description', name: 'Description', type: 'Text', required: false, localized: false },
    { id: 'icon', name: 'Icon', type: 'Symbol', required: false, localized: false },
    { id: 'order', name: 'Display Order', type: 'Integer', required: false, localized: false },
  ],
};

const SHOP_ITEM_CATEGORY_FIELD = {
  id: 'category',
  name: 'Category',
  type: 'Link',
  linkType: 'Entry',
  required: true,
  localized: false,
  validations: [{ linkContentType: ['shopCategory'] }],
};

const SHOP_ITEM_REMOVED_FIELDS = ['icon', 'path', 'order'];

// Mirrors FALLBACK_PRODUCTS in src/Features/sections/CBCPShop.tsx.
const SEED_CATEGORIES = [
  {
    name: 'Custom Prints',
    slug: 'prints',
    icon: 'carbon:image-copy',
    description: 'High-quality art prints of original and fan art, available in multiple sizes.',
  },
  {
    name: 'Original Pieces',
    slug: 'originals',
    icon: 'ph:paint-brush-bold',
    description: 'One-of-a-kind original artworks — own something truly unique.',
  },
  {
    name: 'Stickers',
    slug: 'stickers',
    icon: 'ph:sticker-bold',
    description: 'Waterproof die-cut stickers perfect for laptops, water bottles, and more.',
  },
  {
    name: 'Buttons & Merch',
    slug: 'merch',
    icon: 'carbon:shopping-bag',
    description: 'Enamel pins, buttons, tote bags, and apparel with original CBCP designs.',
  },
];

async function ensureShopCategoryType(client, env) {
  const params = { ...env, contentTypeId: 'shopCategory' };
  try {
    await client.contentType.get(params);
    console.log('- "shopCategory" already exists.');
  } catch (err) {
    if (err.name !== 'NotFound') throw err;
    const created = await client.contentType.createWithId(params, SHOP_CATEGORY);
    await client.contentType.publish(params, created);
    console.log('+ Created and published "shopCategory".');
  }
}

async function updateShopItemType(client, env) {
  const params = { ...env, contentTypeId: 'shopItem' };
  let ct = await client.contentType.get(params);

  if (!ct.fields.some((f) => f.id === 'category')) {
    const insertAt = ct.fields.findIndex((f) => f.id === 'itemId') + 1;
    ct.fields.splice(insertAt, 0, SHOP_ITEM_CATEGORY_FIELD);
    ct = await client.contentType.update(params, ct);
    ct = await client.contentType.publish(params, ct);
    console.log('+ Added "category" to "shopItem".');
  }

  const toRemove = ct.fields.filter((f) => SHOP_ITEM_REMOVED_FIELDS.includes(f.id));
  if (!toRemove.length) {
    console.log('- "shopItem" has no icon/path/order fields left.');
    return;
  }

  // Contentful only deletes a field once its omission has been published.
  if (toRemove.some((f) => !f.omitted)) {
    toRemove.forEach((f) => {
      f.omitted = true;
    });
    ct = await client.contentType.update(params, ct);
    ct = await client.contentType.publish(params, ct);
  }
  ct.fields = ct.fields.filter((f) => !SHOP_ITEM_REMOVED_FIELDS.includes(f.id));
  ct = await client.contentType.update(params, ct);
  await client.contentType.publish(params, ct);
  console.log(`- Removed ${toRemove.map((f) => f.id).join(', ')} from "shopItem".`);
}

async function seedCategories(client, env) {
  for (const [order, seed] of SEED_CATEGORIES.entries()) {
    const existing = await client.entry.getMany({
      ...env,
      query: { content_type: 'shopCategory', 'fields.slug': seed.slug, limit: 1 },
    });
    if (existing.items.length) {
      console.log(`- Category "${seed.slug}" already exists.`);
      continue;
    }
    const fields = Object.fromEntries(
      Object.entries({ ...seed, order }).map(([key, value]) => [key, { [LOCALE]: value }])
    );
    const entry = await client.entry.create({ ...env, contentTypeId: 'shopCategory' }, { fields });
    await client.entry.publish({ ...env, entryId: entry.sys.id }, entry);
    console.log(`+ Created category "${seed.slug}".`);
  }
}

async function main() {
  const client = contentfulManagement.createClient({ accessToken: CMA_TOKEN }, { type: 'plain' });
  const env = { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID };

  await ensureShopCategoryType(client, env);
  await updateShopItemType(client, env);
  await seedCategories(client, env);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});
