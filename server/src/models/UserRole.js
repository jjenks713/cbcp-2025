const mongoose = require('mongoose');

// Registers the Role model, which populate('roleId') below needs.
const Role = require('./Role');

// Join between User and Role. Revoking a role sets deletedAt rather than
// removing the document, so there's a record of who held what and when.
const userRoleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: 'userRoles' }
);

// A user holds each role at most once at a time; revoked rows don't count.
userRoleSchema.index(
  { userId: 1, roleId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

/** Names of the roles a user currently holds, e.g. ['admin', 'user']. */
userRoleSchema.statics.rolesFor = async function rolesFor(userId) {
  const rows = await this.find({ userId, deletedAt: null }).populate('roleId', 'role');
  return rows.map((row) => row.roleId?.role).filter(Boolean).sort();
};

/** Gives a user the named roles they don't already hold; existing grants are left untouched. */
userRoleSchema.statics.grant = async function grant(userId, roleNames) {
  const roles = await Role.find({ role: { $in: roleNames } });
  const unknown = roleNames.filter((name) => !roles.some((r) => r.role === name));
  if (unknown.length) throw new Error(`Unknown role(s): ${unknown.join(', ')} - run scripts/seed-roles.js first`);

  const held = await this.find({ userId, roleId: { $in: roles.map((r) => r._id) }, deletedAt: null });
  const toGrant = roles.filter((role) => !held.some((row) => row.roleId.equals(role._id)));
  if (toGrant.length) await this.insertMany(toGrant.map((role) => ({ userId, roleId: role._id })));
};

module.exports = mongoose.model('UserRole', userRoleSchema);
