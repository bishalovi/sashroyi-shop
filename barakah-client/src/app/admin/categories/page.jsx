"use client";

import { useEffect, useState } from "react";
import AdminRoute from "@/components/auth/AdminRoute";
import { toast } from "react-toastify";
import {
  FiFolder,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiLayers,
  FiLink,
} from "react-icons/fi";

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

export default function AdminCategoriesPage() {
  const baseUrl = "https://sashroyi-api.onrender.com";
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newSubcategories, setNewSubcategories] = useState([
    { name: "Natural", slug: "natural" },
    { name: "Islamic", slug: "islamic" },
  ]);
  const [tempSubName, setTempSubName] = useState("");

  // Edit Category Modal State
  const [editingCat, setEditingCat] = useState(null);
  const [editSubName, setEditSubName] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/categories`);
      const data = await res.json();
      if (data.success && data.data) {
        setCategories(data.data);
      }
    } catch (err) {
      toast.error("Failed to load categories: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewNameChange = (e) => {
    const val = e.target.value;
    setNewCatName(val);
    setNewCatSlug(generateSlug(val));
  };

  const addSubToNew = (e) => {
    e?.preventDefault();
    if (!tempSubName.trim()) return;
    const slug = generateSlug(tempSubName);
    setNewSubcategories([...newSubcategories, { name: tempSubName.trim(), slug }]);
    setTempSubName("");
  };

  const removeSubFromNew = (index) => {
    setNewSubcategories(newSubcategories.filter((_, i) => i !== index));
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${baseUrl}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          slug: newCatSlug.trim() || generateSlug(newCatName),
          description: newCatDesc.trim(),
          subcategories: newSubcategories,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Category created successfully!");
        setNewCatName("");
        setNewCatSlug("");
        setNewCatDesc("");
        setNewSubcategories([
          { name: "Natural", slug: "natural" },
          { name: "Islamic", slug: "islamic" },
        ]);
        fetchCategories();
      } else {
        toast.error(data.message || "Failed to create category");
      }
    } catch (err) {
      toast.error("Error creating category: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (cat) => {
    setEditingCat({
      ...cat,
      subcategories: [...(cat.subcategories || [])],
    });
  };

  const addSubToEdit = (e) => {
    e?.preventDefault();
    if (!editSubName.trim() || !editingCat) return;
    const slug = generateSlug(editSubName);
    setEditingCat({
      ...editingCat,
      subcategories: [...editingCat.subcategories, { name: editSubName.trim(), slug }],
    });
    setEditSubName("");
  };

  const removeSubFromEdit = (index) => {
    if (!editingCat) return;
    setEditingCat({
      ...editingCat,
      subcategories: editingCat.subcategories.filter((_, i) => i !== index),
    });
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCat || !editingCat.name.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${baseUrl}/api/categories/${editingCat._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCat.name.trim(),
          slug: editingCat.slug.trim() || generateSlug(editingCat.name),
          description: editingCat.description?.trim() || "",
          subcategories: editingCat.subcategories,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Category updated successfully!");
        setEditingCat(null);
        fetchCategories();
      } else {
        toast.error(data.message || "Failed to update category");
      }
    } catch (err) {
      toast.error("Error updating category: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return;

    try {
      const res = await fetch(`${baseUrl}/api/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Category deleted successfully!");
        fetchCategories();
      } else {
        toast.error(data.message || "Failed to delete category");
      }
    } catch (err) {
      toast.error("Error deleting category: " + err.message);
    }
  };

  return (
    <AdminRoute>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#0f2a44] sm:text-3xl flex items-center gap-3">
              <FiFolder className="text-[#d4af37]" /> Categories & Subcategories
            </h1>
            <p className="text-sm text-gray-500">
              Manage product categories, subcategories, and SEO URL slugs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Add New Category Form */}
          <div className="lg:col-span-1 rounded-2xl bg-white p-6 shadow-sm border border-gray-100 h-fit space-y-4">
            <h2 className="text-lg font-bold text-[#0f2a44] border-b pb-3 flex items-center gap-2">
              <FiPlus className="text-[#d4af37]" /> Add New Category
            </h2>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Category Name (নাম) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wall Clock"
                  required
                  className="input input-bordered w-full"
                  value={newCatName}
                  onChange={handleNewNameChange}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <FiLink size={14} className="text-[#d4af37]" /> URL Slug (স্লাগ) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. wall-clock"
                  required
                  className="input input-bordered w-full font-mono text-sm bg-gray-50"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  URL হবে: /category/<strong>{newCatSlug || "slug"}</strong>
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Description (বিবরণ - Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description..."
                  className="textarea textarea-bordered w-full text-sm"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                />
              </div>

              {/* Subcategories list */}
              <div className="border-t pt-3 space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <FiLayers size={14} className="text-[#d4af37]" /> Subcategories (সাব-ক্যাটাগরি)
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Subcategory name..."
                    className="input input-bordered input-sm w-full"
                    value={tempSubName}
                    onChange={(e) => setTempSubName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSubToNew();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addSubToNew}
                    className="btn btn-sm bg-[#0f2a44] text-white hover:bg-[#d4af37]"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {newSubcategories.map((sub, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 border"
                    >
                      <span>{sub.name}</span>
                      <span className="text-gray-400 font-mono">({sub.slug})</span>
                      <button
                        type="button"
                        onClick={() => removeSubFromNew(i)}
                        className="text-red-500 hover:text-red-700 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn bg-[#0f2a44] text-white w-full hover:bg-[#d4af37] hover:text-[#0f2a44] transition-all"
              >
                <FiPlus /> {submitting ? "Saving..." : "Create Category"}
              </button>
            </form>
          </div>

          {/* Right Column: Existing Categories List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0f2a44]">
                All Categories ({categories.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl bg-white border">
                <span className="loading loading-spinner loading-lg text-[#0f2a44]"></span>
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center border">
                <p className="text-gray-500">No categories found. Create one on the left!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 hover:border-gray-200 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-[#0f2a44]">{cat.name}</h3>
                          <span className="rounded-md bg-[#0f2a44]/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[#0f2a44]">
                            /category/{cat.slug}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="btn btn-sm btn-ghost text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat._id, cat.name)}
                          className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories */}
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Subcategories:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cat.subcategories && cat.subcategories.length > 0 ? (
                          cat.subcategories.map((sub, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-200/60"
                            >
                              <span>{sub.name}</span>
                              <span className="text-emerald-600 font-mono text-[10px]">
                                ({sub.slug})
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No subcategories</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Category Modal */}
        {editingCat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-[#0f2a44]">Edit Category</h3>
                <button
                  onClick={() => setEditingCat(null)}
                  className="btn btn-sm btn-circle btn-ghost"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateCategory} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered w-full"
                    value={editingCat.name}
                    onChange={(e) =>
                      setEditingCat({ ...editingCat, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered w-full font-mono text-sm bg-gray-50"
                    value={editingCat.slug}
                    onChange={(e) =>
                      setEditingCat({ ...editingCat, slug: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    className="textarea textarea-bordered w-full text-sm"
                    value={editingCat.description || ""}
                    onChange={(e) =>
                      setEditingCat({ ...editingCat, description: e.target.value })
                    }
                  />
                </div>

                {/* Subcategories Editor */}
                <div className="border-t pt-3 space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Subcategories
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add new subcategory..."
                      className="input input-bordered input-sm w-full"
                      value={editSubName}
                      onChange={(e) => setEditSubName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSubToEdit();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addSubToEdit}
                      className="btn btn-sm bg-[#0f2a44] text-white hover:bg-[#d4af37]"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {editingCat.subcategories?.map((sub, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 border"
                      >
                        <span>{sub.name}</span>
                        <span className="text-gray-400 font-mono">({sub.slug})</span>
                        <button
                          type="button"
                          onClick={() => removeSubFromEdit(i)}
                          className="text-red-500 hover:text-red-700 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingCat(null)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn bg-[#0f2a44] text-white hover:bg-[#d4af37] hover:text-[#0f2a44]"
                  >
                    <FiCheck /> {submitting ? "Saving..." : "Save Changes"}
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
