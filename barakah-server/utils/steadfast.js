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

const callSteadfast = async (payload, account) => {
  const apiUrl = process.env.STEADFAST_API_URL;
  let apiKey;
  let secretKey;

  switch (account) {
    case "narayanganj":
      apiKey = process.env.STEADFAST_API_KEY_NARAYANGANJ;
      secretKey = process.env.STEADFAST_SECRET_KEY_NARAYANGANJ;
      break;

    case "badda":
      apiKey = process.env.STEADFAST_API_KEY_BADDA;
      secretKey = process.env.STEADFAST_SECRET_KEY_BADDA;
      break;

    case "jamalpur":
      apiKey = process.env.STEADFAST_API_KEY_JAMALPUR;
      secretKey = process.env.STEADFAST_SECRET_KEY_JAMALPUR;
      break;

    default:
      throw new Error("Invalid Steadfast account.");
  }

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
