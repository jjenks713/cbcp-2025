// One-off CLI for creating accounts directly (no public registration route
// by design - see server/src/routes/auth.js).
//
// Usage: node scripts/createUser.js [--db=<name>] <email> <password> [role] [firstName] [lastName]
//   role defaults to "user"; pass "admin" for an admin account (granted both
//   the "user" and "admin" roles). Roles must exist - run seed-roles.js first.
//   --db targets another database on the same cluster, e.g. --db=cbcp2025-prod
//   for the prod API's users (same as the server's MONGODB_DB_NAME).
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const { connectDB } = require('../src/db');
const User = require('../src/models/User');
const UserRole = require('../src/models/UserRole');
require('../src/models/Role');

async function main() {
  const args = process.argv.slice(2);
  const dbFlag = args.find((a) => a.startsWith('--db='));
  if (dbFlag) process.env.MONGODB_DB_NAME = dbFlag.slice('--db='.length);
  const [email, password, role = 'user', firstName, lastName] = args.filter((a) => a !== dbFlag);
  if (!email || !password) {
    console.error('Usage: node scripts/createUser.js [--db=<name>] <email> <password> [role] [firstName] [lastName]');
    process.exit(1);
  }
  if (!['user', 'admin'].includes(role)) {
    console.error(`Invalid role "${role}" - must be "user" or "admin"`);
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    console.error(`A user with email ${email} already exists`);
    process.exit(1);
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ email, passwordHash, firstName, lastName });
  await UserRole.grant(user._id, role === 'admin' ? ['user', 'admin'] : ['user']);

  console.log(`Created ${role} user: ${user.email} (${user._id}) in database ${User.db.name}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
