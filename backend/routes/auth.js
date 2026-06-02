const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = req.app.locals.db;
  const user = db.prepare(
    'SELECT u.*, s.name as store_name FROM users u LEFT JOIN stores s ON u.store_id = s.id WHERE u.email = ? AND u.active = 1'
  ).get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, store_id: user.store_id },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, store_id: user.store_id, store_name: user.store_name } });
});

router.get('/me', authenticate, (req, res) => {
  const db = req.app.locals.db;
  const user = db.prepare(
    'SELECT u.id, u.name, u.email, u.role, u.store_id, s.name as store_name FROM users u LEFT JOIN stores s ON u.store_id = s.id WHERE u.id = ?'
  ).get(req.user.id);
  res.json(user);
});

module.exports = router;
