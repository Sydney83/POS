const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'pos.db');

function initDB() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    -- Stores
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('cashier','manager','supervisor')),
      store_id INTEGER REFERENCES stores(id),
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT
    );

    -- Products (global catalogue)
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      price REAL NOT NULL DEFAULT 0,
      cost  REAL NOT NULL DEFAULT 0,
      barcode TEXT,
      unit TEXT DEFAULT 'pcs',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Inventory per store
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      store_id   INTEGER NOT NULL REFERENCES stores(id),
      quantity   REAL NOT NULL DEFAULT 0,
      low_stock_threshold REAL DEFAULT 10,
      UNIQUE(product_id, store_id)
    );

    -- Sales transactions
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL REFERENCES stores(id),
      user_id  INTEGER NOT NULL REFERENCES users(id),
      total    REAL NOT NULL DEFAULT 0,
      tax      REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Sale line items
    CREATE TABLE IF NOT EXISTS transaction_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id),
      product_id     INTEGER NOT NULL REFERENCES products(id),
      quantity       REAL NOT NULL,
      unit_price     REAL NOT NULL,
      subtotal       REAL NOT NULL
    );

    -- Stock transfers between stores
    CREATE TABLE IF NOT EXISTS stock_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_store_id INTEGER REFERENCES stores(id),
      to_store_id   INTEGER REFERENCES stores(id),
      product_id    INTEGER NOT NULL REFERENCES products(id),
      quantity      REAL NOT NULL,
      status        TEXT DEFAULT 'pending',
      requested_by  INTEGER REFERENCES users(id),
      approved_by   INTEGER REFERENCES users(id),
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ── Seed data ──────────────────────────────────────────────────────────────
  const storeCount = db.prepare('SELECT COUNT(*) as c FROM stores').get().c;
  if (storeCount === 0) {
    // Stores
    const insertStore = db.prepare('INSERT INTO stores (name, address, phone) VALUES (?,?,?)');
    insertStore.run('Downtown Branch',   '123 Main St, City Centre',  '555-0101');
    insertStore.run('Westside Branch',   '456 West Ave, West District','555-0202');
    insertStore.run('Northgate Branch',  '789 North Blvd, North End', '555-0303');

    // Categories
    const insertCat = db.prepare('INSERT INTO categories (name, description) VALUES (?,?)');
    insertCat.run('Beverages',  'Drinks and liquids');
    insertCat.run('Snacks',     'Chips, biscuits and snacks');
    insertCat.run('Dairy',      'Milk, cheese and dairy products');
    insertCat.run('Bakery',     'Bread, cakes and pastries');
    insertCat.run('Electronics','Electronic accessories');

    // Products
    const insertProduct = db.prepare(
      'INSERT INTO products (name, sku, category_id, price, cost, barcode, unit) VALUES (?,?,?,?,?,?,?)'
    );
    const products = [
      ['Coca Cola 500ml',     'BEV-001', 1, 1.50, 0.80, '5000112637922', 'pcs'],
      ['Orange Juice 1L',     'BEV-002', 1, 2.99, 1.50, '5000112637923', 'pcs'],
      ['Water 600ml',         'BEV-003', 1, 0.99, 0.40, '5000112637924', 'pcs'],
      ['Lays Classic 150g',   'SNK-001', 2, 2.49, 1.20, '5000112637925', 'pcs'],
      ['Oreo Cookies 300g',   'SNK-002', 2, 3.99, 2.00, '5000112637926', 'pcs'],
      ['Full Cream Milk 1L',  'DAI-001', 3, 1.89, 0.90, '5000112637927', 'pcs'],
      ['Cheddar Cheese 200g', 'DAI-002', 3, 4.49, 2.20, '5000112637928', 'pcs'],
      ['White Bread Loaf',    'BAK-001', 4, 2.29, 1.00, '5000112637929', 'pcs'],
      ['Croissant x4',        'BAK-002', 4, 3.49, 1.50, '5000112637930', 'pcs'],
      ['USB Cable Type-C',    'ELC-001', 5,12.99, 5.00, '5000112637931', 'pcs'],
    ];
    products.forEach(p => insertProduct.run(...p));

    // Inventory per store
    const insertInv = db.prepare(
      'INSERT INTO inventory (product_id, store_id, quantity, low_stock_threshold) VALUES (?,?,?,?)'
    );
    for (let storeId = 1; storeId <= 3; storeId++) {
      for (let productId = 1; productId <= 10; productId++) {
        const qty = Math.floor(Math.random() * 80) + 20;
        insertInv.run(productId, storeId, qty, 10);
      }
    }

    // Default users — password: Password123!
    const hash = bcrypt.hashSync('Password123!', 10);
    const insertUser = db.prepare(
      'INSERT INTO users (name, email, password_hash, role, store_id) VALUES (?,?,?,?,?)'
    );
    // Supervisor (access all stores — store_id null)
    insertUser.run('Super Admin',      'supervisor@pos.com',  hash, 'supervisor', null);
    // Managers per store
    insertUser.run('Alice Manager',    'manager1@pos.com',    hash, 'manager',    1);
    insertUser.run('Bob Manager',      'manager2@pos.com',    hash, 'manager',    2);
    insertUser.run('Carol Manager',    'manager3@pos.com',    hash, 'manager',    3);
    // Cashiers
    insertUser.run('Dave Cashier',     'cashier1@pos.com',    hash, 'cashier',    1);
    insertUser.run('Eve Cashier',      'cashier2@pos.com',    hash, 'cashier',    2);
    insertUser.run('Frank Cashier',    'cashier3@pos.com',    hash, 'cashier',    3);

    console.log('✅ Database seeded with stores, products, inventory and users.');
  }

  return db;
}

module.exports = { initDB, DB_PATH };
