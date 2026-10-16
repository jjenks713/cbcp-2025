// Dev-only: fills the shop with fake shop items so the shop can be built
// and tested before real products exist. Each item is published, switched
// on (Show in App) and placed in one of the existing shop categories
// (matched by slug); images reuse existing artwork cover images (nothing is
// uploaded). Their stock - per size, with some per-size prices and some
// sold-out sizes - goes in the inventory collection.
//
// Samples are found again by their exact name + description from SAMPLES
// (or the "[sample item]" prefix older versions added), so real items are
// never touched. Re-running only adds samples that aren't there yet, and
// only stocks samples with no inventory rows yet.
//
// Refuses to run against Contentful "master" or a prod database.
//
// Usage (from server/):
//   node scripts/seed-sample-shop-items.js                     # add missing samples + stock
//   node scripts/seed-sample-shop-items.js --reset-inventory   # also re-stock existing samples
//   node scripts/seed-sample-shop-items.js --delete            # remove samples and their stock
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const contentfulManagement = require('contentful-management');
const { connectDB } = require('../src/db');
const Inventory = require('../src/models/Inventory');

const LOCALE = 'en-US';
// Older versions of this script prefixed sample descriptions with this.
const LEGACY_SAMPLE_MARKER = '[sample item]';

const PRINT_SIZES = ['5x7', '8x10', '11x14'];

