"use client";

import { useState } from "react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import BuyNowButton from "../../app/products/[id]/BuyNowButton";
import { FaWhatsapp } from "react-icons/fa";
import { useSettings } from "@/contexts/SettingsContext";

export default function ProductDetailsActions({ product }) {
  const [quantity, setQuantity] = useState(1);
  const { getWhatsAppUrl } = useSettings();

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleWhatsAppOrder = () => {
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const msg = `হ্যালো! আমি এই প্রোডাক্টটি সম্পর্কে বিস্তারিত জানতে / অর্ডার করতে চাই:

📦 প্রোডাক্ট: ${product?.name || "Product"}
💰 মূল্য: ৳${product?.price || ""}
🔢 পরিমাণ: ${quantity}
🔗 লিঙ্ক: ${currentUrl}`;

    const url = getWhatsAppUrl(msg);
    window.open(url, "_blank");
  };

  return (
    <div className="mt-6">
      {/* Quantity */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-medium text-[#0f2a44]">Quantity (পরিমাণ)</p>

        <div className="flex items-center w-fit rounded-full border border-[#0f2a44]/15 bg-white px-2 py-1">
          <button
            onClick={decreaseQuantity}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-[#0f2a44] transition hover:bg-[#f8f6f1]"
          >
            -
          </button>

          <span className="min-w-10 text-center text-lg font-medium text-[#0f2a44]">
            {quantity}
          </span>

          <button
            onClick={increaseQuantity}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-[#0f2a44] transition hover:bg-[#f8f6f1]"
          >
            +
          </button>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <AddToCartButton product={product} quantity={quantity} />
        <BuyNowButton product={product} quantity={quantity} />
      </div>

      {/* WhatsApp Action Button */}
      <div className="mt-4">
        <button
          onClick={handleWhatsAppOrder}
          type="button"
          className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#20ba59] hover:shadow-md active:scale-[0.99] cursor-pointer"
        >
          <FaWhatsapp size={22} />
          হোয়াটসঅ্যাপে অর্ডার / বিস্তারিত জানুন
        </button>
      </div>
    </div>
  );
}
