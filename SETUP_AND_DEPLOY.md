# NITA FOOD PRODUCTS - Setup and Deployment Guide

This document outlines the system architecture, database design, setup instructions, and deployment guidelines for the complete full-stack website of **NITA FOOD PRODUCTS** (Tanzania).

---

## 1. System Architecture

The application is built on a robust full-stack architecture matching the exact specifications of premium commercial portals:

- **Frontend**: Single Page Application (SPA) built using React.js, TypeScript, Tailwind CSS, Framer Motion, and React Router v6.
- **Backend**: Node.js and Express.js REST API server serving endpoints for content retrieval, authentication, and order recording.
- **Database Model**: Self-healing, persistent SQL-like relational schema, pre-seeded with premium Tanzanian seed and snack lines.
- **Authentication**: Native HMAC-SHA256 authenticated Bearer tokens with distinct staff roles (`Admin` and `Manager`).

---

## 2. Database Schema (MySQL Definition)

If migrating from the built-in persistent storage to a standalone MySQL instance in production, execute the following SQL schema statements to instantiate the tables:

```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- SHA-256 Hashed password
  role ENUM('Admin', 'Manager') NOT NULL DEFAULT 'Manager',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL, -- in TZS
  image VARCHAR(255) DEFAULT NULL,
  sizes TEXT NOT NULL, -- Stored as comma-separated values (e.g. '150g, 250g, 500g')
  ingredients TEXT DEFAULT NULL,
  benefits TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  size VARCHAR(30) NOT NULL,
  status ENUM('Pending', 'Processing', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 4. Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id VARCHAR(50) PRIMARY KEY,
  image TEXT NOT NULL,
  category ENUM('Products', 'Packaging', 'Production Process', 'Company Events', 'Customers') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Local Development Setup

To run the full-stack application on your computer:

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Steps:
1. **Clone or Extract Files**: Ensure all files are placed in the target project folder.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and copy variables from `.env.example`:
   ```env
   GEMINI_API_KEY="your-gemini-key"
   APP_URL="http://localhost:3000"
   ```
4. **Boot Development Server**:
   The development server is configured with `tsx` to run both the Express backend API and the Vite React frontend on a unified local port (`3000`):
   ```bash
   npm run dev
   ```
5. **Access Application**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 4. Admin Portal Credentials

The application boots pre-seeded with two staff accounts for immediate evaluation:

1. **Role: Admin** (Full access, including product creation, editing, status change, and destructive deletion)
   - **Email**: `admin@nitafoods.co.tz`
   - **Password**: `nita2026`
   
2. **Role: Manager** (Read-only on stats, can update order status, but cannot delete products or delete gallery images)
   - **Email**: `manager@nitafoods.co.tz`
   - **Password**: `nita2026`

---

## 5. Deployment Instructions

### A. Deploying Frontend to Vercel (SPA mode)
To deploy the client application as a standalone static SPA on Vercel:
1. Push your code to a GitHub repository.
2. Connect your repository to Vercel.
3. Set the following build options:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (or `vite build`)
   - **Output Directory**: `dist`
4. Add the following rule to `vercel.json` in the root folder to handle React Router client-side routing redirects:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### B. Deploying Full-Stack to Render or Railway (Docker or Node Node)
For deployment-ready execution hosting the Node/Express backend alongside the frontend:
1. **On Render / Railway**:
   - Create a new **Web Service**.
   - Set **Build Command**: `npm run build` (runs `vite build` and bundles `server.ts` into `dist/server.cjs` via `esbuild`).
   - Set **Start Command**: `npm run start` (starts compiled fast server using `node dist/server.cjs`).
2. **Environment Variables**:
   Define `NODE_ENV=production` in the cloud provider's setting dashboard.
