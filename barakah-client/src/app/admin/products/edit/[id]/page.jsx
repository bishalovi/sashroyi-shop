"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import axios from "axios";
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

export default function EditProductPage() {
  const baseUrl = "https://sashroyi-api.onrender.com";
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    subcategory: "",
    price: "",
    oldPrice: "",
    image: "",
    badge: "",
    productCode: "",
    inStock: true,
    isFreeShipping: false,
    productType: "single",
  });

  const [variations, setVariations] = useState([]);

  // Dynamic Categories
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategoryObj, setSelectedCategoryObj] = useState(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [newImageFile, setNewImageFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadMode, setUploadMode] = useState("current"); // 'current', 'file', 'url'

  // Quick Preset Helper
  const applyPcsPreset = () => {
    setVariations([
      { id: `var_${Date.now()}_1`, name: "১ পিস", price: formData.price || "", oldPrice: formData.oldPrice || "", inStock: true, isDefault: true },
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

  // Fetch categories
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

  // Update selectedCategoryObj when category changes
  useEffect(() => {
    if (formData.category && categoriesList.length > 0) {
      const found = categoriesList.find((c) => c.slug === formData.category);
      setSelectedCategoryObj(found || null);
    } else {
      setSelectedCategoryObj(null);
    }
  }, [formData.category, categoriesList]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${baseUrl}/api/products/${id}`, {
          next: { revalidate: 0 },
        });

        const data = await res.json();

        if (data.success) {
          const product = data.data;

          setFormData({
            name: product.name || "",
            slug: product.slug || generateSlug(product.name || ""),
            description: product.description || "",
            category: product.category || "",
            subcategory: product.subcategory || "",
            price: product.price || "",
            oldPrice: product.oldPrice || "",
            image: product.image || "",
            badge: product.badge || "",
            productCode: product.productCode || "",
            inStock: product.inStock ?? true,
            isFreeShipping: product.isFreeShipping ?? false,
            productType: product.productType || (product.variations && product.variations.length > 0 ? "variable" : "single"),
          });

          if (product.variations && product.variations.length > 0) {
            setVariations(product.variations);
          } else {
            setVariations([
              { id: "var_1", name: "১ পিস", price: product.price || "", oldPrice: product.oldPrice || "", inStock: true, isDefault: true },
              { id: "var_2", name: "২ পিস (স্পেশাল অফার)", price: "", oldPrice: "", inStock: true, isDefault: false },
              { id: "var_3", name: "৩ পিস (ধামাকা অফার)", price: "", oldPrice: "", inStock: true, isDefault: false },
            ]);
          }
        } else {
          toast.error(data.message || "Product not found", {
            position: "top-right",
          });
          router.push("/admin/products");
        }
      } catch (error) {
        toast.error(error.message || "Something went wrong", {
          position: "top-right",
        });
        router.push("/admin/products");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [baseUrl, id, router]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: e.target.checked,
      }));
      return;
    }

    if (name === "name") {
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: prev.slug ? prev.slug : generateSlug(value),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      setFilePreview(URL.createObjectURL(file));
      setUploadMode("file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setUpdating(true);

      // Validation for Variable products
      if (formData.productType === "variable") {
        if (!variations || variations.length === 0) {
          toast.error("ভেরিয়েশন প্রোডাক্টের জন্য অন্তত একটি ভেরিয়েশন অপশন প্রয়োজন", { position: "top-right" });
          setUpdating(false);
          return;
        }

        for (let i = 0; i < variations.length; i++) {
          const v = variations[i];
          if (!v.name || !v.name.trim()) {
            toast.error(`ভেরিয়েশন #${i + 1} এর নাম দিন`, { position: "top-right" });
            setUpdating(false);
            return;
          }
          if (!v.price || Number(v.price) <= 0) {
            toast.error(`ভেরিয়েশন "${v.name}" এর বিক্রয় মূল্য দিন`, { position: "top-right" });
            setUpdating(false);
            return;
          }
        }
      } else {
        if (!formData.price || Number(formData.price) <= 0) {
          toast.error("অনুগ্রহ করে প্রোডাক্টের সঠিক বিক্রয় মূল্য দিন", { position: "top-right" });
          setUpdating(false);
          return;
        }
      }

      let finalImageUrl = formData.image;

      if (uploadMode === "file" && newImageFile) {
        setUpdateStatus("ক্লাউডিনারিতে নতুন ছবি আপলোড হচ্ছে...");
        const uploadData = new FormData();
        uploadData.append("file", newImageFile);
        uploadData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          uploadData
        );

        if (!cloudinaryRes.data || !cloudinaryRes.data.secure_url) {
          throw new Error("ছবি আপলোড ব্যর্থ হয়েছে। ক্লাউডিনারি রেসপন্স পাওয়া যায়নি।");
        }

        finalImageUrl = cloudinaryRes.data.secure_url;
      }

      setUpdateStatus("প্রোডাক্ট আপডেট করা হচ্ছে...");

      const defaultVariation = formData.productType === "variable"
        ? variations.find((v) => v.isDefault) || variations[0]
        : null;

      const res = await fetch(`${baseUrl}/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          slug: (formData.slug || generateSlug(formData.name)).trim(),
          image: finalImageUrl,
          productType: formData.productType,
          price: formData.productType === "variable" && defaultVariation ? Number(defaultVariation.price) : Number(formData.price),
          oldPrice: formData.productType === "variable" && defaultVariation ? (defaultVariation.oldPrice ? Number(defaultVariation.oldPrice) : null) : (formData.oldPrice ? Number(formData.oldPrice) : null),
          variations: formData.productType === "variable" ? variations : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update product");
      }

      toast.success("Product updated successfully!", {
        position: "top-right",
      });
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Something went wrong", {
        position: "top-right",
      });
    } finally {
      setUpdating(false);
      setUpdateStatus("");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#e5dccf] bg-white p-6 max-w-3xl mx-auto flex items-center justify-center h-64">
        <p className="text-[#3d2f1f] flex items-center gap-2">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent"></span>
          Loading product...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl rounded-2xl border border-[#e5dccf] bg-white p-6 shadow-sm mx-auto">
      <h1 className="mb-6 text-2xl font-bold text-[#3d2f1f]">Edit Product</h1>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
            Product Name (প্রোডাক্টের নাম) *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-xl border border-[#e5dccf] px-4 py-3 outline-none focus:border-[#d4af37]"
            required
          />
        </div>

        {/* Product URL Slug */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#3d2f1f] flex items-center gap-1.5">
            <FiLink size={15} className="text-[#d4af37]" /> Product URL Slug (স্লাগ) *
          </label>
          <div className="flex rounded-xl border border-[#e5dccf] bg-gray-50 focus-within:border-[#d4af37] focus-within:bg-white transition overflow-hidden">
            <span className="flex items-center px-3 text-xs text-gray-500 font-mono border-r bg-gray-100">
              /products/
            </span>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="product-url-slug"
              className="w-full p-3 font-mono text-sm bg-transparent outline-none"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            এসইও ও সুন্দর লিঙ্কের জন্য ইংরেজি স্লাগ ব্যবহার করুন।
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
            Description (পণ্যের বিবরণ)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="পণ্যের বিবরণ লিখুন..."
            className="w-full rounded-xl border border-[#e5dccf] px-4 py-3 outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Category & Subcategory Dynamic */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
              Category (ক্যাটাগরি) *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#e5dccf] px-4 py-3 outline-none focus:border-[#d4af37] bg-white"
              required
            >
              <option value="">Select category</option>
              {categoriesList.length > 0 ? (
                categoriesList.map((cat) => (
                  <option key={cat._id || cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="wall-clock">Wall Clock</option>
                  <option value="wall-canvas">Wall Canvas</option>
                  <option value="wall-art">Wall Art</option>
                  <option value="round-clock">Round Clock</option>
                  <option value="others">Others</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
              Subcategory (সাব-ক্যাটাগরি)
            </label>
            <select
              name="subcategory"
              value={formData.subcategory}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#e5dccf] px-4 py-3 outline-none focus:border-[#d4af37] bg-white"
            >
              <option value="">Select Subcategory</option>
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
                  <option value="special1">Special 1</option>
                  <option value="special2">Special 2</option>
                  <option value="others">Others</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* PRODUCT PRICING TYPE SELECTOR */}
        <div className="rounded-xl border-2 border-[#d4af37]/40 bg-[#faf7f0]/60 p-4">
          <label className="mb-2 block text-sm font-bold text-[#3d2f1f]">
            📦 Product Pricing Type (প্রোডাক্টের ধরণ)
          </label>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, productType: "single" }))}
              className={`py-2.5 px-4 rounded-lg font-medium text-sm border text-center transition ${
                formData.productType === "single"
                  ? "bg-[#0f2a44] text-white border-[#0f2a44] shadow"
                  : "bg-white text-gray-700 border-gray-300 hover:border-[#d4af37]"
              }`}
            >
              🏷️ Single Product (একক মূল্য)
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, productType: "variable" }));
                if (variations.length === 0) applyPcsPreset();
              }}
              className={`py-2.5 px-4 rounded-lg font-medium text-sm border text-center transition ${
                formData.productType === "variable"
                  ? "bg-[#0f2a44] text-white border-[#0f2a44] shadow"
                  : "bg-white text-gray-700 border-gray-300 hover:border-[#d4af37]"
              }`}
            >
              ✨ Multi-Pack / Variation (১ পিস, ২ পিস, ৩ পিস)
            </button>
          </div>

          {/* SINGLE PRODUCT PRICING */}
          {formData.productType === "single" ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
                  Price (বিক্রয় মূল্য ৳) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  className="w-full rounded-xl border border-[#e5dccf] bg-white px-4 py-3 outline-none focus:border-[#d4af37]"
                  required={formData.productType === "single"}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
                  Old Price (আগের মূল্য ৳ - Optional)
                </label>
                <input
                  type="number"
                  name="oldPrice"
                  value={formData.oldPrice || ""}
                  onChange={handleChange}
                  placeholder="Enter old price"
                  className="w-full rounded-xl border border-[#e5dccf] bg-white px-4 py-3 outline-none focus:border-[#d4af37]"
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
                        id={`default_edit_var_${index}`}
                        name="default_edit_variation"
                        checked={v.isDefault}
                        onChange={() => updateVariationField(index, "isDefault", true)}
                        className="h-4 w-4 accent-[#d4af37] cursor-pointer"
                      />
                      <label
                        htmlFor={`default_edit_var_${index}`}
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

        {/* IMAGE SECTION */}
        <div className="rounded-xl border border-[#e5dccf] p-4 bg-[#faf7f0]/40">
          <label className="mb-2 block text-sm font-semibold text-[#3d2f1f]">
            Product Image (ছবি পরিবর্তন বা নতুন ছবি আপলোড)
          </label>

          <div className="flex flex-col sm:flex-row gap-4 items-start mb-3">
            {/* Image Preview */}
            <div className="relative h-28 w-28 rounded-lg overflow-hidden border bg-white flex-shrink-0">
              {(filePreview || formData.image) ? (
                <Image
                  src={filePreview || formData.image}
                  alt="Product Image"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                  No Image
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  📁 নতুন ছবি সিলেক্ট করুন (Cloudinary):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full rounded-lg border border-[#e5dccf] bg-white p-2 text-xs outline-none file:mr-3 file:rounded file:border-0 file:bg-[#d4af37] file:px-3 file:py-1 file:text-xs file:text-white cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  🔗 অথবা ইমেজ লিঙ্ক (URL):
                </label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={(e) => {
                    handleChange(e);
                    setUploadMode("url");
                    setFilePreview(null);
                  }}
                  className="w-full rounded-lg border border-[#e5dccf] bg-white px-3 py-2 text-xs outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
              Discount Badge (যেমন: 20% Off বা Sale)
            </label>
            <input
              type="text"
              name="badge"
              value={formData.badge}
              onChange={handleChange}
              placeholder="25% Off"
              className="w-full rounded-xl border border-[#e5dccf] px-4 py-3 outline-none focus:border-[#d4af37]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
              Product Code (প্রোডাক্ট কোড)
            </label>
            <input
              type="text"
              name="productCode"
              value={formData.productCode}
              onChange={handleChange}
              placeholder="CWC-121"
              className="w-full rounded-xl border border-[#e5dccf] px-4 py-3 outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 text-[#3d2f1f] border p-3.5 rounded-xl">
            <input
              type="checkbox"
              name="inStock"
              checked={formData.inStock}
              onChange={handleChange}
              className="h-4 w-4 accent-[#d4af37]"
            />
            <span className="text-sm font-medium">In Stock (স্টকে আছে)</span>
          </label>

          <label className="flex items-center gap-3 text-emerald-900 border p-3.5 rounded-xl bg-emerald-50/40">
            <input
              type="checkbox"
              name="isFreeShipping"
              checked={formData.isFreeShipping}
              onChange={handleChange}
              className="h-4 w-4 accent-emerald-600"
            />
            <span className="text-sm font-medium">Free Shipping (ফ্রি ডেলিভারি)</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={updating}
            className="flex-1 rounded-xl bg-[#d4af37] px-6 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60 shadow-md flex items-center justify-center gap-2"
          >
            {updating ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                <span>{updateStatus || "Updating..."}</span>
              </>
            ) : (
              "Update Product (আপডেট করুন)"
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="rounded-xl border border-[#e5dccf] px-6 py-3 font-medium text-[#3d2f1f] hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}