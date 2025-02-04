const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    priority: { type: Number, required: true, enum: [0, 1, 2, 3] }, // 0: Owner, 1: Admin, 2: User, 3: Service
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
