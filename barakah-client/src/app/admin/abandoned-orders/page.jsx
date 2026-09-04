/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { RxCross1 } from "react-icons/rx";
import { LuPhone } from "react-icons/lu";
import LoadingAnimation from "@/components/shared/LoadingAnimation";
import Swal from "sweetalert2";
import { FaWhatsapp } from "react-icons/fa";
import { LuCopy } from "react-icons/lu";

export default function AbandonedOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingId, setLoadingId] = useState(null);

  // Dynamic filter stats tracking setup
  const [counts, setCounts] = useState({ all: 0, abandoned: 0, converted: 0 });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${baseUrl}/api/orders/abandoned?page=${currentPage}`,
        );
        const data = await res.json();
        if (data.success) {
          const rawOrders = data.data || [];
          setOrders(rawOrders);
          setFilteredOrders(rawOrders);
          setTotalPages(data.pagination?.totalPages || 1);

          // Calculate status counts based on current response metrics
          const allCount = rawOrders.length;
          const abandonedCount = rawOrders.filter(
            (o) => o.status === "abandoned",
          ).length;
          const deliveredCount = rawOrders.filter(
            (o) => o.status === "delivered",
          ).length;
          const cancelledCount = rawOrders.filter(
            (o) => o.status === "cancelled",
          ).length;

          setCounts({
            all: allCount,
            abandoned: abandonedCount,
            delivered: deliveredCount,
            cancelled: cancelledCount,
          });
        }
      } catch (error) {
        console.error("Error fetching abandoned orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [baseUrl, currentPage]);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(
        orders.filter((order) => order.status === statusFilter),
      );
    }
  }, [orders, statusFilter]);

  useEffect(() => {
    const allCount = orders.length;
    const abandonedCount = orders.filter(
      (o) => o.status === "abandoned",
    ).length;
    const deliveredCount = orders.filter(
      (o) => o.status === "delivered",
    ).length;
    const cancelledCount = orders.filter(
      (o) => o.status === "cancelled",
    ).length;

    setCounts({
      all: allCount,
      abandoned: abandonedCount,
      delivered: deliveredCount,
      cancelled: cancelledCount,
    });
  }, [orders]);

  // Handle local state filtering switches
  const handleFilterChange = (filterType) => {
    setStatusFilter(filterType);
    if (filterType === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.status === filterType));
    }
  };

  const handleDeliverAbandonedOrder = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Mark this abandoned order as delivered?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d4af37",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, mark it!",
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingId(id);

      const res = await fetch(`${baseUrl}/api/orders/abandoned/${id}/deliver`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (data.success) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === id
              ? {
                  ...order,
                  status: "delivered",
                  deliveredAt: new Date().toISOString(),
                }
              : order,
          ),
        );

        Swal.fire({
          icon: "success",
          title: "Delivered!",
          text: "Abandoned order marked as delivered.",
          timer: 1500,
          showConfirmButton: false,
        });

        if (selectedOrder?._id === id) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: "delivered",
                  deliveredAt: new Date().toISOString(),
                }
              : null,
          );
        }
      } else {
        Swal.fire("Error", "Failed to update abandoned order!", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong!", "error");
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancelAbandonedOrder = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Mark this abandoned order as cancelled?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, cancel it!",
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingId(id);

      const res = await fetch(`${baseUrl}/api/orders/abandoned/${id}/cancel`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (data.success) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === id
              ? {
                  ...order,
                  status: "cancelled",
                  cancelledAt: new Date().toISOString(),
                }
              : order,
          ),
        );

        Swal.fire({
          icon: "success",
          title: "Cancelled!",
          text: "Abandoned order marked as cancelled.",
          timer: 1500,
          showConfirmButton: false,
        });

        if (selectedOrder?._id === id) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: "cancelled",
                  cancelledAt: new Date().toISOString(),
                }
              : null,
          );
        }

        if (statusFilter === "pending") {
          setTotalPages((prev) => Math.max(prev, 1));
        }
      } else {
        Swal.fire("Error", "Failed to cancel order!", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong!", "error");
    } finally {
      setLoadingId(null);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = (current, total) => {
    const pages = [];
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  const normalizePhone = (phone) => {
    if (!phone) return "";

    let cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("0")) {
      cleaned = "88" + cleaned;
    }

    if (!cleaned.startsWith("88")) {
      cleaned = "88" + cleaned;
    }

    return cleaned;
  };

  const generateWhatsAppMessage = (order) => {
    const productNames = order.items.map((item) => item.name).join(", ");

    return `আসসালামু আলাইকুম ${order.customerName} স্যার/ ম্যাম,