// [category slug, name, price, stock, description, sizes?, photos?, prices?]
//   stock: a number (the same for every size) or { size: stock }
//   prices: { size: price } for sizes that cost more/less than `price`
const SAMPLES = [
  ['prints', 'Moth Lantern Print', 25, { '5x7': 8, '8x10': 3, '11x14': 0 }, 'A moth drawn to a paper lantern, screen printed in two inks.', PRINT_SIZES, 2, { '8x10': 30, '11x14': 40 }],
  ['prints', 'Haunted Greenhouse Print', 30, { '5x7': 2, '8x10': 4, '11x14': 1 }, 'Overgrown glass house with a few uninvited guests.', PRINT_SIZES, 2, { '11x14': 45 }],
  ['prints', 'Skeleton Tea Party Print', 28, 0, 'Bone china, literally. A linocut on cotton paper.', PRINT_SIZES],
  ['prints', 'Witchy Cat Print', 22, { '8x10': 12, '11x14': 8 }, 'A very sleepy familiar. Risograph in teal and pink.', ['8x10', '11x14'], 2, { '11x14': 32 }],
  ['originals', 'Graveyard Bloom', 180, 1, 'Original ink drawing, framed.'],
  ['originals', 'Sleepy Ghost', 140, 1, 'Original watercolor and gouache.'],
  ['originals', 'Crow Parliament', 220, 0, 'Original charcoal on toned paper.'],
  ['stickers', 'Cute Skull Sticker', 4, { '2 inch': 20, '3 inch': 30, '4 inch': 0 }, 'Glossy vinyl.', ['2 inch', '3 inch', '4 inch'], 1, { '4 inch': 5 }],
  ['stickers', 'Bat Wings Sticker', 4, 35, 'Holographic vinyl, 3 inch.'],
  ['stickers', 'Mushroom Ghost Sticker', 4, 0, 'Matte vinyl, 3 inch.'],
  ['stickers', 'Spooky Snail Sticker', 3.5, { '2 inch': 40, '3 inch': 20 }, 'Glossy vinyl.', ['2 inch', '3 inch']],
  ['pokemon-stickers', 'Gengar Sticker', 4.5, 40, 'Fan art sticker, glossy vinyl.'],
  ['pokemon-stickers', 'Haunter Sticker', 4.5, 25, 'Fan art sticker, holographic.'],
  ['pokemon-stickers', 'Mimikyu Sticker', 4.5, 0, 'Fan art sticker, matte vinyl.'],
  ['pokemon-stickers', 'Cubone Sticker', 4.5, 18, 'Fan art sticker, glossy vinyl.'],
  ['merch', 'Creepy Cute Button Pack', 10, 15, 'Five 1.25 inch pin-back buttons.'],
  ['merch', 'Ghost Enamel Pin', 12, 8, 'Hard enamel with glow-in-the-dark fill.'],
  ['merch', 'Bat Tote Bag', 24, { Standard: 3, Large: 2 }, 'Heavy cotton canvas, screen printed.', ['Standard', 'Large'], 1, { Large: 28 }],
  ['merch', 'Skull Patch', 8, 0, 'Embroidered iron-on patch.'],

  // More stickers, in a spread of sizes
  ['stickers', 'Moth Sticker', 4, { '2 inch': 20, '3 inch': 15, '4 inch': 10 }, 'Death’s-head moth, glossy vinyl.', ['2 inch', '3 inch', '4 inch'], 1, { '4 inch': 5 }],
  ['stickers', 'Coffin Sticker', 3.5, { '2 inch': 18, '3 inch': 0 }, 'Tiny coffin with a heart lid, matte vinyl.', ['2 inch', '3 inch']],
  ['stickers', 'Haunted House Sticker', 5, { '3 inch': 10, '4 inch': 6, '5 inch': 4 }, 'Crooked house with glowing windows, holographic.', ['3 inch', '4 inch', '5 inch'], 1, { '5 inch': 6.5 }],
  ['stickers', 'Creepy Bunny Sticker', 4, 0, 'A bunny with one too many eyes, glossy vinyl.', ['2 inch', '3 inch']],
  ['stickers', 'Eyeball Sticker', 3, { '1.5 inch': 30, '2 inch': 30, '3 inch': 20 }, 'Bloodshot and watching. Glossy vinyl.', ['1.5 inch', '2 inch', '3 inch'], 1, { '3 inch': 4 }],
  ['stickers', 'Crescent Moon Sticker', 4, { '2 inch': 10, '3 inch': 10, '4 inch': 0 }, 'Sleepy moon with a spider, glitter vinyl.', ['2 inch', '3 inch', '4 inch']],
  ['stickers', 'Ghost Cat Sticker', 4.5, { '3 inch': 7, '4 inch': 5 }, 'A see-through cat, clear vinyl.', ['3 inch', '4 inch']],
  ['stickers', 'Spooky Critters Sticker Sheet', 9, { '4x6': 10, '5x7': 5 }, 'Eight critters on one kiss-cut sheet.', ['4x6', '5x7'], 1, { '5x7': 11 }],

  // More custom prints, in a spread of sizes
  ['prints', 'Lighthouse of Bones Print', 30, { '5x7': 4, '8x10': 4, '11x14': 2 }, 'A lighthouse built from bones, ink and wash.', PRINT_SIZES, 2, { '5x7': 22, '11x14': 42 }],
  ['prints', 'Moonlit Moths Print', 35, { '8x10': 3, '11x14': 3, '16x20': 0 }, 'Moths circling a full moon, two-color screen print.', ['8x10', '11x14', '16x20'], 1, { '11x14': 45, '16x20': 65 }],
  ['prints', 'Candle Witch Print', 28, { A5: 6, A4: 5, A3: 3 }, 'A witch reading by candlelight. Giclee on matte paper.', ['A5', 'A4', 'A3'], 1, { A5: 20, A3: 38 }],
  ['prints', 'Raven Study Print', 18, { '4x6': 15, '5x7': 10 }, 'Pen and ink raven study.', ['4x6', '5x7'], 1, { '4x6': 14 }],
  ['prints', 'Cemetery Gates Print', 40, { '8x10': 2, '12x16': 1 }, 'Wrought iron gates at dusk, linocut.', ['8x10', '12x16'], 2, { '12x16': 55 }],
  ['prints', 'Pumpkin Patch Ghosts Print', 22, 0, 'Little ghosts hiding in a pumpkin patch.', ['5x7', '8x10']],
  ['prints', 'Night Garden Print', 45, { '11x14': 3, '16x20': 2, '18x24': 1 }, 'Moonflowers and nightshade, large format.', ['11x14', '16x20', '18x24'], 1, { '16x20': 60, '18x24': 75 }],
  ['prints', 'Spider Lily Print', 25, { '5x7': 8, '8x10': 6, '11x14': 4 }, 'Red spider lilies, risograph in two inks.', PRINT_SIZES, 2, { '8x10': 30, '11x14': 38 }],
];

const sampleKey = (name, description) => `${name}\n${description}`;
const SAMPLE_BY_KEY = new Map(SAMPLES.map((s) => [sampleKey(s[1], s[4]), s]));

/** This entry's SAMPLES row, if it's a sample (current or older version). */
function sampleFor(entry) {
  const name = entry.fields.name?.[LOCALE] ?? '';
  const content = entry.fields.content?.[LOCALE] ?? '';
  return SAMPLE_BY_KEY.get(sampleKey(name, content)) ?? (content.startsWith(LEGACY_SAMPLE_MARKER) ? null : undefined);
}

/** Inventory rows for a sample: one per size (or one with size null). */
function inventoryRows(itemId, [, , , stock, , sizes = [], , prices = {}]) {
  const stockFor = (size) => Math.max(0, typeof stock === 'number' ? stock : stock[size] ?? 0);
  return sizes.length
    ? sizes.map((size) => ({ itemId, size, stock: stockFor(size), price: prices[size] ?? null }))
    : [{ itemId, size: null, stock: stockFor(null), price: null }];
}

