// One-time migration to the roles/userRoles collections:
//   1. creates the "user" and "admin" roles,
//   2. grants roles from each user's old users.role field - "admin" gets
//      both roles, anything else just "user". Users without that field
//      who already have roles (e.g. created by createUser.js since) are
//      left alone; any with no roles at all get "user".
//   3. with --drop-legacy-role, removes the old users.role field.
// Safe to re-run: it only ever adds missing grants, never admin to someone
// whose old role wasn't admin.
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

  // Raw collection: "role" is no longer in the User schema, so Mongoose wouldn't read it.
  const users = await User.collection.find({}, { projection: { email: 1, role: 1 } }).toArray();
  for (const user of users) {
    const current = await UserRole.rolesFor(user._id);
    if (user.role === 'admin') await UserRole.grant(user._id, ['user', 'admin']);
    else if (user.role || !current.length) await UserRole.grant(user._id, ['user']);
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
