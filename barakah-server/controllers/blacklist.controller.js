const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "";
};

// Check if visitor's IP or Device is blacklisted
exports.checkBlacklist = async (req, res) => {
  try {
    const db = await connectDB();
    const blacklistCollection = db.collection("blacklist");

    const clientIp = getClientIp(req);
    const deviceId = req.query.deviceId || req.body?.deviceId || "";
    const phone = req.query.phone || req.body?.phone || "";

    const queryConditions = [];
    if (deviceId && deviceId.trim()) {
      queryConditions.push({ deviceId: deviceId.trim() });
    }
    if (phone && phone.trim()) {
      queryConditions.push({ phone: phone.trim() });
    }
    // Only check IP if valid and not localhost
    if (clientIp && clientIp !== "::1" && clientIp !== "127.0.0.1") {
      queryConditions.push({ ip: clientIp });
    }

    if (queryConditions.length === 0) {
      return res.json({ success: true, isBlocked: false, clientIp });
    }

    const blockedEntry = await blacklistCollection.findOne({
      $or: queryConditions,
      isActive: { $ne: false },
    });

    if (blockedEntry) {
      return res.json({
        success: true,
        isBlocked: true,
        clientIp,
        reason: blockedEntry.reason || "Access restricted by store administrator.",
        blockedAt: blockedEntry.blockedAt,
      });
    }

    return res.json({ success: true, isBlocked: false, clientIp });
  } catch (error) {
    console.error("Blacklist check error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during blacklist check",
      error: error.message,
    });
  }
};

// Block an entity (device, IP, and/or phone)
exports.blockEntity = async (req, res) => {
  try {
    const db = await connectDB();
    const blacklistCollection = db.collection("blacklist");
    const ordersCollection = db.collection("orders");

    let { orderId, ip, deviceId, phone, reason, customerName } = req.body;

    // If orderId provided, retrieve details from the order if missing
    let orderObjectId = null;
    if (orderId) {
      try {
        orderObjectId = new ObjectId(orderId);
        const order = await ordersCollection.findOne({ _id: orderObjectId });
        if (order) {
          if (!ip && order.ip) ip = order.ip;
          if (!deviceId && order.deviceId) deviceId = order.deviceId;
          if (!phone && order.phone) phone = order.phone;
          if (!customerName && order.customerName) customerName = order.customerName;
        }
      } catch (err) {
        console.warn("Invalid orderId passed to blockEntity:", orderId);
      }
    }

    if (!ip && !deviceId && !phone) {
      return res.status(400).json({
        success: false,
        message: "At least one identifier (ip, deviceId, or phone) is required to block.",
      });
    }

    const orFilters = [];
    if (deviceId) orFilters.push({ deviceId: deviceId.trim() });
    if (phone) orFilters.push({ phone: phone.trim() });
    if (ip && ip !== "::1" && ip !== "127.0.0.1") orFilters.push({ ip: ip.trim() });

    const blockData = {
      ip: ip ? ip.trim() : null,
      deviceId: deviceId ? deviceId.trim() : null,
      phone: phone ? phone.trim() : null,
      customerName: customerName || "",
      reason: reason || "Blocked from admin order list",
      blockedAt: new Date(),
      isActive: true,
    };

    if (orFilters.length > 0) {
      await blacklistCollection.updateOne(
        { $or: orFilters },
        { $set: blockData },
        { upsert: true }
      );
    } else {
      await blacklistCollection.insertOne(blockData);
    }

    // Update order status if orderId was provided
    if (orderObjectId) {
      await ordersCollection.updateOne(
        { _id: orderObjectId },
        { $set: { isBlocked: true } }
      );
    }

    return res.json({
      success: true,
      message: "Customer and device have been blocked successfully.",
      data: blockData,
    });
  } catch (error) {
    console.error("Block entity error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to block entity",
      error: error.message,
    });
  }
};

// Unblock an entity
exports.unblockEntity = async (req, res) => {
  try {
    const db = await connectDB();
    const blacklistCollection = db.collection("blacklist");
    const ordersCollection = db.collection("orders");

    let { orderId, ip, deviceId, phone } = req.body;

    let orderObjectId = null;
    if (orderId) {
      try {
        orderObjectId = new ObjectId(orderId);
        const order = await ordersCollection.findOne({ _id: orderObjectId });
        if (order) {
          if (!ip && order.ip) ip = order.ip;
          if (!deviceId && order.deviceId) deviceId = order.deviceId;
          if (!phone && order.phone) phone = order.phone;
        }
      } catch (err) {
        console.warn("Invalid orderId passed to unblockEntity:", orderId);
      }
    }

    const orFilters = [];
    if (deviceId) orFilters.push({ deviceId: deviceId.trim() });
    if (phone) orFilters.push({ phone: phone.trim() });
    if (ip) orFilters.push({ ip: ip.trim() });

    if (orFilters.length > 0) {
      await blacklistCollection.deleteMany({ $or: orFilters });
    }

    if (orderObjectId) {
      await ordersCollection.updateOne(
        { _id: orderObjectId },
        { $set: { isBlocked: false } }
      );
    }

    return res.json({
      success: true,
      message: "Customer and device have been unblocked successfully.",
    });
  } catch (error) {
    console.error("Unblock entity error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unblock entity",
      error: error.message,
    });
  }
};
