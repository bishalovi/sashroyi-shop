"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiHome, FiBox, FiPlus, FiShoppingCart, FiSliders, FiTruck, FiSettings, FiGrid, FiStar, FiRefreshCw } from "react-icons/fi";
import { IoMdMenu } from "react-icons/io";
import { usePathname } from "next/navigation";
import AdminRoute from "@/components/auth/AdminRoute";
import { MdOutlineShoppingCartCheckout } from "react-icons/md";
import { toast } from "react-toastify";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [clearingCache, setClearingCache] = useState(false);

  const closeDrawer = () => {
    const drawerCheckbox = document.getElementById("admin-drawer");
    if (drawerCheckbox) {
      drawerCheckbox.checked = false;
    }
  };

  const handleClearCache = async () => {
    try {
      setClearingCache(true);
      // 1. Clear CacheStorage
      if (typeof window !== "undefined" && "caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      // 2. Clear Service Workers
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }

      // 3. Clear SessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }

      // 4. Clear LocalStorage except admin auth session
      if (typeof window !== "undefined") {
        const userBackup = localStorage.getItem("barakahUser");
        localStorage.clear();
        if (userBackup) {
          localStorage.setItem("barakahUser", userBackup);
        }
      }

      toast.success("ক্যাশ সফলভাবে মুছে ফেলা হয়েছে! রিলোড হচ্ছে...");

      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      console.error("Failed to clear cache:", err);
      toast.error("ক্যাশ ক্লিয়ার করতে সমস্যা হয়েছে");
      setClearingCache(false);
    }
  };

  useEffect(() => {
    closeDrawer();
  }, [pathname]);

  const isExact = (path) => pathname === path;
  const isProductsPage =
    pathname === "/admin/products" ||
    pathname.startsWith("/admin/products/edit");
  const isCategoriesPage = pathname.startsWith("/admin/categories");
  const isReviewsPage = pathname.startsWith("/admin/reviews");
  return (
    <AdminRoute>
      <div className="drawer lg:drawer-open min-h-screen">
        {/* Toggle checkbox */}
        <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

        {/* Main content */}
        <div className="drawer-content flex flex-col bg-[#faf7f0]">
          {/* Navbar */}
          <div className="flex lg:hidden navbar bg-white border-b border-[#e5dccf] px-4 justify-between">
            <div className="flex items-center gap-2">
              {/* Mobile menu button */}
              <label
                htmlFor="admin-drawer"
                className="btn btn-square btn-ghost"
              >
                <IoMdMenu size={22} />
              </label>

              {/* Title */}
              <h1 className="text-lg font-semibold text-[#3d2f1f]">Admin Dashboard</h1>
            </div>

            {/* Mobile Clear Cache Button */}
            <button
              onClick={handleClearCache}
              disabled={clearingCache}
              className="btn btn-xs sm:btn-sm bg-[#faf7f0] hover:bg-[#d4af37] text-[#0f2a44] border border-[#e5dccf] rounded-lg flex items-center gap-1.5"
              title="Clear Site Cache"
            >
              <FiRefreshCw className={`text-xs ${clearingCache ? "animate-spin text-[#0f2a44]" : "text-[#d4af37]"}`} />
              <span className="text-[11px] font-medium">{clearingCache ? "Clearing..." : "Clear Cache"}</span>
            </button>
          </div>

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>

        {/* Sidebar */}
        <div className="drawer-side z-50">
          <label htmlFor="admin-drawer" className="drawer-overlay"></label>

          <aside className="min-h-full w-64 bg-white border-r border-[#e5dccf] py-6 px-4 flex flex-col justify-between">
            <ul className="pt-12 lg:pt-0 menu text-[#3d2f1f] w-full gap-1">
              {/* Dashboard */}
              <li>
                <Link
                  href="/admin"
                  onClick={closeDrawer}
                  className={isExact("/admin") ? "bg-[#d4af37] text-white" : ""}
                >
                  <FiHome />
                  Dashboard
                </Link>
              </li>

              {/* Categories */}
              <li>
                <Link
                  href="/admin/categories"
                  onClick={closeDrawer}
                  className={isCategoriesPage ? "bg-[#d4af37] text-white" : ""}
                >
                  <FiGrid />
                  Categories
                </Link>
              </li>

              {/* Customer Reviews */}
              <li>
                <Link
                  href="/admin/reviews"
                  onClick={closeDrawer}
                  className={isReviewsPage ? "bg-[#d4af37] text-white" : ""}
                >
                  <FiStar />
                  Customer Reviews
                </Link>
              </li>

              {/* All Products */}
              <li>
                <Link
                  href="/admin/products"
                  onClick={closeDrawer}
                  className={isProductsPage ? "bg-[#d4af37] text-white" : ""}
                >
                  <FiBox />
                  All Products
                </Link>
              </li>

              {/* Add Product */}
              <li>
                <Link
                  href="/admin/products/add"
                  onClick={closeDrawer}
                  className={
                    isExact("/admin/products/add")
                      ? "bg-[#d4af37] text-white"
                      : ""
                  }
                >
                  <FiPlus />
                  Add Product
                </Link>
              </li>

              {/* Orders */}
              <li>
                <Link
                  href="/admin/orders"
                  onClick={closeDrawer}
                  className={
                    isExact("/admin/orders") ? "bg-[#d4af37] text-white" : ""
                  }
                >
                  <FiShoppingCart />
                  Orders
                </Link>
              </li>

              {/* Abandoned Orders */}
              <li>
                <Link
                  href="/admin/abandoned-orders"
                  onClick={closeDrawer}
                  className={
                    isExact("/admin/abandoned-orders")
                      ? "bg-[#d4af37] text-white"
                      : ""
                  }
                >
                  <MdOutlineShoppingCartCheckout />
                  Abandoned
                </Link>
              </li>

              {/* Tracking & Pixels */}
              <li>
                <Link
                  href="/admin/tracking"
                  onClick={closeDrawer}
                  className={
                    isExact("/admin/tracking") ? "bg-[#d4af37] text-white" : ""
                  }
                >
                  <FiSliders />
                  Tracking & Pixels
                </Link>
              </li>

              {/* Shipping Settings */}
              <li>
                <Link
                  href="/admin/shipping"
                  onClick={closeDrawer}
                  className={
                    isExact("/admin/shipping") ? "bg-[#d4af37] text-white" : ""
                  }
                >
                  <FiTruck />
                  Shipping Settings
                </Link>
              </li>

              {/* Website Settings */}
              <li>
                <Link
                  href="/admin/settings"
                  onClick={closeDrawer}
                  className={
                    isExact("/admin/settings") ? "bg-[#d4af37] text-white" : ""
                  }
                >
                  <FiSettings />
                  Website Settings
                </Link>
              </li>
            </ul>

            {/* Sidebar Bottom Action: Clear Cache */}
            <div className="pt-4 mt-6 border-t border-[#e5dccf]">
              <button
                onClick={handleClearCache}
                disabled={clearingCache}
                className="btn btn-outline btn-sm w-full flex items-center justify-center gap-2 text-xs font-semibold text-[#0f2a44] border-[#d4af37] hover:bg-[#d4af37] hover:text-[#0f2a44] hover:border-[#d4af37] rounded-lg transition-all shadow-xs"
                title="মুহূর্তেই ব্রাউজার ক্যাশ ও লোকাল মেমোরি পরিষ্কার করুন"
              >
                <FiRefreshCw className={`text-sm ${clearingCache ? "animate-spin text-[#d4af37]" : ""}`} />
                <span>{clearingCache ? "Clearing..." : "Clear Cache (ক্যাশ মুছুন)"}</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </AdminRoute>
  );
}
