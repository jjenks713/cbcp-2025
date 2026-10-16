const express = require('express');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function toPublicUser(user) {
  return { id: user._id, email: user.email, name: user.name, role: user.role };
}

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

// No public registration route - accounts (including the first admin) are
// created directly via scripts/createUser.js, per project decision.
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ token: signToken(user), user: toPublicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }
  res.json({ user: toPublicUser(user) });
});

module.exports = router;
