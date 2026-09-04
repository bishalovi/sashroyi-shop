"use client";

/**
 * ============================================================================
 * FILE: admin/shipping/page.jsx
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Dynamic Shipping Charge management (Inside Dhaka, Outside Dhaka, Free Shipping)
 * with toggles, price inputs, custom titles, and instant save.
 * ============================================================================
 */

import { useEffect, useState } from "react";
import AdminRoute from "@/components/auth/AdminRoute";
import { toast } from "react-toastify";
import { FaTruck, FaSave, FaCity, FaMapMarkedAlt, FaGift } from "react-icons/fa";

export default function AdminShippingPage() {
  const baseUrl = "https://sashroyi-api.onrender.com";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    insideDhaka: {
      title: "ঢাকার ভিতরে",
      cost: 60,
      isEnabled: true,
    },
    outsideDhaka: {
      title: "ঢাকার বাইরে",
      cost: 120,
      isEnabled: true,
    },
    freeShipping: {
      title: "ফ্রি ডেলিভারি",
      cost: 0,
      isEnabled: false,
      minOrderAmount: 0,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, [baseUrl]);

  const fetchSettings = async () => {
    if (!baseUrl) return;
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/shipping/admin`);
      const data = await res.json();
      if (data.success && data.data) {
        setFormData({
          insideDhaka: {
            title: data.data.insideDhaka?.title || "ঢাকার ভিতরে",
            cost: Number(data.data.insideDhaka?.cost ?? 60),
            isEnabled: Boolean(data.data.insideDhaka?.isEnabled),
          },
          outsideDhaka: {
            title: data.data.outsideDhaka?.title || "ঢাকার বাইরে",
            cost: Number(data.data.outsideDhaka?.cost ?? 120),
            isEnabled: Boolean(data.data.outsideDhaka?.isEnabled),
          },
          freeShipping: {
            title: data.data.freeShipping?.title || "ফ্রি ডেলিভারি",
            cost: 0,
            isEnabled: Boolean(data.data.freeShipping?.isEnabled),
            minOrderAmount: Number(data.data.freeShipping?.minOrderAmount || 0),
          },
        });
      }
    } catch (err) {
      toast.error("Failed to load shipping settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`${baseUrl}/api/shipping/admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Shipping settings saved successfully!");
      } else {
        toast.error(result.message || "Failed to save settings");
      }
    } catch (err) {
      toast.error("Error saving settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminRoute>
        <div className="flex h-96 items-center justify-center">
          <span className="loading loading-spinner loading-lg text-[#0f2a44]"></span>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#0f2a44] sm:text-3xl flex items-center gap-3">
              <FaTruck className="text-[#d4af37]" /> Shipping & Delivery Settings
            </h1>
            <p className="text-sm text-gray-500">
              Manage delivery charges for Inside Dhaka, Outside Dhaka, and Free Shipping.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn bg-[#0f2a44] text-white hover:bg-[#d4af37] hover:text-[#0f2a44] transition-all duration-200"
          >
            <FaSave /> {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Inside Dhaka Card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FaCity className="text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0f2a44]">
                    ঢাকার ভিতরে (Inside Dhaka)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Delivery charge for addresses inside Dhaka city.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-success"
                checked={formData.insideDhaka.isEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    insideDhaka: {
                      ...formData.insideDhaka,
                      isEnabled: e.target.checked,
                    },
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Option Title (অপশনের নাম)
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={formData.insideDhaka.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      insideDhaka: {
                        ...formData.insideDhaka,
                        title: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Delivery Charge (টাকা ৳)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    className="input input-bordered w-full pl-8 font-semibold text-[#0f2a44]"
                    value={formData.insideDhaka.cost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        insideDhaka: {
                          ...formData.insideDhaka,
                          cost: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Outside Dhaka Card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <FaMapMarkedAlt className="text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0f2a44]">
                    ঢাকার বাইরে (Outside Dhaka)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Delivery charge for addresses outside Dhaka city across Bangladesh.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-success"
                checked={formData.outsideDhaka.isEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    outsideDhaka: {
                      ...formData.outsideDhaka,
                      isEnabled: e.target.checked,
                    },
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Option Title (অপশনের নাম)
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={formData.outsideDhaka.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      outsideDhaka: {
                        ...formData.outsideDhaka,
                        title: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Delivery Charge (টাকা ৳)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    className="input input-bordered w-full pl-8 font-semibold text-[#0f2a44]"
                    value={formData.outsideDhaka.cost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        outsideDhaka: {
                          ...formData.outsideDhaka,
                          cost: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Free Shipping Card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FaGift className="text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0f2a44]">
                    ফ্রি শিপিং (Free Shipping)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Offer ৳ 0 free delivery option for special promotions or all orders.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-success"
                checked={formData.freeShipping.isEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    freeShipping: {
                      ...formData.freeShipping,
                      isEnabled: e.target.checked,
                    },
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Option Title (অপশনের নাম)
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={formData.freeShipping.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      freeShipping: {
                        ...formData.freeShipping,
                        title: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Delivery Charge (টাকা ৳)
                </label>
                <input
                  type="text"
                  disabled
                  value="৳ 0.00 (Free)"
                  className="input input-bordered w-full bg-gray-100 font-semibold text-green-600"
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn bg-[#0f2a44] text-white px-8 hover:bg-[#d4af37] hover:text-[#0f2a44] transition-all duration-200"
            >
              <FaSave /> {saving ? "Saving Changes..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </AdminRoute>
  );
}
