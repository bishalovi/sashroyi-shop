"use client";

import Link from "next/link";
import { FiHome, FiBox, FiPlus, FiShoppingCart, FiSliders, FiTruck, FiSettings, FiGrid } from "react-icons/fi";
import { IoMdMenu } from "react-icons/io";
import { usePathname } from "next/navigation";
import AdminRoute from "@/components/auth/AdminRoute";
import { MdOutlineShoppingCartCheckout } from "react-icons/md";

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const isExact = (path) => pathname === path;
  const isProductsPage =
    pathname === "/admin/products" ||
    pathname.startsWith("/admin/products/edit");
  const isCategoriesPage = pathname.startsWith("/admin/categories");
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
        <div className="drawer-side">
          <label htmlFor="admin-drawer" className="drawer-overlay"></label>

          <aside className="min-h-full w-64 bg-white border-r border-[#e5dccf] py-6 px-4">
            <ul className="pt-12 lg:pt-0 menu text-[#3d2f1f] w-full gap-1">
              {/* Dashboard */}
              <li>
                <Link
                  href="/admin"
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
                  className={isCategoriesPage ? "bg-[#d4af37] text-white" : ""}
                >
                  <FiGrid />
                  Categories
                </Link>
              </li>

              {/* All Products */}
              <li>
                <Link
                  href="/admin/products"
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
