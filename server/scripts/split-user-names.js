// One-time migration: replaces each user's "name" with firstName/lastName
// (split at the first space - "Josh Jenkin" -> Josh / Jenkin) and gives
// users without an address an explicit null one. Safe to re-run: users
// already migrated are left alone.
//
// Usage: node scripts/split-user-names.js [--db=<name>]
//   --db targets another database on the same cluster, e.g. --db=cbcp2025-prod
//   (same as createUser.js).
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const { connectDB } = require('../src/db');
const User = require('../src/models/User');

async function main() {
  const dbFlag = process.argv.find((a) => a.startsWith('--db='));
  if (dbFlag) process.env.MONGODB_DB_NAME = dbFlag.slice('--db='.length);

  await connectDB();
  // Raw collection: "name" is no longer in the schema, so Mongoose wouldn't read it.
  const users = User.collection;

  const named = await users.find({ name: { $exists: true } }).toArray();
  for (const user of named) {
    const [firstName, ...rest] = String(user.name ?? '').trim().split(/\s+/);
    const update = { $unset: { name: '' } };
    if (!user.firstName && !user.lastName) {
      update.$set = { firstName: firstName || undefined, lastName: rest.join(' ') || undefined };
      Object.keys(update.$set).forEach((k) => update.$set[k] === undefined && delete update.$set[k]);
    }
    await users.updateOne({ _id: user._id }, update);
    console.log(`${user.email}: "${user.name}" -> ${JSON.stringify(update.$set ?? '(kept existing first/last)')}`);
  }

  const { modifiedCount } = await users.updateMany({ address: { $exists: false } }, { $set: { address: null } });

  console.log(`Done in ${User.db.name}: ${named.length} name(s) split, ${modifiedCount} address(es) set to null.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
