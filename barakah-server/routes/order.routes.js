const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  markOrderDelivered,
  sendToSteadfast,
  getOrderStats,
  cancelOrder,
  getDeliveredAnalytics,
  getOrdersForExport,
  getOrdersByDate,
  getOrderCounts,
  getModeratorActivity,
  getModeratorPerformance,
  verifyOrder,
  saveAbandonedOrder,
  getAbandonedOrders,
  deliverAbandonedOrder,
  cancelAbandonedOrder,
  sendToPathao,
  updateWhatsAppStatus,
  updateCallCount,
  updateOrderStatus,
} = require("../controllers/order.controller");

router.post("/", createOrder);
router.post("/abandoned", saveAbandonedOrder);
router.get("/abandoned", getAbandonedOrders);
router.patch("/abandoned/:id/deliver", deliverAbandonedOrder);
router.patch("/abandoned/:id/cancel", cancelAbandonedOrder);
router.get("/", getOrders);
router.get("/counts", getOrderCounts);
router.get("/stats", getOrderStats);
router.get("/analytics", getDeliveredAnalytics);
router.get("/export", getOrdersForExport);
router.get("/by-date", getOrdersByDate);
router.get("/moderator-activity", getModeratorActivity);
router.get("/moderator-performance", getModeratorPerformance);
router.patch("/:id/deliver", markOrderDelivered);
router.patch("/:id/steadfast", sendToSteadfast);
router.patch("/:id/pathao", sendToPathao);
router.patch("/:id/cancel", cancelOrder);
router.patch("/:id/verify", verifyOrder);
router.patch("/:id/whatsapp", updateWhatsAppStatus);
router.patch("/:id/call", updateCallCount);
router.patch("/:id/status", updateOrderStatus);

module.exports = router;
