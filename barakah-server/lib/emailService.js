const nodemailer = require("nodemailer");

let transporter = null;

if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  try {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
  } catch (err) {
    console.log("Email transporter init skipped:", err.message);
  }
}

async function sendAdminOrderNotification(orderData) {
  if (!transporter) {
    console.log("Email notification skipped: GMAIL credentials not configured or transporter unavailable.");
    return false;
  }
  const {
    customerName,
    phone,
    address,
    total,
    _id,
    notes,
    shippingType,
    shippingCost,
    subtotal,
    paymentMethod,
    accountLast4,
    source,
  } = orderData;

  const trafficSource = source?.traffic_source || "direct";
  const trafficMedium = source?.traffic_medium || "N/A";
  const trafficCampaign = source?.traffic_campaign || "N/A";

  const paymentDisplay =
    paymentMethod === "bkash"
      ? "বিকাশ"
      : paymentMethod === "nagad"
        ? "নগদ"
        : "ক্যাশ অন ডেলিভারি (COD)";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>New Order</title>
</head>

<body>
  <h2>নতুন অর্ডার এসেছে</h2>

  <p><b>Customer Name:</b> ${customerName}</p>
  <p><b>Phone:</b> ${phone}</p>
  <p><b>Address:</b> ${address}</p>

  <h3>Order Details</h3>

  <p><b>Subtotal:</b> ${subtotal} ৳</p>
  <p><b>Shipping Cost:</b> ${shippingCost} ৳</p>
  <p><b>Total:</b> ${total} ৳</p>

  <p><b>Payment Method:</b> ${paymentDisplay}</p>

  <p><b>Notes:</b> ${notes || "No notes"}</p>

</body>
</html>
`;

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `নতুন অর্ডার - ${customerName}`,
      html: htmlContent,
    });

    console.log("Order notification email sent successfully.");
    return true;
  } catch (error) {
    console.error("Email notification error:", error);
    return false;
  }
}

module.exports = {
  sendAdminOrderNotification,
};
