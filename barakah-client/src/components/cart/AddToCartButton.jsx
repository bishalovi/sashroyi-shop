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
      className="px-6 py-3 bg-[#0f2a44] text-white rounded-lg hover:bg-[#d4af37] transition"
    >
      কার্টে যোগ করুন
    </button>
  );
}
