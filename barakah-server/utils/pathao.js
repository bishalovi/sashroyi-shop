const calculateCOD = (paymentMethod, total) => {
  // Always send the actual order amount
  return Math.round(Number(total));
};

/**
 * Transform Barakah order -> Pathao payload
 */
const transformOrderToPathao = (order) => {
  return {
    store_id: Number(process.env.PATHAO_STORE_ID),

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
  const baseUrl = process.env.PATHAO_BASE_URL;

  const response = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.PATHAO_CLIENT_ID,
      client_secret: process.env.PATHAO_CLIENT_SECRET,
      grant_type: "password",
      username: process.env.PATHAO_USERNAME,
      password: process.env.PATHAO_PASSWORD,
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
  const baseUrl = process.env.PATHAO_BASE_URL;

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
