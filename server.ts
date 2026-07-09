import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");
const SECRET_KEY = "nita-secret-token-key-2026";

// Create database if not exists
function initDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      // Ensure all tables exist
      if (data.users && data.products && data.orders && data.gallery && data.messages && data.analytics) {
        return data;
      }
    } catch (e) {
      console.error("Database file corrupted, recreating...");
    }
  }

  // Pre-seed database with premium food products, gallery images, users and initial stats
  const initialData = {
    users: [
      {
        id: "usr-admin-1",
        name: "Nita Administrator",
        email: "admin@nitafoods.co.tz",
        // SHA-256 for "nita2026"
        password: crypto.createHash("sha256").update("nita2026").digest("hex"),
        role: "Admin",
        createdAt: new Date().toISOString()
      },
      {
        id: "usr-manager-1",
        name: "Nita Operations Manager",
        email: "manager@nitafoods.co.tz",
        // SHA-256 for "nita2026"
        password: crypto.createHash("sha256").update("nita2026").digest("hex"),
        role: "Manager",
        createdAt: new Date().toISOString()
      }
    ],
    products: [
      {
        id: "prod-1",
        name: "NITA Pumpkin Seeds (Peeled)",
        description: "Premium quality Tanzanian organic pumpkin seeds, shelled and ready to eat or add to healthy dishes. High in natural magnesium, zinc, and antioxidants.",
        category: "Seeds & Nuts",
        price: 15000,
        image: "",
        sizes: ["250g", "500g", "1kg"],
        ingredients: "100% natural, premium hulled Tanzanian pumpkin seeds.",
        benefits: "Rich in antioxidants, supports prostate and heart health, high in iron, zinc, and dietary fiber.",
        createdAt: new Date().toISOString()
      },
      {
        id: "prod-2",
        name: "NITA Pumpkin Seeds (Roasted & Salted)",
        description: "Deliciously roasted Tanzanian pumpkin seeds lightly tossed with organic sea salt. A healthy and satisfying crunch for work, gym, or transit.",
        category: "Seeds & Nuts",
        price: 12000,
        image: "",
        sizes: ["150g", "250g", "500g"],
        ingredients: "Organic pumpkin seeds, organic sea salt, hint of cold-pressed sunflower oil.",
        benefits: "Instant energy booster, outstanding source of plant protein, packed with healthy fats, and supports immunity.",
        createdAt: new Date().toISOString()
      },
      {
        id: "prod-3",
        name: "NITA Sunflower Seeds (Peeled)",
        description: "Sun-ripened organic Tanzanian sunflower seeds, de-shelled with precision under pristine hygiene conditions. Perfect for direct snacking, salad toppings, and baking.",
        category: "Seeds & Nuts",
        price: 8000,
        image: "",
        sizes: ["250g", "500g", "1kg"],
        ingredients: "100% organic Tanzanian shelled sunflower seeds.",
        benefits: "Abundant in Vitamin E to support glowing skin, anti-inflammatory properties, regulates blood sugar, and supports immune system.",
        createdAt: new Date().toISOString()
      },
      {
        id: "prod-4",
        name: "NITA Honey & Raisin Granola Bar",
        description: "Baked whole-grain granola bar bound together with wild Tanzanian forest honey, premium raisins, organic sesame seeds, and toasted pumpkin seeds. No artificial colors or preservatives.",
        category: "Snacks & Energy Bars",
        price: 3500,
        image: "",
        sizes: ["Pack of 5", "Pack of 10"],
        ingredients: "Organic rolled oats, wild Tanzanian honey, premium dried raisins, sesame seeds, pumpkin seeds, cold-pressed sunflower oil.",
        benefits: "High in dietary fiber, sustains energy release, aids digestive health, and makes a smart alternative to sugary snacks.",
        createdAt: new Date().toISOString()
      },
      {
        id: "prod-5",
        name: "NITA Chia & Sesame Granola Bar",
        description: "High-protein roasted sesame and whole chia seed granola bar sweetened naturally. Specially crafted for athletes, busy professionals, and school lunch boxes.",
        category: "Snacks & Energy Bars",
        price: 4000,
        image: "",
        sizes: ["Pack of 5", "Pack of 10"],
        ingredients: "Organic rolled oats, roasted sesame seeds, organic chia seeds, Tanzanian forest honey, natural vanilla extract, sea salt.",
        benefits: "Rich in Omega-3 fatty acids, supports brain and heart health, strong endurance fuel source, and rich in calcium.",
        createdAt: new Date().toISOString()
      }
    ],
    orders: [
      {
        id: "ord-101",
        customerName: "Salum Masanja",
        phone: "+255 712 345 678",
        productId: "prod-1",
        quantity: 3,
        size: "500g",
        status: "Completed",
        createdAt: new Date(Date.now() - 48 * 3600000).toISOString()
      },
      {
        id: "ord-102",
        customerName: "Rehema Mwangi",
        phone: "+255 754 987 654",
        productId: "prod-4",
        quantity: 2,
        size: "Pack of 10",
        status: "Processing",
        createdAt: new Date(Date.now() - 12 * 3600000).toISOString()
      },
      {
        id: "ord-103",
        customerName: "John Mndeme",
        phone: "+255 655 443 322",
        productId: "prod-3",
        quantity: 5,
        size: "1kg",
        status: "Pending",
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
      }
    ],
    gallery: [
      {
        id: "gal-1",
        image: "",
        category: "Products",
        createdAt: new Date().toISOString()
      },
      {
        id: "gal-2",
        image: "",
        category: "Products",
        createdAt: new Date().toISOString()
      },
      {
        id: "gal-3",
        image: "",
        category: "Packaging",
        createdAt: new Date().toISOString()
      },
      {
        id: "gal-4",
        image: "",
        category: "Packaging",
        createdAt: new Date().toISOString()
      },
      {
        id: "gal-5",
        image: "",
        category: "Production Process",
        createdAt: new Date().toISOString()
      },
      {
        id: "gal-6",
        image: "",
        category: "Production Process",
        createdAt: new Date().toISOString()
      },
      {
        id: "gal-7",
        image: "",
        category: "Company Events",
        createdAt: new Date().toISOString()
      },
      {
        id: "gal-8",
        image: "",
        category: "Company Events",
        createdAt: new Date().toISOString()
      },
      {
        id: "gal-9",
        image: "",
        category: "Customers",
        createdAt: new Date().toISOString()
      },
      {
        id: "gal-10",
        image: "",
        category: "Customers",
        createdAt: new Date().toISOString()
      }
    ],
    messages: [
      {
        id: "msg-1",
        name: "Fatma Said",
        email: "fatmasaid@gmail.com",
        phone: "+255 784 111 222",
        message: "Hello NITA Food Products. I run an organic supermarket in Dar es Salaam, and we are interested in stocking your whole line of peeled pumpkin seeds and granola bars. Can you provide wholesale price lists? Shukran.",
        createdAt: new Date(Date.now() - 36 * 3600000).toISOString()
      }
    ],
    analytics: {
      visitors: 1240,
      pageViews: {
        "/": 845,
        "/about": 320,
        "/products": 654,
        "/gallery": 195,
        "/quality": 210,
        "/contact": 152,
        "/admin": 45
      },
      popularProducts: {
        "prod-1": 142,
        "prod-4": 98,
        "prod-3": 65
      }
    }
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  return initialData;
}

