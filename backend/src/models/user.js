// src/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  discordID: { type: String, required: true, unique: true },
  username: String,
  avatar: String,
  email: String,
  refreshToken: String,
  role: { type: String, enum: ["user", "admin", "moderator"], default: "user" },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

userSchema.virtual("avatarURL").get(function () {
  if (this.avatar) {
    // Wenn der Avatar mit "a_" beginnt, ist es ein GIF
    const fileExtension = this.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${this.discordID}/${this.avatar}.${fileExtension}`;
  } else {
    // Standard-Avatar
    const defaultAvatar = Number(this.discordID) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
  }
});

module.exports = mongoose.model("User", userSchema);
