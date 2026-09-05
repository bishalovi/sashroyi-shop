const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

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
    ]);

    const orders = database.collection("orders");
    await Promise.allSettled([
      orders.createIndex({ createdAt: -1 }, { background: true }),
      orders.createIndex({ orderStatus: 1 }, { background: true }),
      orders.createIndex({ phone: 1 }, { background: true }),
    ]);

    const categories = database.collection("categories");
    await Promise.allSettled([
      categories.createIndex({ slug: 1 }, { background: true }),
    ]);

    const reviews = database.collection("reviews");
    await Promise.allSettled([
      reviews.createIndex({ productId: 1, createdAt: -1 }, { background: true }),
      reviews.createIndex({ isApproved: 1 }, { background: true }),
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