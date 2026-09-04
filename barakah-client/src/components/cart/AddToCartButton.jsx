"use client";

import { useCart } from "@/contexts/CartContext";

export default function AddToCartButton({ product, quantity = 1 }) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
  };

  return (
    <button
      onClick={handleAddToCart}
      className="px-6 py-3 border border-[#0f2a44] text-[#0f2a44] rounded-lg hover:bg-[#d4af37] hover:border-[#d4af37] hover:text-white transition font-medium"
    >
      কার্টে যোগ করুন
    </button>
  );
}
