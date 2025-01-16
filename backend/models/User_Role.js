const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,  // <-- wichtig: ObjectId
    ref: 'User',
    required: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,  // <-- ebenfalls ObjectId
    ref: 'Role',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('UserRole', userRoleSchema);
