"use client";

import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";

export default function BuyNowButton({ product, quantity = 1 }) {
  const { addToCart, clearCart } = useCart();
  const router = useRouter();

  const handleBuyNow = () => {
    clearCart();
    addToCart({ ...product, quantity }, { silent: true, skipTracking: true });

    setTimeout(() => {
      router.push("/checkout");
    }, 100);
  };

  const isFree = Boolean(product?.isFreeShipping);

  return (
    <button
      onClick={handleBuyNow}
      className={`px-6 py-3 rounded-lg transition font-bold cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
        isFree
          ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-emerald-700/20"
          : "bg-[#0f2a44] text-white hover:bg-[#d4af37]"
      }`}
    >
      <span>{isFree ? "🚚 ফ্রি ডেলিভারিতে অর্ডার করুন" : "এখনই কিনুন"}</span>
    </button>
  );
}