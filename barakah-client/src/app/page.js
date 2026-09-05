import HomeCategories from "@/components/home/HomeCategories";
import ProductSection from "@/components/home/ProductSection";
import Reviews from "@/components/home/Reviews";

const baseUrl = "https://sashroyi-api.onrender.com";

async function getCategories() {
  try {
    const res = await fetch(`${baseUrl}/api/categories`, {
      cache: "no-store",
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
        cache: "no-store",
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

async function getAllProducts() {
  try {
    const res = await fetch(`${baseUrl}/api/products?limit=50`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error("Failed to fetch all products:", error);
    return [];
  }
}

export default async function HomePage() {
  const [categories, allProducts] = await Promise.all([
    getCategories(),
    getAllProducts(),
  ]);

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
      <HomeCategories categories={categories} />

      {allProducts.length > 0 && (
        <ProductSection
          title="সকল পণ্যসমূহ"
          products={allProducts}
          bgClass="bg-[#faf7f0]"
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
          <div className="mx-auto max-w-7xl px-4 text-center text-gray-500">
            নতুন প্রোডাক্ট শীঘ্রই আসছে...
          </div>
        </section>
      )}

      <Reviews />
    </main>
  );
}