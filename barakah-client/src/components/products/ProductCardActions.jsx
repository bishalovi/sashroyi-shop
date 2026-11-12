"use client";

import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";

export default function ProductCardActions({ targetProduct }) {
  const { addToCart, clearCart } = useCart();
  const router = useRouter();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(targetProduct);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearCart();
    addToCart(
      { ...targetProduct, quantity: 1 },
      { silent: true, skipTracking: true }
    );
    router.push("/checkout");
  };

  return (
    <div className="flex justify-between py-2 gap-3">
      <button
        type="button"
        onClick={handleAddToCart}
        className="py-2 w-[50%] rounded-md text-[#0f2a44] border border-[#0f2a44] text-xs font-medium hover:bg-[#d4af37] hover:border-[#d4af37] hover:text-[#0f2a44] transition-all duration-200 cursor-pointer"
      >
        কার্টে যোগ করুন
      </button>
      <button
        type="button"
        onClick={handleBuyNow}
        className="w-[50%] py-2 rounded-md bg-[#0f2a44] text-white text-xs font-medium hover:bg-[#d4af37] hover:text-[#0f2a44] transition-all duration-200 cursor-pointer"
      >
        এখনই কিনুন
      </button>
    </div>
  );
}
