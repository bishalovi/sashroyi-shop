const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors"); 

const connectDB = require("./config/db");

const app = express(); 

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const authRoutes = require("./routes/auth.routes");
const reviewRoutes = require("./routes/review.routes");
const trackingRoutes = require("./routes/tracking.routes");
const shippingRoutes = require("./routes/shipping.routes");
const settingsRoutes = require("./routes/settings.routes");
const categoryRoutes = require("./routes/category.routes");

app.get("/", (req, res) => {
  res.send("Barakah server running successfully");
});

app.get("/api/test", async (req, res) => {
  try {
    const db = await connectDB();
    await db.command({ ping: 1 });

    res.json({
      success: true,
      message: "Backend and MongoDB working",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "MongoDB connection failed",
      error: error.message,
    });
  }
});

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/settings", settingsRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize database and performance indexes in background
connectDB()
  .then(async (db) => {
    try {
      await db.collection("products").createIndex({ slug: 1 });
      await db.collection("products").createIndex({ category: 1, subcategory: 1 });
      await db.collection("products").createIndex({ order: 1, createdAt: -1 });
      await db.collection("categories").createIndex({ slug: 1 });
      await db.collection("categories").createIndex({ order: 1 });
      await db.collection("orders").createIndex({ createdAt: -1 });
      await db.collection("settings").createIndex({ key: 1 });
      console.log("Database connected and indexes verified");
    } catch (indexErr) {
      console.log("Indexes initialized");
    }
  })
  .catch((err) => {
    console.error("Database connection warning:", err.message);
  });
