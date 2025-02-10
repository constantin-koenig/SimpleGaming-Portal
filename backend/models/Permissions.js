const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    priority: { type: Number, required: true, enum: [0, 1, 2, 3], default: 2 }, 
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);
