const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Create a sale (POS checkout)
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const { store_id, items, payment_method, discount } = req.body;
  // Cashiers can only sell at their assigned store
  if (req.user.role === 'cashier' && req.user.store_id != store_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!items || items.length === 0) return res.status(400).json({ error: 'No items' });

  const TAX_RATE = 0.15;
  let subtotal = 0;
  const insertTx = db.transaction(() => {
    items.forEach(item => { subtotal += item.quantity * item.unit_price; });
    const discountAmt = discount || 0;
    const taxable = subtotal - discountAmt;
    const tax = parseFloat((taxable * TAX_RATE).toFixed(2));
    const total = parseFloat((taxable + tax).toFixed(2));

    const tx = db.prepare(
      'INSERT INTO transactions (store_id, user_id, total, tax, discount, payment_method) VALUES (?,?,?,?,?,?)'
    ).run(store_id, req.user.id, total, tax, discountAmt, payment_method || 'cash');

    items.forEach(item => {
      db.prepare(
        'INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, subtotal) VALUES (?,?,?,?,?)'
      ).run(tx.lastInsertRowid, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price);
      // Decrement inventory
      db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE product_id=? AND store_id=?')
        .run(item.quantity, item.product_id, store_id);
    });
    return { id: tx.lastInsertRowid, total, tax, discount: discountAmt };
  });

  try {
    res.json(insertTx());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List transactions
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { store_id, from, to, limit = 100 } = req.query;
  let where = [];
  let params = [];
  if (req.user.role !== 'supervisor') {
    where.push('t.store_id = ?'); params.push(req.user.store_id);
  } else if (store_id) {
    where.push('t.store_id = ?'); params.push(store_id);
  }
  if (from) { where.push('date(t.created_at) >= ?'); params.push(from); }
  if (to)   { where.push('date(t.created_at) <= ?'); params.push(to); }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const txs = db.prepare(`
    SELECT t.*, s.name as store_name, u.name as cashier_name
    FROM transactions t
    JOIN stores s ON t.store_id = s.id
    JOIN users u ON t.user_id = u.id
    ${whereClause}
    ORDER BY t.created_at DESC LIMIT ?
  `).all(...params, parseInt(limit));
  res.json(txs);
});

// Get single transaction with items
router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const tx = db.prepare(`
    SELECT t.*, s.name as store_name, u.name as cashier_name
    FROM transactions t JOIN stores s ON t.store_id=s.id JOIN users u ON t.user_id=u.id
    WHERE t.id=?
  `).get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'Not found' });
  tx.items = db.prepare(`
    SELECT ti.*, p.name, p.sku FROM transaction_items ti JOIN products p ON ti.product_id=p.id
    WHERE ti.transaction_id=?
  `).all(req.params.id);
  res.json(tx);
});

module.exports = router;
