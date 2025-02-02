const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["server", "channel", "document", "group", "custom"], // Anpassbar für verschiedene Arten
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Resource", ResourceSchema);
