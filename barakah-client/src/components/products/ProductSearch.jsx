"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";

export default function ProductSearch({ products }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Search Bar */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search product by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-3 rounded-lg border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-[#0f2a44]"
        />
      </div>

      {/* Products */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      ) : (
        <p className="text-center mt-10 text-gray-500">
          No products found.
        </p>
      )}
    </>
  );
}