/**
 * One-time provisioning script: creates the content types this site reads
 * from Contentful (category, artwork, artist, shopItem, faq) if they don't
 * already exist. Safe to re-run — existing content types are left untouched.
 *
 * "category" is self-referencing via parentCategory: a category with no
 * parent is top-level, one with a parent is a subcategory of it. Artwork
 * links to "category" instead of free-typing a category name, so the same
 * taxonomy (and its subcategories) stays consistent across entries.
 *
 * Requires CONTENTFUL_CMA_TOKEN (Content Management API token) in
 * .env.local. That token can create/edit/delete content, so it is kept out
 * of the REACT_APP_* namespace and never shipped to the browser — this
 * script is the only thing that uses it.
 *
 * Usage: node scripts/setup-contentful.js
 */

require('dotenv').config({ path: '.env.local' });
const contentfulManagement = require('contentful-management');

const SPACE_ID = process.env.REACT_APP_CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID = process.env.REACT_APP_CONTENTFUL_ENVIRONMENT || 'master';
const CMA_TOKEN = process.env.CONTENTFUL_CMA_TOKEN;

if (!SPACE_ID || !CMA_TOKEN) {
  console.error(
    'Missing REACT_APP_CONTENTFUL_SPACE_ID or CONTENTFUL_CMA_TOKEN in .env.local'
  );
  process.exit(1);
}

