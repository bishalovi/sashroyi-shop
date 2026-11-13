import { NextResponse } from "next/server";
import crypto from "crypto";

const DEFAULT_PIXEL_ID = "3090216584507410";
const DEFAULT_CAPI_TOKEN = "EAAN1ofCq9NUBSaUTZAgzfG4XJoOGP2xh2iZC3Q3Km7KyRxY24srJG6ZAb7ZAviKpQJC210vGGeZBWwCqZC0DUQfqhZBL1BzG7GSrZCHu9Xk0rRJoD1mV9eUwZAxP3tbuUOovVm2PiSCM824SVZBQGoZAlJJk6A2q3sKZBSFRsKx5viyISgFPyL0MaQNo4cTmE0ku5jyTfwZDZD";

const BD_LOCATIONS = [
  { keywords: ["chittagong", "chattogram", "চট্টগ্রাম"], city: "chattogram", zip: "4000" },
  { keywords: ["sylhet", "সিলেট"], city: "sylhet", zip: "3100" },
  { keywords: ["rajshahi", "রাজশাহী"], city: "rajshahi", zip: "6000" },
  { keywords: ["khulna", "খুলনা"], city: "khulna", zip: "9000" },
  { keywords: ["barisal", "barishal", "বরিশাল"], city: "barisal", zip: "8200" },
  { keywords: ["rangpur", "রংপুর"], city: "rangpur", zip: "5400" },
  { keywords: ["mymensingh", "ময়মনসিংহ", "ময়মনসিংহ"], city: "mymensingh", zip: "2200" },
  { keywords: ["gazipur", "গাজীপুর", "tongi", "টঙ্গী"], city: "gazipur", zip: "1700" },
  { keywords: ["narayanganj", "নারায়ণগঞ্জ", "নারায়ণগঞ্জ"], city: "narayanganj", zip: "1400" },
  { keywords: ["cumilla", "comilla", "কুমিল্লা"], city: "cumilla", zip: "3500" },
  { keywords: ["bogura", "bogra", "বগুড়া", "বগুড়া"], city: "bogura", zip: "5800" },
  { keywords: ["jessore", "jashore", "যশোর"], city: "jessore", zip: "7400" },
  { keywords: ["cox", "কক্সবাজার"], city: "coxs bazar", zip: "4700" },
  { keywords: ["savar", "সাভার", "ashulia", "আশুলিয়া", "আশুলিয়া"], city: "savar", zip: "1340" },
  { keywords: ["tangail", "টাঙ্গাইল"], city: "tangail", zip: "1900" },
  { keywords: ["narsingdi", "নরসিংদী"], city: "narsingdi", zip: "1600" },
  { keywords: ["brahmanbaria", "ব্রাহ্মণবাড়িয়া", "ব্রাহ্মণবাড়িয়া"], city: "brahmanbaria", zip: "3400" },
  { keywords: ["feni", "ফেনী"], city: "feni", zip: "3900" },
  { keywords: ["noakhali", "নোয়াখালী", "নোয়াখালী"], city: "noakhali", zip: "3800" },
  { keywords: ["pabna", "পাবনা"], city: "pabna", zip: "6600" },
  { keywords: ["dinajpur", "দিনাজপুর"], city: "dinajpur", zip: "5200" },
  { keywords: ["kushtia", "কুষ্টিয়া", "কুষ্টিয়া"], city: "kushtia", zip: "7000" },
  { keywords: ["faridpur", "ফরিদপুর"], city: "faridpur", zip: "7800" },
  { keywords: ["sirajganj", "সিরাজগঞ্জ"], city: "sirajganj", zip: "6700" },
  { keywords: ["chandpur", "চাঁদপুর"], city: "chandpur", zip: "3600" },
  { keywords: ["jamalpur", "জামালপুর"], city: "jamalpur", zip: "2000" },
  { keywords: ["dhaka", "ঢাকা", "mirpur", "মিরপুর", "uttara", "উত্তরা", "dhanmondi", "ধানমন্ডি", "gulshan", "গুলশান", "banani", "বনানী", "mohammadpur", "মোহাম্মদপুর", "badda", "বাড্ডা", "motijheel", "মতিঝিল"], city: "dhaka", zip: "1200" },
];

function hashData(value) {
  if (!value) return null;
  const cleaned = String(value).trim().toLowerCase();
  return crypto.createHash("sha256").update(cleaned).digest("hex");
}

function resolveLocation(address) {
  if (!address) return { city: "dhaka", zip: "1200" };
  const lower = String(address).toLowerCase();
  const matched = BD_LOCATIONS.find((loc) =>
    loc.keywords.some((kw) => lower.includes(kw))
  );
  return matched ? { city: matched.city, zip: matched.zip } : { city: "dhaka", zip: "1200" };
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

    const cleanDigits = userParams.phone ? String(userParams.phone).replace(/\D/g, "") : "";
    const normalizedPhone = cleanDigits.startsWith("01") && cleanDigits.length === 11
      ? `88${cleanDigits}`
      : cleanDigits;

    const fallbackVisitorId = userParams.externalId || req.cookies.get("barakah_visitor_id")?.value;
    const externalId = normalizedPhone
      ? hashData(normalizedPhone)
      : (fallbackVisitorId ? hashData(String(fallbackVisitorId)) : hashData(clientIp + userAgent));

    const userData = {
      client_ip_address: clientIp,
      client_user_agent: userAgent,
      country: [hashData("bd")],
      external_id: [externalId],
    };

    if (userParams.name) {
      const parts = String(userParams.name).trim().split(/\s+/);
      if (parts[0]) userData.fn = [hashData(parts[0])];
      if (parts.length > 1) {
        userData.ln = [hashData(parts.slice(1).join(" "))];
      }
    }

    if (normalizedPhone) {
      userData.ph = [hashData(normalizedPhone)];
    }

    if (userParams.email) {
      userData.em = [hashData(userParams.email)];
    }

    const { city, zip } = resolveLocation(userParams.address || userParams.city);
    const cityHash = hashData(city);
    userData.ct = [cityHash];
    userData.st = [cityHash];
    userData.zp = [hashData(zip)];

    const resolvedFbp = userParams.fbp || req.cookies.get("_fbp")?.value;
    const resolvedFbc = userParams.fbc || req.cookies.get("_fbc")?.value;

    if (resolvedFbc && String(resolvedFbc).startsWith("fb.")) userData.fbc = String(resolvedFbc);
    if (resolvedFbp && String(resolvedFbp).startsWith("fb.")) userData.fbp = String(resolvedFbp);

    const eventData = {
      event_name: eventName,
      event_time: eventTime,
      event_id: finalEventId,
      action_source: "website",
      event_source_url: eventSourceUrl || "https://top.skbazarbd.com",
      user_data: userData,
      custom_data: customData || {},
    };

    const payload = { data: [eventData] };
    const activeTestCode = (userParams.testEventCode || process.env.META_TEST_EVENT_CODE || "").trim();
    if (activeTestCode !== "") {
      payload.test_event_code = activeTestCode;
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
