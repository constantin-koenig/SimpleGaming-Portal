const mongoose = require("mongoose");

const PermissionOverrideSchema = new mongoose.Schema({
    targetType: {
        type: String,
        enum: ["user", "role"], // Entweder eine Benutzer- oder Rollen-Überschreibung
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "targetType" // Verweist dynamisch auf "user" oder "role"
    },
    permissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
        required: true
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource", // Verweis auf die Ressource
        required: true
    },
    action: {
        type: String,
        enum: ["allow", "deny"], // Erlauben oder Verbieten
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("PermissionOverride", PermissionOverrideSchema);
