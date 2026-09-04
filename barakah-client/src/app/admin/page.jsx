import AnalyticsCard from "@/components/admin/AnalyticsCard";
import DateAnalyticsCard from "@/components/admin/DateAnalyticsCard";
import ModeratorSectionForAdmin from "@/components/admin/ModeratorSectionForAdmin";
import AdminRoute from "@/components/auth/AdminRoute";
import { Layers, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

async function getDashboardData() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const [productsRes, ordersRes, statsRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/products`, {
        next: { revalidate: 20 },
      }),
      fetch(`${baseUrl}/api/orders`, {
        next: { revalidate: 20 },
      }),
      fetch(`${baseUrl}/api/orders/stats`, {
        next: { revalidate: 20 },
      }),
    ]);

    let products = [];
    let orders = [];
    let stats = {
      totalOrders: 0,
      todayOrders: 0,
      last7DaysOrders: 0,
      last30DaysOrders: 0,
    };

    if (statsRes.status === "fulfilled" && statsRes.value.ok) {
      const statsJson = await statsRes.value.json();
      stats = statsJson.data;
    }

    // products
    if (productsRes.status === "fulfilled" && productsRes.value.ok) {
      const productsJson = await productsRes.value.json();
      products = productsJson?.data || [];
    }

    // orders
    if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
      const ordersJson = await ordersRes.value.json();
      orders = ordersJson?.data || [];
    }

    const totalProducts = products.length;

    const recentProducts = [...products].slice(0, 5);
    const recentOrders = [...orders].slice(0, 5);

    return {
      totalProducts,
      totalOrders: stats.totalOrders,
      todayOrders: stats.todayOrders,
      last7DaysOrders: stats.last7DaysOrders,
      last30DaysOrders: stats.last30DaysOrders,
      recentProducts,
      recentOrders,
    };
  } catch (error) {
    return {
      totalProducts: 0,
      totalOrders: 0,
      recentProducts: [],
      recentOrders: [],
    };
  }
}

export default async function AdminHomePage() {
  const {
    totalProducts,
    totalOrders,
    todayOrders,
    last7DaysOrders,
    last30DaysOrders,
    recentProducts,
    recentOrders,
  } = await getDashboardData();

  return (
    <AdminRoute>
      <div className="space-y-6">
        {/* Heading */}
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Welcome to Admin Dashboard
          </h2>
          <p className="text-gray-500">
            Manage your products, orders, and store settings here.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border border-stone-100 transition-all duration-300 hover:shadow-md">
            <div className="flex items-start  gap-4">
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">
                  Total Products
                </p>
                <p className="text-4xl font-semibold text-stone-600 mt-2">
                  {totalProducts}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-100 transition-all duration-300 hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
                <Package className="w-5 h-5 text-amber-600 " />
              </div>
              <div className="flex-1">
                <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">
                  Total Orders
                </p>
                <p className="text-4xl font-semibold text-stone-600 mt-2">
                  {totalOrders}
                </p>
              </div>
            </div>
          </div>

          {/* <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Order Analytics</p>

            <div className="mt-3 space-y-2">

              <div className="flex justify-between">
                <span>Today</span>
                <span className="font-semibold">{todayOrders}</span>
              </div>

              <div className="flex justify-between">
                <span>Last 7 Days</span>
                <span className="font-semibold">{last7DaysOrders}</span>
              </div>

              <div className="flex justify-between">
                <span>Last 30 Days</span>
                <span className="font-semibold">{last30DaysOrders}</span>
              </div>
            </div>
          </div> */}

          <AnalyticsCard />

          <DateAnalyticsCard />

          <ModeratorSectionForAdmin />
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/products"
              className="btn border border-[#d4af37] text-[#d4af37] hover:bg-[#0f2a44] hover:border-[#0f2a44] transition"
            >
              View Products
            </Link>

            <Link
              href="/admin/products/add"
              className="btn border border-[#d4af37] text-[#d4af37] hover:bg-[#0f2a44] hover:border-[#0f2a44] transition"
            >
              Add Product
            </Link>

            <Link
              href="/admin/orders"
              className="btn border border-[#d4af37] text-[#d4af37] hover:bg-[#0f2a44] hover:border-[#0f2a44] transition"
            >
              View Orders
            </Link>
          </div>
        </div>

        {/* Recent Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Products */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Products</h3>
              <Link href="/admin/products" className="text-sm text-blue-600">
                View all
              </Link>
            </div>

            {recentProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">No products found.</p>
            ) : (
              <div className="space-y-4">
                {recentProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center gap-3 border-b pb-3 last:border-b-0 border-gray-200"
                  >
                    <Image
                      src={product.image || "/placeholder.png"}
                      alt={product.name || "Product"}
                      className="w-12 h-12 rounded-lg object-cover border"
                      width={48}
                      height={48}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {product.name || "Untitled Product"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {product.category || "No category"}
                      </p>
                    </div>

                    <div className="text-sm font-semibold">
                      ৳ {product.price || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Orders</h3>
              <Link href="/admin/orders" className="text-sm text-blue-600">
                View all
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-sm">No orders found.</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between border-b pb-3 last:border-b-0 border-gray-200"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {order.customerName || order.name || "Unnamed Customer"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {order.email || order.phone || "No contact info"}
                      </p>
                    </div>

                    <div className="text-sm font-semibold">
                      ৳{" "}
                      {Number(
                        order.total || order.totalAmount || order.price || 0,
                      ).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
