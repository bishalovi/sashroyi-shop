"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import axios from "axios";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "miigc3z4";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

export default function EditProductPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://sashroyi-api.onrender.com";
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [formData, setFormData] = useState({
    name: "",
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
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [newImageFile, setNewImageFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadMode, setUploadMode] = useState("current"); // 'current', 'file', 'url'

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${baseUrl}/api/products/${id}`, {
          next: { revalidate: 60 },
        });

        const data = await res.json();

        if (data.success) {
          const product = data.data;

          setFormData({
            name: product.name || "",
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
          });
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

      const res = await fetch(`${baseUrl}/api/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          image: finalImageUrl,
          price: Number(formData.price),
          oldPrice: Number(formData.oldPrice),
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
      <div className="rounded-2xl border border-[#e5dccf] bg-white p-6">
        <p className="text-[#3d2f1f]">Loading product...</p>
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

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
              Category (ক্যাটাগরি) *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#e5dccf] px-4 py-3 outline-none focus:border-[#d4af37]"
              required
            >
              <option value="">Select category</option>
              <option value="wall-clock">Wall Clock</option>
              <option value="wall-canvas">Wall Canvas</option>
              <option value="wall-art">Wall Art</option>
              <option value="round-clock">Round Clock</option>
              <option value="others">Others</option>
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
              className="w-full rounded-xl border border-[#e5dccf] px-4 py-3 outline-none focus:border-[#d4af37]"
            >
              <option value="">Select Subcategory</option>
              <option value="natural">Natural</option>
              <option value="islamic">Islamic</option>
              <option value="special1">Special 1</option>
              <option value="special2">Special 2</option>
              <option value="others">Others</option>
            </select>
          </div>
        </div>

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
              className="w-full rounded-xl border border-[#e5dccf] px-4 py-3 outline-none focus:border-[#d4af37]"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#3d2f1f]">
              Old Price (আগের মূল্য ৳)
            </label>
            <input
              type="number"
              name="oldPrice"
              value={formData.oldPrice}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#e5dccf] px-4 py-3 outline-none focus:border-[#d4af37]"
            />
          </div>
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