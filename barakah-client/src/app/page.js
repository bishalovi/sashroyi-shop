import Hero from "@/components/home/Hero";
import ProductSection from "@/components/home/ProductSection";
import Reviews from "@/components/home/Reviews";

const baseUrl = "https://sashroyi-api.onrender.com";

async function getCategories() {
  try {
    const res = await fetch(`${baseUrl}/api/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

async function getProductsByCategory(categorySlug) {
  try {
    const res = await fetch(
      `${baseUrl}/api/products?category=${categorySlug}&limit=8`,
      {
        next: { revalidate: 60 },
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

export default async function HomePage() {
  const categories = await getCategories();

  // Fetch products for all active categories in parallel for maximum speed
  const categorySections = await Promise.all(
    categories.map(async (cat) => {
      const products = await getProductsByCategory(cat.slug);
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
    <main className="min-h-screen bg-[#faf7f0] text-[#3d2f1f]">
      <Hero />

      {activeSections.length > 0 ? (
        activeSections.map((sec) => (
          <ProductSection
            key={sec._id}
            title={sec.name}
            link={`/category/${sec.slug}`}
            products={sec.products}
            bgClass="bg-[#faf7f0]"
          />
        ))
      ) : (
        <section className="bg-[#faf7f0] py-14">
          <div className="mx-auto max-w-7xl px-4 text-center text-gray-500">
            নতুন প্রোডাক্ট শীঘ্রই আসছে...
          </div>
        </section>
      )}

      <Reviews />
    </main>
  );
}