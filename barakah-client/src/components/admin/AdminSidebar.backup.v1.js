"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiBox,
  FiPlus,
  FiShoppingCart,
} from "react-icons/fi";

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`min-h-screen bg-white border-r border-[#e5dccf] transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      } p-4 flex flex-col`}
    >
      <div className="flex items-center justify-between mb-8">
        {!collapsed && (
          <h2 className="text-xl font-bold text-[#3d2f1f]">Barakah Admin</h2>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-[#faf7f0]"
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <nav className="space-y-2 flex-1">
        <SidebarItem
          href="/admin"
          icon={<FiHome />}
          label="Dashboard"
          collapsed={collapsed}
        />
        <SidebarItem
          href="/admin/products"
          icon={<FiBox />}
          label="All Products"
          collapsed={collapsed}
        />
        <SidebarItem
          href="/admin/products/add"
          icon={<FiPlus />}
          label="Add Product"
          collapsed={collapsed}
        />
        <SidebarItem
          href="/admin/orders"
          icon={<FiShoppingCart />}
          label="Orders"
          collapsed={collapsed}
        />
      </nav>
    </aside>
  );
}

function SidebarItem({ href, icon, label, collapsed }) {
  return (
    <Link
      href={href}
      className={`flex items-center rounded-lg hover:bg-[#faf7f0] hover:text-[#d4af37] transition ${
        collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2"
      }`}
    >
      <span className="text-lg shrink-0">{icon}</span>

      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
          collapsed ? "w-0 opacity-0" : "w-32 opacity-100"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
