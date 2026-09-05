"use client";

import Link from "next/link";
import { useEffect } from "react";
import { FiHome, FiBox, FiPlus, FiShoppingCart, FiSliders, FiTruck, FiSettings, FiGrid, FiStar } from "react-icons/fi";
import { IoMdMenu } from "react-icons/io";
import { usePathname } from "next/navigation";
import AdminRoute from "@/components/auth/AdminRoute";
import { MdOutlineShoppingCartCheckout } from "react-icons/md";

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const closeDrawer = () => {
    const drawerCheckbox = document.getElementById("admin-drawer");
    if (drawerCheckbox) {
      drawerCheckbox.checked = false;
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
          <div className="flex lg:hidden navbar bg-white border-b border-[#e5dccf] px-4">
            {/* Mobile menu button */}
            <div className="flex-none lg:hidden">
              <label
                htmlFor="admin-drawer"
                className="btn btn-square btn-ghost"
              >
                <IoMdMenu size={22} />
              </label>
            </div>

            {/* Title */}
            <div className="lg:hidden flex-1 text-lg font-semibold text-[#3d2f1f]">
              <h1>Admin Dashboard</h1>
            </div>
          </div>

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>

        {/* Sidebar */}
        <div className="drawer-side z-50">
          <label htmlFor="admin-drawer" className="drawer-overlay"></label>

          <aside className="min-h-full w-64 bg-white border-r border-[#e5dccf] py-6 px-4">
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
          </aside>
        </div>
      </div>
    </AdminRoute>
  );
}
