"use client";

import { useState, useMemo, useEffect } from "react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import BuyNowButton from "../../app/products/[id]/BuyNowButton";
import { FaWhatsapp } from "react-icons/fa";
import { useSettings } from "@/contexts/SettingsContext";
import { pushToDataLayer } from "@/lib/gtm";
import { trackMetaEvent } from "@/lib/metaTracking";

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

    const variationPrice = Number(variation.price || 0);
    const variationItemId = `${product?._id || product?.id}_${variation.id}`;
    const variationName = `${product?.name || "Product"} (${variation.name})`;

    // Dynamic GTM DataLayer
    pushToDataLayer({
      event: "view_item",
      ecommerce: {
        currency: "BDT",
        value: variationPrice,
        items: [
          {
            item_id: variationItemId,
            item_name: variationName,
            item_variant: variation.name,
            price: variationPrice,
            quantity: 1,
          },
        ],
      },
    });

    // Dynamic Meta Pixel & Server CAPI ViewContent
    trackMetaEvent("ViewContent", {
      content_name: variationName,
      content_category: product?.category || "General",
      content_ids: [variationItemId],
      content_type: "product",
      value: variationPrice,
      currency: "BDT",
      contents: [
        {
          id: variationItemId,
          quantity: 1,
          item_price: variationPrice,
        },
      ],
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

    pushToDataLayer({
      event: "contact",
      contact_method: "whatsapp_product_order",
      product_name: product?.name || "",
      product_price: activePrice,
      quantity,
    });

    trackMetaEvent("Contact", {
      content_name: product?.name || "Product",
      content_ids: [selectedVariation?.id ? `${product?._id || product?.id}_${selectedVariation.id}` : String(product?._id || product?.id || "")],
      content_type: "product",
      value: activePrice * quantity,
      currency: "BDT",
      channel: "WhatsApp",
    });

    const msg = `হ্যালো! আমি এই প্রোডাক্টটি সম্পর্কে বিস্তারিত জানতে / অর্ডার করতে চাই:

📦 প্রোডাক্ট: ${product?.name || "Product"}${variationText}
💰 মূল্য: ৳${activePrice}
🔢 পরিমাণ: ${quantity}
🔗 লিঙ্ক: ${currentUrl}`;

    const url = getWhatsAppUrl(msg);
    window.open(url, "_blank");
  };

  return (
    <div className="mt-4">
      {/* Live Dynamic Price Display */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl font-bold text-[#0f2a44]">
          ৳ {activePrice}
        </span>

        {activeOldPrice && activeOldPrice > activePrice && (
          <>
            <span className="text-gray-400 line-through text-lg">
              ৳ {activeOldPrice}
            </span>
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              ৳{activeOldPrice - activePrice} ছাড়
            </span>
          </>
        )}
      </div>

      {/* Stock Status */}
      <p
        className={`mb-5 font-medium text-sm ${
          isInStock ? "text-green-600" : "text-red-500"
        }`}
      >
        {isInStock ? "✓ In Stock (স্টকে আছে)" : "✗ Out of Stock (স্টক শেষ)"}
      </p>

      {/* Variation Selection Pills */}
      {isVariable && (
        <div className="mb-6 rounded-2xl border border-[#d4af37]/30 bg-[#faf7f0]/70 p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-[#0f2a44]">
              পরিমাণ / প্যাকেজ সিলেক্ট করুন:
            </label>
            {selectedVariation?.name && (
              <span className="text-xs font-semibold text-[#0f2a44] bg-[#d4af37]/20 px-2.5 py-0.5 rounded-full border border-[#d4af37]/40">
                ✓ {selectedVariation.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {product.variations.map((v) => {
              const isSelected = selectedVariation?.id === v.id;
              const hasDiscount = v.oldPrice && Number(v.oldPrice) > Number(v.price);
              const saveAmount = hasDiscount ? Number(v.oldPrice) - Number(v.price) : 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectVariation(v)}
                  className={`relative flex flex-col justify-between p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#d4af37] bg-white ring-2 ring-[#d4af37] shadow-md"
                      : "border-gray-200 bg-white/80 hover:border-[#d4af37]/60 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-sm font-bold text-[#0f2a44]">
                      {v.name}
                    </span>
                    {isSelected && (
                      <span className="h-4 w-4 rounded-full bg-[#d4af37] text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-base font-bold text-[#0f2a44]">
                      ৳{v.price}
                    </span>
                    {v.oldPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ৳{v.oldPrice}
                      </span>
                    )}
                  </div>

                  {saveAmount > 0 && (
                    <span className="mt-1.5 inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
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
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-[#0f2a44]">Quantity (পরিমাণ)</p>

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
        <AddToCartButton product={activeProduct} quantity={quantity} />
        <BuyNowButton product={activeProduct} quantity={quantity} />
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
