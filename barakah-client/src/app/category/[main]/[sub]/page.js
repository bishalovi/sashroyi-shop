import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import OfferCountdown from "@/components/products/OfferCountdown";
import Reviews from "@/components/home/Reviews";
import CategoryViewTracker from "@/components/tracking/CategoryViewTracker";

import { getSiteUrl, getApiUrl } from "@/lib/seoConfig";

const SITE_URL = getSiteUrl();
const API_URL = getApiUrl();

export const revalidate = 10;

async function getCategoryData(main) {
  try {
    const res = await fetch(`${API_URL}/api/categories/${main}`, {
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
  try {
    const url =
      sub && sub !== "all"
        ? `${API_URL}/api/products?category=${main}&subcategory=${sub}`
        : `${API_URL}/api/products?category=${main}`;

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

export async function generateMetadata({ params }) {
  const { main, sub } = await params;
  const categoryData = await getCategoryData(main);
  const categoryName = categoryData?.name || main?.replace(/-/g, " ") || "Category";
  const subName = sub && sub !== "all" ? sub.replace(/-/g, " ") : "";

  const displayTitle = subName
    ? `${subName} - ${categoryName} | Sashroyi Shop`
    : `${categoryName} | Sashroyi Shop`;

  const description = subName
    ? `${categoryName} এর সেরা ${subName} কালেকশন কিনুন Sashroyi Shop থেকে সাশ্রয়ী মূল্যে ও দ্রুত হোম ডেলিভারিতে।`
    : `${categoryName} ক্যাটাগরির সেরা মানের পণ্য কিনুন Sashroyi Shop থেকে সাশ্রয়ী মূল্যে ও দ্রুত হোম ডেলিভারিতে।`;

  const canonicalPath =
    sub && sub !== "all" ? `/category/${main}/${sub}` : `/category/${main}`;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  return {
    title: displayTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title: displayTitle,
      description,
      siteName: "Sashroyi Shop",
      ...(categoryData?.image
        ? { images: [{ url: categoryData.image, alt: categoryName }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description,
      ...(categoryData?.image ? { images: [categoryData.image] } : {}),
    },
  };
}

export default async function CategoryPage({ params }) {
  const { main, sub } = await params;
  const [categoryData, filteredProducts] = await Promise.all([
    getCategoryData(main),
    getProducts(main, sub),
  ]);

  const categoryTitle = categoryData?.name || main?.replace(/-/g, " ");
  const subcategories = categoryData?.subcategories || [];

  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: categoryTitle,
      item: `${SITE_URL}/category/${main}`,
    },
  ];
  if (sub && sub !== "all") {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: sub.replace(/-/g, " "),
      item: `${SITE_URL}/category/${main}/${sub}`,
    });
  }
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <main className="bg-[#faf7f0] min-h-screen pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-center mt-10 text-gray-500">
            No products found.
          </p>
        )}
      </div>
      <Reviews />
    </main>
  );
}
