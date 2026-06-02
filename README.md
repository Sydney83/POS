# 🛒 POS System — Multi-Store Point of Sale

A full-stack, web-based POS system built with **React + Node.js + SQLite**.

---

## 📁 Project Structure

```
pos-system/
├── backend/                  # Node.js + Express API
│   ├── db/
│   │   └── init.js           # SQLite schema + seed data
│   ├── middleware/
│   │   └── auth.js           # JWT auth + role guards
│   ├── routes/
│   │   ├── auth.js           # Login / me
│   │   ├── stores.js         # Store CRUD
│   │   ├── users.js          # User management
│   │   ├── products.js       # Product catalogue
│   │   ├── inventory.js      # Stock levels + transfers
│   │   ├── sales.js          # POS checkout + history
│   │   └── reports.js        # Dashboard analytics
│   ├── .env                  # Backend config
│   └── server.js             # Entry point
│
├── frontend/                 # React + Vite + Tailwind
│   └── src/
│       ├── api/client.js     # Fetch wrapper
│       ├── context/AuthContext.jsx
│       ├── components/Sidebar.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── POS.jsx
│           ├── Inventory.jsx
│           ├── Products.jsx
│           ├── Sales.jsx
│           ├── Transfers.jsx
│           ├── Users.jsx
│           └── Stores.jsx
│
├── start.sh                  # One-command startup
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- **Node.js** v18+ (you have v22 ✅)
- **npm** v9+

### 1. Install dependencies

```bash
# Backend
cd pos-system/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Start both servers

```bash
# From the pos-system root:
./start.sh
```

Or start them separately:

```bash
# Terminal 1 — Backend (port 5000)
cd backend && node server.js

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

### 3. Open the app

```
http://localhost:3000
```

---

## 👤 Demo Login Accounts

| Role       | Email                   | Password       | Access                                  |
|------------|-------------------------|----------------|-----------------------------------------|
| Supervisor | supervisor@pos.com      | Password123!   | Everything — all stores                 |
| Manager 1  | manager1@pos.com        | Password123!   | Downtown Branch — manage + reports      |
| Manager 2  | manager2@pos.com        | Password123!   | Westside Branch — manage + reports      |
| Manager 3  | manager3@pos.com        | Password123!   | Northgate Branch — manage + reports     |
| Cashier 1  | cashier1@pos.com        | Password123!   | Downtown — POS + inventory view only    |
| Cashier 2  | cashier2@pos.com        | Password123!   | Westside — POS + inventory view only    |
| Cashier 3  | cashier3@pos.com        | Password123!   | Northgate — POS + inventory view only   |

---

## 🔐 Role Permissions

| Feature            | Cashier | Manager | Supervisor |
|--------------------|:-------:|:-------:|:----------:|
| Point of Sale      | ✅      | ✅      | ✅         |
| View Inventory     | ✅ (own)| ✅ (own)| ✅ (all)   |
| Adjust Inventory   | ❌      | ✅      | ✅         |
| Products           | ❌      | ✅      | ✅         |
| Delete Products    | ❌      | ❌      | ✅         |
| Sales Reports      | ❌      | ✅ (own)| ✅ (all)   |
| Dashboard          | ❌      | ✅      | ✅         |
| Stock Transfers    | ❌      | ✅      | ✅         |
| User Management    | ❌      | ✅ (cashiers)| ✅    |
| Store Management   | ❌      | ❌      | ✅         |

---

## 🗄️ Database

SQLite file is at `backend/db/pos.db`. It's auto-created and seeded on first run.

**To reset the database:**
```bash
rm backend/db/pos.db
node backend/server.js   # re-seeds automatically
```

---

## 🌐 Hosting (Production)

### Option A — Railway (Easiest, free tier)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your_strong_secret_here
   PORT=5000
   ```
4. Add a **start command**: `node backend/server.js`
5. For the frontend: build it and serve from backend, or deploy to **Vercel**

### Option B — Serve frontend from Express (Single Deploy)

Add this to `backend/server.js` (after your routes):

```js
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

Then in `frontend/vite.config.js`, set:
```js
base: '/'
```

Build the frontend:
```bash
cd frontend && npm run build
```

Now `node backend/server.js` serves everything on port 5000.

### Option C — VPS (DigitalOcean / Linode)

```bash
# Install Node + PM2
npm install -g pm2

# Start backend with PM2 (auto-restart)
pm2 start backend/server.js --name pos-backend
pm2 save
pm2 startup

# Nginx as reverse proxy (port 80 → 5000)
sudo apt install nginx
# Configure /etc/nginx/sites-available/pos with proxy_pass to localhost:5000
```

---

## ⚙️ Environment Variables

`backend/.env`:
```env
PORT=5000
JWT_SECRET=change_this_to_something_long_and_random
NODE_ENV=development
```

---

## 🔧 Customisation Tips

- **Tax rate**: Edit `TAX_RATE = 0.15` in `backend/routes/sales.js`
- **Add currency**: Update `fmt()` functions in frontend pages
- **Add more stores**: Login as supervisor → Stores → Add Store
- **Add products**: Login as manager/supervisor → Products → Add Product
- **Change logo/name**: Edit `frontend/src/components/Sidebar.jsx` and `Login.jsx`
- **Swap SQLite → PostgreSQL**: Replace `better-sqlite3` with `pg`, update query syntax

# POS
# POS
# POS
# POS
