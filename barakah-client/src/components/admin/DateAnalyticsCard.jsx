/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState } from "react";
import {
  Calendar,
  Package,
  CircleCheck,
  CircleX,
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

const toInputFormat = (ddmmyyyy) => {
  if (!ddmmyyyy || !ddmmyyyy.includes("-")) return "";
  const [dd, mm, yyyy] = ddmmyyyy.split("-");
  return `${yyyy}-${mm}-${dd}`;
};

const toDisplayFormat = (yyyymmdd) => {
  if (!yyyymmdd || !yyyymmdd.includes("-")) return "";
  const [yyyy, mm, dd] = yyyymmdd.split("-");
  return `${dd}-${mm}-${yyyy}`;
};

const DateAnalyticsCard = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const todayInput = new Date().toISOString().split("T")[0];
  const todayDisplay = toDisplayFormat(todayInput);

  const [date, setDate] = useState(todayDisplay);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const total = analytics?.totalOrders || 0;
  const deliverySuccessRate =
    total > 0
      ? (((analytics?.totalDelivered || 0) / total) * 100).toFixed(1)
      : "0.0";
  const cancellationRate =
    total > 0
      ? (((analytics?.totalCancelled || 0) / total) * 100).toFixed(1)
      : "0.0";

  const fetchByDate = async (ddmmyyyy) => {
    if (!baseUrl || !ddmmyyyy) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${baseUrl}/api/orders/by-date?date=${ddmmyyyy}`,
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
    void fetchByDate(todayDisplay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const deliveredAbandonedOrdersRate =
    analytics && analytics.totalAbandonedOrders > 0
      ? Math.round(
          (analytics.deliveredAbandonedOrders /
            analytics.totalAbandonedOrders) *
            100,
        )
      : 0;

  const cancelledAbandonedOrdersRate =
    analytics && analytics.totalAbandonedOrders > 0
      ? Math.round(
          (analytics.cancelledAbandonedOrders /
            analytics.totalAbandonedOrders) *
            100,
        )
      : 0;

  const pendingAbandonedOrders = Math.max(
    0,
    (analytics?.totalAbandonedOrders || 0) -
      (analytics?.deliveredAbandonedOrders || 0) -
      (analytics?.cancelledAbandonedOrders || 0),
  );

  return (
    <div className=" bg-[#fdfcfb] rounded-2xl border border-stone-200 shadow-xl shadow-stone-200/50 overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-stone-100 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-5.5">
          <div>
            <h2 className="text-2xl font-semibold text-stone-800 tracking-tight">
              Order Insights
            </h2>
            <p className="text-stone-500 text-xs mt-1">
              Review performance by specific date
            </p>
          </div>

          <div className="flex items-center gap-3 bg-stone-50 p-2 rounded-2xl border border-stone-200">
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type="date"
                value={toInputFormat(date)}
                max={todayInput}
                onChange={(e) => setDate(toDisplayFormat(e.target.value))}
                className="bg-transparent pl-10 pr-4 py-2 text-sm font-medium text-stone-700 focus:outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => fetchByDate(date)}
              disabled={loading}
              className="flex items-center ml-auto gap-2 bg-[#d4af37] hover:bg-[#b8962d] disabled:bg-stone-300 text-white px-3 md:px-5 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-gold/20"
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Stat Card 1: Total Orders */}
            <StatCard
              label="Total Orders"
              value={analytics?.totalOrders ?? 0}
              subValue={analytics?.totalOrdersRevenue ?? 0}
              icon={<Package className="w-5 h-5 text-amber-600" />}
              color="amber"
            />

            {/* Stat Card 2: Delivered */}
            <StatCard
              label="Delivered"
              value={analytics?.totalDelivered ?? 0}
              subValue={analytics?.totalRevenue ?? 0}
              icon={<CircleCheck className="w-5 h-5 text-emerald-600" />}
              color="emerald"
              badge={`${deliverySuccessRate}% Success`}
            />

            {/* Stat Card 3: Cancelled */}
            <StatCard
              label="Cancelled"
              value={analytics?.totalCancelled ?? 0}
              subValue={analytics?.cancelledRevenue ?? 0}
              icon={<CircleX className="w-5 h-5 text-rose-600" />}
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
                value={pendingAbandonedOrders ?? 0}
                icon={<RiPassPendingLine className="w-5 h-5 text-amber-600" />}
                color="cyan"
              />

              <StatCard
                label="Delivered Abandoned"
                value={analytics?.deliveredAbandonedOrders ?? 0}
                icon={<GrDeliver className="w-5 h-5 text-emerald-600" />}
                color="violet"
                badge={`${deliveredAbandonedOrdersRate}%`}
              />

              <StatCard
                label="Cancelled Abandoned"
                value={analytics?.cancelledAbandonedOrders ?? 0}
                icon={<TbUserCancel className="w-5 h-5 text-rose-600" />}
                color="slate"
                badge={`${cancelledAbandonedOrdersRate}%`}
              />
            </div>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50/50">
            <Calendar className="w-12 h-12 text-stone-300 mb-4" />
            <h3 className="text-stone-800 font-medium text-lg">
              No data selected
            </h3>
            <p className="text-stone-500 max-w-xs mx-auto">
              Please select a date from the picker above to view analytics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Sub-component for Stats
const StatCard = ({ label, value, subValue, icon, color, badge }) => {
  const { user } = useAuth();
  const isModerator = user?.role === "barakahModerator0102";
  const colors = {
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",

    blue: "bg-blue-50 text-blue-700 border-blue-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  };

  return (
    <div className="bg-white border border-stone-100 p-5 rounded-xl transition-all duration-300 hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3 rounded-2xl ${colors[color].split(" ")[0]} border ${colors[color].split(" ")[2]}`}
        >
          {icon}
        </div>
        {badge && (
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tight ${colors[color]}`}
          >
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-stone-500 text-xs font-medium uppercase tracking-wider">
          {label}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-3xl font-semibold text-stone-600">{value}</p>
        </div>
        {subValue !== undefined && !isModerator && (
          <div className="flex items-center gap-1 mt-3 text-stone-600 font-medium">
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

export default DateAnalyticsCard;
