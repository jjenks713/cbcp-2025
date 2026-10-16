// One-off CLI for creating accounts directly (no public registration route
// by design - see server/src/routes/auth.js).
//
// Usage: node scripts/createUser.js <email> <password> [role] [name]
//   role defaults to "user"; pass "admin" for an admin account.
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const { connectDB } = require('../src/db');
const User = require('../src/models/User');

async function main() {
  const [email, password, role = 'user', name] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: node scripts/createUser.js <email> <password> [role] [name]');
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
  const user = await User.create({ email, passwordHash, role, name });

  console.log(`Created ${role} user: ${user.email} (${user._id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
