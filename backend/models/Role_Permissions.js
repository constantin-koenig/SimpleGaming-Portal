const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema({
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    permission: { type: mongoose.Schema.Types.ObjectId, ref: 'Permission', required: true },
    effect: { type: String, required: true, enum: ['allow', 'deny'] }, // "allow" oder "deny"
}, { timestamps: true });

module.exports = mongoose.model('RolePermission', rolePermissionSchema);