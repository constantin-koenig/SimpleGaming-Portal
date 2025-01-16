// routes/protectedRoutes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');

// Beispiel: Nur User mit "view_account" Permission
router.get('/account', 
  authMiddleware,
  requirePermission(['view_account']), 
  (req, res) => {
    res.send('Willkommen auf deiner Account-Seite!');
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
