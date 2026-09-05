const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
let db = null;

if (!uri) {
  throw new Error("MONGODB_URI is not defined in .env");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function ensureIndexes(database) {
  try {
    const products = database.collection("products");
    await Promise.allSettled([
      products.createIndex({ slug: 1 }, { sparse: true, background: true }),
      products.createIndex({ category: 1, createdAt: -1 }, { background: true }),
      products.createIndex({ createdAt: -1 }, { background: true }),
      products.createIndex({ isFeatured: 1 }, { background: true }),
      products.createIndex({ productType: 1 }, { background: true }),
    ]);

    const orders = database.collection("orders");
    await Promise.allSettled([
      orders.createIndex({ createdAt: -1 }, { background: true }),
      orders.createIndex({ orderStatus: 1 }, { background: true }),
      orders.createIndex({ phone: 1 }, { background: true }),
      orders.createIndex({ "customerInfo.phone": 1 }, { background: true }),
      orders.createIndex({ orderId: 1 }, { background: true }),
    ]);

    const categories = database.collection("categories");
    await Promise.allSettled([
      categories.createIndex({ slug: 1 }, { background: true }),
      categories.createIndex({ order: 1 }, { background: true }),
    ]);

    const users = database.collection("users");
    await Promise.allSettled([
      users.createIndex({ email: 1 }, { unique: true, sparse: true, background: true }),
    ]);

    const abandonedOrders = database.collection("abandoned-orders");
    await Promise.allSettled([
      abandonedOrders.createIndex({ createdAt: -1 }, { background: true }),
      abandonedOrders.createIndex({ phone: 1 }, { background: true }),
    ]);

    const reviews = database.collection("reviews");
    await Promise.allSettled([
      reviews.createIndex({ productId: 1, createdAt: -1 }, { background: true }),
      reviews.createIndex({ isApproved: 1 }, { background: true }),
    ]);

    const settings = database.collection("settings");
    await Promise.allSettled([
      settings.createIndex({ key: 1 }, { background: true }),
    ]);

    const trackingSettings = database.collection("tracking_settings");
    await Promise.allSettled([
      trackingSettings.createIndex({ key: 1 }, { background: true }),
    ]);

    const shippingSettings = database.collection("shipping_settings");
    await Promise.allSettled([
      shippingSettings.createIndex({ key: 1 }, { background: true }),
    ]);
  } catch (err) {
    console.warn("Auto-index creation notice:", err.message);
  }
}

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(dbName);
    console.log("MongoDB connected");
    ensureIndexes(db).catch(() => {});
  }
  return db;
}

module.exports = connectDB;