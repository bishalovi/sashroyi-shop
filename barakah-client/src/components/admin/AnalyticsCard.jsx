/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect, useState } from "react";
import {
  Calendar,
  Package,
  CheckCircle2,
  XCircle,
  Download,
  Search,
  AlertTriangle,
  ShieldCheck,
  Clock3,
  ShieldX,
} from "lucide-react";
import { MdShoppingCartCheckout } from "react-icons/md";
import { GrDeliver } from "react-icons/gr";
import { RiPassPendingLine } from "react-icons/ri";
import { TbUserCancel } from "react-icons/tb";
import { useAuth } from "@/contexts/AuthContext";

const AnalyticsCard = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const formatDate = (date) => {
    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    const time = d.toLocaleTimeString("en-BD", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${day}-${month}-${year} ${time}`;
  };

  const formatPhone = (phone) => {
    let str = String(phone ?? "").trim();

    // Remove spaces and hyphens
    str = str.replace(/[\s-]/g, "");

    // +8801XXXXXXXXX -> 8801XXXXXXXXX
    if (str.startsWith("+880")) {
      return str.slice(1);
    }

    // 01XXXXXXXXX -> 8801XXXXXXXXX
    if (/^01\d{9}$/.test(str)) {
      return "88" + str;
    }

    // 1XXXXXXXXX -> 8801XXXXXXXXX
    if (/^1\d{9}$/.test(str)) {
      return "880" + str;
    }

    // Already 8801XXXXXXXXX
    if (/^8801\d{9}$/.test(str)) {
      return str;
    }

    return str;
  };

  const fetchAnalytics = async (start, end) => {
    if (!baseUrl || !start || !end) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${baseUrl}/api/orders/analytics?startDate=${start}&endDate=${end}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (data.success) setAnalytics(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAnalytics(startDate, endDate);
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch(
        `${baseUrl}/api/orders/export?startDate=${startDate}&endDate=${endDate}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!data.success) return;

      const headers = [
        "Name",
        "Date",
        "Address",
        "Amount",
        "Mobile",
        "Courier",
        "Account",
        "Consignment ID",
        "Product Code",
        "Product Name",
      ];

      const rows = data.data
        .filter((order) => order.status === "delivered")
        .map((order) => {
          let courier = "";
          let account = "";
          let consignmentId = "";

          if (order.steadfast?.consignmentId) {
            courier = "Steadfast";
            account = order.steadfast.account ?? "";
            consignmentId = order.steadfast.consignmentId;
          } else if (order.pathao?.consignmentId) {
            courier = "Pathao";
            consignmentId = order.pathao.consignmentId;
          }

          return [
            order.customerName,
            formatDate(order.deliveredAt ?? order.createdAt),
            order.address,
            order.total,
            formatPhone(order.phone),
            courier,
            account,
            consignmentId,
            order.items?.map((item) => item.productCode).join(", ") ?? "",
            order.items?.map((item) => item.name).join(", ") ?? "",
          ];
        });

      const csvContent = [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orders-${startDate}-to-${endDate}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  // Calculate metrics
  const deliverySuccessRate =
    analytics && analytics.totalOrders > 0
      ? Math.round((analytics.deliveredOrders / analytics.totalOrders) * 100)
      : 0;

  const cancellationRate =
    analytics && analytics.totalOrders > 0
      ? Math.round((analytics.totalCancelled / analytics.totalOrders) * 100)
      : 0;

  const riskyOrdersRate =
    analytics && analytics.totalOrders > 0
      ? Math.round((analytics.totalRiskyOrders / analytics.totalOrders) * 100)
      : 0;

  const verifiedRiskyOrdersRate =
    analytics && analytics.totalRiskyOrders > 0
      ? Math.round(
          (analytics.verifiedRiskyOrders / analytics.totalRiskyOrders) * 100,
        )
      : 0;

  const cancelledRiskyOrdersRate =
    analytics && analytics.totalRiskyOrders > 0
      ? Math.round(
          (analytics.cancelledRiskyOrders / analytics.totalRiskyOrders) * 100,
        )
      : 0;

  const abandonedDeliverySuccessRate =
    analytics && analytics.totalAbandonedOrders > 0
      ? Math.round(
          (analytics.deliveredAbandonedOrders /
            analytics.totalAbandonedOrders) *
            100,
        )
      : 0;

  const abandonedCancellationRate =
    analytics && analytics.totalAbandonedOrders > 0
      ? Math.round(
          (analytics.cancelledAbandonedOrders /
            analytics.totalAbandonedOrders) *
            100,
        )
      : 0;

  return (
    <div className="bg-[#fdfcfb] rounded-2xl border border-stone-200 shadow-xl shadow-stone-200/50 overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-stone-100 bg-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-800 tracking-tight">
              Order Analytics
            </h2>
            <p className="text-stone-500 text-xs mt-1 mb-2 md:mb-0">
              Review by selected date range
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-start justify-center w-full md:w-auto md:items-end">
            {/* Date Range Inputs */}
            <div className="flex flex-col gap-1 bg-stone-50 p-3 rounded-2xl border border-stone-200 w-full">
              <div className="flex flex-col">
                <label className="text-xs text-stone-600 font-medium uppercase tracking-tight">
                  From
                </label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3 w-4 h-4 text-stone-400 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent pl-10 text-sm font-medium text-stone-700 focus:outline-none cursor-pointer w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-stone-600 font-medium uppercase tracking-tight">
                  To
                </label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3 w-4 h-4 text-stone-400 pointer-events-none" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent pl-10 text-sm font-medium text-stone-700 focus:outline-none cursor-pointer w-full"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row md:flex-col gap-2 mb-0 md:mb-2 justify-center w-full md:w-auto">
              <button
                onClick={() => fetchAnalytics(startDate, endDate)}
                disabled={loading || !startDate || !endDate}
                className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#b8962d] disabled:bg-stone-300 text-white px-5 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-stone-300/20 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Search className="w-4 h-4 text-green-600" /> Search
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Search
                  </>
                )}
              </button>

              <button
                onClick={handleExportCSV}
                disabled={exporting || !startDate || !endDate || !analytics}
                className="flex items-center gap-2 bg-[#0f2a44] hover:bg-[#1e4b7e] disabled:bg-stone-300 text-white px-5 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-stone-300/20 disabled:shadow-none"
              >
                {exporting ? (
                  <>
                    <Download className="w-4 h-4 text-green-600" /> Export
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Export
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Total Orders */}
            <StatCard
              label="Total Orders"
              value={analytics?.totalOrders ?? 0}
              subValue={analytics?.totalOrdersRevenue ?? 0}
              icon={<Package className="w-5 h-5 text-amber-600" />}
              color="amber"
            />

            {/* Delivered */}
            <StatCard
              label="Delivered"
              value={analytics?.deliveredOrders ?? 0}
              subValue={analytics?.deliveredRevenue ?? 0}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              color="emerald"
              badge={`${deliverySuccessRate}% Success`}
            />

            {/* Cancelled */}
            <StatCard
              label="Cancelled"
              value={analytics?.totalCancelled ?? 0}
              subValue={analytics?.cancelledRevenue ?? 0}
              icon={<XCircle className="w-5 h-5 text-rose-600" />}
              color="rose"
              badge={`${cancellationRate}% Rate`}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 col-span-1 md:col-span-3 gap-2 mt-2">
              <StatCard
                label="Risky Orders"
                value={analytics?.totalRiskyOrders ?? 0}
                icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
                color="orange"
                badge={`${riskyOrdersRate}%`}
              />

              <StatCard
                label="Pending Review"
                value={analytics?.pendingRiskyOrders ?? 0}
                icon={<Clock3 className="w-5 h-5 text-amber-600" />}
                color="amber"
              />

              <StatCard
                label="Verified"
                value={analytics?.verifiedRiskyOrders ?? 0}
                icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
                color="emerald"
                badge={`${verifiedRiskyOrdersRate}%`}
              />

              <StatCard
                label="Risky Cancelled"
                value={analytics?.cancelledRiskyOrders ?? 0}
                icon={<ShieldX className="w-5 h-5 text-rose-600" />}
                color="rose"
                badge={`${cancelledRiskyOrdersRate}%`}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 col-span-1 md:col-span-3 gap-2 mt-2">
              <StatCard
                label="Total Abandoned"
                value={analytics?.totalAbandonedOrders ?? 0}
                icon={
                  <MdShoppingCartCheckout className="w-5 h-5 text-orange-600" />
                }
                color="blue"
              />

              <StatCard
                label="Pending Abandoned"
                value={analytics?.pendingAbandonedOrders ?? 0}
                icon={<RiPassPendingLine className="w-5 h-5 text-amber-600" />}
                color="cyan"
              />

              <StatCard
                label="Delivered Abandoned"
                value={analytics?.deliveredAbandonedOrders ?? 0}
                icon={<GrDeliver className="w-5 h-5 text-emerald-600" />}
                color="violet"
                badge={`${abandonedDeliverySuccessRate}%`}
              />

              <StatCard
                label="Cancelled Abandoned"
                value={analytics?.cancelledAbandonedOrders ?? 0}
                icon={<TbUserCancel className="w-5 h-5 text-rose-600" />}
                color="slate"
                badge={`${abandonedCancellationRate}%`}
              />
            </div>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50/50">
            <Calendar className="w-12 h-12 text-stone-300 mb-4" />
            <h3 className="text-stone-800 font-medium text-lg">
              No data selected
            </h3>
            <p className="text-stone-500 max-w-xs mx-auto text-sm mt-1">
              Please select a date range and click Search to view analytics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Sub-component
const StatCard = ({ label, value, subValue, icon, color, badge }) => {
  const { user } = useAuth();
  const isModerator = user?.role === "barakahModerator0102";
  const colors = {
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-100",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-100",
    },

    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
    },

    violet: {
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-100",
    },

    cyan: {
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      border: "border-cyan-100",
    },

    slate: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-100",
    },
  };

  const colorScheme = colors[color];

  return (
    <div className="bg-white border border-stone-100 p-5 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-stone-200">
      {/* Header with Icon and Badge */}
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3 rounded-2xl ${colorScheme.bg} border ${colorScheme.border}`}
        >
          {icon}
        </div>
        {badge && (
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div>
        <p className="text-stone-500 text-xs font-medium uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-3xl font-semibold text-stone-600 mb-2">{value}</p>

        {/* Revenue */}
        {subValue !== undefined && !isModerator && (
          <div className="flex items-center gap-1 text-stone-600 font-medium">
            <span className="text-sm tracking-tight">
              BDT{" "}
              {typeof subValue === "number"
                ? subValue.toLocaleString()
                : Number(subValue || 0).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsCard;
