const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const UserRole = require('../models/UserRole');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Checked against userRoles on every request rather than trusted from the
// token, so revoking admin takes effect immediately, not when the token expires.
async function requireAdmin(req, res, next) {
  const roles = mongoose.isValidObjectId(req.user?.sub) ? await UserRole.rolesFor(req.user.sub) : [];
  if (!roles.includes('admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  req.user.roles = roles;
  next();
}

module.exports = { requireAuth, requireAdmin };
