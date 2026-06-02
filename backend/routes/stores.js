const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const stores = db.prepare('SELECT * FROM stores ORDER BY name').all();
  res.json(stores);
});

router.post('/', authorize('supervisor'), (req, res) => {
  const db = req.app.locals.db;
  const { name, address, phone } = req.body;
  const result = db.prepare('INSERT INTO stores (name, address, phone) VALUES (?,?,?)').run(name, address, phone);
  res.json({ id: result.lastInsertRowid, name, address, phone });
});

router.put('/:id', authorize('supervisor'), (req, res) => {
  const db = req.app.locals.db;
  const { name, address, phone } = req.body;
  db.prepare('UPDATE stores SET name=?, address=?, phone=? WHERE id=?').run(name, address, phone, req.params.id);
  res.json({ success: true });
});

module.exports = router;
