/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import LoadingAnimation from "@/components/shared/LoadingAnimation";
import { LuCopy, LuPhone } from "react-icons/lu";
import { RxCross1 } from "react-icons/rx";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "react-toastify";

export default function OrdersPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const user = JSON.parse(localStorage.getItem("barakahUser") || "{}");
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [steadfastLoadingId, setStedastLoadingId] = useState(null);
  const [pathaoLoadingId, setPathaoLoadingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pendingWhatsAppOrderId, setPendingWhatsAppOrderId] = useState(null);
  const [pendingCallOrderId, setPendingCallOrderId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [counts, setCounts] = useState({
    all: 0,
    verification_required: 0,
    pending: 0,
    no_response: 0,
    delivered: 0,
    cancelled: 0,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = Number(params.get("page")) || 1;
    const status = params.get("status") || "all";

    setCurrentPage(page);
    setStatusFilter(status);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const controller = new AbortController();

    const fetchOrders = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(itemsPerPage),
        });

        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        const res = await fetch(`${baseUrl}/api/orders?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          setOrders([]);
          setTotalPages(1);
          return;
        }

        const data = await res.json();

        if (data.success) {
          setOrders(data.data || []);
          setCurrentPage(data?.pagination?.page || currentPage);
          setTotalPages(data?.pagination?.totalPages || 1);
          setItemsPerPage(data?.pagination?.limit || 50);
        } else {
          setOrders([]);
          setTotalPages(1);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setOrders([]);
          setTotalPages(1);
        }
      } finally {
        setLoading(false);
      }
    };

    const params = new URLSearchParams(window.location.search);
    const page = Number(params.get("page")) || 1;
    const status = params.get("status") || "all";

    if (page !== currentPage) {
      setCurrentPage(page);
      return;
    }

    if (status !== statusFilter) {
      setStatusFilter(status);
      return;
    }

    fetchOrders();

    return () => controller.abort();
  }, [baseUrl, currentPage, itemsPerPage, isReady, statusFilter]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;

    const params = new URLSearchParams(window.location.search);
    params.set("page", page);

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    window.history.pushState({}, "", `?${params.toString()}`);
    setCurrentPage(page);
  };

  const handleFilterChange = (nextStatus) => {
    const params = new URLSearchParams();
    params.set("page", "1");

    if (nextStatus !== "all") {
      params.set("status", nextStatus);
    }

    window.history.pushState({}, "", `?${params.toString()}`);
    setStatusFilter(nextStatus);
    setCurrentPage(1);
  };

  const handleMarkDelivered = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Mark this order as delivered?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d4af37",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, mark it!",
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingId(id);

      const res = await fetch(`${baseUrl}/api/orders/${id}/deliver`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveredBy: user?.userName,
        }),
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
                  deliveredBy: user?.userName,
                }
              : order,
          ),
        );

        Swal.fire({
          icon: "success",
          title: "Delivered!",
          text: "Order marked as delivered.",
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

        if (statusFilter === "pending") {
          setTotalPages((prev) => Math.max(prev, 1));
        }
      } else {
        Swal.fire("Error", "Failed to update order!", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong!", "error");
    } finally {
      setLoadingId(null);
    }
  };

  const handleVerifyOrder = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Mark this order verified and delivered?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, mark it!",
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingId(id);

      const res = await fetch(`${baseUrl}/api/orders/${id}/verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verifiedBy: user?.userName,
          deliveredBy: user?.userName,
        }),
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
                  isVerified: true,
                  verifiedAt: new Date().toISOString(),
                  verifiedBy: user?.userName,
                  deliveredBy: user?.userName,
                }
              : order,
          ),
        );

        if (selectedOrder?._id === id) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: "delivered",
                  deliveredAt: new Date().toISOString(),
                  isVerified: true,
                  verifiedAt: new Date().toISOString(),
                  verifiedBy: user?.userName,
                  deliveredBy: user?.userName,
                }
              : null,
          );
        }

        Swal.fire({
          icon: "success",
          title: "Verified!",
          text: "Order marked as verified and delivered.",
          timer: 1500,
          showConfirmButton: false,
        });

        if (statusFilter === "pending") {
          setTotalPages((prev) => Math.max(prev, 1));
        }
      } else {
        Swal.fire("Error", data.message || "Failed to verify order!", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong!", "error");
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancelOrder = async (id) => {
    const result = await Swal.fire({
      title: "Cancel Order?",
      text: "This order will be marked as cancelled.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, cancel it",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseUrl}/api/orders/${id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancelledBy: user?.userName,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === id ? { ...order, status: "cancelled" } : order,
          ),
        );

        if (selectedOrder?._id === id) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: "cancelled",
                }
              : null,
          );
        }

        Swal.fire("Cancelled!", "Order marked as cancelled.", "success");
      }
    } catch (error) {
      Swal.fire("Error", "Failed to cancel order.", "error");
    }
  };

  const handleSelectSteadfastAccount = async (id) => {
    const { value: account } = await Swal.fire({
      title: "Select Steadfast Account",
      input: "radio",
      inputOptions: {
        narayanganj: "Narayanganj",
        badda: "Badda",
        jamalpur: "Jamalpur",
      },
      inputValidator: (value) => {
        if (!value) {
          return "Please select a Steadfast account.";
        }
      },
      showCancelButton: true,
      confirmButtonText: "Continue",
      confirmButtonColor: "#d4af37",
      cancelButtonColor: "#6b7280",
    });

    if (!account) return;

    handleSendToSteadfast(id, account);
  };

  const handleSendToSteadfast = async (id, account) => {
    const currentOrder = orders.find((order) => order._id === id);
    if (steadfastLoadingId === `${id}-${account}`) return;

    const result = await Swal.fire({
      title: `Send to Steadfast (${account})?`,
      text: `This will create a shipment in the ${account} Steadfast account. You cannot undo this action.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d4af37",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, send it!",
    });

    if (!result.isConfirmed) return;

    try {
      setStedastLoadingId(`${id}-${account}`);

      const res = await fetch(`${baseUrl}/api/orders/${id}/steadfast`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ account }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Request failed");
      }

      if (data.success) {
        const updatedOrders = orders.map((order) =>
          order._id === id
            ? {
                ...order,
                steadfast: data.data,
              }
            : order,
        );
        setOrders(updatedOrders);

        Swal.fire({
          icon: "success",
          title: "Sent to Steadfast!",
          html: `
    <div class="text-left">
          <p><strong>Product Code:</strong> ${
            currentOrder?.items
              ?.map((item) => item.productCode)
              .filter(Boolean)
              .join(", ") || "Not Found"
          }</p>
      <p><strong>Consignment ID:</strong> ${data.data.consignmentId}</p>

      ${
        data.data.trackingUrl
          ? `<p><a href="${data.data.trackingUrl}" target="_blank" class="text-[#d4af37] underline">View Tracking</a></p>`
          : ""
      }
    </div>
  `,
          confirmButtonColor: "#d4af37",
        });

        if (selectedOrder?._id === id) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  steadfast: data.data,
                }
              : null,
          );
        }
      } else {
        Swal.fire(
          "Error",
          data.message || "Failed to send to Steadfast!",
          "error",
        );
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message || "Something went wrong!", "error");
    } finally {
      setStedastLoadingId(null);
    }
  };

  const handleSendToPathao = async (id) => {
    const currentOrder = orders.find((order) => order._id === id);
    if (pathaoLoadingId === id) return;

    const result = await Swal.fire({
      title: "Send to Pathao?",
      text: "This will create a shipment in Pathao. You cannot undo this action.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#eb7029",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, send it!",
    });

    if (!result.isConfirmed) return;

    try {
      setPathaoLoadingId(id);

      const res = await fetch(`${baseUrl}/api/orders/${id}/pathao`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Request failed");
      }

      if (data.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === id
              ? {
                  ...order,
                  pathao: data.data,
                }
              : order,
          ),
        );

        Swal.fire({
          icon: "success",
          title: "Sent to Pathao!",
          html: `
    <div class="text-left">
          <p>
        <strong>Product Code:</strong>
        ${
          currentOrder?.items
            ?.map((item) => item.productCode)
            .filter(Boolean)
            .join(", ") || "Not Found"
        }
      </p>
      <p><strong>Consignment ID:</strong> ${data.data.consignmentId}</p>
      <p><strong>Merchant Order ID:</strong> ${data.data.merchantOrderId}</p>
    </div>
  `,
          confirmButtonColor: "#eb7029",
        });

        if (selectedOrder?._id === id) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  pathao: data.data,
                }
              : null,
          );
        }
      } else {
        Swal.fire(
          "Error",
          data.message || "Failed to send to Pathao!",
          "error",
        );
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message || "Something went wrong!", "error");
    } finally {
      setPathaoLoadingId(null);
    }
  };

  const fetchCounts = async () => {
    const res = await fetch(`${baseUrl}/api/orders/counts`);
    const data = await res.json();

    if (data.success) {
      setCounts(data.data);
    }
  };

  const formatPhoneForWhatsApp = (phone) => {
    // Remove spaces, dashes, parentheses, etc.
    let cleaned = phone.replace(/\D/g, "");

    // +88017XXXXXXXX -> 88017XXXXXXXX
    if (cleaned.startsWith("880")) {
      return cleaned;
    }

    // 017XXXXXXXX -> 88017XXXXXXXX
    if (cleaned.startsWith("0")) {
      return `88${cleaned}`;
    }

    // 171XXXXXXXX -> 88017XXXXXXXX
    if (cleaned.length === 10 && cleaned.startsWith("1")) {
      return `880${cleaned}`;
    }

    // Already invalid
    return null;
  };

  const handleWhatsAppChat = (order) => {
    const phone = formatPhoneForWhatsApp(order.phone);

    if (!phone) {
      alert("Invalid phone number");
      return;
    }

    const url = `https://wa.me/${phone}`;

    window.open(url, "_blank");

    setPendingWhatsAppOrderId(order._id);
  };

  const handleCall = async (order) => {
    try {
      const res = await fetch(`${baseUrl}/api/orders/${order._id}/call`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updatedBy: user.userName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update call count");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id
            ? {
                ...o,
                call: data.data,
              }
            : o,
        ),
      );

      if (selectedOrder?._id === order._id) {
        setSelectedOrder((prev) => ({
          ...prev,
          call: data.data,
        }));
      }

      setPendingCallOrderId(order._id);

      window.location.href = `tel:${order.phone}`;
    } catch (error) {
      console.error(error);
      toast.error("Failed to update call count.");
    }
  };

  const handleCopyWhatsAppMessage = async (order) => {
    const productNames = order.items.map((item) => item.name).join(", ");

    const message = `আসসালামু আলাইকুম ${order.customerName} স্যার/ ম্যাম,

আমি বারাকাহ ইসলামিক ক্লক অ্যান্ড ক্যানভাস থেকে বলছি।

আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।

🛍️ পণ্যের নাম:
${productNames}

💰 মূল্য: ৳${order.total}
📍 ডেলিভারি ঠিকানা: ${order.address}

আমরা প্রডাক্টটি কি এখন পাঠিয়ে দেব?

বারাকাহ থেকে অর্ডার করার জন্য আপনাকে আন্তরিক ধন্যবাদ।`;

    await navigator.clipboard.writeText(message);

    Swal.fire({
      icon: "success",
      title: "Copied!",
      text: "WhatsApp message copied.",
      timer: 1500,
      showConfirmButton: false,
    });
    setPendingWhatsAppOrderId(order._id);
  };

  const updateWhatsAppStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${baseUrl}/api/orders/${orderId}/whatsapp`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          updatedBy: user.userName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update WhatsApp status");
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "WhatsApp status updated.",
        confirmButtonText: "OK",
      });

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? {
                ...order,
                whatsapp: {
                  ...(order.whatsapp || {}),
                  status,
                  updatedAt: new Date().toISOString(),
                  updatedBy: user?.userName || "Admin",
                },
              }
            : order,
        ),
      );

      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) => ({
          ...prev,
          whatsapp: {
            ...(prev.whatsapp || {}),
            status,
            updatedAt: new Date().toISOString(),
            updatedBy: user?.userName || "Admin",
          },
        }));
      }

      setPendingWhatsAppOrderId(null);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      // Get previous status before updating
      const previousStatus = orders.find((o) => o._id === orderId)?.status;

      const res = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update order status");
      }

      await Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Order status updated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      // Update orders
      setOrders((prev) => {
        const updatedOrders = prev.map((order) =>
          order._id === orderId ? { ...order, status } : order,
        );

        if (statusFilter === "all") {
          return updatedOrders;
        }

        return updatedOrders.filter((order) => order.status === statusFilter);
      });

      // Update counts
      if (previousStatus && previousStatus !== status) {
        setCounts((prev) => ({
          ...prev,
          [previousStatus]: Math.max((prev[previousStatus] || 0) - 1, 0),
          [status]: (prev[status] || 0) + 1,
        }));
      }

      // Update selected order
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) => ({
          ...prev,
          status,
        }));
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
  };

  useEffect(() => {
    const handleVisibilityChange = async () => {
      const order = orders.find((o) => o._id === pendingWhatsAppOrderId);
      if (
        !document.hidden &&
        order &&
        (!order.whatsapp || order.whatsapp.status === "pending")
      ) {
        const result = await Swal.fire({
          title: "WhatsApp Confirmation",
          text: "Did you successfully send the confirmation message to the customer?",
          icon: "question",
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: "Message Sent",
          denyButtonText: "No WhatsApp",
          cancelButtonText: "Later",
        });

        if (result.isConfirmed) {
          await updateWhatsAppStatus(pendingWhatsAppOrderId, "sent");
        } else if (result.isDenied) {
          await updateWhatsAppStatus(pendingWhatsAppOrderId, "no_whatsapp");
        }

        setPendingWhatsAppOrderId(null);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [pendingWhatsAppOrderId, orders]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) return;

      const order = orders.find((o) => o._id === pendingCallOrderId);

      if (!order) return;

      const result = await Swal.fire({
        title: "Call Confirmation",
        text: "Did the customer respond to the call?",
        icon: "question",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Yes",
        denyButtonText: "No",
        cancelButtonText: "Later",
      });

      if (result.isDenied) {
        await updateOrderStatus(pendingCallOrderId, "no_response");
      }

      setPendingCallOrderId(null);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pendingCallOrderId, orders]);

  useEffect(() => {
    if (!baseUrl) return;

    fetchCounts();
  }, [baseUrl]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#e5dccf] p-6 flex justify-center py-12">
        <LoadingAnimation
          width={300}
          height={300}
          message="Loading orders..."
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

  const getModeratorPerformance = (order) => {
    const actionTime =
      order.status === "delivered"
        ? order.deliveredAt
        : order.status === "cancelled"
          ? order.cancelledAt
          : null;

    if (!actionTime) return null;

    const created = new Date(order.createdAt);
    const action = new Date(actionTime);

    const diffMinutes = Math.floor((action - created) / (1000 * 60));

    if (diffMinutes <= 20) {
      return { label: "⭐⭐⭐⭐⭐ Very Good", time: diffMinutes };
    }

    if (diffMinutes <= 40) {
      return { label: "⭐⭐⭐⭐ Good", time: diffMinutes };
    }

    if (diffMinutes <= 60) {
      return { label: "⭐⭐⭐ Average", time: diffMinutes };
    }

    if (diffMinutes <= 120) {
      return { label: "⭐⭐ Needs Improvement", time: diffMinutes };
    }

    return { label: "⭐ Poor", time: diffMinutes };
  };

  const performance = selectedOrder
    ? getModeratorPerformance(selectedOrder)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#e5dccf] p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#3d2f1f]">All Orders</h1>
            <p className="text-sm text-[#7a6a58] mt-1">
              Manage customer orders and mark them as delivered.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                handleFilterChange("all");
              }}
              className={`btn btn-sm ${
                statusFilter === "all"
                  ? "bg-[#d4af37] text-white border-[#d4af37]"
                  : "bg-white text-[#3d2f1f] border-[#e5dccf]"
              }`}
            >
              All ({counts.all})
            </button>

            <button
              onClick={() => {
                handleFilterChange("verification_required");
              }}
              className={`btn btn-sm ${
                statusFilter === "verification_required"
                  ? "bg-[#d4af37] text-white border-[#d4af37]"
                  : "bg-white text-[#3d2f1f] border-[#e5dccf]"
              }`}
            >
              Verify ({counts.verification_required})
            </button>

            <button
              onClick={() => {
                handleFilterChange("pending");
              }}
              className={`btn btn-sm ${
                statusFilter === "pending"
                  ? "bg-[#d4af37] text-white border-[#d4af37]"
                  : "bg-white text-[#3d2f1f] border-[#e5dccf]"
              }`}
            >
              Pending ({counts.pending})
            </button>

            <button
              onClick={() => {
                handleFilterChange("no_response");
              }}
              className={`btn btn-sm ${
                statusFilter === "no_response"
                  ? "bg-[#d4af37] text-white border-[#d4af37]"
                  : "bg-white text-[#3d2f1f] border-[#e5dccf]"
              }`}
            >
              No Response ({counts.no_response})
            </button>

            <button
              onClick={() => {
                handleFilterChange("delivered");
              }}
              className={`btn btn-sm ${
                statusFilter === "delivered"
                  ? "bg-[#d4af37] text-white border-[#d4af37]"
                  : "bg-white text-[#3d2f1f] border-[#e5dccf]"
              }`}
            >
              Delivered ({counts.delivered})
            </button>

            <button
              onClick={() => {
                handleFilterChange("cancelled");
              }}
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
      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5dccf] p-6">
          <p className="text-[#7a6a58]">No orders found.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
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
                    <th>Items</th>
                    <th>Order Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order, index) => (
                    <tr key={order._id}>
                      <td>{index + 1}</td>

                      <td>
                        <div>
                          <p className="font-semibold text-[#3d2f1f]">
                            {order.customerName}
                          </p>
                          {order.notes && (
                            <p className="text-xs text-[#7a6a58]">
                              Notes: {order.notes}
                            </p>
                          )}
                        </div>
                      </td>

                      <td>{order.phone}</td>
                      <td className="max-w-55 whitespace-normal">
                        {order.address}
                      </td>
                      <td>৳ {order.total}</td>
                      <td>
                        <div className="space-y-1 text-sm">
                          {order.items?.map((item, i) => (
                            <p key={i}>
                              {item.name} × {item.quantity}
                            </p>
                          ))}
                        </div>
                      </td>

                      <td>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString("en-BD", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "--"}
                      </td>

                      <td>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="btn btn-sm bg-white text-[#3d2f1f] border border-[#d4af37] hover:bg-[#faf7f0]"
                          >
                            View
                          </button>

                          {order.status === "verification_required" ? (
                            <button
                              onClick={() => handleVerifyOrder(order._id)}
                              className="btn btn-sm bg-[#4f46e5] text-white border-none hover:bg-[#4338ca]"
                            >
                              Verify
                            </button>
                          ) : (
                            order.status !== "verification_required" && (
                              <>
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
                                      handleMarkDelivered(order._id)
                                    }
                                    className="btn btn-sm bg-[#d4af37] text-white border-none hover:bg-[#c39d2f]"
                                    disabled={loadingId === order._id}
                                  >
                                    {loadingId === order._id
                                      ? "Updating..."
                                      : "Deliver"}
                                  </button>
                                )}
                              </>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-4 lg:hidden">
            {orders.map((order, index) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-[#e5dccf] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#3d2f1f]">
                      {index + 1}. {order.customerName}
                    </p>
                    <p className="text-sm text-[#7a6a58]">{order.phone}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-[#3d2f1f]">
                  {order.area && (
                    <p>
                      <span className="font-semibold">Area:</span> {order.area}
                    </p>
                  )}

                  <p>
                    <span className="font-semibold">Address:</span>{" "}
                    {order.address}
                  </p>

                  <p>
                    <span className="font-semibold">Total:</span> ৳{" "}
                    {order.total}
                  </p>

                  <div>
                    <span className="font-semibold">Items:</span>
                    <div className="mt-1 space-y-1 text-sm">
                      {order.items?.map((item, i) => (
                        <p key={i}>
                          {item.name} × {item.quantity}
                        </p>
                      ))}
                    </div>
                  </div>

                  <p>
                    <span className="font-semibold">Date:</span>{" "}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString("en-BD", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"}
                  </p>

                  {order.notes && (
                    <p>
                      <span className="font-semibold">Notes:</span>{" "}
                      {order.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="btn btn-sm w-full bg-white text-[#3d2f1f] border border-[#d4af37] hover:bg-[#faf7f0]"
                  >
                    View Order
                  </button>

                  {order.status === "verification_required" ? (
                    <button
                      onClick={() => handleVerifyOrder(order._id)}
                      className="btn btn-sm bg-[#4f46e5] text-white border-none hover:bg-[#4338ca]"
                    >
                      Verify Order
                    </button>
                  ) : (
                    order.status !== "verification_required" && (
                      <>
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
                            onClick={() => handleMarkDelivered(order._id)}
                            className="btn btn-sm bg-[#d4af37] text-white border-none hover:bg-[#c39d2f]"
                            disabled={loadingId === order._id}
                          >
                            {loadingId === order._id
                              ? "Updating..."
                              : "Deliver"}
                          </button>
                        )}
                      </>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
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
                  Order Details
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
              {/* Customer Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[#e5dccf] p-4">
                  <h3 className="mb-3 font-semibold text-[#3d2f1f]">
                    Customer Info
                  </h3>

                  <div className="space-y-2 text-sm text-[#3d2f1f]">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {selectedOrder.customerName}
                    </p>

                    <p className="flex items-center gap-3">
                      <span>
                        <span className="font-semibold">Phone:</span>{" "}
                        {selectedOrder.phone}
                      </span>
                    </p>

                    <p>
                      <span className="font-semibold">Address:</span>{" "}
                      {selectedOrder.address}
                    </p>

                    {selectedOrder.notes && (
                      <p>
                        <span className="font-semibold">Notes:</span>{" "}
                        {selectedOrder.notes}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={() => handleCall(selectedOrder)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 transition-colors"
                      >
                        <LuPhone className="w-3 h-3" />
                        <span>Call</span>
                      </button>

                      <button
                        onClick={() => handleWhatsAppChat(selectedOrder)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#1dd460] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
                      >
                        <FaWhatsapp className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleCopyWhatsAppMessage(selectedOrder)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-slate-600 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                      >
                        <LuCopy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                    </div>

                    {selectedOrder.whatsapp && (
                      <div className="border-t border-[#e5dccf] pt-3 mt-3 space-y-2">
                        <h5 className="font-semibold text-[#3d2f1f]">
                          WhatsApp Status
                        </h5>

                        <p>
                          <span className="font-medium">Status:</span>{" "}
                          {selectedOrder.whatsapp.status === "sent" ? (
                            <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                              Sent
                            </span>
                          ) : selectedOrder.whatsapp.status ===
                            "no_whatsapp" ? (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                              No WhatsApp
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                              Pending
                            </span>
                          )}
                        </p>

                        {selectedOrder.whatsapp.updatedBy && (
                          <p>
                            <span className="font-medium">Updated By:</span>{" "}
                            {selectedOrder.whatsapp.updatedBy}
                          </p>
                        )}

                        {selectedOrder.whatsapp.updatedAt && (
                          <p>
                            <span className="font-medium">Updated At:</span>{" "}
                            {new Date(
                              selectedOrder.whatsapp.updatedAt,
                            ).toLocaleString("en-BD", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        )}

                        {selectedOrder.call && (
                          <div className="border-t border-[#e5dccf] pt-3 mt-3 space-y-2">
                            <h5 className="font-semibold text-[#3d2f1f]">
                              Call Information
                            </h5>

                            <p>
                              <span className="font-medium">Called:</span>{" "}
                              {selectedOrder.call.count}{" "}
                              {selectedOrder.call.count === 1
                                ? "time"
                                : "times"}
                            </p>

                            {selectedOrder.call.updatedBy && (
                              <p>
                                <span className="font-medium">Updated By:</span>{" "}
                                {selectedOrder.call.updatedBy}
                              </p>
                            )}

                            {selectedOrder.call.updatedAt && (
                              <p>
                                <span className="font-medium">
                                  Last Called:
                                </span>{" "}
                                {new Date(
                                  selectedOrder.call.updatedAt,
                                ).toLocaleString("en-BD", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedOrder.source && (
                      <>
                        <div className="border-t border-[#e5dccf] pt-2 mt-2">
                          <h5 className="font-semibold mb-2">Order Source:</h5>
                          <p>
                            <span className="font-medium">Source:</span>{" "}
                            {selectedOrder.source.traffic_source || "direct"}
                          </p>
                          {selectedOrder.source.traffic_medium && (
                            <p>
                              <span className="font-medium">Medium:</span>{" "}
                              {selectedOrder.source.traffic_medium}
                            </p>
                          )}
                          {selectedOrder.source.traffic_campaign && (
                            <p>
                              <span className="font-medium">Campaign:</span>{" "}
                              {selectedOrder.source.traffic_campaign}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[#e5dccf] p-4">
                  <h3 className="mb-3 font-semibold text-[#3d2f1f]">
                    Order Summary
                  </h3>

                  <div className="space-y-2 text-sm text-[#3d2f1f]">
                    <p>
                      <span className="font-semibold">Status:</span>{" "}
                      {selectedOrder.status === "delivered"
                        ? "Delivered"
                        : selectedOrder.status === "cancelled"
                          ? "Cancelled"
                          : selectedOrder.status === "pending"
                            ? "Pending"
                            : "No Response"}
                    </p>

                    <p>
                      <span className="font-semibold">Order Date:</span>{" "}
                      {new Date(selectedOrder.createdAt).toLocaleString(
                        "en-BD",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        },
                      )}
                    </p>

                    {selectedOrder.status === "delivered" &&
                      selectedOrder.deliveredAt && (
                        <p>
                          <span className="font-semibold">Delivered At:</span>{" "}
                          {new Date(selectedOrder.deliveredAt).toLocaleString(
                            "en-BD",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            },
                          )}
                        </p>
                      )}
                    {selectedOrder.status === "cancelled" &&
                      selectedOrder.cancelledAt && (
                        <p>
                          <span className="font-semibold">Cancelled At:</span>{" "}
                          {new Date(selectedOrder.cancelledAt).toLocaleString(
                            "en-BD",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            },
                          )}
                        </p>
                      )}

                    {performance && (
                      <p className="flex flex-wrap gap-1">
                        <span className="font-semibold whitespace-nowrap">
                          Handling Speed:
                        </span>
                        <span>
                          {performance.label} ({performance.time} min)
                        </span>
                      </p>
                    )}

                    {selectedOrder.status === "delivered" &&
                      selectedOrder.deliveredBy && (
                        <p>
                          <span className="font-semibold">Delivered By:</span>{" "}
                          {selectedOrder.deliveredBy}
                        </p>
                      )}

                    {selectedOrder.status === "cancelled" &&
                      selectedOrder.cancelledBy && (
                        <p>
                          <span className="font-semibold">Cancelled By:</span>{" "}
                          {selectedOrder.cancelledBy}
                        </p>
                      )}

                    {selectedOrder.status === "delivered" &&
                      selectedOrder.verifiedBy && (
                        <p>
                          <span className="font-semibold">Verified By:</span>{" "}
                          {selectedOrder.verifiedBy}
                        </p>
                      )}

                    <p>
                      <span className="font-semibold">Delivery Method:</span>{" "}
                      {selectedOrder.shippingType === "inside"
                        ? "Inside Dhaka"
                        : selectedOrder.shippingType === "outside"
                          ? "Outside Dhaka"
                          : "—"}
                    </p>

                    <p>
                      <span className="font-semibold">Payment Method:</span>{" "}
                      {selectedOrder.paymentMethod === "bkash"
                        ? "Bkash"
                        : selectedOrder.paymentMethod === "nagad"
                          ? "Nagad"
                          : selectedOrder.paymentMethod === "cod"
                            ? "Cash on Delivery"
                            : "—"}
                    </p>

                    {(selectedOrder.paymentMethod === "bkash" ||
                      selectedOrder.paymentMethod === "nagad") && (
                      <p>
                        <span className="font-semibold">Last 4 Digits:</span>{" "}
                        {selectedOrder.accountLast4 || "—"}
                      </p>
                    )}

                    <p>
                      <span className="font-semibold">Subtotal:</span> ৳{" "}
                      {selectedOrder.subtotal || 0}
                    </p>

                    <p>
                      <span className="font-semibold">Shipping:</span> ৳{" "}
                      {selectedOrder.shippingCost || 0}
                    </p>

                    <p className="text-base font-bold text-[#3d2f1f]">
                      Total: ৳ {selectedOrder.total || 0}
                    </p>

                    {selectedOrder.steadfast && (
                      <div className="border-t border-[#e5dccf] pt-3 mt-3">
                        <p className="font-semibold mb-2">
                          Steadfast Tracking:
                        </p>
                        <p className="capitalize">
                          <span className="font-medium">Account:</span>{" "}
                          {selectedOrder.steadfast.account || "Not Found"}
                        </p>
                        <p>
                          <span className="font-medium">Status:</span>{" "}
                          <span className="text-[#d4af37]">Sent</span>
                        </p>
                        <p>
                          <span className="font-medium">Product Code:</span>{" "}
                          {selectedOrder.items
                            .map((item) => item.productCode)
                            .filter(Boolean)
                            .join(", ") || "Not Found"}
                        </p>
                        <p>
                          <span className="font-medium">Consignment ID:</span>{" "}
                          {selectedOrder.steadfast.consignmentId}
                        </p>
                        {selectedOrder.steadfast.trackingUrl && (
                          <p>
                            <a
                              href={selectedOrder.steadfast.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-[#d4af37] underline hover:text-[#c39d2f]"
                            >
                              View Tracking
                            </a>
                          </p>
                        )}
                        {selectedOrder.steadfast.sentAt && (
                          <p>
                            <span className="font-medium">Sent at:</span>{" "}
                            {new Date(
                              selectedOrder.steadfast.sentAt,
                            ).toLocaleString("en-BD", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    {selectedOrder.pathao && (
                      <div className="border-t border-[#e5dccf] pt-3 mt-3">
                        <p className="font-semibold mb-2">Pathao Shipment:</p>

                        <p>
                          <span className="font-medium">Status:</span>{" "}
                          <span className="text-[#eb7029]">Sent</span>
                        </p>
                        <p>
                          <span className="font-medium">Product Code:</span>{" "}
                          {selectedOrder.items
                            .map((item) => item.productCode)
                            .filter(Boolean)
                            .join(", ") || "Not Found"}
                        </p>

                        <p>
                          <span className="font-medium">Consignment ID:</span>{" "}
                          {selectedOrder.pathao.consignmentId}
                        </p>

                        <p>
                          <span className="font-medium">
                            Merchant Order ID:
                          </span>{" "}
                          {selectedOrder.pathao.merchantOrderId}
                        </p>

                        {selectedOrder.pathao.sentAt && (
                          <p>
                            <span className="font-medium">Sent at:</span>{" "}
                            {new Date(
                              selectedOrder.pathao.sentAt,
                            ).toLocaleString("en-BD", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedOrder.fraudCheck && (
                <div className="rounded-xl border border-base-300 bg-base-100 p-4 sm:p-6 space-y-6 text-base-content">
                  {/* 1. TOP HEADER & METRIC STRIP */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-base-200">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-[#3d3d3d] tracking-tight">
                          Fraud Assessment
                        </h3>

                        {selectedOrder.fraudCheck.riskLabel ? (
                          <span
                            className={`badge badge-sm font-bold uppercase tracking-wider border-0 ${
                              selectedOrder.fraudCheck.riskColor === "green"
                                ? "badge-success text-white bg-green-700"
                                : selectedOrder.fraudCheck.riskColor ===
                                    "yellow"
                                  ? "badge-warning text-white bg-yellow-600"
                                  : "badge-error text-white bg-red-600"
                            }`}
                          >
                            {selectedOrder.fraudCheck.riskLabel}
                          </span>
                        ) : (
                          <span className="badge-error text-white bg-red-600 badge badge-sm font-bold uppercase tracking-wider">
                            Failed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-base-content/60 mt-0.5">
                        Logistics footprint across digital channels
                      </p>
                    </div>

                    {/* Main Stat Strips */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-base-200/40 p-2 rounded-lg text-center">
                      <div className="px-2 sm:px-4">
                        <p className="text-[10px] uppercase font-sans font-medium text-base-content/50">
                          Success
                        </p>
                        <p className="text-base sm:text-lg font-bold text-green-600">
                          {selectedOrder.fraudCheck.successRatio}%
                        </p>
                      </div>
                      <div className="border-x border-base-300 px-2 sm:px-4">
                        <p className="text-[10px] uppercase font-sans font-medium text-base-content/50">
                          Parcels
                        </p>
                        <p className="text-base sm:text-lg font-bold">
                          {selectedOrder.fraudCheck.totalParcels}
                        </p>
                      </div>
                      <div className="px-2 sm:px-4">
                        <p className="text-[10px] uppercase font-sans font-medium text-base-content/50">
                          Alerts
                        </p>
                        <p
                          className={`text-base sm:text-lg font-bold ${selectedOrder.fraudCheck.totalFraudReports > 0 ? "text-error" : "opacity-40"}`}
                        >
                          {selectedOrder.fraudCheck.totalFraudReports}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. RESPONSIVE SPLIT BLOCK (Banner & Meta Indicators) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Risk Notification Banner */}
                    <div
                      className={`md:col-span-2 rounded-xl p-4 flex flex-col justify-center border ${
                        selectedOrder.fraudCheck.riskColor === "green"
                          ? "bg-green-100/50 border-green-200/50 text-green-800"
                          : selectedOrder.fraudCheck.riskColor === "yellow"
                            ? "bg-yellow-100/50 border-yellow-200/50 text-yellow-800"
                            : "bg-red-100/50 border-red-200/50 text-red-800"
                      }`}
                    >
                      <p className="text-sm font-bold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                        {selectedOrder.fraudCheck.riskAction}
                      </p>
                      <p className="text-xs mt-1 opacity-80 leading-relaxed">
                        {selectedOrder.fraudCheck.flagReason}
                      </p>
                    </div>

                    {/* Verification Parameters */}
                    <div className="bg-base-200/30 border border-base-200 rounded-xl p-4 flex flex-col justify-between gap-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="opacity-60">System Flag:</span>
                        {selectedOrder.fraudCheck.riskLevel ? (
                          <span className="font-semibold text-base-content capitalize">
                            {selectedOrder.fraudCheck.riskLevel}
                          </span>
                        ) : (
                          <span className="text-xs text-base-content/40">
                            Not Found
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="opacity-60">Verification status:</span>
                        <span
                          className={`font-semibold ${selectedOrder.fraudCheck.needsVerification ? "text-red-600" : "text-green-600"}`}
                        >
                          {selectedOrder.fraudCheck.needsVerification
                            ? "Action Needed"
                            : "Cleared"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="opacity-60">
                          API Gateway Response:
                        </span>
                        <span className="font-semibold capitalize">
                          {selectedOrder.fraudCheck.apiStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. PERFORMANCE BREAKDOWN TABLE & CHANNEL STATS */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-sm font-bold opacity-80">
                        Fulfillment Performance History
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        <span>
                          Website Orders:{" "}
                          <strong className="font-semibold">
                            {selectedOrder.fraudCheck.totalWebsiteOrders}
                          </strong>
                        </span>
                        <span className="text-error/80">
                          Web Cancellations:{" "}
                          <strong className="font-semibold">
                            {
                              selectedOrder.fraudCheck
                                .totalCancelledWebsiteOrders
                            }
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* MOBILE VIEW: Turns into individual stacked cards (hidden on md screens and up) */}
                    <div className="space-y-3 md:hidden">
                      {Object.entries(
                        selectedOrder.fraudCheck.couriers || {},
                      ).map(([name, courier]) => (
                        <div
                          key={name}
                          className="border border-base-200 rounded-xl p-4 bg-base-200/20 text-xs space-y-2"
                        >
                          <div className="flex justify-between items-center border-b border-base-200/60 pb-2">
                            <span className="capitalize font-bold text-sm text-base-content">
                              {name}
                            </span>
                            <span
                              className={`font-bold ${
                                courier.successRatio >= 80
                                  ? "text-green-600"
                                  : courier.successRatio >= 60
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {courier.successRatio}% Success Rate
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-1 text-center opacity-80">
                            <div>
                              <p className="text-[10px]">Total</p>
                              <p className="font-semibold text-base-content mt-0.5">
                                {courier.total}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px]">Delivered</p>
                              <p className="font-semibold text-green-600 mt-0.5">
                                {courier.delivered}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px]">Cancelled</p>
                              <p className="font-semibold text-red-600 mt-0.5">
                                {courier.cancelled}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* DESKTOP VIEW: Clean table layout (hidden on mobile layout up to md breakpoint) */}
                    <div className="hidden md:block border border-base-200 rounded-xl overflow-hidden">
                      <table className="table table-sm w-full">
                        <thead>
                          <tr className="bg-base-200/50 border-b border-base-200 text-xs">
                            <th className="py-2.5">Courier Partner</th>
                            <th className="text-center">Total Volume</th>
                            <th className="text-center">Delivered</th>
                            <th className="text-center">Cancelled</th>
                            <th className="text-right">Reliability Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-base-200/60 text-xs">
                          {Object.entries(
                            selectedOrder.fraudCheck.couriers || {},
                          ).map(([name, courier]) => (
                            <tr
                              key={name}
                              className="hover:bg-base-200/20 transition-colors"
                            >
                              <td className="capitalize font-semibold text-base-content py-3">
                                {name}
                              </td>
                              <td className="text-center font-semibold">
                                {courier.total}
                              </td>
                              <td className="text-center  text-green-600 font-semibold">
                                {courier.delivered}
                              </td>
                              <td className="text-center  text-red-600 font-semibold">
                                {courier.cancelled}
                              </td>
                              <td className="text-right">
                                <span
                                  className={` font-bold ${
                                    courier.successRatio >= 80
                                      ? "text-green-600"
                                      : courier.successRatio >= 60
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                  }`}
                                >
                                  {courier.successRatio}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Ordered Items */}
              <div className="rounded-xl border border-[#e5dccf] p-4">
                <h3 className="mb-4 font-semibold text-[#3d2f1f]">
                  Ordered Items
                </h3>

                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4 rounded-xl border border-[#f1eadf] p-3"
                    >
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            className="h-24 w-24 rounded-lg border border-[#e5dccf] object-cover"
                            width={64}
                            height={64}
                          />
                        )}

                        <div>
                          <p className="font-medium text-[#3d2f1f]">
                            {item.name}
                          </p>
                          <p className="text-sm text-[#7a6a58]">
                            {item.productCode}
                          </p>
                          <p className="text-sm text-[#7a6a58]">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-sm text-[#3d2f1f]">
                        <p>৳ {item.price}</p>
                        <p className="font-semibold">
                          ৳ {(item.price || 0) * (item.quantity || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Action */}
              <div className="grid md:flex grid-cols-2 gap-2 justify-center md:justify-end">
                {selectedOrder.status !== "delivered" &&
                  selectedOrder.status !== "cancelled" && (
                    <button
                      onClick={() =>
                        handleSelectSteadfastAccount(selectedOrder._id)
                      }
                      className="btn btn-xs md:btn-sm bg-[#01B795] text-white border-none hover:bg-[#00886f]"
                    >
                      Send To Steadfast
                    </button>
                  )}

                {selectedOrder.status !== "delivered" &&
                  selectedOrder.status !== "cancelled" &&
                  (selectedOrder.pathao?.consignmentId ? (
                    <button
                      className="btn btn-xs md:btn-sm cursor-not-allowed"
                      disabled
                    >
                      Sent to Pathao
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendToPathao(selectedOrder._id)}
                      className="btn btn-xs md:btn-sm bg-[#eb7029] text-white border-none hover:bg-[#a3420a]"
                      disabled={pathaoLoadingId === selectedOrder._id}
                    >
                      {pathaoLoadingId === selectedOrder._id
                        ? "Sending..."
                        : "Send To Pathao"}
                    </button>
                  ))}

                {selectedOrder.status === "cancelled" ? (
                  <button className="btn btn-xs md:btn-sm" disabled>
                    Cancelled
                  </button>
                ) : selectedOrder.status === "delivered" ? (
                  <button className="btn btn-xs md:btn-sm" disabled>
                    Delivered
                  </button>
                ) : (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder._id)}
                    className="btn btn-xs md:btn-sm bg-red-600 text-white border-none hover:bg-red-700"
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
