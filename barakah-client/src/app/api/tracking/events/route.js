import { NextResponse } from "next/server";
import crypto from "crypto";

const DEFAULT_PIXEL_ID = "3090216584507410";
const DEFAULT_CAPI_TOKEN = "EAAN1ofCq9NUBSaUTZAgzfG4XJoOGP2xh2iZC3Q3Km7KyRxY24srJG6ZAb7ZAviKpQJC210vGGeZBWwCqZC0DUQfqhZBL1BzG7GSrZCHu9Xk0rRJoD1mV9eUwZAxP3tbuUOovVm2PiSCM824SVZBQGoZAlJJk6A2q3sKZBSFRsKx5viyISgFPyL0MaQNo4cTmE0ku5jyTfwZDZD";
const DEFAULT_TEST_CODE = "TEST11443";

function hashData(value) {
  if (!value) return null;
  const cleaned = String(value).trim().toLowerCase();
  return crypto.createHash("sha256").update(cleaned).digest("hex");
}

function formatPhone(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("01") && digits.length === 11) {
    digits = "88" + digits;
  }
  return hashData(digits);
}

function formatCity(address) {
  if (!address) return null;
  const lower = String(address).toLowerCase();
  if (lower.includes("dhaka") || lower.includes("ঢাকা")) return hashData("dhaka");
  if (lower.includes("chittagong") || lower.includes("chattogram") || lower.includes("চট্টগ্রাম")) return hashData("chattogram");
  if (lower.includes("sylhet") || lower.includes("সিলেট")) return hashData("sylhet");
  if (lower.includes("rajshahi") || lower.includes("রাজশাহী")) return hashData("rajshahi");
  if (lower.includes("khulna") || lower.includes("খুলনা")) return hashData("khulna");
  if (lower.includes("barisal") || lower.includes("বরিশাল")) return hashData("barisal");
  if (lower.includes("rangpur") || lower.includes("রংপুর")) return hashData("rangpur");
  if (lower.includes("mymensingh") || lower.includes("ময়মনসিংহ")) return hashData("mymensingh");
  if (lower.includes("gazipur") || lower.includes("গাজীপুর")) return hashData("gazipur");
  if (lower.includes("cumilla") || lower.includes("comilla") || lower.includes("কুমিল্লা")) return hashData("cumilla");
  return hashData("dhaka");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { eventName, eventId, eventSourceUrl, customData, userParams = {} } = body;

    if (!eventName) {
      return NextResponse.json({ success: false, message: "Missing eventName" }, { status: 400 });
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Mozilla/5.0";

    const finalEventId = String(eventId || `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
    const eventTime = Math.floor(Date.now() / 1000);

    const externalId = userParams.phone
      ? hashData(String(userParams.phone).replace(/\D/g, ""))
      : (userParams.externalId ? hashData(String(userParams.externalId)) : hashData(clientIp + userAgent));

    const userData = {
      client_ip_address: clientIp,
      client_user_agent: userAgent,
      country: [hashData("bd")],
      external_id: [externalId],
    };

    if (userParams.name) {
      const parts = String(userParams.name).trim().split(/\s+/);
      userData.fn = [hashData(parts[0])];
      if (parts.length > 1) {
        userData.ln = [hashData(parts.slice(1).join(" "))];
      }
    }

    if (userParams.phone) {
      userData.ph = [formatPhone(userParams.phone)];
    }

    if (userParams.email) {
      userData.em = [hashData(userParams.email)];
    }

    const cityHash = formatCity(userParams.address || userParams.city);
    if (cityHash) {
      userData.ct = [cityHash];
      userData.st = [cityHash];
    }

    if (userParams.fbc) userData.fbc = userParams.fbc;
    if (userParams.fbp) userData.fbp = userParams.fbp;

    const eventData = {
      event_name: eventName,
      event_time: eventTime,
      event_id: finalEventId,
      action_source: "website",
      event_source_url: eventSourceUrl || "https://www.sashroyi.shop",
      user_data: userData,
      custom_data: customData || {},
    };

    const payload = { data: [eventData] };
    if (DEFAULT_TEST_CODE) {
      payload.test_event_code = DEFAULT_TEST_CODE;
    }

    const metaUrl = `https://graph.facebook.com/v19.0/${DEFAULT_PIXEL_ID}/events?access_token=${DEFAULT_CAPI_TOKEN}`;

    const metaRes = await fetch(metaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const metaResult = await metaRes.json();

    return NextResponse.json({
      success: true,
      metaResult,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
