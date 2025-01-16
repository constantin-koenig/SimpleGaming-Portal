const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    discriminator: { type: String, required: true },
    avatar: { type: String },
    roles: { type: [String], default: [] },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
