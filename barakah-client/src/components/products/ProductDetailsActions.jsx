"use client";

import { useState, useMemo, useEffect } from "react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import BuyNowButton from "../../app/products/[id]/BuyNowButton";
import { FaWhatsapp } from "react-icons/fa";
import { useSettings } from "@/contexts/SettingsContext";
import { pushToDataLayer } from "@/lib/gtm";

export default function ProductDetailsActions({ product }) {
  const [quantity, setQuantity] = useState(1);
  const { getWhatsAppUrl } = useSettings();

  const isVariable =
    product?.productType === "variable" &&
    Array.isArray(product?.variations) &&
    product.variations.length > 0;

  const defaultVariation = useMemo(() => {
    if (!isVariable) return null;
    return product.variations.find((v) => v.isDefault) || product.variations[0];
  }, [isVariable, product?.variations]);

  const [selectedVariation, setSelectedVariation] = useState(defaultVariation);

  useEffect(() => {
    if (defaultVariation) {
      setSelectedVariation(defaultVariation);
    }
  }, [defaultVariation]);

  const activePrice = selectedVariation ? Number(selectedVariation.price || 0) : Number(product?.price || 0);
  const activeOldPrice = selectedVariation ? (selectedVariation.oldPrice ? Number(selectedVariation.oldPrice) : null) : (product?.oldPrice ? Number(product.oldPrice) : null);
  const isInStock = selectedVariation ? selectedVariation.inStock !== false : product?.inStock !== false;

  const activeProduct = useMemo(() => {
    return {
      ...product,
      price: activePrice,
      oldPrice: activeOldPrice,
      selectedVariationId: selectedVariation?.id || null,
      variationTitle: selectedVariation?.name || null,
    };
  }, [product, activePrice, activeOldPrice, selectedVariation]);

  const handleSelectVariation = (variation) => {
    setSelectedVariation(variation);

    // Dynamic Meta Pixel / DataLayer ViewContent on variation switch
    pushToDataLayer({
      event: "view_item",
      ecommerce: {
        currency: "BDT",
        value: Number(variation.price || 0),
        items: [
          {
            item_id: `${product?._id || product?.id}_${variation.id}`,
            item_name: `${product?.name || "Product"} (${variation.name})`,
            item_variant: variation.name,
            price: Number(variation.price || 0),
            quantity: 1,
          },
        ],
      },
    });
  };

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleWhatsAppOrder = () => {
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const variationText = selectedVariation?.name ? `\n🏷️ প্যাকেজ: ${selectedVariation.name}` : "";
    const msg = `হ্যালো! আমি এই প্রোডাক্টটি সম্পর্কে বিস্তারিত জানতে / অর্ডার করতে চাই:

📦 প্রোডাক্ট: ${product?.name || "Product"}${variationText}
💰 মূল্য: ৳${activePrice}
🔢 পরিমাণ: ${quantity}
🔗 লিঙ্ক: ${currentUrl}`;

    const url = getWhatsAppUrl(msg);
    window.open(url, "_blank");
  };

  return (
    <div className="mt-3">
      {/* Live Dynamic Price Display with Variation Pack Badge */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-[#0f2a44] tracking-tight">
            ৳ {activePrice}
          </span>

          {/* Osthir Variation Pack Badge right next to the price */}
          {isVariable && selectedVariation?.name && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs sm:text-sm font-bold bg-gradient-to-r from-[#d4af37]/20 via-amber-100 to-[#d4af37]/25 text-[#0f2a44] border border-[#d4af37] shadow-xs transition-all duration-300 transform hover:scale-105">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] animate-pulse"></span>
              <span>({selectedVariation.name})</span>
            </span>
          )}
        </div>

        {activeOldPrice && activeOldPrice > activePrice && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 line-through text-sm sm:text-base">
              ৳ {activeOldPrice}
            </span>
            <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              ৳{activeOldPrice - activePrice} ছাড়
            </span>
          </div>
        )}
      </div>

      {/* Stock Status */}
      <p
        className={`mb-3 font-medium text-xs sm:text-sm ${
          isInStock ? "text-green-600" : "text-red-500"
        }`}
      >
        {isInStock ? "✓ In Stock (স্টকে আছে)" : "✗ Out of Stock (স্টক শেষ)"}
      </p>

      {/* Variation Selection Pills */}
      {isVariable && (
        <div className="mb-3.5 rounded-xl border border-[#d4af37]/30 bg-[#faf7f0]/70 p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs sm:text-sm font-bold text-[#0f2a44]">
              পরিমাণ / প্যাকেজ সিলেক্ট করুন:
            </label>
            {selectedVariation?.name && (
              <span className="text-[11px] font-semibold text-[#0f2a44] bg-[#d4af37]/20 px-2 py-0.5 rounded-full border border-[#d4af37]/40">
                ✓ {selectedVariation.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {product.variations.map((v) => {
              const isSelected = selectedVariation?.id === v.id;
              const hasDiscount = v.oldPrice && Number(v.oldPrice) > Number(v.price);
              const saveAmount = hasDiscount ? Number(v.oldPrice) - Number(v.price) : 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectVariation(v)}
                  className={`relative flex flex-col justify-between p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#d4af37] bg-white ring-2 ring-[#d4af37] shadow-sm"
                      : "border-gray-200 bg-white/80 hover:border-[#d4af37]/60 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <span className="text-xs sm:text-sm font-bold text-[#0f2a44]">
                      {v.name}
                    </span>
                    {isSelected && (
                      <span className="h-3.5 w-3.5 rounded-full bg-[#d4af37] text-white flex items-center justify-center text-[9px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm sm:text-base font-bold text-[#0f2a44]">
                      ৳{v.price}
                    </span>
                    {v.oldPrice && (
                      <span className="text-[11px] text-gray-400 line-through">
                        ৳{v.oldPrice}
                      </span>
                    )}
                  </div>

                  {saveAmount > 0 && (
                    <span className="mt-1 inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      ৳{saveAmount} সাশ্রয়
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="mb-3.5">
        <p className="mb-1 text-xs sm:text-sm font-medium text-[#0f2a44]">Quantity (পরিমাণ)</p>

        <div className="flex items-center w-fit rounded-full border border-[#0f2a44]/15 bg-white px-1.5 py-0.5">
          <button
            onClick={decreaseQuantity}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#0f2a44] transition hover:bg-[#f8f6f1]"
          >
            -
          </button>

          <span className="min-w-8 text-center text-base font-medium text-[#0f2a44]">
            {quantity}
          </span>

          <button
            onClick={increaseQuantity}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#0f2a44] transition hover:bg-[#f8f6f1]"
          >
            +
          </button>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <AddToCartButton product={activeProduct} quantity={quantity} />
        <BuyNowButton product={activeProduct} quantity={quantity} />
      </div>

      {/* WhatsApp Action Button */}
      <div className="mt-2.5">
        <button
          onClick={handleWhatsAppOrder}
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-xs transition-all duration-300 hover:bg-[#20ba59] hover:shadow-sm active:scale-[0.99] cursor-pointer"
        >
          <FaWhatsapp size={20} />
          <span>হোয়াটসঅ্যাপে অর্ডার / বিস্তারিত জানুন</span>
        </button>
      </div>
    </div>
  );
}
