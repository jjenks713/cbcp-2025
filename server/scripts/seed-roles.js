// One-time migration to the roles/userRoles collections:
//   1. creates the "user" and "admin" roles,
//   2. grants every existing user both roles,
//   3. with --drop-legacy-role, removes the old users.role field.
// Safe to re-run: existing roles and grants are left alone.
//
// Step 3 is opt-in because an API still running the old code reads
// users.role - e.g. cbcp-2025-api-dev shares cbcp2025 with local dev, so
// drop it there only once this code is deployed to dev.
//
// Usage: node scripts/seed-roles.js [--db=<name>] [--drop-legacy-role]
//   --db targets another database on the same cluster, e.g. --db=cbcp2025-prod
//   (same as createUser.js).
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const { connectDB } = require('../src/db');
const Role = require('../src/models/Role');
const User = require('../src/models/User');
const UserRole = require('../src/models/UserRole');

const ROLES = ['user', 'admin'];

async function main() {
  const dbFlag = process.argv.find((a) => a.startsWith('--db='));
  if (dbFlag) process.env.MONGODB_DB_NAME = dbFlag.slice('--db='.length);
  const dropLegacyRole = process.argv.includes('--drop-legacy-role');

  await connectDB();
  await Promise.all([Role.syncIndexes(), UserRole.syncIndexes()]);

  for (const role of ROLES) {
    await Role.updateOne({ role }, { $setOnInsert: { role } }, { upsert: true });
  }
  console.log(`Roles: ${(await Role.find().sort('role')).map((r) => r.role).join(', ')}`);

  const users = await User.find();
  for (const user of users) {
    await UserRole.grant(user._id, ROLES);
    console.log(`${user.email}: ${(await UserRole.rolesFor(user._id)).join(', ')}`);
  }

  if (dropLegacyRole) {
    const { modifiedCount } = await User.collection.updateMany({ role: { $exists: true } }, { $unset: { role: '' } });
    console.log(`Removed users.role from ${modifiedCount} user(s).`);
  } else {
    console.log('Left users.role in place (pass --drop-legacy-role to remove it).');
  }

  console.log(`Done in ${User.db.name}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
