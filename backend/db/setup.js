const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");

const DB_PATH = path.join(__dirname, "pos.db");

function getDb() {
  return new Database(DB_PATH);
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('cashier','manager','supervisor')),
      store_id INTEGER REFERENCES stores(id),
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      price REAL NOT NULL,
      cost REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id),
      store_id INTEGER REFERENCES stores(id),
      quantity INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 10,
      UNIQUE(product_id, store_id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER REFERENCES stores(id),
      user_id INTEGER REFERENCES users(id),
      total REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER REFERENCES sales(id),
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id),
      store_id INTEGER REFERENCES stores(id),
      user_id INTEGER REFERENCES users(id),
      change_type TEXT NOT NULL,
      quantity_change INTEGER NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed stores
  const storeCount = db.prepare("SELECT COUNT(*) as c FROM stores").get().c;
  if (storeCount === 0) {
    const insertStore = db.prepare(
      "INSERT INTO stores (name, location) VALUES (?, ?)"
    );
    insertStore.run("Main Branch", "CBD - High Street");
    insertStore.run("North Branch", "Northgate Mall");
    insertStore.run("South Branch", "Southpark Shopping Centre");

    // Seed categories
    const insertCat = db.prepare("INSERT INTO categories (name) VALUES (?)");
    ["Groceries", "Beverages", "Electronics", "Clothing", "Household"].forEach(
      (c) => insertCat.run(c)
    );

    // Seed products
    const insertProd = db.prepare(
      "INSERT INTO products (name, sku, category_id, price, cost) VALUES (?, ?, ?, ?, ?)"
    );
    const products = [
      ["Bread (White)", "BREAD-001", 1, 2.5, 1.2],
      ["Bread (Brown)", "BREAD-002", 1, 2.8, 1.4],
      ["Milk 1L", "MILK-001", 1, 3.0, 1.8],
      ["Eggs (12 pack)", "EGGS-001", 1, 5.5, 3.0],
      ["Rice 2kg", "RICE-001", 1, 8.0, 5.0],
      ["Maize Flour 2kg", "MAIZE-001", 1, 6.5, 4.0],
      ["Coca-Cola 500ml", "COKE-001", 2, 1.5, 0.8],
      ["Water 500ml", "WATR-001", 2, 0.8, 0.3],
      ["Orange Juice 1L", "OJ-001", 2, 4.0, 2.2],
      ["Fanta 500ml", "FANT-001", 2, 1.5, 0.8],
      ["Cooking Oil 2L", "OIL-001", 5, 9.0, 6.0],
      ["Sugar 1kg", "SUGR-001", 1, 3.5, 2.0],
      ["Salt 500g", "SALT-001", 1, 1.0, 0.5],
      ["Soap Bar", "SOAP-001", 5, 1.2, 0.6],
      ["Shampoo 250ml", "SHMP-001", 5, 4.5, 2.5],
    ];
    products.forEach((p) => insertProd.run(...p));

    // Seed inventory (all 3 stores get stock)
    const insertInv = db.prepare(
      "INSERT OR IGNORE INTO inventory (product_id, store_id, quantity, low_stock_threshold) VALUES (?, ?, ?, ?)"
    );
    for (let storeId = 1; storeId <= 3; storeId++) {
      for (let productId = 1; productId <= 15; productId++) {
        const qty = Math.floor(Math.random() * 100) + 20;
        insertInv.run(productId, storeId, qty, 10);
      }
    }

    // Seed users
    const insertUser = db.prepare(
      "INSERT INTO users (username, password, full_name, role, store_id) VALUES (?, ?, ?, ?, ?)"
    );
    const hash = (pw) => bcrypt.hashSync(pw, 10);

    // Supervisor (all stores access)
    insertUser.run(
      "supervisor",
      hash("super123"),
      "Alice Supervisor",
      "supervisor",
      null
    );

    // Managers (one per store)
    insertUser.run(
      "manager1",
      hash("manager123"),
      "Bob Manager",
      "manager",
      1
    );
    insertUser.run(
      "manager2",
      hash("manager123"),
      "Carol Manager",
      "manager",
      2
    );
    insertUser.run(
      "manager3",
      hash("manager123"),
      "David Manager",
      "manager",
      3
    );

    // Cashiers
    insertUser.run(
      "cashier1",
      hash("cashier123"),
      "Eve Cashier",
      "cashier",
      1
    );
    insertUser.run(
      "cashier2",
      hash("cashier123"),
      "Frank Cashier",
      "cashier",
      1
    );
    insertUser.run(
      "cashier3",
      hash("cashier123"),
      "Grace Cashier",
      "cashier",
      2
    );
    insertUser.run(
      "cashier4",
      hash("cashier123"),
      "Henry Cashier",
      "cashier",
      3
    );

    console.log("✅ Database seeded successfully");
  }

  db.close();
}

module.exports = { getDb, initDb };
