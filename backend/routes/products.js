const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const products = db.prepare(`
    SELECT p.*, c.name as category_name FROM products p
    LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name
  `).all();
  res.json(products);
});

router.get('/categories', (req, res) => {
  const db = req.app.locals.db;
  res.json(db.prepare('SELECT * FROM categories ORDER BY name').all());
});

router.post('/', authorize('supervisor', 'manager'), (req, res) => {
  const db = req.app.locals.db;
  const { name, sku, category_id, price, cost, barcode, unit } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO products (name, sku, category_id, price, cost, barcode, unit) VALUES (?,?,?,?,?,?,?)'
    ).run(name, sku, category_id, price, cost, barcode, unit || 'pcs');
    // Auto-create inventory rows for all stores
    const stores = db.prepare('SELECT id FROM stores').all();
    stores.forEach(s => {
      db.prepare('INSERT OR IGNORE INTO inventory (product_id, store_id, quantity) VALUES (?,?,0)').run(result.lastInsertRowid, s.id);
    });
    res.json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: 'SKU already exists' });
  }
});

router.put('/:id', authorize('supervisor', 'manager'), (req, res) => {
  const db = req.app.locals.db;
  const { name, sku, category_id, price, cost, barcode, unit } = req.body;
  db.prepare('UPDATE products SET name=?, sku=?, category_id=?, price=?, cost=?, barcode=?, unit=? WHERE id=?')
    .run(name, sku, category_id, price, cost, barcode, unit, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', authorize('supervisor'), (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