const CONTENT_TYPES = [
  {
    id: 'category',
    name: 'Category',
    description: 'A category or subcategory. Leave Parent Category empty for a top-level category.',
    displayField: 'name',
    fields: [
      { id: 'name', name: 'Name', type: 'Symbol', required: true },
      { id: 'slug', name: 'Slug', type: 'Symbol', required: true },
      {
        id: 'parentCategory',
        name: 'Parent Category',
        type: 'Link',
        linkType: 'Entry',
        required: false,
        validations: [{ linkContentType: ['category'] }],
      },
      { id: 'description', name: 'Description', type: 'Text', required: false },
    ],
  },
  {
    id: 'artwork',
    name: 'Artwork',
    description:
      'categories is an array so a piece shown on more than one page (e.g. a drawing also featured as a commission) can carry multiple tags without a duplicate entry.',
    displayField: 'title',
    fields: [
      { id: 'title', name: 'Title', type: 'Symbol', required: true },
      {
        id: 'categories',
        name: 'Categories',
        type: 'Array',
        required: true,
        items: {
          type: 'Link',
          linkType: 'Entry',
          validations: [{ linkContentType: ['category'] }],
        },
      },
      { id: 'description', name: 'Description', type: 'Text', required: false },
      { id: 'medium', name: 'Medium', type: 'Symbol', required: false },
      { id: 'size', name: 'Size', type: 'Symbol', required: false },
      { id: 'edition', name: 'Edition', type: 'Symbol', required: false },
      {
        id: 'coverImage',
        name: 'Cover Image',
        type: 'Link',
        linkType: 'Asset',
        required: true,
        validations: [{ linkMimetypeGroup: ['image'] }],
      },
      {
        id: 'images',
        name: 'Additional Images (e.g. book page spreads)',
        type: 'Array',
        required: false,
        items: {
          type: 'Link',
          linkType: 'Asset',
          validations: [{ linkMimetypeGroup: ['image'] }],
        },
      },
      {
        id: 'featured',
        name: 'Featured (shown in Featured Artwork carousel)',
        type: 'Boolean',
        required: false,
      },
    ],
  },
  {
    id: 'artist',
    name: 'Artist',
    displayField: 'name',
    fields: [
      { id: 'name', name: 'Name', type: 'Symbol', required: true },
      { id: 'role', name: 'Role', type: 'Symbol', required: false },
      {
        id: 'photo',
        name: 'Photo',
        type: 'Link',
        linkType: 'Asset',
        required: false,
        validations: [{ linkMimetypeGroup: ['image'] }],
      },
      { id: 'bio', name: 'Bio', type: 'Text', required: false },
      { id: 'piecesSold', name: 'Pieces Sold', type: 'Integer', required: false },
      { id: 'followers', name: 'Followers', type: 'Integer', required: false },
      { id: 'yearsCreating', name: 'Years Creating', type: 'Integer', required: false },
    ],
  },
  {
    // Top-level categories are the homepage shop cards; set Parent Category
    // to make a subcategory (Stickers -> Pokemon Stickers).
    id: 'shopCategory',
    name: 'Shop Category',
    displayField: 'name',
    fields: [
      { id: 'name', name: 'Name', type: 'Symbol', required: true },
      {
        id: 'slug',
        name: 'Slug',
        type: 'Symbol',
        required: true,
        validations: [
          { unique: true },
          {
            regexp: { pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' },
            message: 'Lowercase letters, numbers and single hyphens only, e.g. pokemon-stickers',
          },
        ],
      },
      {
        id: 'parentCategory',
        name: 'Parent Category',
        type: 'Link',
        linkType: 'Entry',
        required: false,
        validations: [{ linkContentType: ['shopCategory'] }],
      },
      { id: 'description', name: 'Description', type: 'Text', required: false },
      { id: 'icon', name: 'Icon', type: 'Symbol', required: false },
      { id: 'order', name: 'Display Order', type: 'Integer', required: false },
    ],
  },
  {
    id: 'shopItem',
    name: 'Shop Item',
    displayField: 'name',
    fields: [
      { id: 'name', name: 'Name', type: 'Symbol', required: true },
      {
        id: 'itemId',
        name: 'Item ID',
        type: 'Symbol',
        required: true,
        validations: [
          { unique: true },
          {
            regexp: { pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' },
            message: 'Lowercase letters, numbers and single hyphens only, e.g. custom-prints',
          },
        ],
      },
      {
        id: 'category',
        name: 'Category',
        type: 'Link',
        linkType: 'Entry',
        required: true,
        validations: [{ linkContentType: ['shopCategory'] }],
      },
      {
        id: 'images',
        name: 'Images',
        type: 'Array',
        required: false,
        items: {
          type: 'Link',
          linkType: 'Asset',
          validations: [{ linkMimetypeGroup: ['image'] }],
        },
      },
      { id: 'content', name: 'Description', type: 'Text', required: false },
    ],
  },
  {
    id: 'faq',
    name: 'FAQ',
    displayField: 'question',
    fields: [
      { id: 'question', name: 'Question', type: 'Symbol', required: true },
      { id: 'answer', name: 'Answer', type: 'Text', required: true },
      { id: 'order', name: 'Display Order', type: 'Integer', required: false },
    ],
  },
];

// Content type ids whose field shape changed in a way Contentful won't allow
// as an in-place field-type change (e.g. category: Link -> categories: Array
// of Links). Safe to drop and recreate ONLY because no entries exist yet for
// these types — never do this once real entries are depended on.
// Every type gets "Show in App" (see scripts/add-show-in-app-field.js): the
// site only shows entries with it switched on, and new entries start hidden.
for (const def of CONTENT_TYPES) {
  def.fields.push({
    id: 'showInApp',
    name: 'Show in App',
    type: 'Boolean',
    required: false,
    defaultValue: { 'en-US': false },
  });
}

const RECREATE_IDS = new Set(['artwork']);

async function createOrSkip(client, def) {
  const params = {
    spaceId: SPACE_ID,
    environmentId: ENVIRONMENT_ID,
    contentTypeId: def.id,
  };

  try {
    await client.contentType.get(params);
    if (!RECREATE_IDS.has(def.id)) {
      console.log(`- "${def.id}" already exists, skipping.`);
      return;
    }
    console.log(`~ "${def.id}" exists with an outdated shape — recreating (no entries to lose)...`);
    await client.contentType.unpublish(params);
    await client.contentType.delete(params);
  } catch (err) {
    const notFound = err.name === 'NotFound' || err.status === 404 || err.response?.status === 404;
    if (!notFound) throw err;
  }

  const contentType = await client.contentType.createWithId(params, {
    name: def.name,
    description: def.description,
    displayField: def.displayField,
    fields: def.fields,
  });
  await client.contentType.publish(params, contentType);
  console.log(`+ Created and published "${def.id}".`);
}

async function main() {
  const client = contentfulManagement.createClient(
    { accessToken: CMA_TOKEN },
    { type: 'plain' }
  );

  console.log(`Provisioning content types in space "${SPACE_ID}" / env "${ENVIRONMENT_ID}"...`);
  for (const def of CONTENT_TYPES) {
    // eslint-disable-next-line no-await-in-loop
    await createOrSkip(client, def);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error('Contentful provisioning failed:', err.message || err);
  process.exit(1);
});
