// src/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  username: String,
  avatar: String,
  role: { type: String, enum: ["user", "admin", "moderator"], default: "user" },
});

module.exports = mongoose.model("User", userSchema);
