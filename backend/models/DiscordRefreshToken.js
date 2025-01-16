const mongoose = require('mongoose');

const DiscordRefreshTokenSchema = new mongoose.Schema({
    discordId: { type: String, required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('DiscordRefreshToken', DiscordRefreshTokenSchema);