আমি বারাকাহ ইসলামিক ক্লক অ্যান্ড ক্যানভাস থেকে বলছি।

আমরা লক্ষ্য করেছি যে আপনি নিচের প্রডাক্টগুলো অর্ডার করার জন্য তথ্য পূরণ করেছিলেন, কিন্তু অর্ডারটি সম্পূর্ণ হয়নি।

পণ্যের নাম: ${productNames}
মূল্য: ৳${order.total}
ডেলিভারি ঠিকানা: ${order.address}

আপনি চাইলে আমরা এখনই এই অর্ডারটি কনফার্ম করে পাঠিয়ে দিতে পারি।

যদি অর্ডারটি নিতে আগ্রহী থাকেন, তাহলে শুধু "জি" লিখে রিপ্লাই করুন অথবা আমাদের কল করুন।

বারাকাহ ইসলামিক ক্লক অ্যান্ড ক্যানভাসের সাথে থাকার জন্য আপনাকে আন্তরিক ধন্যবাদ।`;
  };

  const handleWhatsAppChat = (order) => {
    const phone = normalizePhone(order.phone);
    const message = encodeURIComponent(generateWhatsAppMessage(order));

    window.open(
      `https://wa.me/${phone}?text=${message}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleCopyWhatsAppMessage = async (order) => {
    try {
      await navigator.clipboard.writeText(generateWhatsAppMessage(order));

      Swal.fire({
        icon: "success",
        title: "Copied!",
        text: "WhatsApp message copied.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire("Error", "Failed to copy message.", "error");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="rounded-2xl bg-white p-8">
          <LoadingAnimation
            width={300}
            height={300}
            message="Loading all orders..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter Action Badges */}
      <div className="bg-white rounded-2xl border border-[#e5dccf] p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#3d2f1f]">
              Abandoned Orders
            </h1>
            <p className="text-sm text-[#7a6a58] mt-1">
              Analyze checkouts started by customers but left uncompleted.
            </p>
          </div>

          {/* Action Filter Button Layout Set */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange("all")}
              className={`btn btn-sm ${
                statusFilter === "all"
                  ? "bg-[#d4af37] text-white border-[#d4af37]"
                  : "bg-white text-[#3d2f1f] border-[#e5dccf]"
              }`}
            >
              All ({counts.all})
            </button>

            <button
              onClick={() => handleFilterChange("abandoned")}
              className={`btn btn-sm ${
                statusFilter === "abandoned"
                  ? "bg-[#d4af37] text-white border-[#d4af37]"
                  : "bg-white text-[#3d2f1f] border-[#e5dccf]"
              }`}
            >
              Abandoned ({counts.abandoned})
            </button>

            <button
              onClick={() => handleFilterChange("delivered")}
              className={`btn btn-sm ${
                statusFilter === "delivered"
                  ? "bg-[#d4af37] text-white border-[#d4af37]"
                  : "bg-white text-[#3d2f1f] border-[#e5dccf]"
              }`}
            >
              Delivered ({counts.delivered})
            </button>

            <button
              onClick={() => handleFilterChange("cancelled")}
              className={`btn btn-sm ${
                statusFilter === "cancelled"
                  ? "bg-[#d4af37] text-white border-[#d4af37]"
                  : "bg-white text-[#3d2f1f] border-[#e5dccf]"
              }`}
            >
              Cancelled ({counts.cancelled})
            </button>
          </div>
        </div>
      </div>

      {/* Main Container - Empty or Content */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5dccf] p-6">
          <p className="text-[#7a6a58]">No matching orders found.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table Layout */}
          <div className="hidden lg:block bg-white rounded-2xl border border-[#e5dccf] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-[#faf7f0] text-[#3d2f1f]">
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Abandoned Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr key={order._id}>
                      <td>{(currentPage - 1) * 10 + (index + 1)}</td>
                      <td>
                        <p className="font-semibold text-[#3d2f1f]">
                          {order.customerName}
                        </p>
                      </td>
                      <td>{order.phone}</td>
                      <td className="max-w-55 whitespace-normal">
                        {order.address}
                      </td>
                      <td>৳ {order.total}</td>
                      <td>
                        <div className="space-y-1 text-sm">
                          {order.status === "abandoned" ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#fef3c7] px-2 py-1 text-xs font-semibold text-[#b45309] capitalize">
                              {order.status}
                            </span>
                          ) : order.status === "delivered" ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#d1fae5] px-2 py-1 text-xs font-semibold text-[#065f46] capitalize">
                              {order.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#c54242] px-2 py-1 text-xs font-semibold text-[white] capitalize">
                              {order.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {order.updatedAt
                          ? new Date(order.updatedAt).toLocaleString("en-BD", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "--"}
                      </td>
                      <td className="flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="btn btn-sm bg-white text-[#3d2f1f] border border-[#d4af37] hover:bg-[#faf7f0]"
                        >
                          View
                        </button>

                        {order.status === "delivered" ? (
                          <button className="btn btn-sm" disabled>
                            Delivered
                          </button>
                        ) : order.status === "cancelled" ? (
                          <button className="btn btn-sm" disabled>
                            Cancelled
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleDeliverAbandonedOrder(order._id)
                            }
                            className="btn btn-sm bg-[#d4af37] text-white border-none hover:bg-[#c39d2f]"
                            disabled={loadingId === order._id}
                          >
                            {loadingId === order._id
                              ? "Updating..."
                              : "Deliver"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards Layout */}
          <div className="grid gap-4 lg:hidden">
            {filteredOrders.map((order, index) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-[#e5dccf] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#3d2f1f]">
                      {(currentPage - 1) * 10 + (index + 1)}.{" "}
                      {order.customerName}
                    </p>
                    <p className="text-sm text-[#7a6a58]">{order.phone}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-[#3d2f1f]">
                  <p>
                    <span className="font-semibold">Address:</span>{" "}
                    {order.address}
                  </p>

                  <p>
                    <span className="font-semibold">Total:</span> ৳{" "}
                    {order.total}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Status:</span>
                    <div>
                      {order.status === "abandoned" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#fef3c7] px-2 py-1 text-xs font-semibold text-[#b45309] capitalize">
                          {order.status}
                        </span>
                      ) : order.status === "delivered" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#d1fae5] px-2 py-1 text-xs font-semibold text-[#065f46] capitalize">
                          {order.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#c54242] px-2 py-1 text-xs font-semibold text-[white] capitalize">
                          {order.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <p>
                    <span className="font-semibold">Date:</span>{" "}
                    {order.updatedAt
                      ? new Date(order.updatedAt).toLocaleString("en-BD", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"}
                  </p>
                </div>

                <div className="mt-4 flex flex-col justify-center">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="btn btn-sm bg-white text-[#3d2f1f] border border-[#d4af37] hover:bg-[#faf7f0]"
                  >
                    View Order
                  </button>
                  <div className="mt-2">
                    {" "}
                    {order.status === "delivered" ? (
                      <button className="btn btn-sm w-full" disabled>
                        Delivered
                      </button>
                    ) : order.status === "cancelled" ? (
                      <button className="btn btn-sm w-full" disabled>
                        Cancelled
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeliverAbandonedOrder(order._id)}
                        className="btn btn-sm bg-[#d4af37] text-white border-none hover:bg-[#c39d2f] w-full"
                        disabled={loadingId === order._id}
                      >
                        {loadingId === order._id ? "Updating..." : "Deliver"}
                      </button>
                    )}{" "}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-8">
            {/* Mobile pagination */}
            <div className="flex items-center justify-center gap-2 md:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-sm"
              >
                Prev
              </button>

              <span className="rounded-lg border px-4 py-2 text-sm font-medium">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-sm"
              >
                Next
              </button>
            </div>

            {/* Desktop pagination */}
            <div className="hidden justify-center md:flex">
              <div className="join">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
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
                      onClick={() => handlePageChange(page)}
                      className={`join-item btn btn-sm ${
                        currentPage === page
                          ? "bg-black text-white border-black"
                          : "btn-ghost"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="join-item btn btn-sm"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Side-details / Overlay Modal View */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e5dccf] p-5">
              <div>
                <h2 className="text-xl font-bold text-[#3d2f1f]">
                  Abandoned Details
                </h2>
                <p className="text-sm text-[#7a6a58]">
                  Customer: {selectedOrder.customerName}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="text-black hover:text-red-700 transition-colors cursor-pointer text-xl"
              >
                <RxCross1 />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Customer Section */}
                <div className="rounded-xl border border-[#e5dccf] p-4">
                  <h3 className="mb-3 font-semibold text-[#3d2f1f]">
                    Customer Info
                  </h3>
                  <div className="space-y-2 text-sm text-[#3d2f1f]">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {selectedOrder.customerName}
                    </p>
                    <p>
                      <span className="font-semibold">Phone:</span>{" "}
                      {selectedOrder.phone}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <a
                        href={`tel:${selectedOrder.phone}`}
                        className="inline-flex items-center gap-1.5 rounded-md bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800"
                      >
                        <LuPhone className="w-3 h-3" />
                        <span>Call</span>
                      </a>

                      <button
                        onClick={() => handleWhatsAppChat(selectedOrder)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#1dd460] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1ebe5d]"
                      >
                        <FaWhatsapp className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleCopyWhatsAppMessage(selectedOrder)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-slate-600 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                      >
                        <LuCopy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <p>
                      <span className="font-semibold">Address:</span>{" "}
                      {selectedOrder.address}
                    </p>
                  </div>
                </div>

                {/* Cart Snapshot Summary */}
                <div className="rounded-xl border border-[#e5dccf] p-4">
                  <h3 className="mb-3 font-semibold text-[#3d2f1f]">
                    Cart Value Snapshot
                  </h3>
                  <div className="space-y-2 text-sm text-[#3d2f1f]">
                    <p className="capitalize">
                      <span className="font-semibold capitalize">
                        Checkout State:
                      </span>{" "}
                      {selectedOrder.status || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Last Interaction:</span>{" "}
                      {selectedOrder.updatedAt
                        ? new Date(selectedOrder.updatedAt).toLocaleDateString()
                        : "—"}
                    </p>
                    <p className="text-base font-bold text-[#3d2f1f]">
                      Total Recoverable: ৳ {selectedOrder.total || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Details */}
              <div className="rounded-xl border border-[#e5dccf] p-4">
                <h3 className="mb-3 font-semibold text-[#3d2f1f]">
                  Cart Items
                </h3>

                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 rounded-lg border border-[#e5dccf] p-3"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-lg object-cover border"
                      />

                      <div className="flex-1">
                        <p className="font-semibold text-[#3d2f1f]">
                          {item.name}
                        </p>

                        <div className="mt-1 text-sm text-[#7a6a58] space-y-1">
                          <p>Price: ৳ {item.price}</p>
                          <p>Quantity: {item.quantity}</p>
                          <p className="font-semibold text-[#3d2f1f]">
                            Subtotal: ৳ {item.price * item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                {selectedOrder.status === "cancelled" ? (
                  <button className="btn btn-sm" disabled>
                    Cancelled
                  </button>
                ) : selectedOrder.status === "delivered" ? (
                  <button className="btn btn-sm" disabled>
                    Delivered
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      handleCancelAbandonedOrder(selectedOrder._id)
                    }
                    className="btn btn-sm bg-red-600 text-white border-none hover:bg-red-700"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
