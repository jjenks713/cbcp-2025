/**
 * Dev-only: fills the shop with fake shop items so the shop page can be
 * built and tested before real products exist. Each item is published,
 * switched on (Show in App), and placed in one of the existing shop
 * categories (matched by slug). Images reuse existing artwork cover
 * images - nothing is uploaded.
 *
 * Every sample item's description starts with SAMPLE_MARKER, which is how
 * --delete finds them again; real items are never touched.
 *
 * Refuses to run against the "master" environment (the live site).
 *
 * Requires CONTENTFUL_CMA_TOKEN in .env.local (same as setup-contentful.js).
 *
 * Usage:
 *   node scripts/seed-sample-shop-items.js           # create the samples
 *   node scripts/seed-sample-shop-items.js --delete  # remove them again
 */

require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');
const contentfulManagement = require('contentful-management');

const SPACE_ID = process.env.REACT_APP_CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID = process.env.REACT_APP_CONTENTFUL_ENVIRONMENT || 'master';
const CMA_TOKEN = process.env.CONTENTFUL_CMA_TOKEN;
const LOCALE = 'en-US';

const SAMPLE_MARKER = '[sample item]';

if (!SPACE_ID || !CMA_TOKEN) {
  console.error('Missing REACT_APP_CONTENTFUL_SPACE_ID or CONTENTFUL_CMA_TOKEN in .env.local');
  process.exit(1);
}
if (ENVIRONMENT_ID === 'master') {
  console.error('Refusing to add sample items to "master" (the live site). Set REACT_APP_CONTENTFUL_ENVIRONMENT=dev.');
  process.exit(1);
}

// [category slug, name, price, stock, description]
const SAMPLES = [
  ['prints', 'Moth Lantern Print', 25, 12, 'A moth drawn to a paper lantern, screen printed in two inks.'],
  ['prints', 'Haunted Greenhouse Print', 30, 6, 'Overgrown glass house with a few uninvited guests.'],
  ['prints', 'Skeleton Tea Party Print', 28, 0, 'Bone china, literally. 11x14 linocut.'],
  ['prints', 'Witchy Cat Print', 22, 20, 'A very sleepy familiar. 8x10 risograph.'],
  ['originals', 'Graveyard Bloom', 180, 1, 'Original ink drawing, framed.'],
  ['originals', 'Sleepy Ghost', 140, 1, 'Original watercolor and gouache.'],
  ['originals', 'Crow Parliament', 220, 0, 'Original charcoal on toned paper.'],
  ['stickers', 'Cute Skull Sticker', 4, 50, 'Glossy vinyl, 3 inch.'],
  ['stickers', 'Bat Wings Sticker', 4, 35, 'Holographic vinyl, 3 inch.'],
  ['stickers', 'Mushroom Ghost Sticker', 4, 0, 'Matte vinyl, 3 inch.'],
  ['stickers', 'Spooky Snail Sticker', 3.5, 60, 'Glossy vinyl, 2.5 inch.'],
  ['pokemon-stickers', 'Gengar Sticker', 4.5, 40, 'Fan art sticker, glossy vinyl.'],
  ['pokemon-stickers', 'Haunter Sticker', 4.5, 25, 'Fan art sticker, holographic.'],
  ['pokemon-stickers', 'Mimikyu Sticker', 4.5, 0, 'Fan art sticker, matte vinyl.'],
  ['pokemon-stickers', 'Cubone Sticker', 4.5, 18, 'Fan art sticker, glossy vinyl.'],
  ['merch', 'Creepy Cute Button Pack', 10, 15, 'Five 1.25 inch pin-back buttons.'],
  ['merch', 'Ghost Enamel Pin', 12, 8, 'Hard enamel with glow-in-the-dark fill.'],
  ['merch', 'Bat Tote Bag', 24, 5, 'Heavy cotton canvas, screen printed.'],
  ['merch', 'Skull Patch', 8, 0, 'Embroidered iron-on patch.'],
];

// Same format the API generates for real items (server/src/routes/admin-contentful.js).
const ITEM_ID_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const generateItemId = () =>
  Array.from({ length: 8 }, () => ITEM_ID_ALPHABET[crypto.randomInt(ITEM_ID_ALPHABET.length)]).join('');

const wrap = (value) => ({ [LOCALE]: value });
const link = (linkType, id) => wrap({ sys: { type: 'Link', linkType, id } });

async function main() {
  const client = contentfulManagement.createClient({ accessToken: CMA_TOKEN }, { type: 'plain' });
  const params = { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID };

  const existing = await client.entry.getMany({ ...params, query: { content_type: 'shopItem', limit: 1000 } });
  const samples = existing.items.filter((e) => (e.fields.content?.[LOCALE] ?? '').startsWith(SAMPLE_MARKER));

  if (process.argv.includes('--delete')) {
    for (const entry of samples) {
      if (entry.sys.publishedVersion) await client.entry.unpublish({ ...params, entryId: entry.sys.id });
      await client.entry.delete({ ...params, entryId: entry.sys.id });
    }
    console.log(`"${ENVIRONMENT_ID}": deleted ${samples.length} sample shop item(s).`);
    return;
  }

  if (samples.length) {
    console.log(`"${ENVIRONMENT_ID}" already has ${samples.length} sample item(s) - run with --delete first to recreate them.`);
    return;
  }

  const categories = await client.entry.getMany({ ...params, query: { content_type: 'shopCategory', limit: 1000 } });
  const categoryBySlug = new Map(categories.items.map((c) => [c.fields.slug?.[LOCALE], c.sys.id]));

  // Artwork cover images, so the samples show real art.
  const artworks = await client.entry.getMany({ ...params, query: { content_type: 'artwork', limit: 1000 } });
  const imageIds = [...new Set(artworks.items.map((a) => a.fields.coverImage?.[LOCALE]?.sys?.id).filter(Boolean))];
  if (!imageIds.length) console.warn('No artwork cover images found - samples will have no images.');

  let created = 0;
  for (const [index, [slug, name, price, stock, description]] of SAMPLES.entries()) {
    const categoryId = categoryBySlug.get(slug);
    if (!categoryId) {
      console.warn(`Skipping "${name}": no shop category with slug "${slug}".`);
      continue;
    }
    const fields = {
      name: wrap(name),
      itemId: wrap(generateItemId()),
      category: link('Entry', categoryId),
      price: wrap(price),
      stock: wrap(stock),
      content: wrap(`${SAMPLE_MARKER} ${description}`),
      showInApp: wrap(true),
      ...(imageIds.length && { images: wrap([link('Asset', imageIds[index % imageIds.length])[LOCALE]]) }),
    };
    const entry = await client.entry.create({ ...params, contentTypeId: 'shopItem' }, { fields });
    await client.entry.publish({ ...params, entryId: entry.sys.id }, entry);
    created += 1;
    console.log(`  + ${name} (${slug}, $${price}, stock ${stock})`);
  }

  console.log(`"${ENVIRONMENT_ID}": created ${created} sample shop item(s). Remove with --delete.`);
}

main().catch((err) => {
  console.error('Failed:', err.message || err);
  process.exit(1);
});
