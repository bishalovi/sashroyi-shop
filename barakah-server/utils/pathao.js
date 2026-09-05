const connectDB = require("../config/db");

const calculateCOD = (paymentMethod, total) => {
  // Always send the actual order amount
  return Math.round(Number(total));
};

const getPathaoConfig = async () => {
  let baseUrl = process.env.PATHAO_BASE_URL || "https://api-hermes.pathao.com";
  let clientId = process.env.PATHAO_CLIENT_ID || "";
  let clientSecret = process.env.PATHAO_CLIENT_SECRET || "";
  let username = process.env.PATHAO_USERNAME || "";
  let password = process.env.PATHAO_PASSWORD || "";
  let storeId = process.env.PATHAO_STORE_ID || "";

  try {
    const db = await connectDB();
    const config = await db.collection("shipping_settings").findOne({ key: "main_shipping_config" });
    const pathao = config?.couriers?.pathao;
    if (pathao) {
      if (pathao.baseUrl) baseUrl = pathao.baseUrl.trim();
      if (pathao.clientId) clientId = pathao.clientId.trim();
      if (pathao.clientSecret) clientSecret = pathao.clientSecret.trim();
      if (pathao.username) username = pathao.username.trim();
      if (pathao.password) password = pathao.password.trim();
      if (pathao.storeId) storeId = pathao.storeId.trim();
    }
  } catch (err) {
    console.error("Failed to load Pathao config from DB:", err.message);
  }

  return { baseUrl, clientId, clientSecret, username, password, storeId };
};

/**
 * Transform Barakah order -> Pathao payload
 */
const transformOrderToPathao = async (order) => {
  const { storeId } = await getPathaoConfig();

  return {
    store_id: Number(storeId || process.env.PATHAO_STORE_ID || 0),
    merchant_order_id: order._id.toString(),
    recipient_name: order.customerName,
    recipient_phone: order.phone,
    recipient_address: order.address,
    delivery_type: 48, 
    item_type: 2, 
    special_instruction: order.notes || "",
    item_quantity:
      order.items?.reduce((sum, item) => sum + Number(item.quantity || 1), 0) ||
      1,
    item_weight: 0.5,
    item_description: order.items?.map((item) => item.name).join(", ") || "",
    amount_to_collect: calculateCOD(order.paymentMethod, order.total),
  };
};

/**
 * Get OAuth Access Token
 */
const getPathaoAccessToken = async () => {
  const { baseUrl, clientId, clientSecret, username, password } = await getPathaoConfig();

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error("Pathao API credentials not configured.");
  }

  const response = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "password",
      username: username,
      password: password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `Pathao Auth Error (${response.status})`);
  }
  return data.access_token;
};

/**
 * Create shipment in Pathao
 */
const callPathao = async (payload) => {
  const { baseUrl } = await getPathaoConfig();
  const token = await getPathaoAccessToken();

  const response = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `Pathao API Error (${response.status})`);
  }

  return data;
};

/**
 * Extract shipment details
 */
const extractPathaoShipmentDetails = (response) => {
  const shipment = response?.data || {};

  return {
    consignmentId: shipment.consignment_id,
    merchantOrderId: shipment.merchant_order_id,
    orderStatus: shipment.order_status,
    deliveryFee: shipment.delivery_fee,
  };
};

module.exports = {
  calculateCOD,
  transformOrderToPathao,
  getPathaoAccessToken,
  callPathao,
  extractPathaoShipmentDetails,
};
