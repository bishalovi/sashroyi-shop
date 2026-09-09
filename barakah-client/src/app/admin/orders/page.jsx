/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import LoadingAnimation from "@/components/shared/LoadingAnimation";
import { LuCopy, LuPhone, LuPencil, LuSave, LuDownload, LuTruck, LuPlus, LuTrash2, LuBan, LuShieldCheck, LuCheckSquare } from "react-icons/lu";
import { RxCross1 } from "react-icons/rx";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";

const getOrdinalNumber = (n) => {
  if (!n || n <= 0) return "1st";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function OrdersPage() {
  const baseUrl = "https://sashroyi-api.onrender.com";
  const { user } = useAuth();
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
    confirmed: 0,
    in_courier: 0,
    no_response: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
  });

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  // Add Manual Order States
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [addOrderCustomerName, setAddOrderCustomerName] = useState("");
  const [addOrderPhone, setAddOrderPhone] = useState("");
  const [addOrderAddress, setAddOrderAddress] = useState("");
  const [addOrderNotes, setAddOrderNotes] = useState("");
  const [addOrderSource, setAddOrderSource] = useState("whatsapp");
  const [addOrderStatus, setAddOrderStatus] = useState("confirmed");
  const [addOrderShippingType, setAddOrderShippingType] = useState("inside");
  const [addOrderShippingCost, setAddOrderShippingCost] = useState(60);
  const [addOrderDiscount, setAddOrderDiscount] = useState(0);
  const [addOrderPaymentMethod, setAddOrderPaymentMethod] = useState("cod");
  const [addOrderItems, setAddOrderItems] = useState([]);
  const [isSubmittingNewOrder, setIsSubmittingNewOrder] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");

  const fetchProductsForOrder = async () => {
    if (availableProducts.length > 0) return;
    try {
      setLoadingProducts(true);
      const res = await fetch(`${baseUrl}/api/products`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAvailableProducts(data.data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenAddOrder = () => {
    setIsAddOrderOpen(true);
    fetchProductsForOrder();
    setAddOrderCustomerName("");
    setAddOrderPhone("");
    setAddOrderAddress("");
    setAddOrderNotes("");
    setAddOrderSource("whatsapp");
    setAddOrderStatus("confirmed");
    setAddOrderShippingType("inside");
    setAddOrderShippingCost(60);
    setAddOrderDiscount(0);
    setAddOrderPaymentMethod("cod");
    setAddOrderItems([]);
    setSelectedProductId("");
  };

  const handleCloseAddOrder = () => {
    setIsAddOrderOpen(false);
  };

  const handleAddProductToOrder = (productId) => {
    if (!productId) return;
    const prod = availableProducts.find((p) => p._id === productId);
    if (!prod) return;

    const existingIndex = addOrderItems.findIndex((it) => it.productId === prod._id);
    if (existingIndex > -1) {
      setAddOrderItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: Number(it.quantity || 1) + 1 } : it
        )
      );
    } else {
      setAddOrderItems((prev) => [
        ...prev,
        {
          productId: prod._id,
          name: prod.name,
          productCode: prod.productCode || "",
          price: Number(prod.price) || 0,
          quantity: 1,
          image: prod.image || "",
        },
      ]);
    }
    setSelectedProductId("");
  };

  const handleAddCustomProduct = () => {
    setAddOrderItems((prev) => [
      ...prev,
      {
        productId: `custom_${Date.now()}`,
        name: "Custom Product",
        productCode: "",
        price: 0,
        quantity: 1,
        image: "",
      },
    ]);
  };

  const handleRemoveOrderItem = (index) => {
    setAddOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewItemQtyChange = (index, delta) => {
    setAddOrderItems((prev) =>
      prev.map((it, i) => {
        if (i === index) {
          return { ...it, quantity: Math.max(1, (Number(it.quantity) || 1) + delta) };
        }
        return it;
      })
    );
  };

  const handleNewItemPriceChange = (index, newPrice) => {
    setAddOrderItems((prev) =>
      prev.map((it, i) => {
        if (i === index) {
          return { ...it, price: Math.max(0, Number(newPrice) || 0) };
        }
        return it;
      })
    );
  };

  const handleNewItemNameChange = (index, newName) => {
    setAddOrderItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, name: newName } : it))
    );
  };

  const handleCreateNewOrder = async (e) => {
    if (e) e.preventDefault();

    if (!addOrderCustomerName.trim()) {
      toast.error("গ্রাহকের নাম লিখুন");
      return;
    }
    if (!addOrderPhone.trim()) {
      toast.error("গ্রাহকের ফোন নম্বর লিখুন");
      return;
    }
    if (!addOrderAddress.trim()) {
      toast.error("গ্রাহকের পূর্ণ ডেলিভারি ঠিকানা লিখুন");
      return;
    }
    if (addOrderItems.length === 0) {
      toast.error("কমপক্ষে একটি প্রোডাক্ট যোগ করুন");
      return;
    }

    try {
      setIsSubmittingNewOrder(true);
      const subtotal = addOrderItems.reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
        0
      );
      const shipping = Number(addOrderShippingCost) || 0;
      const discount = Number(addOrderDiscount) || 0;
      const total = Math.max(0, subtotal + shipping - discount);

      const orderPayload = {
        customerName: addOrderCustomerName.trim(),
        phone: addOrderPhone.trim(),
        address: addOrderAddress.trim(),
        notes: addOrderNotes.trim(),
        shippingType: addOrderShippingType,
        shippingCost: shipping,
        discount: discount,
        paymentMethod: addOrderPaymentMethod,
        items: addOrderItems,
        subtotal: subtotal,
        total: total,
        status: addOrderStatus,
        source: {
          traffic_source: addOrderSource,
          traffic_medium: "manual_admin",
          traffic_campaign: "direct_order",
        },
        createdBy: user?.userName || "admin",
      };

      const res = await fetch(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("নতুন অর্ডার সফলভাবে যুক্ত হয়েছে!");
        setIsAddOrderOpen(false);

        if (result.data) {
          setOrders((prev) => [result.data, ...prev]);
          setCounts((prev) => ({
            ...prev,
            all: (prev.all || 0) + 1,
            [addOrderStatus]: (prev[addOrderStatus] || 0) + 1,
          }));
        }
      } else {
        toast.error(result.message || "Failed to create order");
      }
    } catch (err) {
      console.error("Order creation error:", err);
      toast.error("Something went wrong creating order");
    } finally {
      setIsSubmittingNewOrder(false);
    }
  };

  // Customer Info Edit States
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerEditName, setCustomerEditName] = useState("");
  const [customerEditPhone, setCustomerEditPhone] = useState("");
  const [customerEditAddress, setCustomerEditAddress] = useState("");
  const [customerEditNotes, setCustomerEditNotes] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  const handleStartEditCustomer = (order) => {
    setIsEditingCustomer(true);
    setCustomerEditName(order.customerName || "");
    setCustomerEditPhone(order.phone || "");
    setCustomerEditAddress(order.address || "");
    setCustomerEditNotes(order.notes || "");
  };

  const handleCancelEditCustomer = () => {
    setIsEditingCustomer(false);
  };

  const handleSaveCustomer = async () => {
    if (!selectedOrder) return;
    if (!customerEditName.trim()) {
      toast.error("গ্রাহকের নাম লিখুন");
      return;
    }
    if (!customerEditPhone.trim()) {
      toast.error("গ্রাহকের ফোন নম্বর লিখুন");
      return;
    }
    if (!customerEditAddress.trim()) {
      toast.error("গ্রাহকের ঠিকানা লিখুন");
      return;
    }

    try {
      setSavingCustomer(true);
      const res = await fetch(`${baseUrl}/api/orders/${selectedOrder._id}/details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerEditName.trim(),
          phone: customerEditPhone.trim(),
          address: customerEditAddress.trim(),
          notes: customerEditNotes.trim(),
          updatedBy: user?.userName || "admin",
        }),
      });

      const data = await res.json();
      if (data.success) {
        const updatedOrder = data.data || {
          ...selectedOrder,
          customerName: customerEditName.trim(),
          phone: customerEditPhone.trim(),
          address: customerEditAddress.trim(),
          notes: customerEditNotes.trim(),
        };

        setSelectedOrder(updatedOrder);
        setOrders((prev) =>
          prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...updatedOrder } : o))
        );
        setIsEditingCustomer(false);
        toast.success("গ্রাহকের নাম, ঠিকানা ও নম্বর সফলভাবে আপডেট হয়েছে!");
      } else {
        toast.error(data.message || "Failed to update customer info");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating customer info");
    } finally {
      setSavingCustomer(false);
    }
  };

  const [blockingLoading, setBlockingLoading] = useState(false);

  const handleBlockCustomer = async (order) => {
    if (!order) return;

    const result = await Swal.fire({
      title: "কাস্টমার ও ডিভাইস ব্লক করবেন?",
      html: `
        <div class="text-left text-sm space-y-2 text-gray-700">
          <p>আপনি কি নিশ্চিত যে <b>${order.customerName || "এই গ্রাহক"}</b> (${order.phone}) কে ব্লক করতে চান?</p>
          <div class="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs leading-relaxed">
            ⚠️ <b>ব্লক করার পর:</b> এই গ্রাহক তার ডিভাইস বা আইপি (${order.ip || "ডিভাইস"}) দিয়ে sashroyi.shop ওয়েবসাইটে প্রবেশ করতে পারবে না এবং কোনো নতুন অর্ডার দিতে পারবে না।
          </div>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: "হ্যাঁ, ব্লক করুন",
      cancelButtonText: "বাতিল",
    });

    if (!result.isConfirmed) return;

    try {
      setBlockingLoading(true);
      const res = await fetch(`${baseUrl}/api/blacklist/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order._id,
          ip: order.ip,
          deviceId: order.deviceId,
          phone: order.phone,
          customerName: order.customerName,
          reason: "ফেক অর্ডার বা সন্দেহভাজন আচরণ (Blocked from Order List)",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to block entity");

      toast.success("ডিভাইস ও আইপি সফলভাবে ব্লক করা হয়েছে!");

      // Update selectedOrder state
      setSelectedOrder((prev) => (prev ? { ...prev, isBlocked: true } : null));

      // Update orders list
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, isBlocked: true } : o))
      );
    } catch (err) {
      toast.error(err.message || "ব্লক করতে সমস্যা হয়েছে");
    } finally {
      setBlockingLoading(false);
    }
  };

  const handleUnblockCustomer = async (order) => {
    if (!order) return;

    const result = await Swal.fire({
      title: "আনব্লক করতে চান?",
      text: `${order.customerName || "এই গ্রাহক"} (${order.phone}) এর ডিভাইস ও আইপি আনব্লক করতে চান? এর ফলে গ্রাহক পুনরায় ওয়েবসাইটে ভিজিট ও অর্ডার করতে পারবে।`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      confirmButtonText: "হ্যাঁ, আনব্লক করুন",
      cancelButtonText: "বাতিল",
    });

    if (!result.isConfirmed) return;

    try {
      setBlockingLoading(true);
      const res = await fetch(`${baseUrl}/api/blacklist/unblock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order._id,
          ip: order.ip,
          deviceId: order.deviceId,
          phone: order.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to unblock entity");

      toast.success("ডিভাইস ও আইপি সফলভাবে আনব্লক করা হয়েছে!");

      // Update selectedOrder state
      setSelectedOrder((prev) => (prev ? { ...prev, isBlocked: false } : null));

      // Update orders list
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, isBlocked: false } : o))
      );
    } catch (err) {
      toast.error(err.message || "আনব্লক করতে সমস্যা হয়েছে");
    } finally {
      setBlockingLoading(false);
    }
  };

  // Order Pricing & Items Edit States
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceEditItems, setPriceEditItems] = useState([]);
  const [priceEditShippingCost, setPriceEditShippingCost] = useState(0);
  const [priceEditDiscount, setPriceEditDiscount] = useState(0);
  const [savingPrice, setSavingPrice] = useState(false);

  const handleStartEditPricing = (order) => {
    setIsEditingPrice(true);
    setPriceEditItems(
      (order.items || []).map((item) => ({
        name: item.name || "",
        productCode: item.productCode || "",
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image: item.image || "",
      }))
    );
    setPriceEditShippingCost(Number(order.shippingCost) || 0);
    setPriceEditDiscount(Number(order.discount) || 0);
  };

  const handleCancelEditPricing = () => {
    setIsEditingPrice(false);
  };

  const handleItemQuantityChange = (index, delta) => {
    setPriceEditItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const nextQty = Math.max(1, Number(item.quantity || 1) + delta);
          return { ...item, quantity: nextQty };
        }
        return item;
      })
    );
  };

  const handleItemQuantityDirectChange = (index, val) => {
    const nextQty = Math.max(1, parseInt(val, 10) || 1);
    setPriceEditItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: nextQty } : item))
    );
  };

  const handleItemPriceChange = (index, newPrice) => {
    setPriceEditItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return { ...item, price: Math.max(0, Number(newPrice) || 0) };
        }
        return item;
      })
    );
  };

  const handleSavePricing = async () => {
    if (!selectedOrder) return;
    try {
      setSavingPrice(true);
      const subtotal = priceEditItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0
      );
      const shipping = Number(priceEditShippingCost) || 0;
      const discount = Number(priceEditDiscount) || 0;
      const total = Math.max(0, subtotal + shipping - discount);

      const res = await fetch(`${baseUrl}/api/orders/${selectedOrder._id}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: priceEditItems,
          shippingCost: shipping,
          discount: discount,
          subtotal: subtotal,
          total: total,
          updatedBy: user?.userName || "admin",
        }),
      });

      const data = await res.json();
      if (data.success) {
        const updatedOrder = data.data || {
          ...selectedOrder,
          items: priceEditItems,
          shippingCost: shipping,
          discount: discount,
          subtotal: subtotal,
          total: total,
        };

        setSelectedOrder(updatedOrder);
        setOrders((prev) =>
          prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...updatedOrder } : o))
        );
        setIsEditingPrice(false);
        toast.success("অর্ডারের দাম ও তথ্য সফলভাবে আপডেট হয়েছে!");
      } else {
        toast.error(data.message || "Failed to update order pricing");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating order pricing");
    } finally {
      setSavingPrice(false);
    }
  };

  // Bulk Courier & Export States & Handlers
  const [bulkCourierLoading, setBulkCourierLoading] = useState(false);

  const formatPhoneForBM = (phone) => {
    if (!phone) return "";
    let digits = String(phone).replace(/\D/g, "");
    if (digits.startsWith("880")) return digits;
    if (digits.startsWith("0")) return "88" + digits;
    if (digits.length === 10 && digits.startsWith("1")) return "880" + digits;
    return digits;
  };

  const sanitizeCsvField = (field) => {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleExportOrders = (customOrders = null) => {
    const list = customOrders || (selectedIds.size > 0 ? orders.filter((o) => selectedIds.has(o._id)) : orders);
    if (!list || list.length === 0) {
      toast.info("No orders found to export");
      return;
    }

    const headers = ["phone", "fn", "ln", "ct", "country", "value", "order_id", "status", "courier_consignment"];
    const rows = list.map((order) => {
      const nameParts = (order.customerName || "").trim().split(/\s+/);
      const fn = nameParts[0] || "";
      const ln = nameParts.slice(1).join(" ") || fn;
      const phone = formatPhoneForBM(order.phone);
      const ct = order.shippingType === "inside" ? "Dhaka" : "Bangladesh";
      const country = "BD";
      const value = order.total || 0;
      const orderId = order._id || "";
      const status = order.status || "";
      const courierConsignment = order.steadfast?.consignmentId || order.pathao?.consignmentId || "";

      return [
        sanitizeCsvField(phone),
        sanitizeCsvField(fn),
        sanitizeCsvField(ln),
        sanitizeCsvField(ct),
        sanitizeCsvField(country),
        value,
        sanitizeCsvField(orderId),
        sanitizeCsvField(status),
        sanitizeCsvField(courierConsignment),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${list.length}টি অর্ডারের ডাটা সফলভাবে ডাউনলোড হয়েছে!`);
  };

  const handleBulkSendToSteadfast = async () => {
    if (selectedIds.size === 0) return;
    const selectedOrderList = orders.filter((o) => selectedIds.has(o._id));
    const eligibleOrders = selectedOrderList.filter(
      (o) => !o.steadfast?.consignmentId && o.status !== "cancelled"
    );

    if (eligibleOrders.length === 0) {
      Swal.fire("Note", "সিলেক্টেড সবগুলো অর্ডার ইতিমধ্যে Steadfast-এ পাঠানো হয়েছে অথবা বাতিল করা।", "info");
      return;
    }

    const { value: account } = await Swal.fire({
      title: "Select Steadfast Account",
      html: `<p class="text-sm mb-3"><strong>${eligibleOrders.length}টি</strong> অর্ডার Steadfast-এ পাঠানো হবে।</p>`,
      input: "radio",
      inputOptions: {
        narayanganj: "Narayanganj",
        badda: "Badda",
        jamalpur: "Jamalpur",
      },
      inputValidator: (value) => {
        if (!value) return "Please select an account!";
      },
      showCancelButton: true,
      confirmButtonText: "Send All Now",
      confirmButtonColor: "#01B795",
      cancelButtonColor: "#6b7280",
    });

    if (!account) return;

    try {
      setBulkCourierLoading(true);
      let successCount = 0;
      let updatedOrdersMap = {};

      for (const ord of eligibleOrders) {
        try {
          const res = await fetch(`${baseUrl}/api/orders/${ord._id}/steadfast`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account }),
          });
          const data = await res.json();
          if (data.success && data.data) {
            successCount++;
            updatedOrdersMap[ord._id] = data.data;
          }
        } catch (err) {
          console.error("Steadfast send failed for order", ord._id, err);
        }
      }

      if (successCount > 0) {
        setOrders((prev) =>
          prev.map((o) => (updatedOrdersMap[o._id] ? { ...o, steadfast: updatedOrdersMap[o._id] } : o))
        );
        Swal.fire("Success!", `${successCount}টি অর্ডার সফলভাবে Steadfast (${account})-এ পাঠানো হয়েছে।`, "success");
        setSelectedIds(new Set());
      } else {
        Swal.fire("Failed", "কোনো অর্ডার পাঠানো সম্ভব হয়নি। দয়া করে API সেটিংস চেক করুন।", "error");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error dispatching bulk steadfast");
    } finally {
      setBulkCourierLoading(false);
    }
  };

  const handleBulkSendToPathao = async () => {
    if (selectedIds.size === 0) return;
    const selectedOrderList = orders.filter((o) => selectedIds.has(o._id));
    const eligibleOrders = selectedOrderList.filter(
      (o) => !o.pathao?.consignmentId && o.status !== "cancelled"
    );

    if (eligibleOrders.length === 0) {
      Swal.fire("Note", "সিলেক্টেড সবগুলো অর্ডার ইতিমধ্যে Pathao-তে পাঠানো হয়েছে অথবা বাতিল করা।", "info");
      return;
    }

    const result = await Swal.fire({
      title: "Send to Pathao?",
      text: `আপনি কি নিশ্চিত যে ${eligibleOrders.length}টি অর্ডার Pathao কুরিয়ারে পাঠাতে চান?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Send All",
      confirmButtonColor: "#eb7029",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      setBulkCourierLoading(true);
      let successCount = 0;
      let updatedOrdersMap = {};

      for (const ord of eligibleOrders) {
        try {
          const res = await fetch(`${baseUrl}/api/orders/${ord._id}/pathao`, {
            method: "PATCH",
          });
          const data = await res.json();
          if (data.success && data.data) {
            successCount++;
            updatedOrdersMap[ord._id] = data.data;
          }
        } catch (err) {
          console.error("Pathao send failed for order", ord._id, err);
        }
      }

      if (successCount > 0) {
        setOrders((prev) =>
          prev.map((o) => (updatedOrdersMap[o._id] ? { ...o, pathao: updatedOrdersMap[o._id] } : o))
        );
        Swal.fire("Success!", `${successCount}টি অর্ডার সফলভাবে Pathao-তে পাঠানো হয়েছে।`, "success");
        setSelectedIds(new Set());
      } else {
        Swal.fire("Failed", "কোনো অর্ডার পাঠানো সম্ভব হয়নি। দয়া করে API সেটিংস চেক করুন।", "error");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error dispatching bulk pathao");
    } finally {
      setBulkCourierLoading(false);
    }
  };



  const STATUS_OPTIONS = [
    { value: "pending", label: "Pending", bg: "bg-amber-50 text-amber-800 border-amber-300", dot: "bg-amber-500" },
    { value: "confirmed", label: "Confirmed", bg: "bg-blue-50 text-blue-800 border-blue-300", dot: "bg-blue-500" },
    { value: "in_courier", label: "In Courier", bg: "bg-purple-50 text-purple-800 border-purple-300", dot: "bg-purple-500" },
    { value: "delivered", label: "Delivered", bg: "bg-emerald-50 text-emerald-800 border-emerald-300", dot: "bg-emerald-500" },
    { value: "cancelled", label: "Cancelled", bg: "bg-rose-50 text-rose-800 border-rose-300", dot: "bg-rose-500" },
    { value: "returned", label: "Returned", bg: "bg-orange-50 text-orange-800 border-orange-300", dot: "bg-orange-500" },
    { value: "no_response", label: "No Response", bg: "bg-gray-100 text-gray-700 border-gray-300", dot: "bg-gray-400" },
    { value: "verification_required", label: "Verify", bg: "bg-indigo-50 text-indigo-800 border-indigo-300", dot: "bg-indigo-500" },
  ];

  const isAllSelected = orders.length > 0 && orders.every((o) => selectedIds.has(o._id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const nextSet = new Set(selectedIds);
      orders.forEach((o) => nextSet.add(o._id));
      setSelectedIds(nextSet);
    }
  };

  const handleToggleOrder = (id) => {
    const nextSet = new Set(selectedIds);
    if (nextSet.has(id)) {
      nextSet.delete(id);
    } else {
      nextSet.add(id);
    }
    setSelectedIds(nextSet);
  };

  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      setLoadingId(orderId);
      const res = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, updatedBy: user?.userName || "admin" }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder?._id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        toast.success(`স্ট্যাটাস পরিবর্তন হয়েছে: ${newStatus}`);
        fetchCounts();
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (err) {
      toast.error("Error updating status");
    } finally {
      setLoadingId(null);
    }
  };

  const handleBulkStatusChange = async (targetStatus) => {
    if (selectedIds.size === 0 || !targetStatus) return;
    try {
      setBulkStatusLoading(true);
      const idsArray = Array.from(selectedIds);
      const res = await fetch(`${baseUrl}/api/orders/bulk-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: idsArray,
          status: targetStatus,
          updatedBy: user?.userName || "admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (selectedIds.has(o._id) ? { ...o, status: targetStatus } : o))
        );
        setSelectedIds(new Set());
        toast.success(`${idsArray.length}টি অর্ডারের স্ট্যাটাস আপডেট হয়েছে: ${targetStatus}`);
        fetchCounts();
      } else {
        toast.error(data.message || "Bulk update failed");
      }
    } catch (err) {
      toast.error("Failed to update orders");
    } finally {
      setBulkStatusLoading(false);
    }
  };

  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const handleDeleteOrder = async (order) => {
    if (!order) return;

    const result = await Swal.fire({
      title: "অর্ডার মুছে ফেলতে চান?",
      html: `
        <div class="text-left text-sm space-y-1 text-gray-700">
          <p>গ্রাহক: <b>${order.customerName || "Customer"}</b></p>
          <p>ফোন: <b>${order.phone || "N/A"}</b> | মোট: <b>৳${order.total || 0}</b></p>
          <div class="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs mt-2">
            ⚠️ এই অর্ডারটি চিরতরে মুছে যাবে। এটি আর ফিরিয়ে আনা যাবে না।
          </div>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: "হ্যাঁ, ডিলিট করুন",
      cancelButtonText: "বাতিল",
    });

    if (!result.isConfirmed) return;

    try {
      setDeleteLoadingId(order._id);
      const res = await fetch(`${baseUrl}/api/orders/${order._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete order");

      toast.success("অর্ডার সফলভাবে মুছে ফেলা হয়েছে!");

      setOrders((prev) => prev.filter((o) => o._id !== order._id));
      if (selectedOrder?._id === order._id) {
        setSelectedOrder(null);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(order._id);
        return next;
      });
      fetchCounts();
    } catch (err) {
      toast.error(err.message || "অর্ডার ডিলিট করতে সমস্যা হয়েছে");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const result = await Swal.fire({
      title: `${selectedIds.size}টি অর্ডার মুছে ফেলতে চান?`,
      html: `
        <div class="text-left text-sm space-y-2 text-gray-700">
          <p>আপনি <b>${selectedIds.size}টি</b> অর্ডার মুছে ফেলার জন্য সিলেক্ট করেছেন।</p>
          <div class="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
            ⚠️ সতর্কবার্তা: নির্বাচিত অর্ডারগুলো চিরতরে মুছে যাবে।
          </div>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: `হ্যাঁ, ডিলিট করুন`,
      cancelButtonText: "বাতিল",
    });

    if (!result.isConfirmed) return;

    try {
      setBulkDeleteLoading(true);
      const idsArray = Array.from(selectedIds);
      const res = await fetch(`${baseUrl}/api/orders/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsArray }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to bulk delete orders");

      toast.success(`${data.deletedCount || idsArray.length}টি অর্ডার সফলভাবে মুছে ফেলা হয়েছে!`);

      setOrders((prev) => prev.filter((o) => !selectedIds.has(o._id)));
      if (selectedOrder && selectedIds.has(selectedOrder._id)) {
        setSelectedOrder(null);
      }
      setSelectedIds(new Set());
      fetchCounts();
    } catch (err) {
      toast.error(err.message || "বাল্ক ডিলিট করতে সমস্যা হয়েছে");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = Number(params.get("page")) || 1;
    const status = params.get("status") || "all";
    const isNew = params.get("new");

    setCurrentPage(page);
    setStatusFilter(status);
    setIsReady(true);

    if (isNew === "true" || isNew === "1") {
      handleOpenAddOrder();
    }
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

    fetchCounts();

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
      <div className="bg-white rounded-2xl border border-[#e5dccf] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e5dccf]/60 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#3d2f1f]">All Orders (সকল অর্ডার)</h1>
            <p className="text-sm text-[#7a6a58] mt-1">
              Manage customer orders, view status, dispatch to couriers and create manual orders.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddOrder}
            className="btn btn-sm sm:btn-md bg-[#0f2a44] hover:bg-[#1a3f66] text-white border-none flex items-center justify-center gap-2 font-bold shadow-lg rounded-xl px-5 transition-transform active:scale-95 text-xs sm:text-sm shrink-0"
          >
            <LuPlus className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37]" />
            <span>+ Add New Order (নতুন অর্ডার)</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
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
            All ({counts.all || 0})
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
            Pending ({counts.pending || 0})
          </button>

          <button
            onClick={() => {
              handleFilterChange("confirmed");
            }}
            className={`btn btn-sm ${
              statusFilter === "confirmed"
                ? "bg-[#d4af37] text-white border-[#d4af37]"
                : "bg-white text-[#3d2f1f] border-[#e5dccf]"
            }`}
          >
            Confirmed ({counts.confirmed || 0})
          </button>

          <button
            onClick={() => {
              handleFilterChange("in_courier");
            }}
            className={`btn btn-sm ${
              statusFilter === "in_courier"
                ? "bg-[#d4af37] text-white border-[#d4af37]"
                : "bg-white text-[#3d2f1f] border-[#e5dccf]"
            }`}
          >
            In Courier ({counts.in_courier || 0})
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
            Delivered ({counts.delivered || 0})
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
            Cancelled ({counts.cancelled || 0})
          </button>

          <button
            onClick={() => {
              handleFilterChange("returned");
            }}
            className={`btn btn-sm ${
              statusFilter === "returned"
                ? "bg-[#d4af37] text-white border-[#d4af37]"
                : "bg-white text-[#3d2f1f] border-[#e5dccf]"
            }`}
          >
            Returned ({counts.returned || 0})
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
            No Response ({counts.no_response || 0})
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
            Verify ({counts.verification_required || 0})
          </button>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-30 flex flex-wrap items-center justify-between gap-3 bg-[#0f2a44] text-white p-3.5 rounded-2xl shadow-2xl border border-[#d4af37]/50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d4af37] text-xs font-black text-[#0f2a44]">
              {selectedIds.size}
            </span>
            <span className="text-sm font-bold">
              {selectedIds.size} টি অর্ডার সিলেক্টেড
            </span>

            {/* Quick All Select Button */}
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="btn btn-xs bg-[#d4af37] hover:bg-[#b89528] text-[#0f2a44] border-none font-bold rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-sm active:scale-95 text-xs transition-transform"
              title={isAllSelected ? "সবগুলো সিলেকশন বাতিল করুন" : "এক ক্লিকে এই পেজের সবগুলো অর্ডার সিলেক্ট করুন"}
            >
              <LuCheckSquare className="w-3.5 h-3.5" />
              <span>
                {isAllSelected ? "Deselect All (বাদ দিন)" : `Select All (${orders.length}টি সব সিলেক্ট)`}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Courier Dispatch Actions */}
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-white/20">
              <button
                type="button"
                disabled={bulkCourierLoading}
                onClick={handleBulkSendToSteadfast}
                className="btn btn-xs bg-[#01B795] hover:bg-[#00886f] text-white border-none text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <LuTruck className="w-3 h-3" />
                <span>Steadfast</span>
              </button>

              <button
                type="button"
                disabled={bulkCourierLoading}
                onClick={handleBulkSendToPathao}
                className="btn btn-xs bg-[#eb7029] hover:bg-[#a3420a] text-white border-none text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <LuTruck className="w-3 h-3" />
                <span>Pathao</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportOrders()}
                className="btn btn-xs bg-white/20 hover:bg-white/30 text-white border-none text-xs font-bold flex items-center gap-1 shadow-sm"
                title="Export selected orders to CSV"
              >
                <LuDownload className="w-3 h-3" />
                <span>Export Orders</span>
              </button>
            </div>

            <span className="text-xs text-gray-300 font-medium">একসাথে স্ট্যাটাস:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_OPTIONS.slice(0, 6).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={bulkStatusLoading}
                  onClick={() => handleBulkStatusChange(opt.value)}
                  className="btn btn-xs bg-white/10 hover:bg-[#d4af37] text-white hover:text-[#0f2a44] border-none text-[11px] font-semibold transition-all duration-150"
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Bulk Delete Button */}
            <button
              type="button"
              disabled={bulkDeleteLoading}
              onClick={handleBulkDelete}
              className="btn btn-xs bg-rose-600 hover:bg-rose-700 text-white border-none font-bold rounded-lg px-2.5 py-1 flex items-center gap-1 shadow-sm active:scale-95 ml-1"
              title="নির্বাচিত অর্ডারগুলো চিরতরে মুছে ফেলুন"
            >
              <LuTrash2 className="w-3.5 h-3.5" />
              <span>{bulkDeleteLoading ? "মুছছে..." : "Delete Selected"}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="btn btn-xs btn-ghost text-gray-300 hover:text-white ml-1"
            >
              ✕ বাদ দিন
            </button>
          </div>
        </div>
      )}

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
                    <th className="w-8">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                      />
                    </th>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Total</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Order Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order, index) => {
                    const isSelected = selectedIds.has(order._id);
                    return (
                      <tr key={order._id} className={isSelected ? "bg-amber-50/40" : ""}>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-xs"
                            checked={isSelected}
                            onChange={() => handleToggleOrder(order._id)}
                          />
                        </td>

                        <td>{index + 1}</td>

                        <td>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-semibold text-[#3d2f1f]">
                                {order.customerName}
                              </p>
                              {order.customerHistory?.isRepeat && (
                                <span
                                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold border shadow-2xs ${
                                    (order.customerHistory?.orderCount || 2) >= 4
                                      ? "bg-purple-100 text-purple-900 border-purple-300"
                                      : "bg-amber-100 text-amber-900 border-amber-300"
                                  }`}
                                  title={`এই কাস্টমার আগে ${order.customerHistory.orderCount - 1} বার অর্ডার করেছেন (মোট ${order.customerHistory.orderCount}টি অর্ডার)`}
                                >
                                  ⭐ Repeat ({getOrdinalNumber(order.customerHistory.orderCount)} Order)
                                </span>
                              )}
                            </div>
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
                          <div className="flex items-center justify-between gap-3 min-w-52">
                            <div className="space-y-2 flex-1 min-w-0">
                              {order.items?.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  {item.image ? (
                                    <Image
                                      src={item.image}
                                      alt={item.name || "Product"}
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 rounded-md object-cover border border-[#e5dccf] shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-400 text-xs">
                                      📦
                                    </div>
                                  )}
                                  <div className="leading-tight flex-1 min-w-0">
                                    <p className="font-medium text-xs text-[#3d2f1f] truncate" title={item.name}>
                                      {item.name}
                                    </p>
                                    <p className="text-[11px] text-[#7a6a58] mt-0.5">
                                      <span className="font-bold text-[#3d2f1f]">{item.quantity}</span> × ৳{item.price}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Instant Call button beside product image & item */}
                            <button
                              type="button"
                              onClick={() => handleCall(order)}
                              className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-lg px-2 py-1 flex items-center gap-1 shrink-0 font-bold shadow-xs transition-transform active:scale-95"
                              title={`Call ${order.customerName} (${order.phone})`}
                            >
                              <LuPhone className="w-3 h-3" />
                              <span>Call</span>
                            </button>
                          </div>
                        </td>

                        {/* Interactive Status Dropdown Pill */}
                        <td>
                          <select
                            value={order.status || "pending"}
                            onChange={(e) => handleQuickStatusChange(order._id, e.target.value)}
                            disabled={loadingId === order._id}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer appearance-none pr-6 focus:outline-none transition-all shadow-2xs ${
                              order.status === "delivered"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : order.status === "cancelled"
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : order.status === "in_courier"
                                ? "bg-purple-50 text-purple-700 border-purple-300"
                                : order.status === "confirmed"
                                ? "bg-blue-50 text-blue-700 border-blue-300"
                                : order.status === "returned"
                                ? "bg-orange-50 text-orange-700 border-orange-300"
                                : order.status === "no_response"
                                ? "bg-gray-100 text-gray-700 border-gray-300"
                                : order.status === "verification_required"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                                : "bg-amber-50 text-amber-800 border-amber-300"
                            }`}
                            style={{
                              backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 8px top 50%",
                              backgroundSize: "8px auto",
                            }}
                            title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-white text-gray-800 font-medium">
                                {opt.label}
                              </option>
                            ))}
                          </select>
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
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="btn btn-xs sm:btn-sm bg-white text-[#3d2f1f] border border-[#d4af37] hover:bg-[#faf7f0] font-semibold"
                            >
                              View
                            </button>

                            {order.status === "verification_required" && (
                              <button
                                onClick={() => handleVerifyOrder(order._id)}
                                className="btn btn-xs sm:btn-sm bg-[#4f46e5] text-white border-none hover:bg-[#4338ca]"
                              >
                                Verify
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(order)}
                              disabled={deleteLoadingId === order._id}
                              className="btn btn-xs text-rose-600 hover:text-white bg-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 font-semibold transition-colors"
                              title="Delete Order"
                            >
                              {deleteLoadingId === order._id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-4 lg:hidden">
            {orders.map((order, index) => {
              const isSelected = selectedIds.has(order._id);
              return (
                <div
                  key={order._id}
                  className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${
                    isSelected ? "border-[#d4af37] bg-amber-50/40" : "border-[#e5dccf]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm mt-0.5"
                        checked={isSelected}
                        onChange={() => handleToggleOrder(order._id)}
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-[#3d2f1f]">
                            {index + 1}. {order.customerName}
                          </p>
                          {order.customerHistory?.isRepeat && (
                            <span
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold border shadow-2xs ${
                                (order.customerHistory?.orderCount || 2) >= 4
                                  ? "bg-purple-100 text-purple-900 border-purple-300"
                                  : "bg-amber-100 text-amber-900 border-amber-300"
                              }`}
                            >
                              ⭐ Repeat ({getOrdinalNumber(order.customerHistory.orderCount)} Order)
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#7a6a58]">{order.phone}</p>
                      </div>
                    </div>

                    <select
                      value={order.status || "pending"}
                      onChange={(e) => handleQuickStatusChange(order._id, e.target.value)}
                      disabled={loadingId === order._id}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold border cursor-pointer appearance-none pr-5 focus:outline-none shrink-0 ${
                        order.status === "delivered"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : order.status === "cancelled"
                          ? "bg-rose-50 text-rose-700 border-rose-300"
                          : order.status === "in_courier"
                          ? "bg-purple-50 text-purple-700 border-purple-300"
                          : order.status === "confirmed"
                          ? "bg-blue-50 text-blue-700 border-blue-300"
                          : order.status === "returned"
                          ? "bg-orange-50 text-orange-700 border-orange-300"
                          : order.status === "no_response"
                          ? "bg-gray-100 text-gray-700 border-gray-300"
                          : order.status === "verification_required"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 6px top 50%",
                        backgroundSize: "7px auto",
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-white text-gray-800">
                          {opt.label}
                        </option>
                      ))}
                    </select>
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
                    <span className="font-semibold text-xs text-[#7a6a58]">Items:</span>

                    <div className="mt-1.5 space-y-2">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-2.5 p-1.5 rounded-lg bg-[#faf7f0]/60 border border-[#f1eadf]">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name || "Product"}
                                width={44}
                                height={44}
                                className="w-11 h-11 rounded-md object-cover border border-[#e5dccf] shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-400 text-xs">
                                📦
                              </div>
                            )}
                            <div className="leading-tight flex-1 min-w-0">
                              <p className="font-medium text-xs text-[#3d2f1f] truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-[#7a6a58] mt-0.5">
                                Qty: <span className="font-bold text-[#3d2f1f]">{item.quantity}</span> × ৳{item.price} = <span className="font-semibold text-[#3d2f1f]">৳{(item.price || 0) * (item.quantity || 0)}</span>
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCall(order)}
                            className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-lg px-2 py-1 flex items-center gap-1 shrink-0 font-bold shadow-2xs active:scale-95"
                            title={`Call ${order.phone}`}
                          >
                            <LuPhone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </button>
                        </div>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn btn-sm flex-1 bg-white text-[#3d2f1f] border border-[#d4af37] hover:bg-[#faf7f0] font-semibold"
                    >
                      View Order
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order)}
                      disabled={deleteLoadingId === order._id}
                      className="btn btn-sm bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white font-semibold px-3"
                      title="Delete Order"
                    >
                      <LuTrash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {order.status === "verification_required" && (
                    <button
                      onClick={() => handleVerifyOrder(order._id)}
                      className="btn btn-sm bg-[#4f46e5] text-white border-none hover:bg-[#4338ca]"
                    >
                      Verify Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
      {/* Add Order Modal for WhatsApp / Facebook / Phone Call Orders */}
      {isAddOrderOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={handleCloseAddOrder}
        >
          <div
            className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-[#e5dccf] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e5dccf] px-5 py-4 bg-[#faf7f2]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0f2a44] text-[#d4af37] flex items-center justify-center shadow-xs">
                  <LuPlus className="w-5 h-5 font-bold" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#3d2f1f]">
                    নতুন অর্ডার তৈরি করুন (Add Order)
                  </h2>
                  <p className="text-xs text-[#7a6a58]">
                    WhatsApp, Facebook বা ফোনে পাওয়া অর্ডার সরাসরি অ্যাডমিন প্যানেলে যুক্ত করুন
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseAddOrder}
                className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100 text-lg cursor-pointer"
              >
                <RxCross1 />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateNewOrder} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* 1. Order Source Selection Bar */}
              <div className="bg-[#faf7f2] p-3 rounded-xl border border-[#e5dccf] flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#3d2f1f]">
                  অর্ডারের মাধ্যম (Order Source):
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setAddOrderSource("whatsapp")}
                    className={`btn btn-xs rounded-lg flex items-center gap-1.5 transition-all ${
                      addOrderSource === "whatsapp"
                        ? "bg-[#25D366] text-white border-none shadow-xs font-bold"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <FaWhatsapp className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddOrderSource("facebook")}
                    className={`btn btn-xs rounded-lg flex items-center gap-1.5 transition-all ${
                      addOrderSource === "facebook"
                        ? "bg-[#1877F2] text-white border-none shadow-xs font-bold"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <span className="font-extrabold text-xs">f</span>
                    <span>Facebook</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddOrderSource("phone_call")}
                    className={`btn btn-xs rounded-lg flex items-center gap-1.5 transition-all ${
                      addOrderSource === "phone_call"
                        ? "bg-emerald-700 text-white border-none shadow-xs font-bold"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <LuPhone className="w-3 h-3" />
                    <span>Phone Call</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddOrderSource("direct")}
                    className={`btn btn-xs rounded-lg flex items-center gap-1.5 transition-all ${
                      addOrderSource === "direct"
                        ? "bg-[#0f2a44] text-white border-none shadow-xs font-bold"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <span>Manual / অন্যান্য</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Customer & Shipping Details */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-xl border border-[#e5dccf] p-4 bg-white space-y-3 shadow-2xs">
                    <h3 className="font-bold text-[#3d2f1f] text-sm border-b border-[#e5dccf]/60 pb-2">
                      গ্রাহকের তথ্য (Customer Details)
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        গ্রাহকের নাম (Customer Name) *
                      </label>
                      <input
                        type="text"
                        required
                        value={addOrderCustomerName}
                        onChange={(e) => setAddOrderCustomerName(e.target.value)}
                        placeholder="যেমন: তানভীর আহমেদ"
                        className="input input-sm input-bordered w-full text-xs font-medium focus:outline-none focus:border-[#d4af37] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        ফোন নম্বর (Phone Number) *
                      </label>
                      <input
                        type="text"
                        required
                        value={addOrderPhone}
                        onChange={(e) => setAddOrderPhone(e.target.value)}
                        placeholder="যেমন: 017xxxxxxxx"
                        className="input input-sm input-bordered w-full text-xs font-medium focus:outline-none focus:border-[#d4af37] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        সম্পূর্ণ ডেলিভারি ঠিকানা (Address) *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={addOrderAddress}
                        onChange={(e) => setAddOrderAddress(e.target.value)}
                        placeholder="বাসা/হোল্ডিং, রোড, এলাকা, থানা, জেলা"
                        className="textarea textarea-sm textarea-bordered w-full text-xs font-medium focus:outline-none focus:border-[#d4af37] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        বিশেষ নোট (Notes / Instructions)
                      </label>
                      <input
                        type="text"
                        value={addOrderNotes}
                        onChange={(e) => setAddOrderNotes(e.target.value)}
                        placeholder="যেমন: ৩টার পরে ডেলিভারি দিন"
                        className="input input-sm input-bordered w-full text-xs font-medium focus:outline-none focus:border-[#d4af37] bg-white"
                      />
                    </div>
                  </div>

                  {/* Shipping & Payment Options */}
                  <div className="rounded-xl border border-[#e5dccf] p-4 bg-white space-y-3 shadow-2xs">
                    <h3 className="font-bold text-[#3d2f1f] text-sm border-b border-[#e5dccf]/60 pb-2">
                      ডেলিভারি ও পেমেন্ট (Delivery & Payment)
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        ডেলিভারি চার্জ (Delivery Cost)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 mb-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAddOrderShippingType("inside");
                            setAddOrderShippingCost(60);
                          }}
                          className={`btn btn-xs text-[11px] font-semibold border ${
                            addOrderShippingType === "inside" && addOrderShippingCost === 60
                              ? "bg-[#d4af37] text-white border-[#d4af37]"
                              : "bg-white text-gray-700 border-gray-300"
                          }`}
                        >
                          ঢাকা (৳60)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddOrderShippingType("outside");
                            setAddOrderShippingCost(120);
                          }}
                          className={`btn btn-xs text-[11px] font-semibold border ${
                            addOrderShippingType === "outside" && addOrderShippingCost === 120
                              ? "bg-[#d4af37] text-white border-[#d4af37]"
                              : "bg-white text-gray-700 border-gray-300"
                          }`}
                        >
                          বাইরে (৳120)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddOrderShippingType("inside");
                            setAddOrderShippingCost(0);
                          }}
                          className={`btn btn-xs text-[11px] font-semibold border ${
                            addOrderShippingCost === 0
                              ? "bg-[#d4af37] text-white border-[#d4af37]"
                              : "bg-white text-gray-700 border-gray-300"
                          }`}
                        >
                          ফ্রি (৳0)
                        </button>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                          ৳
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={addOrderShippingCost}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setAddOrderShippingCost(val);
                            if (val >= 100) setAddOrderShippingType("outside");
                          }}
                          className="input input-sm input-bordered w-full pl-7 text-xs font-bold focus:outline-none focus:border-[#d4af37] bg-white"
                          placeholder="কাস্টম ডেলিভারি চার্জ"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          পেমেন্ট মেথড
                        </label>
                        <select
                          value={addOrderPaymentMethod}
                          onChange={(e) => setAddOrderPaymentMethod(e.target.value)}
                          className="select select-sm select-bordered w-full text-xs font-medium focus:outline-none focus:border-[#d4af37] bg-white"
                        >
                          <option value="cod">Cash on Delivery (COD)</option>
                          <option value="bkash">Bkash</option>
                          <option value="nagad">Nagad</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          অর্ডার স্ট্যাটাস
                        </label>
                        <select
                          value={addOrderStatus}
                          onChange={(e) => setAddOrderStatus(e.target.value)}
                          className="select select-sm select-bordered w-full text-xs font-semibold focus:outline-none focus:border-[#d4af37] bg-white"
                        >
                          <option value="confirmed">Confirmed (কনফার্মড)</option>
                          <option value="pending">Pending (পেন্ডিং)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Products & Pricing */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="rounded-xl border border-[#e5dccf] p-4 bg-white space-y-3 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5dccf]/60 pb-2">
                      <h3 className="font-bold text-[#3d2f1f] text-sm">
                        পণ্য নির্বাচন (Select Products)
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddCustomProduct}
                        className="btn btn-xs bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 font-semibold"
                      >
                        + কাস্টম পণ্য যোগ করুন
                      </button>
                    </div>

                    {/* Product Selector Dropdown */}
                    <div className="flex gap-2 items-center">
                      <select
                        value={selectedProductId}
                        onChange={(e) => {
                          setSelectedProductId(e.target.value);
                          if (e.target.value) {
                            handleAddProductToOrder(e.target.value);
                          }
                        }}
                        disabled={loadingProducts}
                        className="select select-sm select-bordered w-full text-xs font-medium focus:outline-none focus:border-[#d4af37] bg-white"
                      >
                        <option value="">
                          {loadingProducts
                            ? "প্রোডাক্ট লোড হচ্ছে..."
                            : "-- স্টোর থেকে প্রোডাক্ট সিলেক্ট করুন --"}
                        </option>
                        {availableProducts.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} — ৳{p.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selected Products List */}
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pt-1">
                      {addOrderItems.length === 0 ? (
                        <div className="text-center py-8 rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
                          <p className="text-xs text-gray-500 font-medium">
                            এখনো কোনো প্রোডাক্ট যোগ করা হয়নি।
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            উপরের ড্রপডাউন থেকে প্রোডাক্ট নির্বাচন করুন।
                          </p>
                        </div>
                      ) : (
                        addOrderItems.map((item, index) => {
                          const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
                          const isCustom = item.productId && String(item.productId).startsWith("custom_");
                          return (
                            <div
                              key={index}
                              className="rounded-xl border border-[#e5dccf] bg-[#faf7f2]/50 p-3 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                {item.image ? (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={44}
                                    height={44}
                                    className="w-11 h-11 rounded-lg object-cover border border-[#e5dccf] shrink-0"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-lg bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0">
                                    Item
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  {isCustom ? (
                                    <input
                                      type="text"
                                      value={item.name}
                                      onChange={(e) => handleNewItemNameChange(index, e.target.value)}
                                      placeholder="পণ্যের নাম"
                                      className="input input-xs input-bordered w-full font-semibold text-xs mb-1"
                                    />
                                  ) : (
                                    <p className="font-semibold text-xs text-[#3d2f1f] truncate">
                                      {item.name}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-500 text-[11px]">একক মূল্য:</span>
                                    <div className="relative w-20">
                                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">
                                        ৳
                                      </span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={item.price}
                                        onChange={(e) => handleNewItemPriceChange(index, e.target.value)}
                                        className="input input-xs input-bordered w-full pl-4 text-xs font-bold"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Qty & Line Total */}
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleNewItemQtyChange(index, -1)}
                                    disabled={item.quantity <= 1}
                                    className="w-6 h-6 rounded bg-white border border-gray-300 font-bold text-xs flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                                  >
                                    -
                                  </button>
                                  <span className="w-7 text-center font-bold text-xs">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleNewItemQtyChange(index, 1)}
                                    className="w-6 h-6 rounded bg-white border border-gray-300 font-bold text-xs flex items-center justify-center hover:bg-gray-100"
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="text-right w-16">
                                  <p className="font-bold text-xs text-[#3d2f1f]">
                                    ৳{itemTotal}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveOrderItem(index)}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                  title="মুছে ফেলুন"
                                >
                                  <LuTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Discount & Live Summary Card */}
                    <div className="pt-3 border-t border-[#e5dccf]/60 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          ছাড় বা অগ্রিম পেমেন্ট (Discount / Advance ৳)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                            ৳
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={addOrderDiscount}
                            onChange={(e) => setAddOrderDiscount(Number(e.target.value) || 0)}
                            placeholder="0"
                            className="input input-sm input-bordered w-full pl-7 text-xs font-bold focus:outline-none focus:border-[#d4af37] bg-white"
                          />
                        </div>
                      </div>

                      {/* Calculation Box */}
                      {(() => {
                        const calculatedSubtotal = addOrderItems.reduce(
                          (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
                          0
                        );
                        const calculatedTotal = Math.max(
                          0,
                          calculatedSubtotal + Number(addOrderShippingCost || 0) - Number(addOrderDiscount || 0)
                        );
                        return (
                          <div className="rounded-xl bg-[#0f2a44] text-white p-3.5 space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-300">
                              <span>সাবটোটাল (Subtotal):</span>
                              <span className="font-semibold text-white">৳ {calculatedSubtotal}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-300">
                              <span>ডেলিভারি চার্জ (Delivery):</span>
                              <span className="font-semibold text-white">+৳ {addOrderShippingCost || 0}</span>
                            </div>
                            {addOrderDiscount > 0 && (
                              <div className="flex items-center justify-between text-xs text-rose-300">
                                <span>ছাড় / অগ্রিম (Discount):</span>
                                <span className="font-semibold">-৳ {addOrderDiscount}</span>
                              </div>
                            )}
                            <div className="border-t border-white/20 pt-2 flex items-center justify-between">
                              <span className="font-bold text-sm text-[#d4af37]">
                                মোট আদায়যোগ্য (Total to Collect):
                              </span>
                              <span className="text-lg font-black text-[#d4af37]">
                                ৳ {calculatedTotal}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5dccf]">
                <button
                  type="button"
                  onClick={handleCloseAddOrder}
                  disabled={isSubmittingNewOrder}
                  className="btn btn-sm bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 font-medium px-4"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewOrder}
                  className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold flex items-center gap-1.5 shadow-md px-6"
                >
                  {isSubmittingNewOrder ? (
                    <span>অর্ডার যুক্ত হচ্ছে...</span>
                  ) : (
                    <>
                      <LuPlus className="w-4 h-4" />
                      <span>অর্ডার তৈরি করুন (Create Order)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setSelectedOrder(null);
            setIsEditingPrice(false);
            setIsEditingCustomer(false);
          }}
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
                onClick={() => {
                  setSelectedOrder(null);
                  setIsEditingPrice(false);
                  setIsEditingCustomer(false);
                }}
                className="text-black hover:text-red-700 transition-colors cursor-pointer text-xl"
              >
                <RxCross1 />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Customer Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[#e5dccf] p-4 bg-white">
                  <div className="flex items-center justify-between mb-3 border-b border-[#e5dccf]/60 pb-2">
                    <h3 className="font-semibold text-[#3d2f1f]">
                      Customer Info
                    </h3>

                    {!isEditingCustomer ? (
                      <button
                        type="button"
                        onClick={() => handleStartEditCustomer(selectedOrder)}
                        className="btn btn-xs bg-[#d4af37] text-white border-none hover:bg-[#b89528] flex items-center gap-1 font-medium shadow-xs"
                      >
                        <LuPencil className="w-3 h-3" />
                        <span>Edit Info</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCancelEditCustomer}
                          disabled={savingCustomer}
                          className="btn btn-xs bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCustomer}
                          disabled={savingCustomer}
                          className="btn btn-xs bg-emerald-600 text-white hover:bg-emerald-700 border-none font-medium flex items-center gap-1 shadow-xs"
                        >
                          {savingCustomer ? (
                            <span>Saving...</span>
                          ) : (
                            <>
                              <LuSave className="w-3 h-3" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditingCustomer ? (
                    <div className="space-y-2 text-sm text-[#3d2f1f]">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold">Name:</span>{" "}
                          <span>{selectedOrder.customerName}</span>
                          {selectedOrder.customerHistory?.isRepeat ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border shadow-xs ${
                                (selectedOrder.customerHistory?.orderCount || 2) >= 4
                                  ? "bg-purple-100 text-purple-900 border-purple-300"
                                  : "bg-amber-100 text-amber-900 border-amber-300"
                              }`}
                            >
                              ⭐ Repeat Customer ({getOrdinalNumber(selectedOrder.customerHistory.orderCount)} Order)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                              🌱 1st Order (নতুন কাস্টমার)
                            </span>
                          )}
                        </div>
                      </div>

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

                      {/* Customer Order History Card */}
                      <div className="p-2.5 rounded-xl bg-[#faf7f0] border border-[#e5dccf] space-y-1.5 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#3d2f1f]">কাস্টমার হিস্ট্রি (এই শপে):</span>
                          <span className="font-bold text-[#d4af37]">
                            মোট কেনাকাটা: ৳ {selectedOrder.customerHistory?.totalSpent || selectedOrder.total || 0}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                          <div className="bg-white p-1.5 rounded-lg border border-[#e5dccf]/60">
                            <span className="text-[10px] text-[#7a6a58] block">মোট অর্ডার</span>
                            <span className="font-bold text-[#3d2f1f]">{selectedOrder.customerHistory?.orderCount || 1} টি</span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                            <span className="text-[10px] text-emerald-700 block">ডেলিভার্ড</span>
                            <span className="font-bold text-emerald-700">{selectedOrder.customerHistory?.deliveredCount || 0} টি</span>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-rose-100">
                            <span className="text-[10px] text-rose-700 block">ক্যান্সেলড</span>
                            <span className="font-bold text-rose-700">{selectedOrder.customerHistory?.cancelledCount || 0} টি</span>
                          </div>
                        </div>
                      </div>
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

                      {/* Device & IP Details + Block / Unblock Button */}
                      <div className="pt-3 mt-3 border-t border-[#f1eadf] space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-[#7a6a58]">Device IP:</span>
                            <span className="font-mono text-[11px] bg-[#faf7f0] px-2 py-0.5 rounded border border-[#e5dccf] text-[#3d2f1f]">
                              {selectedOrder.ip || "Not Captured"}
                            </span>
                            {selectedOrder.isBlocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                🚫 Blocked (স্থগিত)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                🟢 Allowed (অনুমোদিত)
                              </span>
                            )}
                          </div>

                          {selectedOrder.isBlocked ? (
                            <button
                              type="button"
                              onClick={() => handleUnblockCustomer(selectedOrder)}
                              disabled={blockingLoading}
                              className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold rounded-lg px-2.5 py-1 flex items-center gap-1 shadow-xs active:scale-95"
                              title="Unblock this customer and device"
                            >
                              <LuShieldCheck className="w-3.5 h-3.5" />
                              <span>{blockingLoading ? "Processing..." : "Unblock (আনব্লক)"}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBlockCustomer(selectedOrder)}
                              disabled={blockingLoading}
                              className="btn btn-xs bg-rose-600 hover:bg-rose-700 text-white border-none font-bold rounded-lg px-2.5 py-1 flex items-center gap-1 shadow-xs active:scale-95"
                              title="Block this device & IP from visiting the website"
                            >
                              <LuBan className="w-3.5 h-3.5" />
                              <span>{blockingLoading ? "Processing..." : "Block Device (ব্লক করুন)"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Customer Name (নাম) *
                        </label>
                        <input
                          type="text"
                          value={customerEditName}
                          onChange={(e) => setCustomerEditName(e.target.value)}
                          placeholder="গ্রাহকের নাম"
                          className="input input-sm input-bordered w-full text-xs font-medium focus:outline-none focus:border-[#d4af37] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Phone Number (ফোন নম্বর) *
                        </label>
                        <input
                          type="text"
                          value={customerEditPhone}
                          onChange={(e) => setCustomerEditPhone(e.target.value)}
                          placeholder="ফোন নম্বর (যেমন: 017xxxxxxxx)"
                          className="input input-sm input-bordered w-full text-xs font-medium focus:outline-none focus:border-[#d4af37] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Address (ডেলিভারি ঠিকানা) *
                        </label>
                        <textarea
                          rows={2}
                          value={customerEditAddress}
                          onChange={(e) => setCustomerEditAddress(e.target.value)}
                          placeholder="সম্পূর্ণ ডেলিভারি ঠিকানা"
                          className="textarea textarea-sm textarea-bordered w-full text-xs font-medium focus:outline-none focus:border-[#d4af37] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Notes (বিশেষ নোট)
                        </label>
                        <input
                          type="text"
                          value={customerEditNotes}
                          onChange={(e) => setCustomerEditNotes(e.target.value)}
                          placeholder="নোট (যদি থাকে)"
                          className="input input-sm input-bordered w-full text-xs font-medium focus:outline-none focus:border-[#d4af37] bg-white"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={handleCancelEditCustomer}
                          disabled={savingCustomer}
                          className="btn btn-xs bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 font-medium"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCustomer}
                          disabled={savingCustomer}
                          className="btn btn-xs bg-emerald-600 text-white hover:bg-emerald-700 border-none font-medium flex items-center gap-1 shadow-xs"
                        >
                          {savingCustomer ? (
                            <span>সংরক্ষণ হচ্ছে...</span>
                          ) : (
                            <>
                              <LuSave className="w-3 h-3" />
                              <span>সংরক্ষণ করুন (Save)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

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


                <div className="rounded-xl border border-[#e5dccf] p-4">
                  <h3 className="mb-3 font-semibold text-[#3d2f1f]">
                    Order Summary
                  </h3>

                  <div className="space-y-2 text-sm text-[#3d2f1f]">
                    <div className="flex items-center justify-between py-1 border-b border-[#e5dccf]/60">
                      <span className="font-semibold">Status:</span>
                      <select
                        value={selectedOrder.status || "pending"}
                        onChange={(e) => handleQuickStatusChange(selectedOrder._id, e.target.value)}
                        disabled={loadingId === selectedOrder._id}
                        className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer appearance-none pr-6 focus:outline-none transition-all ${
                          selectedOrder.status === "delivered"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : selectedOrder.status === "cancelled"
                            ? "bg-rose-50 text-rose-700 border-rose-300"
                            : selectedOrder.status === "in_courier"
                            ? "bg-purple-50 text-purple-700 border-purple-300"
                            : selectedOrder.status === "confirmed"
                            ? "bg-blue-50 text-blue-700 border-blue-300"
                            : selectedOrder.status === "returned"
                            ? "bg-orange-50 text-orange-700 border-orange-300"
                            : selectedOrder.status === "no_response"
                            ? "bg-gray-100 text-gray-700 border-gray-300"
                            : selectedOrder.status === "verification_required"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 8px top 50%",
                          backgroundSize: "8px auto",
                        }}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-white text-gray-800">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

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

                    {selectedOrder.discount ? (
                      <p className="text-rose-600">
                        <span className="font-semibold">Discount:</span> -৳{" "}
                        {selectedOrder.discount || 0}
                      </p>
                    ) : null}

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

              {/* Ordered Items & Pricing */}
              <div className="rounded-xl border border-[#e5dccf] p-4 bg-white">
                <div className="flex items-center justify-between mb-4 border-b border-[#e5dccf]/60 pb-3">
                  <div>
                    <h3 className="font-semibold text-[#3d2f1f] text-base">
                      Ordered Items & Pricing
                    </h3>
                    <p className="text-xs text-[#7a6a58]">
                      {isEditingPrice
                        ? "Edit quantities, unit prices, shipping & discount below"
                        : "View items and adjust pricing if necessary"}
                    </p>
                  </div>

                  {!isEditingPrice ? (
                    <button
                      type="button"
                      onClick={() => handleStartEditPricing(selectedOrder)}
                      className="btn btn-xs sm:btn-sm bg-[#d4af37] text-white border-none hover:bg-[#b89528] flex items-center gap-1.5 font-medium shadow-sm"
                    >
                      <LuPencil className="w-3.5 h-3.5" />
                      <span>Edit Price / Items</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEditPricing}
                        disabled={savingPrice}
                        className="btn btn-xs sm:btn-sm bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePricing}
                        disabled={savingPrice}
                        className="btn btn-xs sm:btn-sm bg-emerald-600 text-white hover:bg-emerald-700 border-none font-medium flex items-center gap-1"
                      >
                        {savingPrice ? (
                          <span>Saving...</span>
                        ) : (
                          <>
                            <LuSave className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {!isEditingPrice ? (
                  /* Standard View Mode */
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4 rounded-xl border border-[#f1eadf] p-3 hover:bg-[#faf7f2]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <Image
                              src={item.image}
                              alt={item.name}
                              className="h-20 w-20 rounded-lg border border-[#e5dccf] object-cover"
                              width={64}
                              height={64}
                            />
                          )}

                          <div>
                            <p className="font-medium text-[#3d2f1f]">
                              {item.name}
                            </p>
                            {item.productCode && (
                              <p className="text-xs text-[#7a6a58]">
                                Code: {item.productCode}
                              </p>
                            )}
                            <p className="text-xs text-[#7a6a58] mt-0.5">
                              Qty: <span className="font-bold text-[#3d2f1f]">{item.quantity}</span> × ৳{item.price}
                            </p>
                          </div>
                        </div>

                        <div className="text-right text-sm text-[#3d2f1f]">
                          <p className="text-xs text-gray-500">Unit: ৳{item.price}</p>
                          <p className="font-bold text-base text-[#3d2f1f]">
                            ৳ {(item.price || 0) * (item.quantity || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Interactive Edit Mode */
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {priceEditItems.map((item, index) => {
                        const itemSubtotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
                        return (
                          <div
                            key={index}
                            className="rounded-xl border border-amber-200 bg-amber-50/30 p-3.5 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {item.image && (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    className="h-14 w-14 rounded-lg border border-[#e5dccf] object-cover"
                                    width={56}
                                    height={56}
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-[#3d2f1f] text-sm">
                                    {item.name}
                                  </p>
                                  {item.productCode && (
                                    <p className="text-xs text-[#7a6a58]">
                                      Code: {item.productCode}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-[#7a6a58]">Item Total:</span>
                                <p className="font-bold text-base text-[#3d2f1f]">
                                  ৳ {itemSubtotal}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-100">
                              {/* Quantity Control */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Quantity (পরিমাণ)
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleItemQuantityChange(index, -1)}
                                    disabled={Number(item.quantity) <= 1}
                                    className="w-8 h-8 rounded-lg bg-white border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center text-sm shadow-sm"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleItemQuantityDirectChange(index, e.target.value)}
                                    className="w-16 h-8 text-center rounded-lg border border-gray-300 font-bold text-sm focus:outline-none focus:border-[#d4af37] bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleItemQuantityChange(index, 1)}
                                    className="w-8 h-8 rounded-lg bg-white border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center text-sm shadow-sm"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* Unit Price Control */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Unit Price / একক মূল্য (৳)
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                                    ৳
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.price}
                                    onChange={(e) => handleItemPriceChange(index, e.target.value)}
                                    className="w-full h-8 pl-7 pr-3 rounded-lg border border-gray-300 font-bold text-sm focus:outline-none focus:border-[#d4af37] bg-white"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Shipping & Discount Adjustments */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                        Delivery & Discount Adjustments
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Shipping / ডেলিভারি চার্জ (৳)
                          </label>
                          <div className="relative mb-2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                              ৳
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={priceEditShippingCost}
                              onChange={(e) => setPriceEditShippingCost(Number(e.target.value) || 0)}
                              className="w-full h-9 pl-7 pr-3 rounded-lg border border-gray-300 font-bold text-sm focus:outline-none focus:border-[#d4af37] bg-white"
                              placeholder="0"
                            />
                          </div>
                          {/* Quick shipping buttons */}
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPriceEditShippingCost(0)}
                              className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                                priceEditShippingCost === 0
                                  ? "bg-[#d4af37] text-white border-[#d4af37] font-semibold"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                              }`}
                            >
                              Free (৳0)
                            </button>
                            <button
                              type="button"
                              onClick={() => setPriceEditShippingCost(60)}
                              className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                                priceEditShippingCost === 60
                                  ? "bg-[#d4af37] text-white border-[#d4af37] font-semibold"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                              }`}
                            >
                              Inside (৳60)
                            </button>
                            <button
                              type="button"
                              onClick={() => setPriceEditShippingCost(120)}
                              className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                                priceEditShippingCost === 120
                                  ? "bg-[#d4af37] text-white border-[#d4af37] font-semibold"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                              }`}
                            >
                              Outside (৳120)
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Discount / ছাড় বা অগ্রিম (৳)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                              ৳
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={priceEditDiscount}
                              onChange={(e) => setPriceEditDiscount(Number(e.target.value) || 0)}
                              className="w-full h-9 pl-7 pr-3 rounded-lg border border-gray-300 font-bold text-sm focus:outline-none focus:border-[#d4af37] bg-white"
                              placeholder="0"
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            টোটাল অ্যামাউন্ট থেকে এই টাকা বিয়োগ হবে।
                          </p>
                        </div>
                      </div>

                      {/* Live Calculation Summary */}
                      {(() => {
                        const calculatedSubtotal = priceEditItems.reduce(
                          (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
                          0
                        );
                        const calculatedTotal = Math.max(
                          0,
                          calculatedSubtotal + Number(priceEditShippingCost || 0) - Number(priceEditDiscount || 0)
                        );
                        return (
                          <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-amber-50/60 p-3 rounded-lg">
                            <div className="text-xs space-y-0.5 text-gray-600">
                              <p>Subtotal: <span className="font-semibold text-gray-800">৳{calculatedSubtotal}</span></p>
                              <p>Shipping: <span className="font-semibold text-gray-800">+৳{priceEditShippingCost || 0}</span></p>
                              {priceEditDiscount > 0 && (
                                <p>Discount: <span className="font-semibold text-rose-600">-৳{priceEditDiscount}</span></p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-gray-600">New Total to Collect:</span>
                              <p className="text-lg font-extrabold text-[#3d2f1f]">
                                ৳ {calculatedTotal}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleCancelEditPricing}
                        disabled={savingPrice}
                        className="btn btn-sm bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePricing}
                        disabled={savingPrice}
                        className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 border-none font-medium flex items-center gap-1.5 shadow-sm"
                      >
                        {savingPrice ? (
                          <span>Saving Changes...</span>
                        ) : (
                          <>
                            <LuSave className="w-4 h-4" />
                            <span>Save & Apply New Pricing</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Action */}
              <div className="grid md:flex grid-cols-2 gap-2 justify-center md:justify-end items-center">
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(selectedOrder)}
                  disabled={deleteLoadingId === selectedOrder._id}
                  className="btn btn-xs md:btn-sm bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 font-bold flex items-center justify-center gap-1.5 md:mr-auto"
                  title="এই অর্ডারটি চিরতরে মুছে ফেলুন"
                >
                  <LuTrash2 className="w-3.5 h-3.5" />
                  <span>{deleteLoadingId === selectedOrder._id ? "মুছছে..." : "Delete Order"}</span>
                </button>

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
