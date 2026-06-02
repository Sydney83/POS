const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate, authorize('supervisor', 'manager'));

// Dashboard summary
router.get('/summary', (req, res) => {
  const db = req.app.locals.db;
  const storeFilter = req.user.role === 'supervisor' ? '' : `AND t.store_id = ${req.user.store_id}`;
  const invFilter  = req.user.role === 'supervisor' ? '' : `AND store_id = ${req.user.store_id}`;

  const todaySales = db.prepare(`
    SELECT COALESCE(SUM(total),0) as revenue, COUNT(*) as count
    FROM transactions t WHERE date(t.created_at) = date('now') ${storeFilter}
  `).get();

  const monthSales = db.prepare(`
    SELECT COALESCE(SUM(total),0) as revenue, COUNT(*) as count
    FROM transactions t WHERE strftime('%Y-%m', t.created_at) = strftime('%Y-%m','now') ${storeFilter}
  `).get();

  const lowStock = db.prepare(`
    SELECT COUNT(*) as count FROM inventory WHERE quantity <= low_stock_threshold ${invFilter}
  `).get();

  const topProducts = db.prepare(`
    SELECT p.name, SUM(ti.quantity) as sold, SUM(ti.subtotal) as revenue
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE strftime('%Y-%m', t.created_at) = strftime('%Y-%m','now') ${storeFilter}
    GROUP BY p.id ORDER BY sold DESC LIMIT 5
  `).all();

  const salesByStore = db.prepare(`
    SELECT s.name, COALESCE(SUM(t.total),0) as revenue, COUNT(t.id) as count
    FROM stores s LEFT JOIN transactions t ON s.id = t.store_id
      AND strftime('%Y-%m', t.created_at) = strftime('%Y-%m','now')
    GROUP BY s.id ORDER BY revenue DESC
  `).all();

  const dailySales = db.prepare(`
    SELECT date(created_at) as day, SUM(total) as revenue, COUNT(*) as count
    FROM transactions t WHERE date(created_at) >= date('now','-29 days') ${storeFilter}
    GROUP BY day ORDER BY day
  `).all();

  res.json({ todaySales, monthSales, lowStock, topProducts, salesByStore, dailySales });
});

// Low stock report
router.get('/low-stock', (req, res) => {
  const db = req.app.locals.db;
  const storeFilter = req.user.role === 'supervisor' ? '' : `AND i.store_id = ${req.user.store_id}`;
  const items = db.prepare(`
    SELECT i.*, p.name, p.sku, p.unit, s.name as store_name
    FROM inventory i JOIN products p ON i.product_id=p.id JOIN stores s ON i.store_id=s.id
    WHERE i.quantity <= i.low_stock_threshold ${storeFilter}
    ORDER BY i.quantity ASC
  `).all();
  res.json(items);
});

module.exports = router;