const db = initDB();

// Sync in-memory db with file
function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Custom simple token creator and verifier (like JWT)
function generateToken(payload: { id: string; name: string; email: string; role: string }) {
  const payloadStr = JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 });
  const base64Payload = Buffer.from(payloadStr).toString("base64");
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(base64Payload).digest("hex");
  return `${base64Payload}.${signature}`;
}

function verifyToken(token: string) {
  try {
    const [base64Payload, signature] = token.split(".");
    if (!base64Payload || !signature) return null;
    const expectedSignature = crypto.createHmac("sha256", SECRET_KEY).update(base64Payload).digest("hex");
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(base64Payload, "base64").toString("utf-8"));
    if (Date.now() > payload.exp) {
      return null; // expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// Auth Middleware
function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  req.user = decoded;
  next();
}

// ==========================================
// API ENDPOINTS
// ==========================================

// --- AUTH ---
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
  const user = db.users.find((u: any) => u.email === email && u.password === hashedPassword);

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = generateToken({ id: user.id, name: user.name, email: user.email, role: user.role });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// --- ANALYTICS TRACKING ---
app.post("/api/analytics/visit", (req, res) => {
  const { path } = req.body;
  if (!path) return res.status(400).json({ error: "Path is required" });

  db.analytics.visitors += 1;
  db.analytics.pageViews[path] = (db.analytics.pageViews[path] || 0) + 1;
  saveDB();
  res.json({ success: true });
});

app.get("/api/analytics", requireAuth, (req, res) => {
  // Hydrate additional sales info
  let sales = 0;
  db.orders.forEach((o: any) => {
    if (o.status === "Completed") {
      const prod = db.products.find((p: any) => p.id === o.productId);
      if (prod) {
        sales += prod.price * o.quantity;
      }
    }
  });

  res.json({
    visitors: db.analytics.visitors,
    pageViews: db.analytics.pageViews,
    popularProducts: db.analytics.popularProducts,
    totalProducts: db.products.length,
    totalOrders: db.orders.length,
    totalSales: sales,
    orders: db.orders
  });
});

// --- PRODUCTS ---
app.get("/api/products", (req, res) => {
  res.json(db.products);
});

app.get("/api/products/:id", (req, res) => {
  const product = db.products.find((p: any) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  // Track product search view popularity in analytics
  db.analytics.popularProducts[product.id] = (db.analytics.popularProducts[product.id] || 0) + 1;
  saveDB();

  res.json(product);
});

app.post("/api/products", requireAuth, (req, res) => {
  const { name, description, category, price, image, sizes, ingredients, benefits } = req.body;
  if (!name || !description || !category || !price) {
    return res.status(400).json({ error: "Name, description, category, and price are required." });
  }

  const newProduct = {
    id: "prod-" + Date.now(),
    name,
    description,
    category,
    price: Number(price),
    image: image || "",
    sizes: Array.isArray(sizes) ? sizes : ["250g", "500g", "1kg"],
    ingredients: ingredients || "Pure natural food product",
    benefits: benefits || "Rich in essential vitamins and nutrients",
    createdAt: new Date().toISOString()
  };

  db.products.push(newProduct);
  saveDB();
  res.status(201).json(newProduct);
});

app.put("/api/products/:id", requireAuth, (req, res) => {
  const index = db.products.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Product not found" });

  const { name, description, category, price, image, sizes, ingredients, benefits } = req.body;
  const existing = db.products[index];

  db.products[index] = {
    ...existing,
    name: name !== undefined ? name : existing.name,
    description: description !== undefined ? description : existing.description,
    category: category !== undefined ? category : existing.category,
    price: price !== undefined ? Number(price) : existing.price,
    image: image !== undefined ? image : existing.image,
    sizes: sizes !== undefined ? (Array.isArray(sizes) ? sizes : existing.sizes) : existing.sizes,
    ingredients: ingredients !== undefined ? ingredients : existing.ingredients,
    benefits: benefits !== undefined ? benefits : existing.benefits
  };

  saveDB();
  res.json(db.products[index]);
});

app.delete("/api/products/:id", requireAuth, (req, res) => {
  const index = db.products.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Product not found" });

  const deleted = db.products.splice(index, 1);
  saveDB();
  res.json({ message: "Product deleted successfully", product: deleted[0] });
});

// --- ORDERS ---
app.get("/api/orders", requireAuth, (req, res) => {
  // Hydrate orders with product name for admin convenience
  const hydratedOrders = db.orders.map((o: any) => {
    const prod = db.products.find((p: any) => p.id === o.productId);
    return {
      ...o,
      productName: prod ? prod.name : "Unknown Product",
      productPrice: prod ? prod.price : 0
    };
  });
  res.json(hydratedOrders);
});

app.post("/api/orders", (req, res) => {
  const { customerName, phone, productId, quantity, size } = req.body;
  if (!customerName || !phone || !productId || !quantity || !size) {
    return res.status(400).json({ error: "All order fields are required." });
  }

  const prod = db.products.find((p: any) => p.id === productId);
  if (!prod) return res.status(404).json({ error: "Product not found" });

  const newOrder = {
    id: "ord-" + Date.now().toString().slice(-6),
    customerName,
    phone,
    productId,
    quantity: Number(quantity),
    size,
    status: "Pending" as const,
    createdAt: new Date().toISOString()
  };

  db.orders.push(newOrder);
  // Also increment analytics product interest
  db.analytics.popularProducts[productId] = (db.analytics.popularProducts[productId] || 0) + 2;
  saveDB();

  res.status(201).json({
    ...newOrder,
    productName: prod.name,
    productPrice: prod.price
  });
});

app.put("/api/orders/:id", requireAuth, (req, res) => {
  const index = db.orders.findIndex((o: any) => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Order not found" });

  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required." });

  db.orders[index].status = status;
  saveDB();
  res.json(db.orders[index]);
});

// --- GALLERY ---
app.get("/api/gallery", (req, res) => {
  res.json(db.gallery);
});

app.post("/api/gallery", requireAuth, (req, res) => {
  const { image, category } = req.body;
  if (!image || !category) {
    return res.status(400).json({ error: "Image and category are required." });
  }

  const newItem = {
    id: "gal-" + Date.now(),
    image,
    category,
    createdAt: new Date().toISOString()
  };

  db.gallery.push(newItem);
  saveDB();
  res.status(201).json(newItem);
});

app.delete("/api/gallery/:id", requireAuth, (req, res) => {
  const index = db.gallery.findIndex((g: any) => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Gallery item not found" });

  const deleted = db.gallery.splice(index, 1);
  saveDB();
  res.json({ message: "Gallery item deleted successfully", item: deleted[0] });
});

// --- MESSAGES ---
app.get("/api/messages", requireAuth, (req, res) => {
  res.json(db.messages);
});

app.post("/api/messages", (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  const newMessage = {
    id: "msg-" + Date.now(),
    name,
    email,
    phone: phone || "",
    message,
    createdAt: new Date().toISOString()
  };

  db.messages.push(newMessage);
  saveDB();
  res.status(201).json(newMessage);
});

// ==========================================
// VITE OR STATIC SERVING MIDDLEWARE
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NITA Food Backend Server] Running on http://localhost:${PORT}`);
  });
}

start();
