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
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
  }
}

startServer();
