"use client";

/**
 * ============================================================================
 * FILE: ProductTable.jsx
 * VERSION: v2.0.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Select products and download official Meta (Facebook/Instagram) Catalog CSV
 * for 1-click import into Meta Commerce Manager.
 * ============================================================================
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { FaFacebook, FaFileImport, FaTrashAlt } from "react-icons/fa";
import ProductCsvImportModal from "./ProductCsvImportModal";

export default function ProductTable({
  initialProducts,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 50,
  onPageChange,
  onImportSuccess,
}) {
  const baseUrl = "https://sashroyi-api.onrender.com";
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const isModerator = user?.role === "barakahModerator0102";

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);
  const [deletingId, setDeletingId] = useState(null);
  const router = useRouter();

  // Selection handlers
  const isAllSelected =
    products.length > 0 && products.every((p) => selectedIds.has(p._id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const nextSet = new Set(selectedIds);
      products.forEach((p) => nextSet.add(p._id));
      setSelectedIds(nextSet);
    }
  };

  const handleToggleProduct = (id) => {
    const nextSet = new Set(selectedIds);
    if (nextSet.has(id)) {
      nextSet.delete(id);
    } else {
      nextSet.add(id);
    }
    setSelectedIds(nextSet);
  };

  // Meta Commerce Manager Official CSV Exporter
  const handleExportMetaCSV = (exportAll = false) => {
    const targetProducts = exportAll
      ? products
      : products.filter((p) => selectedIds.has(p._id));

    if (targetProducts.length === 0) {
      Swal.fire({
        title: "No Products Selected",
        text: "Please select at least one product, or click 'Export All'.",
        icon: "info",
        confirmButtonColor: "#0f2a44",
      });
      return;
    }

    const headers = [
      "id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "link",
      "image_link",
      "brand",
      "google_product_category",
      "fb_product_category",
    ];

    const rows = targetProducts.map((p) => {
      const id = p._id || p.productCode || "";
      const title = `"${(p.name || "").replace(/"/g, '""')}"`;
      const cleanDesc = (p.description || p.name || "")
        .replace(/<[^>]*>?/gm, "")
        .replace(/"/g, '""')
        .replace(/\r?\n|\r/g, " ")
        .trim();
      const description = `"${cleanDesc}"`;
      const availability = p.inStock ? "in stock" : "out of stock";
      const condition = "new";
      const price = `"${Number(p.price || 0).toFixed(2)} BDT"`;
      const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://sashroyi.shop";
      const link = `${siteOrigin}/products/${p.slug || p._id}`;
      const image_link = p.image || "";
      const brand = `"Sashroyi"`;
      const googleCategory = p.category ? `"${p.category.replace(/"/g, '""')}"` : `"General"`;
      const fbCategory = p.category ? `"${p.category.replace(/"/g, '""')}"` : `"general"`;

      return [
        id,
        title,
        description,
        availability,
        condition,
        price,
        link,
        image_link,
        brand,
        googleCategory,
        fbCategory,
      ].join(",");
    });

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `meta_catalog_barakah_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: "success",
      title: "CSV Downloaded!",
      text: `Successfully exported ${targetProducts.length} product(s) for Meta Commerce Manager.`,
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This product will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d4af37",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(id);

      const res = await fetch(`${baseUrl}/api/products/${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (result.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Product has been deleted.",
          timer: 1500,
          showConfirmButton: false,
        });

        router.refresh();
      } else {
        Swal.fire("Error", result.message, "error");
      }
    } catch (error) {
      Swal.fire("Error", "Something went wrong!", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to permanently delete ${count} selected product(s)!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, delete ${count} product(s)!`,
    });

    if (!result.isConfirmed) return;

    try {
      setIsBulkDeleting(true);
      const res = await fetch(`${baseUrl}/api/products/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setProducts((prev) => prev.filter((p) => !selectedIds.has(p._id)));
        setSelectedIds(new Set());

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: data.message || `Deleted ${count} product(s) successfully.`,
          timer: 2000,
          showConfirmButton: false,
        });

        onImportSuccess?.();
        router.refresh();
      } else {
        Swal.fire("Error", data.message || "Failed to delete products", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Network error while deleting products", "error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleMoveProduct = async (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    const newProducts = [...products];
    const temp = newProducts[index];
    newProducts[index] = newProducts[targetIndex];
    newProducts[targetIndex] = temp;

    setProducts(newProducts);

    try {
      const orderedIds = newProducts.map((p) => p._id);
      await fetch(`${baseUrl}/api/products/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    } catch (err) {
      console.error("Failed to reorder products:", err);
    }
  };

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        {!isModerator && (
          <div className="flex justify-end">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="btn btn-sm bg-[#0f2a44] text-white hover:bg-[#1a3d5f] border-none flex items-center gap-2"
            >
              <FaFileImport />
              Import CSV
            </button>
          </div>
        )}
        <p className="text-gray-500">No products found.</p>
        <ProductCsvImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          baseUrl={baseUrl}
          onSuccess={() => {
            onImportSuccess?.();
            router.refresh();
          }}
        />
      </div>
    );
  }

  const getPageNumbers = (currentPage, totalPages) => {
    const delta = 2;
    const range = [];

    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);

    for (let i = left; i <= right; i++) range.push(i);

    if (left > 2) range.unshift("...");
    if (left > 1) range.unshift(1);

    if (right < totalPages - 1) range.push("...");
    if (right < totalPages) range.push(totalPages);

    return range;
  };

  return (
    <div>
      {/* Top Action Bar for Meta Catalog Export */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-[#faf7f0] p-3 rounded-xl border border-[#e5dccf]">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-[#0f2a44]">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary"
              checked={isAllSelected}
              onChange={handleToggleSelectAll}
            />
            <span>Select All ({products.length})</span>
          </label>

          {selectedIds.size > 0 && (
            <span className="badge bg-[#0f2a44] text-white text-xs font-semibold px-2 py-1">
              {selectedIds.size} Selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isModerator && selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-none flex items-center gap-1.5 shadow-sm font-medium transition-all"
              title="Delete all selected products"
            >
              <FaTrashAlt className="text-xs" />
              {isBulkDeleting ? "Deleting..." : `Delete (${selectedIds.size})`}
            </button>
          )}

          {!isModerator && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="btn btn-sm bg-[#0f2a44] text-white hover:bg-[#1a3d5f] border-none flex items-center gap-2 shadow-sm font-medium"
              title="Bulk import products from CSV"
            >
              <FaFileImport />
              Import CSV
            </button>
          )}

          <button
            onClick={() => {
              if (selectedIds.size === 0) {
                Swal.fire({
                  title: "কোনো প্রোডাক্ট সিলেক্ট করা নেই",
                  text: "প্রোডাক্ট সিলেক্ট করুন অথবা 'Select All' এ টিক দিন।",
                  icon: "info",
                  confirmButtonColor: "#1877F2",
                });
                return;
              }
              handleExportMetaCSV(false);
            }}
            disabled={selectedIds.size === 0}
            className={`btn btn-sm flex items-center gap-2 border-none transition-all ${
              selectedIds.size > 0
                ? "bg-[#1877F2] text-white hover:bg-[#166fe5] shadow-sm font-medium"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            title="Download Meta Catalog CSV for selected products"
          >
            <FaFacebook className={selectedIds.size > 0 ? "text-white" : "text-gray-400"} />
            Export Meta CSV {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="overflow-x-auto hidden md:block">
        <table className="table">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                />
              </th>
              <th>#</th>
              <th>Order</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product, index) => {
              const isSelected = selectedIds.has(product._id);
              return (
                <tr
                  key={product._id}
                  className={isSelected ? "bg-amber-50/50" : ""}
                >
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={isSelected}
                      onChange={() => handleToggleProduct(product._id)}
                    />
                  </td>

                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>

                  {/* Reorder Buttons */}
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveProduct(index, "up")}
                        className="btn btn-xs btn-outline border-gray-300 hover:bg-[#0f2a44] hover:text-white disabled:opacity-20 px-1.5 py-0.5"
                        title="উপরে নিন (Move Up)"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={index === products.length - 1}
                        onClick={() => handleMoveProduct(index, "down")}
                        className="btn btn-xs btn-outline border-gray-300 hover:bg-[#0f2a44] hover:text-white disabled:opacity-20 px-1.5 py-0.5"
                        title="নিচে নিন (Move Down)"
                      >
                        ↓
                      </button>
                    </div>
                  </td>

                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle h-12 w-12">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={48}
                            height={48}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span className="truncate max-w-[240px]">{product.name}</span>
                          {product.productType === "variable" && Array.isArray(product.variations) && product.variations.length > 0 && (
                            <span className="badge badge-warning badge-sm text-[10px] font-bold shrink-0">
                              {product.variations.length} ভ্যারিয়েশন
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {product.subcategory || "—"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>{product.category}</td>
                  <td>৳ {product.price}</td>

                  <td>
                    {product.inStock ? (
                      <span className="badge badge-success badge-sm">
                        In Stock
                      </span>
                    ) : (
                      <span className="badge badge-error badge-sm">
                        Out of Stock
                      </span>
                    )}
                  </td>

                  <td>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/products/edit/${product._id}`}
                        className="btn btn-ghost btn-xs"
                      >
                        Edit
                      </Link>
                      {!isModerator && (
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="btn btn-ghost btn-xs text-red-500"
                        >
                          {deletingId === product._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
        {products.map((product, index) => {
          const isSelected = selectedIds.has(product._id);
          return (
            <div
              key={product._id}
              className={`border rounded-xl p-4 shadow-sm bg-white ${
                isSelected ? "border-[#d4af37] bg-amber-50/30" : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm mt-1"
                  checked={isSelected}
                  onChange={() => handleToggleProduct(product._id)}
                />

                <Image
                  src={product.image}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-lg shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold truncate">
                      {(currentPage - 1) * itemsPerPage + index + 1}. {product.name}
                    </p>
                    {product.productType === "variable" && Array.isArray(product.variations) && product.variations.length > 0 && (
                      <span className="badge badge-warning badge-xs text-[10px] font-bold shrink-0">
                        {product.variations.length} ভ্যারিয়েশন
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mt-0.5">
                    {product.category} • {product.subcategory || "—"}
                  </p>

                  <p className="font-semibold mt-1">৳ {product.price}</p>

                  <div className="mt-2">
                    {product.inStock ? (
                      <span className="badge badge-success badge-sm">
                        In Stock
                      </span>
                    ) : (
                      <span className="badge badge-error badge-sm">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 items-center">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveProduct(index, "up")}
                    className="btn btn-sm btn-outline border-gray-300 px-2"
                    title="উপরে নিন"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === products.length - 1}
                    onClick={() => handleMoveProduct(index, "down")}
                    className="btn btn-sm btn-outline border-gray-300 px-2"
                    title="নিচে নিন"
                  >
                    ↓
                  </button>
                </div>

                <Link
                  href={`/admin/products/edit/${product._id}`}
                  className="btn btn-sm flex-1"
                >
                  Edit
                </Link>

                {!isModerator && (
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="btn btn-sm btn-error flex-1"
                  >
                    {deletingId === product._id ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="mt-8">
        <div className="flex items-center justify-center gap-2 md:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-sm"
          >
            Prev
          </button>

          <span className="rounded-lg border px-4 py-2 text-sm font-medium">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn btn-sm"
          >
            Next
          </button>
        </div>

        <div className="hidden justify-center md:flex">
          <div className="join">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="join-item btn btn-sm"
            >
              «
            </button>

            {getPageNumbers(currentPage, totalPages).map((page, i) =>
              page === "..." ? (
                <button
                  key={`ellipsis-${i}`}
                  className="join-item btn btn-sm btn-disabled"
                >
                  ...
                </button>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`join-item btn btn-sm ${
                    currentPage === page
                      ? "bg-black text-white border-black"
                      : "btn-ghost"
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="join-item btn btn-sm"
            >
              »
            </button>
          </div>
        </div>
      </div>

      <ProductCsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        baseUrl={baseUrl}
        onSuccess={() => {
          onImportSuccess?.();
          router.refresh();
        }}
      />
    </div>
  );
}
