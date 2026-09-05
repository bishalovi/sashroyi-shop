const connectDB = require("../config/db");

const calculateCOD = (paymentMethod, total) => {
  // Always send real order price regardless of payment method
  return Math.round(Number(total));
};

const transformOrderToSteadfast = (order) => {
  return {
    invoice: order._id.toString(),
    recipient_name: order.customerName,
    recipient_phone: order.phone,
    recipient_address: order.address,
    cod_amount: calculateCOD(order.paymentMethod, order.total),
    note: order.notes || "",
    item_description: order.items?.map((item) => item.name).join(", ") || "",
  };
};

const getSteadfastCredentials = async (account) => {
  let apiUrl = process.env.STEADFAST_API_URL || "https://portal.packzy.com/api/v1";
  let apiKey = "";
  let secretKey = "";

  try {
    const db = await connectDB();
    const config = await db.collection("shipping_settings").findOne({ key: "main_shipping_config" });
    const steadfast = config?.couriers?.steadfast;

    if (steadfast) {
      if (steadfast.apiUrl) apiUrl = steadfast.apiUrl.trim();
      if (account && steadfast.accounts?.[account]?.apiKey && steadfast.accounts?.[account]?.secretKey) {
        apiKey = steadfast.accounts[account].apiKey.trim();
        secretKey = steadfast.accounts[account].secretKey.trim();
      } else if (steadfast.apiKey && steadfast.secretKey) {
        apiKey = steadfast.apiKey.trim();
        secretKey = steadfast.secretKey.trim();
      }
    }
  } catch (err) {
    console.error("Failed to load Steadfast config from DB:", err.message);
  }

  if (!apiKey || !secretKey) {
    switch (account) {
      case "narayanganj":
        apiKey = process.env.STEADFAST_API_KEY_NARAYANGANJ || process.env.STEADFAST_API_KEY;
        secretKey = process.env.STEADFAST_SECRET_KEY_NARAYANGANJ || process.env.STEADFAST_SECRET_KEY;
        break;
      case "badda":
        apiKey = process.env.STEADFAST_API_KEY_BADDA || process.env.STEADFAST_API_KEY;
        secretKey = process.env.STEADFAST_SECRET_KEY_BADDA || process.env.STEADFAST_SECRET_KEY;
        break;
      case "jamalpur":
        apiKey = process.env.STEADFAST_API_KEY_JAMALPUR || process.env.STEADFAST_API_KEY;
        secretKey = process.env.STEADFAST_SECRET_KEY_JAMALPUR || process.env.STEADFAST_SECRET_KEY;
        break;
      default:
        apiKey = process.env.STEADFAST_API_KEY || process.env.STEADFAST_API_KEY_NARAYANGANJ;
        secretKey = process.env.STEADFAST_SECRET_KEY || process.env.STEADFAST_SECRET_KEY_NARAYANGANJ;
        break;
    }
  }

  return { apiUrl, apiKey, secretKey };
};

const callSteadfast = async (payload, account) => {
  const { apiUrl, apiKey, secretKey } = await getSteadfastCredentials(account);

  if (!apiUrl || !apiKey || !secretKey) {
    throw new Error("Steadfast API credentials not configured.");
  }

  const response = await fetch(`${apiUrl}/create_order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
    },
    body: JSON.stringify(payload),
  });

  const rawResponse = await response.text();

  let data;

  try {
    data = JSON.parse(rawResponse);
  } catch (err) {
    throw new Error(
      `Steadfast returned non-JSON response. Status: ${response.status}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message || `Steadfast API Error (${response.status})`,
    );
  }

  return data;
};

module.exports = {
  calculateCOD,
  transformOrderToSteadfast,
  callSteadfast,
};
