// One-time migration: copies each shop item's stock from Contentful (the
// old shopItem "stock" field) into the inventory collection - one row per
// size, or one row with size null for items without sizes. Sized items get
// their old shared stock on every size; adjust per size afterwards in the
// admin panel. Items that already have inventory rows are left alone, so
// it's safe to re-run.
//
// Run this BEFORE removing the stock field from Contentful
// (scripts/remove-shop-item-stock.js).
//
// Usage: node scripts/migrate-stock-to-inventory.js [--db=<name>] [--env=<contentful env>]
//   --db  database, e.g. --db=cbcp2025-prod (same as createUser.js)
//   --env Contentful environment, e.g. --env=master (default: CONTENTFUL_ENVIRONMENT)
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const contentfulManagement = require('contentful-management');
const { connectDB } = require('../src/db');
const Inventory = require('../src/models/Inventory');

const LOCALE = 'en-US';
const flag = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

async function main() {
  const db = flag('db');
  if (db) process.env.MONGODB_DB_NAME = db;
  const environmentId = flag('env') || process.env.CONTENTFUL_ENVIRONMENT || 'master';
  const { CONTENTFUL_SPACE_ID: spaceId, CONTENTFUL_CMA_TOKEN: accessToken } = process.env;
  if (!spaceId || !accessToken) throw new Error('CONTENTFUL_SPACE_ID / CONTENTFUL_CMA_TOKEN are not set');

  await connectDB();
  await Inventory.syncIndexes();

  const client = contentfulManagement.createClient({ accessToken }, { type: 'plain' });
  const items = await client.entry.getMany({
    spaceId,
    environmentId,
    query: { content_type: 'shopItem', limit: 1000 },
  });

  let migrated = 0;
  for (const entry of items.items) {
    const name = entry.fields.name?.[LOCALE] ?? entry.sys.id;
    const itemId = entry.fields.itemId?.[LOCALE];
    if (!itemId) {
      console.log(`  - ${name}: no itemId, skipped`);
      continue;
    }
    if (await Inventory.exists({ itemId })) {
      console.log(`  = ${name}: already has inventory`);
      continue;
    }
    const stock = Math.max(0, Math.trunc(entry.fields.stock?.[LOCALE] ?? 0));
    const sizes = (entry.fields.sizes?.[LOCALE] ?? []).filter(Boolean);
    const rows = sizes.length ? sizes.map((size) => ({ itemId, size, stock })) : [{ itemId, size: null, stock }];
    await Inventory.insertMany(rows);
    migrated += 1;
    console.log(`  + ${name}: ${rows.map((r) => `${r.size ?? 'one size'}=${r.stock}`).join(', ')}`);
  }

  console.log(`Done: Contentful "${environmentId}" -> ${Inventory.db.name}, ${migrated} item(s) migrated.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
