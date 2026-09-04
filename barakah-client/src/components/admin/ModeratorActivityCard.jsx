/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Search,
  User,
  Phone,
  MessageCircle,
  CircleCheck,
  CircleX,
} from "lucide-react";
import Swal from "sweetalert2";

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

const ModeratorActivityCard = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const todayInput = new Date().toISOString().split("T")[0];
  const todayDisplay = toDisplayFormat(todayInput);

  const [date, setDate] = useState(todayDisplay);
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState(null);

  // Later we'll fetch moderators dynamically
  const [moderator, setModerator] = useState("");

  const moderators = [
    {
      label: "Moderator 1",
      value: "Moderator 1",
    },
    {
      label: "Moderator 2",
      value: "Moderator 2",
    },
    {
      label: "Dipto Sir",
      value: "Shahneaz Rashid",
    },
  ];

  const fetchModeratorActivity = async (selectedDate, selectedModerator) => {
    if (!baseUrl) return;

    if (!selectedModerator) {
      return Swal.fire(
        "Select Moderator",
        "Please select a moderator.",
        "warning",
      );
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${baseUrl}/api/orders/moderator-activity?date=${selectedDate}&moderator=${selectedModerator}`,
        {
          cache: "no-store",
        },
      );

      const data = await res.json();

      if (data.success) {
        setActivity(data.data);
      } else {
        Swal.fire("Error", data.message, "error");
      }
    } catch (error) {
      console.error(error);

      Swal.fire("Error", "Failed to load moderator activity.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // optional auto load
    if (moderator) {
      void fetchModeratorActivity(todayDisplay, moderator);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-[#fdfcfb] rounded-2xl border border-stone-200 shadow-xl shadow-stone-200/50 overflow-hidden">
      {/* Header */}

      <div className="p-4 border-b border-stone-100 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-stone-800 tracking-tight">
              Moderator Activity
            </h2>

            <p className="text-stone-500 text-xs mt-1">
              Analyze moderator performance by date
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-stone-50 p-2 rounded-2xl border border-stone-200">
            {/* Date */}

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

            {/* Moderator */}

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />

              <select
                value={moderator}
                onChange={(e) => setModerator(e.target.value)}
                className="bg-white border border-stone-200 rounded-xl pl-10 pr-8 py-2 text-sm text-stone-700 focus:outline-none cursor-pointer"
              >
                <option value="">Select Moderator</option>

                {moderators.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}

            <button
              onClick={() => fetchModeratorActivity(date, moderator)}
              disabled={loading}
              className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#b8962d] disabled:bg-stone-300 text-white px-5 py-2 rounded-xl font-medium transition-all"
            >
              <Search className="w-4 h-4" />

              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}

      <div className="p-4">
        {activity ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <StatCard
              label="Verified"
              value={activity?.verified ?? 0}
              icon={<CircleCheck className="w-5 h-5 text-emerald-600" />}
              color="emerald"
            />

            <StatCard
              label="Delivered"
              value={activity?.delivered ?? 0}
              icon={<CircleCheck className="w-5 h-5 text-blue-600" />}
              color="blue"
            />

            <StatCard
              label="Cancelled"
              value={activity?.cancelled ?? 0}
              icon={<CircleX className="w-5 h-5 text-rose-600" />}
              color="rose"
            />

            <StatCard
              label="Phone Calls"
              value={activity?.calls ?? 0}
              icon={<Phone className="w-5 h-5 text-amber-600" />}
              color="amber"
            />

            <StatCard
              label="WhatsApp"
              value={activity?.whatsapp ?? 0}
              icon={<MessageCircle className="w-5 h-5 text-green-600" />}
              color="green"
            />

            <StatCard
              label="Total Actions"
              value={activity?.totalActions ?? 0}
              icon={<User className="w-5 h-5 text-violet-600" />}
              color="violet"
            />
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50/50">
            <Calendar className="w-12 h-12 text-stone-300 mb-4" />

            <h3 className="text-stone-800 font-medium text-lg">
              No Activity Found
            </h3>

            <p className="text-stone-500 max-w-xs mx-auto">
              Select a moderator and date, then click Search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
  };

  return (
    <div className="bg-white border border-stone-100 p-5 rounded-xl transition-all duration-300 hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3 rounded-2xl ${
            colors[color].split(" ")[0]
          } border ${colors[color].split(" ")[2]}`}
        >
          {icon}
        </div>
      </div>

      <p className="text-stone-500 text-xs font-medium uppercase tracking-wider">
        {label}
      </p>

      <p className="text-3xl font-semibold text-stone-700 mt-2">{value}</p>
    </div>
  );
};

export default ModeratorActivityCard;
