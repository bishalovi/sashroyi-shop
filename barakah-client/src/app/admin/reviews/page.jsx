"use client";

import { useEffect, useState } from "react";
import AdminRoute from "@/components/auth/AdminRoute";
import Image from "next/image";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FiStar,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiX,
  FiImage,
  FiUser,
  FiCheck,
} from "react-icons/fi";
import { formatImageUrl } from "@/contexts/SettingsContext";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "miigc3z4";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

export default function AdminReviewsPage() {
  const baseUrl = "https://topskbazar-api.onrender.com";
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New Review Form State
  const [newReview, setNewReview] = useState({
    name: "???????? ??????",
    image: "",
    rating: 5,
    comment: "??? ?????? ?????????! ?????? ???????? ???????",
  });
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [uploadMode, setUploadMode] = useState("url"); // 'file' or 'url'

  // Edit Review State
  const [editingReview, setEditingReview] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editUploadMode, setEditUploadMode] = useState("url");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/reviews`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReviews(data.data);
      }
    } catch (err) {
      toast.error("????? ??? ???? ?????? ?????: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      let finalImageUrl = newReview.image.trim();

      if (uploadMode === "file") {
        if (!newImageFile) {
          toast.error("??????? ??? ???????? ??? ??????? ????");
          setSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", newImageFile);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );

        if (!cloudinaryRes.data?.secure_url) {
          throw new Error("????????????? ??? ????? ?????? ?????");
        }

        finalImageUrl = cloudinaryRes.data.secure_url;
      } else {
        if (!finalImageUrl) {
          toast.error("??????? ??? ???????? ???? ???? ?? ???? ???");
          setSubmitting(false);
          return;
        }
        finalImageUrl = formatImageUrl(finalImageUrl);
      }

      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newReview.name.trim(),
          image: finalImageUrl,
          rating: Number(newReview.rating) || 5,
          comment: newReview.comment.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("???? ????? ??????? ??? ??? ?????!");
        setNewReview({
          name: "???????? ??????",
          image: "",
          rating: 5,
          comment: "",
        });
        setNewImageFile(null);
        setNewImagePreview(null);
        fetchReviews();
      } else {
        toast.error(data.message || "????? ??? ???? ?????? ?????");
      }
    } catch (err) {
      toast.error(err.message || "??????? ??????");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!editingReview) return;

    try {
      setSubmitting(true);
      let finalImageUrl = editingReview.image.trim();

      if (editUploadMode === "file" && editImageFile) {
        const formData = new FormData();
        formData.append("file", editImageFile);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );

        if (!cloudinaryRes.data?.secure_url) {
          throw new Error("????????????? ??? ????? ?????? ?????");
        }

        finalImageUrl = cloudinaryRes.data.secure_url;
      } else {
        finalImageUrl = formatImageUrl(finalImageUrl);
      }

      const res = await fetch(`${baseUrl}/api/reviews/${editingReview._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingReview.name.trim(),
          image: finalImageUrl,
          rating: Number(editingReview.rating) || 5,
          comment: editingReview.comment?.trim() || "",
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("????? ??????? ????? ??? ?????!");
        setEditingReview(null);
        setEditImageFile(null);
        setEditImagePreview(null);
        fetchReviews();
      } else {
        toast.error(data.message || "????? ????? ???? ?????? ?????");
      }
    } catch (err) {
      toast.error(err.message || "??????? ??????");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (id, name) => {
    if (!window.confirm(`???? ?? ??????????? "${name}" ?? ??????? ???? ????? ????`)) {
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/api/reviews/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("????? ??????? ???? ???? ?????!");
        setReviews(reviews.filter((r) => r._id !== id));
      } else {
        toast.error(data.message || "????? ????? ?????? ?????");
      }
    } catch (err) {
      toast.error("??????? ??????: " + err.message);
    }
  };

  return (
    <AdminRoute>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#0f2a44] sm:text-3xl flex items-center gap-3">
              <FiStar className="text-[#d4af37]" /> Customer Reviews Management (?????? ?????)
            </h1>
            <p className="text-sm text-gray-500">
              ??????? ????????? ????????? ?????????? ?????, ????????? ? ????? ????????? ?????
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
          {/* Left Column: Add New Review Form */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-[#0f2a44] flex items-center gap-2 border-b pb-3">
              <FiPlus className="text-[#d4af37]" /> ???? ????? ??? ????
            </h2>

            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  ???????? ??? (Customer Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="????: ?????? ?????"
                  className="input input-bordered w-full text-sm"
                  value={newReview.name}
                  onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  ????? (Star Rating)
                </label>
                <select
                  className="select select-bordered w-full bg-white text-sm"
                  value={newReview.rating}
                  onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                >
                  <option value={5}>????? (? ?????)</option>
                  <option value={4}>???? (? ?????)</option>
                  <option value={3}>??? (? ?????)</option>
                </select>
              </div>

              {/* Image Input Section */}
              <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">
                    ????? ??? / ????????? *
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setUploadMode("url")}
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
                        uploadMode === "url" ? "bg-[#0f2a44] text-white" : "bg-white border text-gray-600"
                      }`}
                    >
                      ?? Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode("file")}
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
                        uploadMode === "file" ? "bg-[#0f2a44] text-white" : "bg-white border text-gray-600"
                      }`}
                    >
                      ?? Upload
                    </button>
                  </div>
                </div>

                {uploadMode === "url" ? (
                  <input
                    type="text"
                    required={uploadMode === "url"}
                    placeholder="https://... (???? ?? ?????? ????)"
                    className="input input-bordered input-sm w-full text-xs font-mono"
                    value={newReview.image}
                    onChange={(e) => setNewReview({ ...newReview, image: e.target.value })}
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNewImageFile(file);
                        setNewImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#0f2a44] file:text-white cursor-pointer"
                  />
                )}

                {/* Preview */}
                {(newImagePreview || (newReview.image && uploadMode === "url")) && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-white mt-2">
                    <Image
                      src={newImagePreview || formatImageUrl(newReview.image)}
                      alt="Review Preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  ??????? / ???????? (??????)
                </label>
                <textarea
                  rows={2}
                  placeholder="???????? ???????..."
                  className="textarea textarea-bordered w-full text-sm"
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn bg-[#0f2a44] text-white w-full hover:bg-[#d4af37] hover:text-[#0f2a44] transition-all"
              >
                <FiPlus /> {submitting ? "????? ?????..." : "????? ????? ????"}
              </button>
            </form>
          </div>

          {/* Right Column: Existing Reviews Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0f2a44]">
                ??? ????????? ({reviews.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl bg-white border">
                <span className="loading loading-spinner loading-lg text-[#0f2a44]"></span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center border">
                <FiStar className="mx-auto text-4xl text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium">???? ????? ????? ??? ????</p>
                <p className="text-xs text-gray-400 mt-1">??? ????? ???? ???? ???? ?????? ????? ??? ????</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:border-gray-200 transition space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image */}
                      <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-3">
                        <Image
                          src={review.image || "/placeholder.png"}
                          alt={review.name || "Customer Review"}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>

                      {/* Info */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#0f2a44] truncate">
                          {review.name || "???????? ??????"}
                        </h3>
                        <div className="flex text-amber-400 text-xs">
                          {Array.from({ length: review.rating || 5 }).map((_, i) => (
                            <span key={i}>?</span>
                          ))}
                        </div>
                      </div>

                      {review.comment && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2 italic">
                          "{review.comment}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                      <span className="text-gray-400">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString("bn-BD") : "N/A"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingReview(review);
                            setEditUploadMode("url");
                            setEditImageFile(null);
                            setEditImagePreview(null);
                          }}
                          className="btn btn-xs btn-ghost text-blue-600 hover:bg-blue-50"
                          title="????????"
                        >
                          <FiEdit2 size={14} /> ????
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review._id, review.name)}
                          className="btn btn-xs btn-ghost text-red-600 hover:bg-red-50"
                          title="???? ?????"
                        >
                          <FiTrash2 size={14} /> ?????
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Review Modal */}
        {editingReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-[#0f2a44]">????? ???????? ????</h3>
                <button
                  onClick={() => setEditingReview(null)}
                  className="btn btn-sm btn-circle btn-ghost"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateReview} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    ???????? ???
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered w-full text-sm"
                    value={editingReview.name}
                    onChange={(e) => setEditingReview({ ...editingReview, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    ????? (Stars)
                  </label>
                  <select
                    className="select select-bordered w-full bg-white text-sm"
                    value={editingReview.rating || 5}
                    onChange={(e) => setEditingReview({ ...editingReview, rating: Number(e.target.value) })}
                  >
                    <option value={5}>????? (? ?????)</option>
                    <option value={4}>???? (? ?????)</option>
                    <option value={3}>??? (? ?????)</option>
                  </select>
                </div>

                {/* Edit Image Section */}
                <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">????? ???? ????? / ????</label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditUploadMode("url")}
                        className={`px-2 py-0.5 text-xs rounded ${
                          editUploadMode === "url" ? "bg-[#0f2a44] text-white" : "bg-white border text-gray-600"
                        }`}
                      >
                        ?? Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditUploadMode("file")}
                        className={`px-2 py-0.5 text-xs rounded ${
                          editUploadMode === "file" ? "bg-[#0f2a44] text-white" : "bg-white border text-gray-600"
                        }`}
                      >
                        ?? File
                      </button>
                    </div>
                  </div>

                  {editUploadMode === "url" ? (
                    <input
                      type="text"
                      required={editUploadMode === "url"}
                      className="input input-bordered input-sm w-full text-xs font-mono"
                      value={editingReview.image}
                      onChange={(e) => setEditingReview({ ...editingReview, image: e.target.value })}
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setEditImageFile(file);
                          setEditImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#0f2a44] file:text-white cursor-pointer"
                    />
                  )}

                  {/* Preview */}
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-white mt-2">
                    <Image
                      src={editImagePreview || formatImageUrl(editingReview.image)}
                      alt="Review Preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    ??????? / ????????
                  </label>
                  <textarea
                    rows={2}
                    className="textarea textarea-bordered w-full text-sm"
                    value={editingReview.comment || ""}
                    onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingReview(null)}
                    className="btn btn-ghost btn-sm"
                  >
                    ?????
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn bg-[#0f2a44] text-white btn-sm hover:bg-[#d4af37] hover:text-[#0f2a44]"
                  >
                    {submitting ? "??????? ?????..." : "????? ????"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}
