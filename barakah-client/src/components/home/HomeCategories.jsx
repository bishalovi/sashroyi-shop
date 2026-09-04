import Link from "next/link";
import { BiCategory } from "react-icons/bi";
import { MdOutlineKitchen, MdHomeRepairService, MdChildCare, MdBuild, MdDevices, MdOutlineShoppingBag } from "react-icons/md";

// Icon mapping helper for categories
const getCategoryIcon = (slug) => {
  const s = slug?.toLowerCase() || "";
  if (s.includes("kitchen") || s.includes("dining") || s.includes("cook")) return <MdOutlineKitchen className="text-2xl" />;
  if (s.includes("home") || s.includes("living")) return <MdHomeRepairService className="text-2xl" />;
  if (s.includes("baby") || s.includes("child") || s.includes("kid") || s.includes("toy")) return <MdChildCare className="text-2xl" />;
  if (s.includes("tool") || s.includes("accessor")) return <MdBuild className="text-2xl" />;
  if (s.includes("gadget") || s.includes("device") || s.includes("watch")) return <MdDevices className="text-2xl" />;
  if (s.includes("combo") || s.includes("offer")) return <MdOutlineShoppingBag className="text-2xl" />;
  return <BiCategory className="text-2xl" />;
};

export default function HomeCategories({ categories = [] }) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="bg-white border-b border-gray-100 py-6 lg:py-8 shadow-xs">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-[#0f2a44] flex items-center gap-2">
            <BiCategory className="text-[#d4af37] text-xl" /> ক্যাটাগরিসমূহ
          </h2>
          <span className="text-xs text-gray-500 font-medium">পছন্দের ক্যাটাগরি বেছে নিন</span>
        </div>

        {/* Scrollable on mobile, grid on larger screens */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat._id || cat.slug}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center justify-center p-4 rounded-xl bg-[#faf7f0] border border-[#0f2a44]/10 hover:border-[#d4af37] hover:bg-white hover:shadow-md transition-all duration-200 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#0f2a44]/5 group-hover:bg-[#d4af37]/20 flex items-center justify-center text-[#0f2a44] group-hover:text-[#d4af37] group-hover:scale-110 transition-all duration-200 mb-2">
                {getCategoryIcon(cat.slug)}
              </div>
              <span className="text-xs md:text-sm font-semibold text-[#0f2a44] group-hover:text-[#d4af37] line-clamp-1">
                {cat.name}
              </span>
              {cat.subcategories && cat.subcategories.length > 0 && (
                <span className="text-[10px] text-gray-500 mt-0.5">
                  {cat.subcategories.length} সাব-ক্যাটাগরি
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
