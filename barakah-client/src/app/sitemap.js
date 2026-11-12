const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sashroyi.shop";
const API_URL = "https://sashroyi-api.onrender.com";

export const revalidate = 300;

export default async function sitemap() {
  const staticRoutes = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  let productRoutes = [];
  let categoryRoutes = [];

  try {
    const res = await fetch(`${API_URL}/api/products`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = await res.json();
      const products = Array.isArray(json.data) ? json.data : [];
      productRoutes = products.map((product) => ({
        url: `${SITE_URL}/products/${product.slug || product._id}`,
        lastModified: product.updatedAt
          ? new Date(product.updatedAt)
          : product.createdAt
          ? new Date(product.createdAt)
          : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error("Sitemap products fetch error:", error);
  }

  try {
    const res = await fetch(`${API_URL}/api/categories`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = await res.json();
      const categories = Array.isArray(json.data) ? json.data : [];
      categoryRoutes = categories
        .filter((cat) => cat?.slug || cat?.name)
        .map((cat) => ({
          url: `${SITE_URL}/category/${encodeURIComponent(cat.slug || cat.name)}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        }));
    }
  } catch (error) {
    console.error("Sitemap categories fetch error:", error);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
