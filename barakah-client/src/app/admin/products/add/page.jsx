"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { toast } from "react-toastify";
import { FiLink } from "react-icons/fi";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "miigc3z4";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

function generateSlug(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AddProductPage() {
  const baseUrl = "https://sashroyi-api.onrender.com";
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMode, setUploadMode] = useState("file"); // 'file' or 'url'
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Product Type & Variations
  const [productType, setProductType] = useState("single"); // 'single' | 'variable'
  const [variations, setVariations] = useState([
    { id: "var_1", name: "১ পিস", price: "", oldPrice: "", inStock: true, isDefault: true },
    { id: "var_2", name: "২ পিস (স্পেশাল অফার)", price: "", oldPrice: "", inStock: true, isDefault: false },
    { id: "var_3", name: "৩ পিস (ধামাকা অফার)", price: "", oldPrice: "", inStock: true, isDefault: false },
  ]);

  // Dynamic Categories
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategoryObj, setSelectedCategoryObj] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      slug: "",
      price: "",
      oldPrice: "",
      category: "",
      subcategory: "",
      description: "",
      badge: "",
      productCode: "",
      inStock: true,
      isFreeShipping: false,
      imageUrl: "",
    },
  });

  const customImageUrl = watch("imageUrl");
  const productName = watch("name");
  const selectedCategorySlug = watch("category");

  // Quick Preset Helper
  const applyPcsPreset = () => {
    setVariations([
      { id: `var_${Date.now()}_1`, name: "১ পিস", price: watch("price") || "", oldPrice: watch("oldPrice") || "", inStock: true, isDefault: true },
      { id: `var_${Date.now()}_2`, name: "২ পিস (স্পেশাল অফার)", price: "", oldPrice: "", inStock: true, isDefault: false },
      { id: `var_${Date.now()}_3`, name: "৩ পিস (ধামাকা অফার)", price: "", oldPrice: "", inStock: true, isDefault: false },
    ]);
    toast.info("১ পিস, ২ পিস, ৩ পিস টেমপ্লেট যোগ করা হয়েছে। মূল্য বসিয়ে দিন।", { position: "top-right" });
  };

  const addCustomVariation = () => {
    const newIdx = variations.length + 1;
    setVariations((prev) => [
      ...prev,
      {
        id: `var_${Date.now()}_${newIdx}`,
        name: `${newIdx} পিস`,
        price: "",
        oldPrice: "",
        inStock: true,
        isDefault: prev.length === 0,
      },
    ]);
  };

  const removeVariation = (index) => {
    if (variations.length <= 1) {
      toast.warning("কমপক্ষে একটি ভেরিয়েশন থাকতে হবে", { position: "top-right" });
      return;
    }
    const filtered = variations.filter((_, idx) => idx !== index);
    if (!filtered.some((v) => v.isDefault) && filtered.length > 0) {
      filtered[0].isDefault = true;
    }
    setVariations(filtered);
  };

  const updateVariationField = (index, field, value) => {
    setVariations((prev) => {
      const copy = [...prev];
      if (field === "isDefault") {
        return copy.map((item, idx) => ({
          ...item,
          isDefault: idx === index,
        }));
      }
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  useEffect(() => {
    fetch(`${baseUrl}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCategoriesList(data.data);
        }
      })
      .catch((err) => console.error("Failed to load categories:", err));
  }, [baseUrl]);

  // When category changes, update selectedCategoryObj for subcategories
  useEffect(() => {
    if (selectedCategorySlug && categoriesList.length > 0) {
      const found = categoriesList.find((c) => c.slug === selectedCategorySlug);
      setSelectedCategoryObj(found || null);
    } else {
      setSelectedCategoryObj(null);
    }
  }, [selectedCategorySlug, categoriesList]);

  // Auto-generate slug when name changes (unless user typed a custom slug)
  const handleNameChange = (e) => {
    const val = e.target.value;
    setValue("name", val);
    setValue("slug", generateSlug(val));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    try {
      setUploading(true);

      // Validation for Variable products
      if (productType === "variable") {
        if (!variations || variations.length === 0) {
          toast.error("ভেরিয়েশন প্রোডাক্টের জন্য অন্তত একটি ভেরিয়েশন অপশন প্রয়োজন", { position: "top-right" });
          setUploading(false);
          return;
        }

        for (let i = 0; i < variations.length; i++) {
          const v = variations[i];
          if (!v.name || !v.name.trim()) {
            toast.error(`ভেরিয়েশন #${i + 1} এর নাম দিন`, { position: "top-right" });
            setUploading(false);
            return;
          }
          if (!v.price || Number(v.price) <= 0) {
            toast.error(`ভেরিয়েশন "${v.name}" এর বিক্রয় মূল্য দিন`, { position: "top-right" });
            setUploading(false);
            return;
          }
        }
      } else {
        if (!data.price || Number(data.price) <= 0) {
          toast.error("অনুগ্রহ করে প্রোডাক্টের সঠিক বিক্রয় মূল্য দিন", { position: "top-right" });
          setUploading(false);
          return;
        }
      }

      let finalImageUrl = "";

      if (uploadMode === "file") {
        if (!selectedFile) {
          toast.error("অনুগ্রহ করে প্রোডাক্টের ছবি সিলেক্ট করুন", { position: "top-right" });
          setUploading(false);
          return;
        }

        setUploadStatus("ক্লাউডিনারিতে ছবি আপলোড হচ্ছে...");
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );

        if (!cloudinaryRes.data || !cloudinaryRes.data.secure_url) {
          throw new Error("ছবি আপলোড ব্যর্থ হয়েছে। ক্লাউডিনারি রেসপন্স পাওয়া যায়নি।");
        }

        finalImageUrl = cloudinaryRes.data.secure_url;
      } else {
        if (!data.imageUrl || !data.imageUrl.trim()) {
          toast.error("অনুগ্রহ করে একটি ভ্যালিড ইমেজ URL দিন", { position: "top-right" });
          setUploading(false);
          return;
        }
        finalImageUrl = data.imageUrl.trim();
      }

      setUploadStatus("প্রোডাক্ট সেভ করা হচ্ছে...");

      const defaultVariation = productType === "variable"
        ? variations.find((v) => v.isDefault) || variations[0]
        : null;

      const productData = {
        name: data.name.trim(),
        slug: (data.slug || generateSlug(data.name)).trim(),
        productType: productType,
        price: productType === "variable" && defaultVariation ? Number(defaultVariation.price) : Number(data.price),
        oldPrice: productType === "variable" && defaultVariation ? (defaultVariation.oldPrice ? Number(defaultVariation.oldPrice) : null) : (data.oldPrice ? Number(data.oldPrice) : null),
        variations: productType === "variable" ? variations : [],
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        badge: data.badge,
        productCode: data.productCode,
        inStock: Boolean(data.inStock),
        isFreeShipping: Boolean(data.isFreeShipping),
        image: finalImageUrl,
      };

      const res = await fetch(`${baseUrl}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const text = await res.text();
      let result = {};
      try {
        result = JSON.parse(text);
      } catch (err) {
        console.error("Non-JSON response received:", text);
        throw new Error(res.ok ? "Unexpected response format" : `Server returned error (${res.status})`);
      }

      if (!res.ok || !result.success) {
        throw new Error(result.message || "প্রোডাক্ট সংরক্ষণ করা যায়নি");
      }

      toast.success("প্রোডাক্ট সফলভাবে যুক্ত হয়েছে!", {
        position: "top-right",
      });
      reset();
      setPreview(null);
      setSelectedFile(null);
      setProductType("single");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "প্রোডাক্ট যুক্ত করতে সমস্যা হয়েছে", {
        position: "top-right",
      });
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="max-w-3xl rounded-xl mx-auto bg-white p-6 shadow-sm border border-[#e5dccf]/60">
      <h2 className="mb-6 text-2xl font-bold text-[#3d2f1f]">Add New Product</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
            Product Name (প্রোডাক্টের নাম) *
          </label>
          <input
            type="text"
            placeholder="Enter product name (e.g. Ayatul Kursi Wooden Clock)"
            {...register("name", {
              required: "Product name is required",
            })}
            onChange={handleNameChange}
            className="w-full rounded-lg border border-[#e5dccf] p-3 outline-none focus:border-[#d4af37]"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Product Slug Field (Auto-generated & Editable) */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#3d2f1f] flex items-center gap-1.5">
            <FiLink size={15} className="text-[#d4af37]" /> Product URL Slug (স্লাগ) *
          </label>
          <div className="flex rounded-lg border border-[#e5dccf] bg-gray-50 focus-within:border-[#d4af37] focus-within:bg-white transition">
            <span className="flex items-center px-3 text-xs text-gray-500 font-mono border-r bg-gray-100">
              /products/
            </span>
            <input
              type="text"
              placeholder="product-url-slug"
              {...register("slug", {
                required: "Slug is required",
              })}
              className="w-full p-3 font-mono text-sm bg-transparent outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            নাম লিখলে স্বয়ংক্রিয়ভাবে তৈরি হবে, প্রয়োজনে এডিট করতে পারবেন।
          </p>
        </div>

        {/* PRODUCT TYPE SELECTOR */}
        <div className="rounded-xl border-2 border-[#d4af37]/40 bg-[#faf7f0]/60 p-4">
          <label className="mb-2 block text-sm font-bold text-[#3d2f1f]">
            📦 Product Pricing Type (প্রোডাক্টের ধরণ)
          </label>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setProductType("single")}
              className={`py-2.5 px-4 rounded-lg font-medium text-sm border text-center transition ${
                productType === "single"
                  ? "bg-[#0f2a44] text-white border-[#0f2a44] shadow"
                  : "bg-white text-gray-700 border-gray-300 hover:border-[#d4af37]"
              }`}
            >
              🏷️ Single Product (একক মূল্য)
            </button>
            <button
              type="button"
              onClick={() => {
                setProductType("variable");
                if (variations.length === 0) applyPcsPreset();
              }}
              className={`py-2.5 px-4 rounded-lg font-medium text-sm border text-center transition ${
                productType === "variable"
                  ? "bg-[#0f2a44] text-white border-[#0f2a44] shadow"
                  : "bg-white text-gray-700 border-gray-300 hover:border-[#d4af37]"
              }`}
            >
              ✨ Multi-Pack / Variation (১ পিস, ২ পিস, ৩ পিস)
            </button>
          </div>

          {/* SINGLE PRODUCT PRICING */}
          {productType === "single" ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
                  Price (বিক্রয় মূল্য ৳) *
                </label>
                <input
                  type="number"
                  placeholder="Enter price"
                  {...register("price", {
                    required: productType === "single" ? "Price is required" : false,
                    min: {
                      value: 1,
                      message: "Price must be greater than 0",
                    },
                  })}
                  className="w-full rounded-lg border border-[#e5dccf] bg-white p-3 outline-none focus:border-[#d4af37]"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.price.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
                  Old Price (আগের মূল্য ৳ - Optional)
                </label>
                <input
                  type="number"
                  placeholder="Enter old price"
                  {...register("oldPrice")}
                  className="w-full rounded-lg border border-[#e5dccf] bg-white p-3 outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          ) : (
            /* VARIATION / MULTI-PACK BUILDER */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#e5dccf]">
                <p className="text-xs text-gray-600">
                  গ্রাহক যে ভেরিয়েশন সিলেক্ট করবে, <strong>তাত্ক্ষণিকভাবে ডিসপ্লে প্রাইস ও মেটা পিক্সেল ট্র্যাকিং</strong> আপডেট হবে।
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyPcsPreset}
                    className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-900 px-2.5 py-1 rounded font-medium hover:bg-amber-200 transition"
                  >
                    ⚡ ১/২/৩ পিস টেমপ্লেট
                  </button>
                  <button
                    type="button"
                    onClick={addCustomVariation}
                    className="inline-flex items-center gap-1 text-xs bg-[#0f2a44] text-white px-3 py-1 rounded font-medium hover:bg-opacity-90 transition"
                  >
                    + নতুন অপশন যোগ
                  </button>
                </div>
              </div>

              {/* Variations List */}
              <div className="space-y-3">
                {variations.map((v, index) => (
                  <div
                    key={v.id || index}
                    className={`p-3 rounded-lg border bg-white transition flex flex-col md:flex-row gap-3 items-start md:items-center ${
                      v.isDefault ? "border-[#d4af37] ring-1 ring-[#d4af37]/30 bg-amber-50/20" : "border-gray-200"
                    }`}
                  >
                    {/* Default Radio */}
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="radio"
                        id={`default_var_${index}`}
                        name="default_variation"
                        checked={v.isDefault}
                        onChange={() => updateVariationField(index, "isDefault", true)}
                        className="h-4 w-4 accent-[#d4af37] cursor-pointer"
                      />
                      <label
                        htmlFor={`default_var_${index}`}
                        className={`text-xs font-semibold cursor-pointer ${
                          v.isDefault ? "text-[#d4af37]" : "text-gray-500"
                        }`}
                      >
                        {v.isDefault ? "ডিফল্ট" : "সিলেক্ট"}
                      </label>
                    </div>

                    {/* Title / Name */}
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                        প্যাকের নাম (যেমন: ১ পিস, ২ পিস ইত্যাদি)
                      </label>
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => updateVariationField(index, "name", e.target.value)}
                        placeholder="e.g. ১ পিস / ২ পিস (অফার)"
                        className="w-full text-sm font-medium border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    {/* Selling Price */}
                    <div className="w-full md:w-28">
                      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                        বিক্রয় মূল্য (৳) *
                      </label>
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => updateVariationField(index, "price", e.target.value)}
                        placeholder="৳ 500"
                        className="w-full text-sm font-semibold text-[#0f2a44] border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    {/* Old Price */}
                    <div className="w-full md:w-28">
                      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">
                        পূর্বের মূল্য (৳)
                      </label>
                      <input
                        type="number"
                        value={v.oldPrice || ""}
                        onChange={(e) => updateVariationField(index, "oldPrice", e.target.value)}
                        placeholder="৳ 650"
                        className="w-full text-sm text-gray-500 border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    {/* In Stock toggle & Remove */}
                    <div className="flex items-center gap-3 self-end md:self-center shrink-0 pt-1 md:pt-4">
                      <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={v.inStock !== false}
                          onChange={(e) => updateVariationField(index, "inStock", e.target.checked)}
                          className="h-3.5 w-3.5 accent-[#d4af37]"
                        />
                        <span>স্টক</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => removeVariation(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                        title="Delete Variation"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Category & Subcategory Selection */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
              Category (ক্যাটাগরি) *
            </label>
            <select
              {...register("category", {
                required: "Category is required",
              })}
              className="w-full rounded-lg border border-[#e5dccf] p-3 outline-none focus:border-[#d4af37] bg-white"
            >
              <option value="">Select Category</option>
              {categoriesList.map((cat) => (
                <option key={cat._id || cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-500">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
              Subcategory (সাব-ক্যাটাগরি - Optional)
            </label>
            <select
              {...register("subcategory")}
              className="w-full rounded-lg border border-[#e5dccf] p-3 outline-none focus:border-[#d4af37] bg-white"
            >
              <option value="">Select Subcategory (None)</option>
              {selectedCategoryObj?.subcategories && selectedCategoryObj.subcategories.length > 0 ? (
                selectedCategoryObj.subcategories.map((sub, idx) => (
                  <option key={idx} value={sub.slug}>
                    {sub.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="natural">Natural</option>
                  <option value="islamic">Islamic</option>
                  <option value="others">Others</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
              Discount Badge (যেমন: 20% Off বা Hot)
            </label>
            <input
              type="text"
              placeholder="Example: 20% Off"
              {...register("badge")}
              className="w-full rounded-lg border border-[#e5dccf] p-3 outline-none focus:border-[#d4af37]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
              Product Code (প্রোডাক্ট কোড - Optional)
            </label>
            <input
              type="text"
              placeholder="Example: CWC-121"
              {...register("productCode")}
              className="w-full rounded-lg border border-[#e5dccf] p-3 outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
            Description (পণ্যের বিবরণ - Optional)
          </label>
          <textarea
            rows={4}
            placeholder="Enter product description (Optional)..."
            {...register("description")}
            className="w-full rounded-lg border border-[#e5dccf] p-3 outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* IMAGE UPLOAD SECTION */}
        <div className="rounded-xl border border-[#e5dccf] p-4 bg-[#faf7f0]/40">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-[#3d2f1f]">
              Product Image (প্রোডাক্ট ইমেজ) *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  uploadMode === "file"
                    ? "bg-[#d4af37] text-white"
                    : "bg-white border text-gray-700"
                }`}
              >
                📁 Upload File (Cloudinary)
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("url")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  uploadMode === "url"
                    ? "bg-[#d4af37] text-white"
                    : "bg-white border text-gray-700"
                }`}
              >
                🔗 Image URL (লিঙ্ক)
              </button>
            </div>
          </div>

          {uploadMode === "file" ? (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full rounded-lg border border-[#e5dccf] bg-white p-2.5 outline-none file:mr-4 file:rounded-md file:border-0 file:bg-[#d4af37] file:px-4 file:py-1.5 file:text-white file:cursor-pointer cursor-pointer"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                JPG, PNG, WEBP ফরম্যাটে ছবি সিলেক্ট করুন (স্বয়ংক্রিয়ভাবে ক্লাউডিনারিতে আপলোড হবে)।
              </p>
            </div>
          ) : (
            <div>
              <input
                type="url"
                placeholder="https://res.cloudinary.com/.../image.jpg"
                {...register("imageUrl")}
                className="w-full rounded-lg border border-[#e5dccf] bg-white p-3 outline-none focus:border-[#d4af37]"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                ইমেজের সরাসরি অনলাইন লিঙ্ক (URL) পেস্ট করুন।
              </p>
            </div>
          )}

          {/* Live Preview */}
          {(preview || (uploadMode === "url" && customImageUrl)) && (
            <div className="mt-4 flex items-center gap-4 p-2 bg-white rounded-lg border">
              <div className="relative h-28 w-28 rounded-lg overflow-hidden border bg-gray-50">
                <Image
                  src={preview || customImageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">✓ Image Ready</p>
                <p className="text-xs text-gray-500 mt-1">
                  {uploadMode === "file" ? selectedFile?.name : "Online Image Link"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-[#e5dccf] p-4">
            <input
              id="inStock"
              type="checkbox"
              {...register("inStock")}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <label
              htmlFor="inStock"
              className="text-sm font-medium text-[#3d2f1f]"
            >
              In Stock (স্টকে আছে)
            </label>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-[#e5dccf] p-4 bg-emerald-50/40">
            <input
              id="isFreeShipping"
              type="checkbox"
              {...register("isFreeShipping")}
              className="h-4 w-4 accent-emerald-600"
            />
            <label
              htmlFor="isFreeShipping"
              className="text-sm font-medium text-emerald-900 cursor-pointer"
            >
              Free Shipping (এই প্রোডাক্টে ফ্রি ডেলিভারি)
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full rounded-lg bg-[#d4af37] px-6 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60 shadow-md flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              <span>{uploadStatus || "Uploading..."}</span>
            </>
          ) : (
            "Add Product (প্রোডাক্ট যুক্ত করুন)"
          )}
        </button>
      </form>
    </div>
  );
}
