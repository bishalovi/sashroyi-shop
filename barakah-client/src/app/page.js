import HomeCategories from "@/components/home/HomeCategories";
import ProductSection from "@/components/home/ProductSection";
import Reviews from "@/components/home/Reviews";

import { headers } from "next/headers";
import { getSiteUrl, getApiUrl, isTopSkbazarHost } from "@/lib/seoConfig";

async function getDynamicApiUrl() {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "";
    if (isTopSkbazarHost(host)) {
      return "https://topskbazar-api.onrender.com";
    }
  } catch {}
  return getApiUrl();
}

async function getDynamicSiteUrl() {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "";
    if (isTopSkbazarHost(host)) {
      return "https://top.skbazarbd.com";
    }
  } catch {}
  return getSiteUrl();
}

export const revalidate = 10;

async function getPublicSettings(explicitBaseUrl) {
  const baseUrl = explicitBaseUrl || (await getDynamicApiUrl());
  try {
    const res = await fetch(`${baseUrl}/api/settings/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

async function getCategories(explicitBaseUrl) {
  const baseUrl = explicitBaseUrl || (await getDynamicApiUrl());
  try {
    const res = await fetch(`${baseUrl}/api/categories`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) return [];
    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

async function getProductsByCategory(categorySlug, explicitBaseUrl) {
  const baseUrl = explicitBaseUrl || (await getDynamicApiUrl());
  try {
    const res = await fetch(
      `${baseUrl}/api/products?category=${categorySlug}&limit=8`,
      {
        next: { revalidate: 10 },
      },
    );
    if (!res.ok) return [];
    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error(`Failed to fetch ${categorySlug} products:`, error);
    return [];
  }
}

async function getAllProducts(explicitBaseUrl) {
  const baseUrl = explicitBaseUrl || (await getDynamicApiUrl());
  try {
    const res = await fetch(`${baseUrl}/api/products?limit=50`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) return [];
    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error("Failed to fetch all products:", error);
    return [];
  }
}

const slimProduct = (p) => ({
  _id: p._id,
  name: p.name,
  slug: p.slug,
  image: p.image,
  category: p.category,
  price: p.price,
  oldPrice: p.oldPrice,
  badge: p.badge,
  isFreeShipping: Boolean(p.isFreeShipping),
  variations: p.variations,
});

export default async function HomePage() {
  const baseUrl = await getDynamicApiUrl();
  const SITE_URL = await getDynamicSiteUrl();

  const [categories, allProductsRaw, publicSettings] = await Promise.all([
    getCategories(baseUrl),
    getAllProducts(baseUrl),
    getPublicSettings(baseUrl),
  ]);

  const allProducts = allProductsRaw.map(slimProduct);

  const shopName = publicSettings?.general?.shopName || "Sashroyi Shop";
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: shopName,
    url: SITE_URL,
    ...(publicSettings?.general?.logoUrl ? { logo: publicSettings.general.logoUrl } : {}),
    ...(publicSettings?.contact?.phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            telephone: publicSettings.contact.phone,
            contactType: "customer service",
            areaServed: "BD",
          },
        }
      : {}),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: shopName,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  // Fetch products for all active categories in parallel for maximum speed
  const categorySections = await Promise.all(
    categories.map(async (cat) => {
      const products = (await getProductsByCategory(cat.slug, baseUrl)).map(slimProduct);
      return {
        ...cat,
        products,
      };
    }),
  );

  // Filter sections that have products
  const activeSections = categorySections.filter(
    (sec) => sec.products && sec.products.length > 0,
  );

  return (
    <div className="min-h-screen bg-[#faf7f0] text-[#3d2f1f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <HomeCategories categories={categories} />

      {allProducts.length > 0 && (
        <ProductSection
          title="সকল পণ্যসমূহ"
          products={allProducts}
          bgClass="bg-[#faf7f0]"
          isFirst={true}
        />
      )}

      {activeSections.length > 0 &&
        activeSections.map((sec) => (
          <ProductSection
            key={sec._id}
            title={sec.name}
            link={`/category/${sec.slug}`}
            products={sec.products}
            bgClass="bg-[#faf7f0]"
          />
        ))}

      {allProducts.length === 0 && activeSections.length === 0 && (
        <section className="bg-[#faf7f0] py-10">
          <div className="mx-auto max-w-7xl px-4 text-center text-gray-600">
            নতুন প্রোডাক্ট শীঘ্রই আসছে...
          </div>
        </section>
      )}

      <Reviews />
    </div>
  );
}