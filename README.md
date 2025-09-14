# InsightsX
# Shopify Data Ingestion & Insights Service

A multi-tenant Shopify data ingestion and insights platform that fetches products, customers, and orders from Shopify stores, stores them in a relational database, and visualizes business insights through an interactive dashboard.


---

## 🚀 Features

* **Shopify API Integration**

  * Ingests customers, orders, and products from Shopify.
  * Sync scheduler for automatic updates.
  * Multi-tenant handling with isolated data per store.

* **Insights Dashboard** (React + Chart.js)

  * Total customers, orders, and revenue.
  * Orders by date (with date range filtering).
  * Top 5 customers by spend.
  * Trend charts for key business metrics.

* **Authentication**

  * Email-based login for accessing dashboard.
  * Tenant onboarding & authentication for multi-store handling.

* **Database (MySQL with Sequelize ORM)**

  * Clean schema with tenant isolation.
  * Easily extensible for new entities/events.

* **Deployment Ready**

  * Configurations for Render, Railway, Heroku, and Vercel.
  * `.env` driven secrets and tenant configuration.

---

## 🛠️ Tech Stack

* **Backend:** Node.js (Express.js)
* **Frontend:** React.js with Chart.js
* **Database:** MySQL (via Sequelize ORM)
* **Deployment:** Railway, Render, Vercel, or Heroku
* **Others:** Scheduler for data sync, JWT/Auth middleware

---

## 📂 Folder Structure

```
insightsx
├── client
│   ├── src
│   │   ├── app.js
│   │   ├── AuthPage.js
│   │   ├── Dashboard.js
│   │   └── index.html
│   ├── index.html
│   ├── style.css
│   └── tailwind.config.js
├── config
│   └── database.js
├── middleware
│   ├── auth.js
│   └── tenant.js
├── models
│   ├── customer.js
│   ├── index.js
│   ├── order.js
│   ├── product.js
│   ├── tenant.js
│   └── user.js
├── routes
│   ├── auth.js
│   ├── customers.js
│   ├── metrics.js
│   ├── orders.js
│   ├── products.js
│   ├── shopify.js
│   ├── tenants.js
│   └── webhook.js
├── scripts
│   ├── migrate.js
│   ├── script_1.py
│   ├── script_2.py
│   ├── script_3.py
│   ├── script_4.py
│   ├── script_5.py
│   ├── script_6.py
│   ├── script_7.py
│   └── seed.js
├── services
│   └── shopify_service.js
├── .env
├── package.json
├── Procfile
├── railway.json
├── render.yaml
├── server.js
└── vercel.json

---

## ⚙️ Setup Instructions

---

### 1. Clone the Repository

```bash
git clone https://github.com/Khushnood-Ali/insightsx.git
cd insightsx
```

### 2. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd client
npm install
```

### 3. Configure Environment

Create a `.env` file in root:

```env
# Database
DB_NAME=insightsx
DB_USER=root
DB_PASS=your_db_password
DB_HOST=localhost
DB_PORT=3306

# Server
PORT=3001
NODE_ENV=development
JWT_SECRET=supersecret123

# Shopify
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_secret
SHOPIFY_ADMIN_API_TOKEN=Admin_Token   
SHOPIFY_STORE_DOMAIN=your_domain

NOTE: change the required values accordingly

```

### 4. Run Locally

```bash
# Backend
npm run dev

# Frontend
cd client
npm start
```

---

## 🗄 Database Schema

* **Tenant** → `id, name, api_key, api_secret`
* **Customer** → `id, tenantId, name, email, total_spent`
* **Order** → `id, tenantId, customerId, date, total_price`
* **Product** → `id, tenantId, name, price, sku, inventory_count`

All tables are linked via `tenantId` to support **multi-tenancy**.

---

## 📡 API Endpoints

### Auth & Tenant

* `POST /api/auth/register` → Register tenant
* `POST /api/auth/login` → Login

### Shopify Data Sync

* `POST /api/tenant/:id/sync` → Trigger sync for a tenant

### Insights

* `GET /api/insights/summary` → Total customers, orders, revenue
* `GET /api/insights/orders?start=YYYY-MM-DD&end=YYYY-MM-DD` → Orders by date
* `GET /api/insights/top-customers` → Top 5 customers by spend

---

## 📊 Dashboard Screens

* **Login Screen** (email auth)
* **Dashboard**

  * KPI Cards: Total Customers, Orders, Revenue
  * Chart: Orders by Date (filterable)
  * Table: Top 5 Customers

---

## 🚀 Deployment

Choose one of the configs:

* **Heroku:** `Procfile` ready → `git push heroku main`
* **Render:** `render.yaml`
* **Railway:** `railway.json`
* **Vercel:** `vercel.json`

---
📝 Known Limitations

Shopify webhooks not fully implemented (manual sync required).

Multi-tenancy tested with 3 stores; scaling needs Redis/RabbitMQ for queues.

Limited metrics — can be extended with retention, churn, and product performance.

🔮 Next Steps

Add real-time webhooks for abandoned cart / checkout events.

Improve tenant onboarding flow.

Extend dashboards with segmentation and cohort analysis.

Harden security with OAuth for Shopify app installation.
