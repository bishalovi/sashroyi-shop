import Link from "next/link";
import ProductSearch from "@/components/products/ProductSearch";
import OfferCountdown from "@/components/products/OfferCountdown";
import Reviews from "@/components/home/Reviews";
import CategoryViewTracker from "@/components/tracking/CategoryViewTracker";

export const revalidate = 10;

async function getCategoryData(main) {
  const baseUrl = "https://sashroyi-api.onrender.com";
  try {
    const res = await fetch(`${baseUrl}/api/categories/${main}`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (e) {
    return null;
  }
}

async function getProducts(main, sub) {
  const baseUrl = "https://sashroyi-api.onrender.com";

  try {
    const url =
      sub && sub !== "all"
        ? `${baseUrl}/api/products?category=${main}&subcategory=${sub}`
        : `${baseUrl}/api/products?category=${main}`;

    const res = await fetch(url, {
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      return [];
    }

    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export default async function CategoryPage({ params }) {
  const { main, sub } = await params;
  const [categoryData, filteredProducts] = await Promise.all([
    getCategoryData(main),
    getProducts(main, sub),
  ]);

  const categoryTitle = categoryData?.name || main?.replace(/-/g, " ");
  const subcategories = categoryData?.subcategories || [];

  return (
    <main className="bg-[#faf7f0] min-h-screen pb-10">
      <CategoryViewTracker
        categoryName={categoryTitle}
        categorySlug={main}
        subcategorySlug={sub}
        products={filteredProducts}
      />
      <OfferCountdown category={main} subcategory={sub} />
      <div className="max-w-7xl mx-auto px-4 pt-8">
        {/* Title */}
        <h1 className="text-3xl font-bold mb-6 capitalize text-[#0f2a44]">
          {categoryTitle}
        </h1>

        {/* Dynamic Subcategories Tabs */}
        {subcategories.length > 0 && (
          <div className="flex gap-2 md:gap-3 mb-8 flex-wrap items-center">
            <Link
              href={`/category/${main}/all`}
              className={`text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 rounded-xl font-medium transition shadow-xs ${
                sub === "all" || !sub
                  ? "bg-[#0f2a44] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-100"
              }`}
            >
              All (সকল)
            </Link>

            {subcategories.map((item, idx) => {
              const isSelected = sub === item.slug;
              return (
                <Link
                  key={idx}
                  href={`/category/${main}/${item.slug}`}
                  className={`text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 rounded-xl font-medium transition shadow-xs ${
                    isSelected
                      ? "bg-[#0f2a44] text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-100"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}

        <ProductSearch products={filteredProducts} />
      </div>
      <Reviews />
    </main>
  );
}
