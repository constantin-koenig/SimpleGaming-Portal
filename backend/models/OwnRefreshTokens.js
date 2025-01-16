const mongoose = require('mongoose');

const OwnRefreshTokenSchema = new mongoose.Schema({
    userId: { type: String, required: true }, 
    token: { type: String, required: true }, 
    expiresAt: { type: Date, required: true }, 
}, { timestamps: true });

module.exports = mongoose.model('OwnRefreshToken', OwnRefreshTokenSchema);
