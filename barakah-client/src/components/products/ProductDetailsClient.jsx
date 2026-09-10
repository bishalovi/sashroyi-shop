"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import AddToCartButton from "@/components/cart/AddToCartButton";
import BuyNowButton from "@/app/products/[id]/BuyNowButton";
import { FaWhatsapp, FaTruck, FaShieldAlt, FaUndo } from "react-icons/fa";
import { useSettings } from "@/contexts/SettingsContext";
import { pushToDataLayer } from "@/lib/gtm";
import { trackMetaEvent } from "@/lib/metaTracking";

const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop";

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
  // Bengali Color Names
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

export default function ProductDetailsClient({ product }) {
  const [quantity, setQuantity] = useState(1);
  const { getWhatsAppUrl } = useSettings();

  const isVariable =
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

  const mainProductImage =
    product?.image && (product.image.startsWith("http") || product.image.startsWith("/"))
      ? product.image
      : DEFAULT_PLACEHOLDER;

  // Active image: if selected variation has an image, use it, else default product image
  const [activeImage, setActiveImage] = useState(
    selectedVariation?.image && selectedVariation.image.trim()
      ? selectedVariation.image.trim()
      : mainProductImage
  );

  useEffect(() => {
    if (selectedVariation?.image && selectedVariation.image.trim()) {
      setActiveImage(selectedVariation.image.trim());
    } else {
      setActiveImage(mainProductImage);
    }
  }, [selectedVariation, mainProductImage]);

  const activePrice = selectedVariation ? Number(selectedVariation.price || 0) : Number(product?.price || 0);
  const activeOldPrice = selectedVariation
    ? (selectedVariation.oldPrice ? Number(selectedVariation.oldPrice) : null)
    : (product?.oldPrice ? Number(product.oldPrice) : null);
  const isInStock = selectedVariation ? selectedVariation.inStock !== false : product?.inStock !== false;

  const activeProduct = useMemo(() => {
    return {
      ...product,
      price: activePrice,
      oldPrice: activeOldPrice,
      image: activeImage,
      selectedVariationId: selectedVariation?.id || null,
      variationTitle: selectedVariation?.name || null,
    };
  }, [product, activePrice, activeOldPrice, activeImage, selectedVariation]);

  // Variations that have distinct images for thumbnail list
  const variationImagesList = useMemo(() => {
    const list = [{ id: "main", name: product?.name || "Main", image: mainProductImage, isMain: true }];
    if (isVariable) {
      product.variations.forEach((v) => {
        if (v.image && v.image.trim() && !list.some((item) => item.image === v.image.trim())) {
          list.push({ id: v.id, name: v.name, image: v.image.trim(), variation: v });
        }
      });
    }
    return list;
  }, [isVariable, product?.variations, product?.name, mainProductImage]);

  const handleSelectVariation = (variation) => {
    setSelectedVariation(variation);

    if (variation.image && variation.image.trim()) {
      setActiveImage(variation.image.trim());
    }

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

  const handleThumbnailClick = (item) => {
    setActiveImage(item.image);
    if (item.variation) {
      handleSelectVariation(item.variation);
    }
  };

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleWhatsAppOrder = () => {
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const variationText = selectedVariation?.name ? `\n🏷️ অপশন: ${selectedVariation.name}` : "";
    const msg = `হ্যালো! আমি এই প্রোডাক্টটি সম্পর্কে বিস্তারিত জানতে / অর্ডার করতে চাই:\n\n📦 প্রোডাক্ট: ${product?.name || "Product"}${variationText}\n🔢 পরিমাণ: ${quantity} টি\n💰 মোট মূল্য: ৳${activePrice * quantity}\n🔗 লিঙ্ক: ${currentUrl}`;

    const url = getWhatsAppUrl(msg);
    window.open(url, "_blank");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
      {/* Left Column: Interactive Main Image & Gallery */}
      <div className="space-y-4">
        {/* Main Display Image */}
        <div className="bg-white rounded-3xl overflow-hidden aspect-square relative shadow-md border border-[#0f2a44]/5 transition-all duration-300">
          {product?.badge && (
            <span className="absolute top-4 left-4 z-10 px-3.5 py-1 bg-[#d4af37] text-white rounded-full font-bold text-xs uppercase tracking-wide shadow">
              {product.badge}
            </span>
          )}

          {activeOldPrice && activeOldPrice > activePrice && (
            <span className="absolute top-4 right-4 z-10 px-3 py-1 bg-red-600 text-white rounded-full font-bold text-xs shadow">
              ৳{(activeOldPrice - activePrice) * quantity} ছাড়
            </span>
          )}

          <Image
            key={activeImage}
            src={activeImage}
            alt={product?.name || "Product Image"}
            fill
            className="object-cover transition-opacity duration-300 ease-in-out"
            priority
            unoptimized={activeImage.startsWith("http")}
          />
        </div>

        {/* Thumbnail Gallery (When multiple variation images exist) */}
        {variationImagesList.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {variationImagesList.map((item, idx) => {
              const isSelected = activeImage === item.image;
              return (
                <button
                  key={item.id || idx}
                  type="button"
                  onClick={() => handleThumbnailClick(item)}
                  className={`relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#d4af37] ring-2 ring-[#d4af37]/30 shadow-md scale-105"
                      : "border-gray-200 hover:border-[#d4af37]/60 opacity-80 hover:opacity-100"
                  }`}
                  title={item.name}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                  {item.name && (
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center truncate px-1 py-0.5 font-medium">
                      {item.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Details & Actions */}
      <div>
        {product?.badge && (
          <span className="inline-block mb-3 px-3 py-1 bg-[#d4af37] text-white rounded font-medium text-sm">
            {product.badge}
          </span>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold text-[#0f2a44]">
          {product?.name}
        </h1>

        {product?.productCode && (
          <p className="text-xs text-gray-500 mt-1 font-mono">
            কোড: <span className="font-semibold text-gray-700">{product.productCode}</span>
          </p>
        )}

        {/* Description */}
        {product?.description ? (
          <p className="mt-4 text-base text-[#0f2a44]/80 leading-relaxed whitespace-pre-line border-b border-[#0f2a44]/10 pb-4">
            {product.description}
          </p>
        ) : null}

        {/* Dynamic Price Display */}
        <div className="flex items-baseline gap-3 my-4 flex-wrap">
          <span className="text-3xl sm:text-4xl font-extrabold text-[#0f2a44]">
            ৳ {activePrice * quantity}
          </span>

          {quantity > 1 && (
            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
              (প্রতি পিস ৳{activePrice})
            </span>
          )}

          {activeOldPrice && activeOldPrice > activePrice && (
            <>
              <span className="text-gray-400 line-through text-lg">
                ৳ {activeOldPrice * quantity}
              </span>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                ৳{(activeOldPrice - activePrice) * quantity} সাশ্রয়
              </span>
            </>
          )}
        </div>

        {/* Stock Status */}
        <p
          className={`mb-5 font-semibold text-sm ${
            isInStock ? "text-green-600" : "text-red-500"
          }`}
        >
          {isInStock ? "✓ In Stock (স্টকে আছে)" : "✗ Out of Stock (স্টক শেষ)"}
        </p>

        {/* Variations / Color / Size Selector (Horizontal Side-by-Side) */}
        {isVariable && (
          <div className="mb-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#0f2a44] flex items-center gap-1.5">
                <span>অপশন সিলেক্ট করুন:</span>
                {selectedVariation?.name && (
                  <span className="text-xs font-semibold text-[#0f2a44] bg-[#d4af37]/20 px-2.5 py-0.5 rounded-full border border-[#d4af37]/40">
                    ✓ {selectedVariation.name}
                  </span>
                )}
              </label>

              {selectedVariation?.price && (
                <span className="text-xs font-bold text-[#0f2a44] bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
                  ৳{selectedVariation.price}
                </span>
              )}
            </div>

            {/* Side-by-Side Flex Wrap Pills */}
            <div className="flex flex-wrap gap-2.5 items-center">
              {product.variations.map((v) => {
                const isSelected = selectedVariation?.id === v.id;
                const autoColor = getAutoColor(v.color, v.name);

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVariation(v)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-[#d4af37] bg-white ring-2 ring-[#d4af37] text-[#0f2a44] font-bold shadow-md scale-[1.02]"
                        : "border-gray-200 bg-white/90 hover:border-[#d4af37]/60 hover:bg-white text-gray-700 hover:text-[#0f2a44] shadow-sm"
                    }`}
                  >
                    {/* Mini Thumbnail or Color Swatch */}
                    {v.image ? (
                      <div className="relative h-6 w-6 rounded-md overflow-hidden border border-gray-200 shrink-0 bg-gray-50">
                        <img
                          src={v.image}
                          alt={v.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : autoColor ? (
                      <span
                        className="h-4 w-4 rounded-full border border-gray-300 shadow-sm shrink-0 ring-1 ring-black/10"
                        style={{ backgroundColor: autoColor }}
                        title={v.name}
                      />
                    ) : null}

                    {/* Name */}
                    <span className="text-sm">{v.name}</span>

                    {/* Price Badge inside pill */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                        isSelected
                          ? "bg-amber-100 text-amber-900"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      ৳{v.price}
                    </span>

                    {/* Selected Check indicator */}
                    {isSelected && (
                      <span className="text-[#d4af37] text-xs font-black">
                        ✓
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

          <div className="flex items-center w-fit rounded-full border border-[#0f2a44]/15 bg-white px-2 py-1 shadow-sm">
            <button
              onClick={decreaseQuantity}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-[#0f2a44] transition hover:bg-[#f8f6f1]"
            >
              -
            </button>

            <span className="min-w-10 text-center text-lg font-bold text-[#0f2a44]">
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

        {/* Trust Badges */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-[#0f2a44]/10">
          <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="h-9 w-9 rounded-full bg-amber-50 text-[#d4af37] flex items-center justify-center shrink-0">
              <FaTruck size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0f2a44]">ক্যাশ অন ডেলিভারি</p>
              <p className="text-[11px] text-gray-500">পণ্য দেখে মূল্য পরিশোধ</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FaShieldAlt size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0f2a44]">১০০% জেনুইন পণ্য</p>
              <p className="text-[11px] text-gray-500">সেরা মানের নিশ্চয়তা</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FaUndo size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0f2a44]">সহজ রিটার্ন</p>
              <p className="text-[11px] text-gray-500">৭ দিনের রিটার্ন সুবিধা</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
