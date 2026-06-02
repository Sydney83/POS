const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Get inventory for a store
router.get('/store/:storeId', (req, res) => {
  const db = req.app.locals.db;
  const storeId = req.params.storeId;
  // Non-supervisors can only view their store
  if (req.user.role !== 'supervisor' && req.user.store_id != storeId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const inventory = db.prepare(`
    SELECT i.*, p.name, p.sku, p.price, p.cost, p.barcode, p.unit, c.name as category_name
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE i.store_id = ?
    ORDER BY p.name
  `).all(storeId);
  res.json(inventory);
});

// Adjust stock (manager/supervisor only)
router.put('/adjust', authorize('supervisor', 'manager'), (req, res) => {
  const db = req.app.locals.db;
  const { product_id, store_id, quantity, low_stock_threshold } = req.body;
  if (req.user.role === 'manager' && req.user.store_id != store_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.prepare(`INSERT INTO inventory (product_id, store_id, quantity, low_stock_threshold) VALUES (?,?,?,?)
              ON CONFLICT(product_id, store_id) DO UPDATE SET quantity=?, low_stock_threshold=?`)
    .run(product_id, store_id, quantity, low_stock_threshold ?? 10, quantity, low_stock_threshold ?? 10);
  res.json({ success: true });
});

// Stock transfer request
router.post('/transfer', authenticate, (req, res) => {
  const db = req.app.locals.db;
  const { from_store_id, to_store_id, product_id, quantity } = req.body;
  const result = db.prepare(
    'INSERT INTO stock_transfers (from_store_id, to_store_id, product_id, quantity, requested_by) VALUES (?,?,?,?,?)'
  ).run(from_store_id, to_store_id, product_id, quantity, req.user.id);
  res.json({ id: result.lastInsertRowid });
});

// Approve/reject transfer (manager/supervisor)
router.put('/transfer/:id', authorize('supervisor', 'manager'), (req, res) => {
  const db = req.app.locals.db;
  const { status } = req.body;
  const transfer = db.prepare('SELECT * FROM stock_transfers WHERE id=?').get(req.params.id);
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

  if (status === 'approved') {
    // Deduct from source, add to destination
    db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE product_id=? AND store_id=?')
      .run(transfer.quantity, transfer.product_id, transfer.from_store_id);
    db.prepare('UPDATE inventory SET quantity = quantity + ? WHERE product_id=? AND store_id=?')
      .run(transfer.quantity, transfer.product_id, transfer.to_store_id);
  }

  db.prepare('UPDATE stock_transfers SET status=?, approved_by=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(status, req.user.id, req.params.id);
  res.json({ success: true });
});

// List transfers
router.get('/transfers', (req, res) => {
  const db = req.app.locals.db;
  let query = `
    SELECT t.*, p.name as product_name, p.sku,
           fs.name as from_store, ts.name as to_store,
           u.name as requested_by_name
    FROM stock_transfers t
    JOIN products p ON t.product_id = p.id
    LEFT JOIN stores fs ON t.from_store_id = fs.id
    LEFT JOIN stores ts ON t.to_store_id = ts.id
    LEFT JOIN users u ON t.requested_by = u.id
    ORDER BY t.created_at DESC
  `;
  res.json(db.prepare(query).all());
});

module.exports = router;
