# NITA FOOD PRODUCTS - Setup, Migration & Deployment Guide

This document outlines the system architecture, PostgreSQL database design, Prisma ORM setup, local run commands, and cloud deployment guidelines for **NITA FOOD PRODUCTS** (Tanzania).

---

## 1. System Architecture

The application is built on a modern full-stack TypeScript architecture:

- **Frontend**: Single Page Application (SPA) built with React 19, TypeScript, Tailwind CSS, Framer Motion, and React Router.
- **Backend**: Express REST API integrated with Vite middleware for fast development and high-performance standalone CommonJS production bundle (`dist/server.cjs`).
- **Database & ORM**: PostgreSQL database managed through Prisma ORM (`@prisma/client`).
- **Authentication**: Secure bcrypt-hashed passwords and HMAC-SHA256 JWT tokens. Only one role exists: **`Admin`**. (Manager role has been completely removed).

---

## 2. Environment Configuration

Create a `.env` file in the root directory and configure the following variables:

```env
# PostgreSQL Database Connection URL (e.g. Supabase, Neon, Railway, Local)
DATABASE_URL="postgresql://postgres:password@localhost:5432/nita_db?schema=public"

# JSON Web Token Secret for Admin Authentication
JWT_SECRET="nita-food-secure-jwt-secret-key-2026"

# Initial Admin Credentials (used during seed or first boot)
ADMIN_INITIAL_EMAIL="admin@nitafoods.local"
ADMIN_INITIAL_PASSWORD="change-this-before-production"

# Application URL
APP_URL="http://localhost:3000"
```

---

## 3. Local Development Setup & Database Migration Commands

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```
*(On Windows PowerShell if `npx` script execution is restricted, run: `npx.cmd prisma generate`)*

### Step 3: Run Database Migrations
Create and apply initial PostgreSQL tables:
```bash
npx prisma migrate dev --name init_postgresql
```
*(Windows PowerShell: `npx.cmd prisma migrate dev --name init_postgresql`)*

### Step 4: Seed Database
Populates the database with the initial single Admin account and catalog:
```bash
npx prisma db seed
```
*(Windows PowerShell: `npx.cmd prisma db seed`)*

### Step 5: Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 4. Admin Portal Access

The public website does not display an Admin login button in the navbar. Access the portal directly via:
- URL: **`http://localhost:3000/admin`** or **`http://localhost:3000/admin/login`**
- **Default Email**: `admin@nitafoods.local` (or whatever configured in `.env`)
- **Default Password**: `admin123` (or whatever configured in `.env`)

The Admin has full privileges:
- Adding, editing, and deleting products
- Managing product sizes & image URLs
- Managing gallery items & categories
- Viewing incoming customer orders & updating order status
- Reading contact messages & inquiries
- Real-time website and product view analytics

---

## 5. Useful Prisma Commands

- **Open Prisma Studio (Visual DB GUI)**:
  ```bash
  npx prisma studio
  # or on Windows: npx.cmd prisma studio
  ```
- **Update Schema Changes**:
  ```bash
  npx prisma migrate dev
  # or on Windows: npx.cmd prisma migrate dev
  ```
- **Reset Database**:
  ```bash
  npx prisma migrate reset
  # or on Windows: npx.cmd prisma migrate reset
  ```

---

## 6. Deployment Instructions (Vercel / Railway / Render)

### A. Deploying to Vercel
1. Set the following Environment Variables in the Vercel Project Settings:
   - `DATABASE_URL` = Your hosted PostgreSQL connection string (from Supabase, Neon, or Railway)
   - `JWT_SECRET` = A strong secret random string
   - `ADMIN_INITIAL_EMAIL` = Your production admin email
   - `ADMIN_INITIAL_PASSWORD` = Your production admin password
2. Add Build Command:
   ```bash
   prisma generate && npm run build
   ```
3. After deployment, run `npx prisma migrate deploy` and `npx prisma db seed` against your production database.

### B. Deploying to Railway / Render (Full-Stack Container or Node Service)
- **Build Command**: `npm run prisma:generate && npm run build`
- **Start Command**: `npm run start`
- Provide `DATABASE_URL` and `JWT_SECRET`.
