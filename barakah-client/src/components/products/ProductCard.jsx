import Image from "next/image";
import Link from "next/link";
import ProductCardActions from "./ProductCardActions";
import { getOptimizedImageUrl } from "@/lib/imageOptimizer";

const DEFAULT_PLACEHOLDER =
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=480&auto=format&fit=crop";

const COLOR_MAP = {
  red: "#ef4444",
  blue: "#3b82f6",
  black: "#111827",
  brown: "#78350f",
  green: "#22c55e",
  white: "#f9fafb",
  yellow: "#eab308",
  pink: "#ec4899",
  purple: "#a855f7",
  orange: "#f97316",
  gray: "#6b7280",
  grey: "#6b7280",
  navy: "#1e3a8a",
  teal: "#14b8a6",
  maroon: "#881337",
  "লাল": "#ef4444",
  "নীল": "#3b82f6",
  "কালো": "#111827",
  "সাদা": "#ffffff",
  "সবুজ": "#22c55e",
  "হলুদ": "#eab308",
  "গোলাপী": "#ec4899",
  "বাদামী": "#78350f",
  "কমলা": "#f97316",
  "ধূসর": "#6b7280",
};

function getAutoColor(color, name) {
  if (color && color.trim()) return color.trim();
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export default function ProductCard({ product, priority = false, eager = false }) {
  const rawImg =
    product?.image && (product.image.startsWith("http") || product.image.startsWith("/"))
      ? product.image
      : DEFAULT_PLACEHOLDER;

  const imgSrc = getOptimizedImageUrl(rawImg, 480);
  const isCdnOptimized =
    imgSrc.includes("res.cloudinary.com") ||
    imgSrc.includes("lh3.googleusercontent.com") ||
    imgSrc.includes("images.unsplash.com");

  const isVariable =
    Array.isArray(product?.variations) && product.variations.length > 0;
  const defaultVar = isVariable
    ? product.variations.find((v) => v.isDefault) || product.variations[0]
    : null;
  const displayPrice = defaultVar
    ? Number(defaultVar.price ?? product?.price ?? 0)
    : Number(product?.price ?? 0);
  const displayOldPrice = defaultVar
    ? defaultVar.oldPrice
      ? Number(defaultVar.oldPrice)
      : product?.oldPrice
    : product?.oldPrice;

  const varCount = isVariable ? product.variations.length : 0;
  const colorSwatches = isVariable
    ? product.variations
        .map((v) => getAutoColor(v.color, v.name))
        .filter(Boolean)
    : [];
  const isColorProduct = colorSwatches.length > 0;
  const isSizeProduct =
    isVariable &&
    product.variations.some((v) =>
      ["m", "l", "xl", "xxl", "s", "xs", "সাইজ", "size"].some((s) =>
        v.name?.toLowerCase().includes(s)
      )
    );

  let variationLabel = "";
  if (isVariable) {
    if (isColorProduct) {
      variationLabel = `${varCount}টি রঙে পাবেন`;
    } else if (isSizeProduct) {
      variationLabel = `${varCount}টি সাইজে পাবেন`;
    } else {
      variationLabel = `${varCount}টি অপশনে পাবেন`;
    }
  }

  const targetProduct =
    isVariable && defaultVar
      ? {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          image: product.image,
          category: product.category,
          price: displayPrice,
          oldPrice: displayOldPrice,
          selectedVariationId: defaultVar.id,
          variationTitle: defaultVar.name,
        }
      : {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          image: product.image,
          category: product.category,
          price: product.price,
          oldPrice: product.oldPrice,
        };

  const productUrl = `/products/${product.slug || product._id}`;

  return (
    <div className="group block overflow-hidden rounded-2xl bg-white border border-[#0f2a44]/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Image */}
      <Link href={productUrl} prefetch={false} className="block relative bg-[#faf7f0] aspect-square overflow-hidden">
        <Image
          width={300}
          height={300}
          src={imgSrc}
          alt={product?.name || "Product"}
          sizes="(max-width: 640px) 360px, (max-width: 1024px) 280px, 300px"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
          loading={priority || eager ? "eager" : "lazy"}
          unoptimized={isCdnOptimized}
        />

        {/* Badge */}
        {product?.badge && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-semibold ${
              product.badge === "Sale"
                ? "bg-red-600 text-white"
                : product.badge === "New"
                  ? "bg-[#d4af37] text-[#0f2a44]"
                  : "bg-red-600 text-white"
            }`}
          >
            {product.badge}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={productUrl} prefetch={false} className="block">
          {/* Category */}
          <p className="mb-1 text-xs capitalize text-[#0f2a44]/80">
            {product?.category || "General"}
          </p>

          {/* Name */}
          <p className="mb-1.5 line-clamp-1 text-sm font-semibold text-[#0f2a44]">
            {product?.name || "Untitled Product"}
          </p>

          {/* Price & Variation Pack Badge */}
          <div className="flex items-center justify-between gap-1.5 my-1 min-h-[30px]">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base font-extrabold text-[#0f2a44]">
                ৳ {displayPrice}
              </span>
              {displayOldPrice && displayOldPrice > displayPrice ? (
                <span className="text-xs text-gray-600 line-through">
                  ৳ {displayOldPrice}
                </span>
              ) : null}
            </div>

            {isVariable && variationLabel && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-[#0f2a44] text-[10px] font-bold border border-[#d4af37]/40 shadow-sm shrink-0">
                {/* Mini Color Dots Preview */}
                {isColorProduct && colorSwatches.length > 0 && (
                  <span className="flex items-center -space-x-1">
                    {colorSwatches.slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className="inline-block h-2.5 w-2.5 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </span>
                )}
                <span>{variationLabel}</span>
              </div>
            )}
          </div>
        </Link>

        {/* add to cart + buy now */}
        <ProductCardActions targetProduct={targetProduct} />
      </div>
    </div>
  );
}
