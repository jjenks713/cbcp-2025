const express = require('express');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');

const User = require('../models/User');
const UserRole = require('../models/UserRole');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function toPublicUser(user) {
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    address: user.address ?? null,
    roles: await UserRole.rolesFor(user._id),
  };
}

// Roles aren't in the token - requireAdmin looks them up per request.
function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

// Slows password guessing: 10 failed logins per IP per 15 minutes, then
// 429 until the window passes. Successful logins don't count. Kept in
// memory, so it's per Cloud Run instance and resets on redeploy.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many failed login attempts - try again in 15 minutes' },
});

// No public registration route - accounts (including the first admin) are
// created directly via scripts/createUser.js, per project decision.
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ token: signToken(user), user: await toPublicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }
  res.json({ user: await toPublicUser(user) });
});

// What a user may change about themselves, with max lengths. Email (the
// login) and roles are deliberately not here.
const EDITABLE_PROFILE_FIELDS = { firstName: 100, lastName: 100, address: 500 };

// Updates only the fields sent; a blank or null value clears that field.
router.patch('/me', requireAuth, async (req, res) => {
  const updates = {};
  for (const [field, maxLength] of Object.entries(EDITABLE_PROFILE_FIELDS)) {
    if (!(field in (req.body || {}))) continue;
    const value = req.body[field];
    if (value !== null && typeof value !== 'string') {
      return res.status(400).json({ error: `${field} must be text` });
    }
    const trimmed = value?.trim() ?? '';
    if (trimmed.length > maxLength) {
      return res.status(400).json({ error: `${field} must be at most ${maxLength} characters` });
    }
    updates[field] = trimmed || null;
  }

  const user = await User.findByIdAndUpdate(req.user.sub, { $set: updates }, { new: true, runValidators: true });
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }
  res.json({ user: await toPublicUser(user) });
});

module.exports = router;
