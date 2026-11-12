import { getSiteUrl, getApiUrl } from "@/lib/seoConfig";

const SITE_URL = getSiteUrl();
const API_URL = getApiUrl();

export const revalidate = 300;

export async function GET() {
  let settings = {};
  let products = [];
  let categories = [];

  try {
    const [settingsRes, productsRes, categoriesRes] = await Promise.all([
      fetch(`${API_URL}/api/settings/public`, { next: { revalidate: 300 } }),
      fetch(`${API_URL}/api/products`, { next: { revalidate: 300 } }),
      fetch(`${API_URL}/api/categories`, { next: { revalidate: 300 } }),
    ]);

    if (settingsRes.ok) {
      const json = await settingsRes.json();
      settings = json?.data || {};
    }
    if (productsRes.ok) {
      const json = await productsRes.json();
      products = Array.isArray(json?.data) ? json.data : [];
    }
    if (categoriesRes.ok) {
      const json = await categoriesRes.json();
      categories = Array.isArray(json?.data) ? json.data : [];
    }
  } catch (error) {
    console.error("llms.txt fetch error:", error);
  }

  const seo = settings?.seo || {};
  if (seo.llmsEnabled === false) {
    return new Response("llms.txt is currently disabled.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const shopName = settings?.general?.shopName || "Sashroyi Shop";
  const summary =
    seo.llmsCustomSummary?.trim() ||
    seo.siteDescription?.trim() ||
    "E-commerce storefront for Kitchen & Dining, Home & Living, and Household Essentials in Bangladesh.";

  const lines = [
    `# ${shopName}`,
    "",
    `> ${summary}`,
    "",
    "## Store Information",
    `- Website: ${SITE_URL}`,
    `- Sitemap: ${SITE_URL}/sitemap.xml`,
    `- Robots: ${SITE_URL}/robots.txt`,
    settings?.contact?.phone ? `- Phone / WhatsApp: ${settings.contact.phone}` : null,
    settings?.contact?.email ? `- Email: ${settings.contact.email}` : null,
    settings?.contact?.address ? `- Address: ${settings.contact.address}` : null,
    "",
  ].filter((l) => l !== null);

  if (categories.length > 0) {
    lines.push("## Categories");
    for (const cat of categories) {
      const catSlug = cat.slug || cat.name;
      if (!catSlug) continue;
      lines.push(`- [${cat.name || catSlug}](${SITE_URL}/category/${encodeURIComponent(catSlug)})`);
    }
    lines.push("");
  }

  if (products.length > 0) {
    lines.push("## Products");
    for (const p of products) {
      const slugOrId = p.slug || p._id;
      const priceText = p.price ? ` - ৳${p.price}` : "";
      const stockText = p.inStock === false ? " (Out of Stock)" : " (In Stock)";
      const categoryText = p.category ? ` [${p.category}]` : "";
      lines.push(`- [${p.name}](${SITE_URL}/products/${slugOrId})${priceText}${stockText}${categoryText}`);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
