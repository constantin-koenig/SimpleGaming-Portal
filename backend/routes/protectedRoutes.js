// routes/protectedRoutes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');

// Beispiel: Nur User mit "view_account" Permission
router.get('/user/dashboard', 
  authMiddleware,
  requirePermission(['user_view_dashboard']), 
  (req, res) => {
    res.send('Willkommen auf deiner Dashboard-Seite!');
  }
);

// Beispiel: Hier sind ZWEI Permissions nötig
router.post('/posts',
  authMiddleware,
  requirePermission(['create_post', 'upload_files']),
  (req, res) => {
    // ...
    res.send('Post angelegt!');
  }
);

module.exports = router;
