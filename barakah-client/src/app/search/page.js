"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Container from "@/components/shared/Container";
import ProductCard from "@/components/products/ProductCard";
import SearchBar from "@/components/home/SearchBar";
import { FiSearch } from "react-icons/fi";

import { pushToDataLayer } from "@/lib/gtm";
import { trackMetaEvent } from "@/lib/metaTracking";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = "https://sashroyi-api.onrender.com";

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setLoading(false);
      return;
    }

    // Track Meta & GTM Search event
    pushToDataLayer({
      event: "search",
      search_term: query,
    });

    trackMetaEvent("Search", {
      search_string: query,
      content_type: "product",
    });

    setLoading(true);
    fetch(`${baseUrl}/api/products?search=${encodeURIComponent(query)}&limit=50`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data?.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to search products:", err);
        setProducts([]);
        setLoading(false);
      });
  }, [query]);

  return (
    <div className="min-h-screen bg-[#faf7f0] py-8 lg:py-12">
      <Container>
        {/* Search Bar at top */}
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Results header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#0f2a44]">
              {query ? `"${query}" এর অনুসন্ধান ফলাফল` : "পণ্য অনুসন্ধান"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              মোট {products.length} টি পণ্য পাওয়া গেছে
            </p>
          </div>
        </div>

        {/* Loading / Results / Empty state */}
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0f2a44] border-r-transparent"></div>
            <p className="mt-3 text-sm font-medium">লোড হচ্ছে...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-2xl bg-white p-8 border border-gray-100 shadow-xs max-w-md mx-auto">
            <FiSearch className="mx-auto text-4xl text-gray-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">কোনো পণ্য পাওয়া যায়নি</h3>
            <p className="text-xs text-gray-500 mt-1">
              বানান সঠিক কিনা দেখে নিন অথবা অন্য কোনো নাম দিয়ে সার্চ করুন
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf7f0] py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0f2a44] border-r-transparent"></div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
