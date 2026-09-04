/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import ProductTable from "@/components/admin/ProductTable";
import LoadingAnimation from "@/components/shared/LoadingAnimation";

export default function AllProductsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [loading, setLoading] = useState(true);

  const getProducts = async (page = 1) => {
    try {
      setLoading(true);

      const res = await fetch(`${baseUrl}/api/products?page=${page}&limit=50`, {
        cache: "no-store",
      });

      if (!res.ok) {
        setProducts([]);
        setCurrentPage(1);
        setTotalPages(1);
        setItemsPerPage(50);
        return;
      }

      const result = await res.json();

      setProducts(result?.data || []);
      setCurrentPage(result?.pagination?.page || page);
      setTotalPages(result?.pagination?.totalPages || 1);
      setItemsPerPage(result?.pagination?.limit || 50);
    } catch (error) {
      setProducts([]);
      setCurrentPage(1);
      setTotalPages(1);
      setItemsPerPage(50);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = Number(params.get("page")) || 1;
    getProducts(page);
  }, []);

  const handlePageChange = (page) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page);
    window.history.pushState({}, "", `?${params.toString()}`);

    getProducts(page);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold mb-6">All Products</h2>

      {loading ? (
        <div className="flex justify-center py-12 ">
          <LoadingAnimation width={300} height={300} message="Loading products..." />
        </div>
      ) : (
        <ProductTable
          initialProducts={products}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}