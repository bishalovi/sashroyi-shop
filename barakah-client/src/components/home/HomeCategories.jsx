"use client";

import Link from "next/link";
import SearchBar from "./SearchBar";
import { BiCategory } from "react-icons/bi";
import {
  MdOutlineKitchen,
  MdHomeRepairService,
  MdChildCare,
  MdBuild,
  MdDevices,
  MdOutlineShoppingBag,
  MdOutlineSpa,
  MdCheckroom,
} from "react-icons/md";
import { IoSparklesOutline } from "react-icons/io5";

// Category icon & gradient helper
const getCategoryMeta = (slug) => {
  const s = slug?.toLowerCase() || "";
  if (s.includes("kitchen") || s.includes("dining") || s.includes("cook")) {
    return {
      icon: <MdOutlineKitchen className="text-2xl" />,
      color: "from-amber-500/10 to-orange-500/20 text-amber-700",
      borderHover: "hover:border-amber-400",
    };
  }
  if (s.includes("home") || s.includes("living")) {
    return {
      icon: <MdHomeRepairService className="text-2xl" />,
      color: "from-blue-500/10 to-indigo-500/20 text-blue-700",
      borderHover: "hover:border-blue-400",
    };
  }
  if (s.includes("baby") || s.includes("child") || s.includes("kid") || s.includes("toy")) {
    return {
      icon: <MdChildCare className="text-2xl" />,
      color: "from-pink-500/10 to-rose-500/20 text-pink-700",
      borderHover: "hover:border-pink-400",
    };
  }
  if (s.includes("tool") || s.includes("accessor")) {
    return {
      icon: <MdBuild className="text-2xl" />,
      color: "from-emerald-500/10 to-teal-500/20 text-emerald-700",
      borderHover: "hover:border-emerald-400",
    };
  }
  if (s.includes("gadget") || s.includes("device") || s.includes("watch")) {
    return {
      icon: <MdDevices className="text-2xl" />,
      color: "from-violet-500/10 to-purple-500/20 text-violet-700",
      borderHover: "hover:border-violet-400",
    };
  }
  if (s.includes("combo") || s.includes("offer")) {
    return {
      icon: <MdOutlineShoppingBag className="text-2xl" />,
      color: "from-red-500/10 to-orange-500/20 text-red-700",
      borderHover: "hover:border-red-400",
    };
  }
  if (s.includes("fashion") || s.includes("cloth")) {
    return {
      icon: <MdCheckroom className="text-2xl" />,
      color: "from-cyan-500/10 to-sky-500/20 text-cyan-700",
      borderHover: "hover:border-cyan-400",
    };
  }
  return {
    icon: <BiCategory className="text-2xl" />,
    color: "from-[#d4af37]/10 to-[#0f2a44]/10 text-[#0f2a44]",
    borderHover: "hover:border-[#d4af37]",
  };
};

export default function HomeCategories({ categories = [] }) {
  return (
    <section className="bg-gradient-to-b from-white via-[#faf7f0]/60 to-[#faf7f0] pt-5 pb-8 border-b border-gray-200/70">
      <div className="mx-auto max-w-7xl px-4">
        {/* 1. Header Search Bar */}
        <div className="mb-6">
          <SearchBar />
        </div>

        {/* 2. Category Section Heading */}
        {categories && categories.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#d4af37]/15 text-[#0f2a44]">
                  <IoSparklesOutline className="text-lg text-[#d4af37]" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-[#0f2a44]">
                    জনপ্রিয় ক্যাটাগরিসমূহ
                  </h2>
                </div>
              </div>
              <span className="text-xs text-gray-500 hidden sm:inline-block">
                প্রয়োজনীয় ক্যাটাগরি বেছে নিন
              </span>
            </div>

            {/* 3. Modern Category Grid / Pills */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3.5">
              {categories.map((cat) => {
                const meta = getCategoryMeta(cat.slug);
                return (
                  <Link
                    key={cat._id || cat.slug}
                    href={`/category/${cat.slug}`}
                    className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${meta.borderHover}`}
                  >
                    {/* Icon container */}
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-xs`}
                    >
                      {meta.icon}
                    </div>

                    {/* Category Title */}
                    <span className="text-xs sm:text-sm font-semibold text-[#0f2a44] group-hover:text-[#d4af37] text-center line-clamp-1 transition-colors">
                      {cat.name}
                    </span>

                    {/* Subcategories count badge */}
                    {cat.subcategories && cat.subcategories.length > 0 ? (
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-500 font-medium group-hover:bg-[#0f2a44]/5">
                        {cat.subcategories.length} টি ধরন
                      </span>
                    ) : (
                      <span className="mt-1 text-[10px] text-gray-400">সকল পণ্য</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
