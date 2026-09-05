"use client";

import { useCart } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop";

export default function ProductCard({ product }) {
  const { addToCart, clearCart } = useCart();
  const router = useRouter();
  const [imgSrc, setImgSrc] = useState(
    product?.image && (product.image.startsWith("http") || product.image.startsWith("/"))
      ? product.image
      : DEFAULT_PLACEHOLDER
  );

  const isVariable =
    product?.productType === "variable" &&
    Array.isArray(product?.variations) &&
    product.variations.length > 0;
  const defaultVar = isVariable
    ? product.variations.find((v) => v.isDefault) || product.variations[0]
    : null;
  const displayPrice = defaultVar ? Number(defaultVar.price ?? product?.price ?? 0) : Number(product?.price ?? 0);
  const displayOldPrice = defaultVar ? (defaultVar.oldPrice ? Number(defaultVar.oldPrice) : product?.oldPrice) : product?.oldPrice;
  const packName = defaultVar?.name;

  const getTargetProduct = () => {
    if (isVariable && defaultVar) {
      return {
        ...product,
        price: displayPrice,
        oldPrice: displayOldPrice,
        selectedVariationId: defaultVar.id,
        variationTitle: defaultVar.name,
      };
    }
    return product;
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(getTargetProduct());
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();

    clearCart();
    addToCart({ ...getTargetProduct(), quantity: 1 });
    router.push("/checkout");
  };

  return (
    <Link
      href={`/products/${product.slug || product._id}`}
      className="group block overflow-hidden rounded-2xl bg-white border border-[#0f2a44]/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative bg-[#faf7f0] aspect-square overflow-hidden">
        <Image
          width={300}
          height={300}
          src={imgSrc}
          alt={product?.name || "Product"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => setImgSrc(DEFAULT_PLACEHOLDER)}
          unoptimized={imgSrc.startsWith("http")}
        />

        {/* Badge */}
        {product?.badge && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-semibold ${
              product.badge === "Sale"
                ? "bg-red-500 text-white"
                : product.badge === "New"
                  ? "bg-[#d4af37] text-white"
                  : "bg-red-500 text-white"
            }`}
          >
            {product.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="mb-1 text-xs capitalize text-[#0f2a44]/60">
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
              <span className="text-xs text-gray-400 line-through">
                ৳ {displayOldPrice}
              </span>
            ) : null}
          </div>

          {isVariable && packName && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/15 text-[#966f00] text-[11px] font-bold border border-[#d4af37]/40 shadow-[0_2px_8px_rgba(212,175,55,0.12)] group-hover:scale-105 transition-transform duration-200 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4af37]"></span>
              </span>
              <span className="tracking-tight">{packName}</span>
            </span>
          )}
        </div>

        {/* add to cart + buy now */}
        <div className="flex justify-between py-2 gap-3">
          <button
            onClick={handleAddToCart}
            className="py-2 w-[50%] rounded-md text-[#0f2a44] border border-[#0f2a44] text-xs font-medium hover:bg-[#d4af37] hover:border-[#d4af37] hover:text-white transition-all duration-200"
          >
            কার্টে যোগ করুন
          </button>
          <button
            onClick={handleBuyNow}
            className="w-[50%] py-2 rounded-md bg-[#0f2a44] text-white text-xs font-medium hover:bg-[#d4af37] transition-all duration-200"
          >
            এখনই কিনুন
          </button>
        </div>
      </div>
    </Link>
  );
}