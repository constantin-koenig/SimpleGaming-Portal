const mongoose = require('mongoose');

const protectedResourceSchema = new mongoose.Schema({
    resourceType: { type: String, required: true }, // Z.B. "Page", "Project"
    resourceId: { type: String, required: true },  // Eindeutige ID der Ressource
    requiredRole: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }, // Rolle, die Zugriff benötigt
    requiredPermission: { type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }, // Berechtigung, die Zugriff benötigt
}, { timestamps: true });

module.exports = mongoose.model('ProtectedResource', protectedResourceSchema);