// Same format the API generates for real items (src/routes/admin-contentful.js).
const ITEM_ID_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const generateItemId = () =>
  Array.from({ length: 8 }, () => ITEM_ID_ALPHABET[crypto.randomInt(ITEM_ID_ALPHABET.length)]).join('');

const wrap = (value) => ({ [LOCALE]: value });
const link = (linkType, id) => ({ sys: { type: 'Link', linkType, id } });

async function main() {
  const { CONTENTFUL_SPACE_ID: spaceId, CONTENTFUL_CMA_TOKEN: accessToken } = process.env;
  const environmentId = process.env.CONTENTFUL_ENVIRONMENT || 'master';
  if (!spaceId || !accessToken) throw new Error('CONTENTFUL_SPACE_ID / CONTENTFUL_CMA_TOKEN are not set');
  if (environmentId === 'master') throw new Error('Refusing to add samples to Contentful "master" (the live site).');

  await connectDB();
  if (/prod/i.test(Inventory.db.name)) throw new Error(`Refusing to stock samples in "${Inventory.db.name}".`);
  await Inventory.syncIndexes();

  const client = contentfulManagement.createClient({ accessToken }, { type: 'plain' });
  const params = { spaceId, environmentId };
  const existing = await client.entry.getMany({ ...params, query: { content_type: 'shopItem', limit: 1000 } });
  const samples = existing.items.filter((e) => sampleFor(e) !== undefined);

  if (process.argv.includes('--delete')) {
    for (const entry of samples) {
      if (entry.sys.publishedVersion) await client.entry.unpublish({ ...params, entryId: entry.sys.id });
      await client.entry.delete({ ...params, entryId: entry.sys.id });
      const itemId = entry.fields.itemId?.[LOCALE];
      if (itemId) await Inventory.deleteMany({ itemId });
    }
    console.log(`"${environmentId}" / ${Inventory.db.name}: deleted ${samples.length} sample item(s) and their stock.`);
    process.exit(0);
  }

  const existingKeys = new Set(
    samples.map((e) => sampleKey(e.fields.name?.[LOCALE] ?? '', e.fields.content?.[LOCALE] ?? ''))
  );
  const missing = SAMPLES.filter((s) => !existingKeys.has(sampleKey(s[1], s[4])));

  const categories = await client.entry.getMany({ ...params, query: { content_type: 'shopCategory', limit: 1000 } });
  const categoryBySlug = new Map(categories.items.map((c) => [c.fields.slug?.[LOCALE], c.sys.id]));
  // Artwork cover images, so the samples show real art.
  const artworks = await client.entry.getMany({ ...params, query: { content_type: 'artwork', limit: 1000 } });
  const imageIds = [...new Set(artworks.items.map((a) => a.fields.coverImage?.[LOCALE]?.sys?.id).filter(Boolean))];

  // [itemId, sample] for every sample that exists after this run
  const stocked = samples
    .map((e) => [e.fields.itemId?.[LOCALE], sampleFor(e)])
    .filter(([itemId, sample]) => itemId && sample);

  for (const sample of missing) {
    const index = SAMPLES.indexOf(sample);
    const [slug, name, price, , description, sizes = [], photos = 1] = sample;
    const categoryId = categoryBySlug.get(slug);
    if (!categoryId) {
      console.warn(`Skipping "${name}": no shop category with slug "${slug}".`);
      continue;
    }
    const images = Array.from({ length: photos }, (_, i) => imageIds[(index + i * 7) % imageIds.length]);
    const itemId = generateItemId();
    const fields = {
      name: wrap(name),
      itemId: wrap(itemId),
      category: wrap(link('Entry', categoryId)),
      price: wrap(price),
      ...(sizes.length && { sizes: wrap(sizes) }),
      content: wrap(description),
      showInApp: wrap(true),
      ...(imageIds.length && { images: wrap(images.map((id) => link('Asset', id))) }),
    };
    const entry = await client.entry.create({ ...params, contentTypeId: 'shopItem' }, { fields });
    await client.entry.publish({ ...params, entryId: entry.sys.id }, entry);
    stocked.push([itemId, sample]);
    console.log(`  + ${name} (${slug}, $${price}${sizes.length ? `, sizes ${sizes.join('/')}` : ''})`);
  }

  const reset = process.argv.includes('--reset-inventory');
  let restocked = 0;
  for (const [itemId, sample] of stocked) {
    if (!reset && (await Inventory.exists({ itemId }))) continue;
    await Inventory.deleteMany({ itemId });
    await Inventory.insertMany(inventoryRows(itemId, sample));
    restocked += 1;
  }

  console.log(
    `"${environmentId}" / ${Inventory.db.name}: ${missing.length} sample(s) created, ${restocked} stocked (${stocked.length} samples total).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed:', err.message || err);
  process.exit(1);
});
