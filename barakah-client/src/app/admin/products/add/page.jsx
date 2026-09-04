"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import { toast } from "react-toastify";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "miigc3z4";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

export default function AddProductPage() {
  const baseUrl = "https://sashroyi-api.onrender.com";
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMode, setUploadMode] = useState("file"); // 'file' or 'url'
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
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

      const productData = {
        name: data.name,
        price: Number(data.price),
        oldPrice: data.oldPrice ? Number(data.oldPrice) : null,
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

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "প্রোডাক্ট সংরক্ষণ করা যায়নি");
      }

      toast.success("প্রোডাক্ট সফলভাবে যুক্ত হয়েছে!", {
        position: "top-right",
      });
      reset();
      setPreview(null);
      setSelectedFile(null);
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
            placeholder="Enter product name"
            {...register("name", {
              required: "Product name is required",
            })}
            className="w-full rounded-lg border border-[#e5dccf] p-3 outline-none focus:border-[#d4af37]"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
              Price (বিক্রয় মূল্য ৳) *
            </label>
            <input
              type="number"
              placeholder="Enter price"
              {...register("price", {
                required: "Price is required",
                min: {
                  value: 1,
                  message: "Price must be greater than 0",
                },
              })}
              className="w-full rounded-lg border border-[#e5dccf] p-3 outline-none focus:border-[#d4af37]"
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
              className="w-full rounded-lg border border-[#e5dccf] p-3 outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
              Category (ক্যাটাগরি) *
            </label>
            <select
              {...register("category", {
                required: "Category is required",
              })}
              className="w-full rounded-lg border border-[#e5dccf] p-3 outline-none focus:border-[#d4af37]"
            >
              <option value="">Select Category</option>
              <option value="wall-clock">Wall Clock</option>
              <option value="wall-canvas">Wall Canvas</option>
              <option value="wall-art">Wall Art</option>
              <option value="round-clock">Round Clock</option>
              <option value="others">Others</option>
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-500">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
              Subcategory (সাব-ক্যাটাগরি) *
            </label>
            <select
              {...register("subcategory", {
                required: "Subcategory is required",
              })}
              className="w-full rounded-lg border border-[#e5dccf] p-3 outline-none focus:border-[#d4af37]"
            >
              <option value="">Select Subcategory</option>
              <option value="natural">Natural</option>
              <option value="islamic">Islamic</option>
              <option value="special1">Special 1</option>
              <option value="special2">Special 2</option>
              <option value="others">Others</option>
            </select>
            {errors.subcategory && (
              <p className="mt-1 text-sm text-red-500">
                {errors.subcategory.message}
              </p>
            )}
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
            Description (পণ্যের বিবরণ) *
          </label>
          <textarea
            rows={4}
            placeholder="Enter product description..."
            {...register("description", {
              required: "Description is required",
              minLength: {
                value: 5,
                message: "Description should be at least 5 characters",
              },
            })}
            className="w-full rounded-lg border border-[#e5dccf] p-3 outline-none focus:border-[#d4af37]"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">
              {errors.description.message}
            </p>
          )}
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
