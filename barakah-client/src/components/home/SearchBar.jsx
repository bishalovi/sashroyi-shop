"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { trackMetaEvent } from "@/lib/metaTracking";
import { pushToDataLayer } from "@/lib/gtm";

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchRef = useRef(null);

  const baseUrl = "https://sashroyi-api.onrender.com";

  // Debounced search for live dropdown
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`${baseUrl}/api/products?search=${encodeURIComponent(searchTerm.trim())}&limit=5`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data?.data || []);
          setIsOpen(true);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Search error:", err);
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      setIsOpen(false);

      pushToDataLayer({
        event: "search",
        search_term: query,
      });

      trackMetaEvent("Search", {
        search_string: query,
        content_type: "product",
      });

      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <div className="relative w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder="পছন্দের পণ্য খুঁজুন... (যেমন: Coocker, Blender, Watch)"
            className="w-full pl-11 pr-24 py-3 md:py-3.5 bg-white border-2 border-[#0f2a44]/20 rounded-full text-sm md:text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#d4af37] focus:ring-3 focus:ring-[#d4af37]/20 shadow-sm transition-all duration-200"
          />
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg md:text-xl" />
          
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setResults([]);
                setIsOpen(false);
              }}
              className="absolute right-24 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <IoClose className="text-lg" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-5 py-2 md:py-2.5 bg-[#0f2a44] hover:bg-[#d4af37] text-white rounded-full text-xs md:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-sm"
        >
          <span>খুঁজুন</span>
        </button>
      </form>

      {/* Live search dropdown results */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">খোঁজা হচ্ছে...</div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {results.map((product) => (
                <Link
                  key={product._id}
                  href={`/products/${product._id}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 hover:bg-[#faf7f0] transition-colors"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <Image
                      src={product.image || "/placeholder.png"}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-[#0f2a44] font-bold">৳ {product.price}</p>
                  </div>
                </Link>
              ))}
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="w-full py-2.5 bg-gray-50 hover:bg-[#faf7f0] text-center text-xs font-semibold text-[#0f2a44] hover:text-[#d4af37] transition-colors"
              >
                সব ফলাফল দেখুন ({results.length}+) →
              </button>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">কোনো পণ্য পাওয়া যায়নি</div>
          )}
        </div>
      )}
    </div>
  );
}
