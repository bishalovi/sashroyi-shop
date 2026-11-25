"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { FaBolt, FaCartPlus } from "react-icons/fa";

const DEFAULT_PLACEHOLDER =
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop";

function getCdnImageUrl(url, width = 120) {
  if (!url || typeof url !== "string") return DEFAULT_PLACEHOLDER;
  const trimmed = url.trim();
  if (trimmed.includes("res.cloudinary.com") && trimmed.includes("/image/upload/")) {
    if (trimmed.includes("/image/upload/f_auto")) return trimmed;
    return trimmed.replace(
      "/image/upload/",
      `/image/upload/f_auto,q_auto:good,w_${width},c_limit/`
    );
  }
  if (trimmed.includes("lh3.googleusercontent.com/d/") && !trimmed.includes("=")) {
    return `${trimmed}=w${width}`;
  }
  return trimmed;
}

export default function MobileStickyBuyBar({
  product,
  quantity = 1,
  activePrice = 0,
  activeOldPrice = null,
  activeImage = "",
  selectedVariation = null,
  isInStock = true,
}) {
  const { mobileStickyBar } = useSettings();
  const isEnabled = mobileStickyBar?.isEnabled !== false;
  const isPermanent = mobileStickyBar?.displayMode === "permanent";

  const [isVisible, setIsVisible] = useState(() => isPermanent);
  const [isAddingCart, setIsAddingCart] = useState(false);
  const { addToCart, clearCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (isPermanent) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      // Show bar once user has scrolled past top fold (> 280px)
      if (typeof window !== "undefined") {
        if (window.scrollY > 280) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isPermanent]);

  const handleBuyNow = () => {
    if (!isInStock) return;
    clearCart();
    addToCart({ ...product, quantity }, { silent: true });

    setTimeout(() => {
      router.push("/checkout");
    }, 100);
  };

  const handleAddToCart = () => {
    if (!isInStock) return;
    setIsAddingCart(true);
    addToCart({ ...product, quantity });
    setTimeout(() => setIsAddingCart(false), 600);
  };

  // If feature is turned off in Settings, completely unmount (zero DOM, zero overhead)
  if (!isEnabled) {
    return null;
  }

  const finalImage = activeImage || product?.image || DEFAULT_PLACEHOLDER;
  const totalPrice = Number(activePrice || product?.price || 0) * (quantity || 1);
  const totalOldPrice = activeOldPrice ? Number(activeOldPrice) * (quantity || 1) : null;

  return (
    <>
      {/* Floating WhatsApp button adjustment when sticky bar is active on mobile */}
      <style jsx global>{`
        @media (max-width: 1023px) {
          body:has(.mobile-sticky-buy-bar-active) div.fixed.bottom-6.right-6 {
            bottom: 5.25rem !important;
            transition: bottom 0.3s ease;
          }
        }
      `}</style>

      {/* Sticky Bar (Mobile & Tablet only: lg:hidden) */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-5px_25px_rgba(0,0,0,0.12)] transition-all duration-300 ease-in-out px-3 py-2.5 sm:px-4 sm:py-3 pb-[calc(0.65rem+env(safe-area-inset-bottom,0px))] ${
          isVisible
            ? "translate-y-0 opacity-100 mobile-sticky-buy-bar-active"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
          {/* Left: Thumbnail & Price Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Thumbnail */}
            <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-xl overflow-hidden border border-gray-200/80 bg-gray-50 shrink-0 shadow-xs">
              <img
                src={getCdnImageUrl(finalImage, 100)}
                alt={product?.name || "Product"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Price & Variation details */}
            <div className="min-w-0 flex flex-col justify-center">
              {/* Variation pill or product name */}
              {selectedVariation?.name ? (
                <span className="inline-block text-[10px] sm:text-[11px] font-semibold text-[#0f2a44] bg-[#d4af37]/20 px-2 py-0.5 rounded-md truncate max-w-[125px] border border-[#d4af37]/30">
                  ✓ {selectedVariation.name}
                </span>
              ) : (
                <p className="text-[11px] sm:text-xs font-semibold text-gray-700 truncate max-w-[130px]">
                  {product?.name}
                </p>
              )}

              {/* Price row */}
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-black text-[#0f2a44] tracking-tight">
                  ৳{totalPrice}
                </span>

                {totalOldPrice && totalOldPrice > totalPrice && (
                  <span className="text-[11px] sm:text-xs text-gray-400 line-through">
                    ৳{totalOldPrice}
                  </span>
                )}

                {quantity > 1 && (
                  <span className="text-[10px] text-gray-500 font-medium">
                    ({quantity}টি)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Add to Cart button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!isInStock || isAddingCart}
              title="কার্টে যোগ করুন"
              aria-label="কার্টে যোগ করুন"
              className={`p-2.5 sm:p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[#0f2a44] transition-all duration-200 active:scale-95 shadow-xs cursor-pointer flex items-center justify-center ${
                !isInStock ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FaCartPlus size={18} className={isAddingCart ? "scale-125 transition-transform" : ""} />
            </button>

            {/* Direct 1-Click Buy Now button */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!isInStock}
              className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap ${
                isInStock
                  ? product?.isFreeShipping
                    ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-700/25"
                    : "bg-gradient-to-r from-[#0f2a44] to-[#1c446c] hover:from-[#133557] hover:to-[#225384] shadow-[#0f2a44]/20"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {product?.isFreeShipping ? (
                <span className="text-sm">🚚</span>
              ) : (
                <FaBolt className="text-[#d4af37] animate-pulse" size={14} />
              )}
              <span>
                {isInStock
                  ? product?.isFreeShipping
                    ? "ফ্রি ডেলিভারিতে অর্ডার করুন"
                    : "এখনই অর্ডার করুন"
                  : "স্টক আউট"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
