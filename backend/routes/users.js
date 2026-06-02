const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Supervisors see all; managers see their store only
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  let users;
  if (req.user.role === 'supervisor') {
    users = db.prepare(`SELECT u.id, u.name, u.email, u.role, u.active, u.store_id, s.name as store_name, u.created_at
                        FROM users u LEFT JOIN stores s ON u.store_id = s.id ORDER BY u.name`).all();
  } else if (req.user.role === 'manager') {
    users = db.prepare(`SELECT u.id, u.name, u.email, u.role, u.active, u.store_id, s.name as store_name, u.created_at
                        FROM users u LEFT JOIN stores s ON u.store_id = s.id
                        WHERE u.store_id = ? ORDER BY u.name`).all(req.user.store_id);
  } else {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(users);
});

router.post('/', authorize('supervisor', 'manager'), (req, res) => {
  const db = req.app.locals.db;
  const { name, email, password, role, store_id } = req.body;
  // Managers can only create cashiers for their store
  if (req.user.role === 'manager' && (role !== 'cashier' || store_id != req.user.store_id)) {
    return res.status(403).json({ error: 'Managers can only create cashiers for their store' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare('INSERT INTO users (name, email, password_hash, role, store_id) VALUES (?,?,?,?,?)').run(name, email, hash, role, store_id || null);
    res.json({ id: result.lastInsertRowid, name, email, role, store_id });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

router.put('/:id', authorize('supervisor', 'manager'), (req, res) => {
  const db = req.app.locals.db;
  const { name, email, role, store_id, active, password } = req.body;
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET name=?, email=?, role=?, store_id=?, active=?, password_hash=? WHERE id=?')
      .run(name, email, role, store_id || null, active ?? 1, hash, req.params.id);
  } else {
    db.prepare('UPDATE users SET name=?, email=?, role=?, store_id=?, active=? WHERE id=?')
      .run(name, email, role, store_id || null, active ?? 1, req.params.id);
  }
  res.json({ success: true });
});

router.delete('/:id', authorize('supervisor'), (req, res) => {
  const db = req.app.locals.db;
  db.prepare('UPDATE users SET active=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
