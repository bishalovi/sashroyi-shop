"use client";

/**
 * ============================================================================
 * FILE: admin/shipping/page.jsx
 * VERSION: v2.0.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * 1. Dynamic Shipping Charge management (Inside Dhaka, Outside Dhaka, Free Shipping)
 * 2. Courier API Connection & Integration Hub (Steadfast & Pathao)
 * ============================================================================
 */

import { useEffect, useState } from "react";
import AdminRoute from "@/components/auth/AdminRoute";
import { toast } from "react-toastify";
import {
  FaTruck,
  FaSave,
  FaCity,
  FaMapMarkedAlt,
  FaGift,
  FaPlug,
  FaKey,
  FaBuilding,
  FaCheckCircle,
  FaExchangeAlt,
} from "react-icons/fa";

export default function AdminShippingPage() {
  const baseUrl = "https://sashroyi-api.onrender.com";
  const [activeTab, setActiveTab] = useState("charges"); // 'charges' | 'couriers'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSteadfast, setTestingSteadfast] = useState(false);
  const [testingPathao, setTestingPathao] = useState(false);
  const [steadfastTestResult, setSteadfastTestResult] = useState(null);
  const [pathaoTestResult, setPathaoTestResult] = useState(null);

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
    couriers: {
      steadfast: {
        isEnabled: true,
        apiUrl: "https://portal.packzy.com/api/v1",
        apiKey: "",
        secretKey: "",
        accounts: {
          narayanganj: { apiKey: "", secretKey: "" },
          badda: { apiKey: "", secretKey: "" },
          jamalpur: { apiKey: "", secretKey: "" },
        },
      },
      pathao: {
        isEnabled: false,
        baseUrl: "https://api-hermes.pathao.com",
        clientId: "",
        clientSecret: "",
        username: "",
        password: "",
        storeId: "",
      },
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
          couriers: {
            steadfast: {
              isEnabled: typeof data.data.couriers?.steadfast?.isEnabled === "boolean" ? data.data.couriers.steadfast.isEnabled : true,
              apiUrl: data.data.couriers?.steadfast?.apiUrl || "https://portal.packzy.com/api/v1",
              apiKey: data.data.couriers?.steadfast?.apiKey || "",
              secretKey: data.data.couriers?.steadfast?.secretKey || "",
              accounts: {
                narayanganj: {
                  apiKey: data.data.couriers?.steadfast?.accounts?.narayanganj?.apiKey || "",
                  secretKey: data.data.couriers?.steadfast?.accounts?.narayanganj?.secretKey || "",
                },
                badda: {
                  apiKey: data.data.couriers?.steadfast?.accounts?.badda?.apiKey || "",
                  secretKey: data.data.couriers?.steadfast?.accounts?.badda?.secretKey || "",
                },
                jamalpur: {
                  apiKey: data.data.couriers?.steadfast?.accounts?.jamalpur?.apiKey || "",
                  secretKey: data.data.couriers?.steadfast?.accounts?.jamalpur?.secretKey || "",
                },
              },
            },
            pathao: {
              isEnabled: Boolean(data.data.couriers?.pathao?.isEnabled),
              baseUrl: data.data.couriers?.pathao?.baseUrl || "https://api-hermes.pathao.com",
              clientId: data.data.couriers?.pathao?.clientId || "",
              clientSecret: data.data.couriers?.pathao?.clientSecret || "",
              username: data.data.couriers?.pathao?.username || "",
              password: data.data.couriers?.pathao?.password || "",
              storeId: data.data.couriers?.pathao?.storeId || "",
            },
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
        toast.success("Shipping & Courier settings saved successfully!");
      } else {
        toast.error(result.message || "Failed to save settings");
      }
    } catch (err) {
      toast.error("Error saving settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestSteadfast = async (accountName = "primary") => {
    try {
      setTestingSteadfast(true);
      setSteadfastTestResult(null);

      let apiKey = formData.couriers.steadfast.apiKey;
      let secretKey = formData.couriers.steadfast.secretKey;

      if (accountName !== "primary" && formData.couriers.steadfast.accounts[accountName]) {
        apiKey = formData.couriers.steadfast.accounts[accountName].apiKey || apiKey;
        secretKey = formData.couriers.steadfast.accounts[accountName].secretKey || secretKey;
      }

      const res = await fetch(`${baseUrl}/api/shipping/test-steadfast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl: formData.couriers.steadfast.apiUrl,
          apiKey,
          secretKey,
        }),
      });

      const result = await res.json();
      setSteadfastTestResult(result);
      if (result.success) {
        toast.success(result.message, { position: "top-right", autoClose: 4000 });
      } else {
        toast.error(result.message, { position: "top-right", autoClose: 4000 });
      }
    } catch (err) {
      const errMsg = "Steadfast টেস্ট ব্যর্থ হয়েছে: " + err.message;
      setSteadfastTestResult({ success: false, message: errMsg });
      toast.error(errMsg);
    } finally {
      setTestingSteadfast(false);
    }
  };

  const handleTestPathao = async () => {
    try {
      setTestingPathao(true);
      setPathaoTestResult(null);

      const res = await fetch(`${baseUrl}/api/shipping/test-pathao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: formData.couriers.pathao.baseUrl,
          clientId: formData.couriers.pathao.clientId,
          clientSecret: formData.couriers.pathao.clientSecret,
          username: formData.couriers.pathao.username,
          password: formData.couriers.pathao.password,
        }),
      });

      const result = await res.json();
      setPathaoTestResult(result);
      if (result.success) {
        toast.success(result.message, { position: "top-right", autoClose: 4000 });
      } else {
        toast.error(result.message, { position: "top-right", autoClose: 4000 });
      }
    } catch (err) {
      const errMsg = "Pathao টেস্ট ব্যর্থ হয়েছে: " + err.message;
      setPathaoTestResult({ success: false, message: errMsg });
      toast.error(errMsg);
    } finally {
      setTestingPathao(false);
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
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#0f2a44] sm:text-3xl flex items-center gap-3">
              <FaTruck className="text-[#d4af37]" /> Shipping & Courier Settings
            </h1>
            <p className="text-sm text-gray-500">
              ডেলিভারি চার্জ এবং Steadfast ও Pathao কুরিয়ার কানেকশন কনফিগার করুন।
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn bg-[#0f2a44] text-white hover:bg-[#d4af37] hover:text-[#0f2a44] transition-all duration-200 shadow"
          >
            <FaSave /> {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("charges")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition ${
              activeTab === "charges"
                ? "bg-[#0f2a44] text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaTruck /> Delivery Charges (ডেলিভারি চার্জ)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("couriers")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition ${
              activeTab === "couriers"
                ? "bg-[#0f2a44] text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaPlug /> Courier API Connect (Steadfast & Pathao)
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: DELIVERY CHARGES */}
          {activeTab === "charges" && (
            <div className="space-y-6">
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
            </div>
          )}

          {/* TAB 2: COURIER API INTEGRATION (STEADFAST & PATHAO) */}
          {activeTab === "couriers" && (
            <div className="space-y-6">
              {/* STEADFAST COURIER INTEGRATION CARD */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 font-bold text-xl">
                      ⚡
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#0f2a44] flex items-center gap-2">
                        Steadfast Courier API Integration
                      </h2>
                      <p className="text-xs text-gray-500">
                        অর্ডার সরাসরি ১-ক্লিকে Steadfast কুরিয়ারে পাঠানোর জন্য API Key ও Secret সেট করুন।
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${formData.couriers.steadfast.isEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {formData.couriers.steadfast.isEnabled ? "Active" : "Disabled"}
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={formData.couriers.steadfast.isEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          couriers: {
                            ...formData.couriers,
                            steadfast: {
                              ...formData.couriers.steadfast,
                              isEnabled: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Steadfast Base API URL
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full font-mono text-sm bg-gray-50"
                      value={formData.couriers.steadfast.apiUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          couriers: {
                            ...formData.couriers,
                            steadfast: {
                              ...formData.couriers.steadfast,
                              apiUrl: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  {/* Primary Account Credentials */}
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                        <FaKey className="text-indigo-600" /> Primary Account (মূল অ্যাকাউন্ট)
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleTestSteadfast("primary")}
                        disabled={testingSteadfast}
                        className="btn btn-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {testingSteadfast ? "টেস্টিং..." : "⚡ Test Connection (ব্যালেন্স চেক)"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">
                          API Key *
                        </label>
                        <input
                          type="text"
                          placeholder="Steadfast API Key"
                          className="input input-bordered input-sm w-full font-mono"
                          value={formData.couriers.steadfast.apiKey}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              couriers: {
                                ...formData.couriers,
                                steadfast: {
                                  ...formData.couriers.steadfast,
                                  apiKey: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">
                          Secret Key *
                        </label>
                        <input
                          type="text"
                          placeholder="Steadfast Secret Key"
                          className="input input-bordered input-sm w-full font-mono"
                          value={formData.couriers.steadfast.secretKey}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              couriers: {
                                ...formData.couriers,
                                steadfast: {
                                  ...formData.couriers.steadfast,
                                  secretKey: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multi-Branch Accounts (Narayanganj, Badda, Jamalpur) */}
                  <div className="border-t border-gray-100 pt-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Branch / Warehouse Accounts (ব্রাঞ্চভিত্তিক অ্যাকাউন্ট - ঐচ্ছিক)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Narayanganj */}
                      <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0f2a44]">Narayanganj</span>
                          <button
                            type="button"
                            onClick={() => handleTestSteadfast("narayanganj")}
                            className="text-[10px] text-indigo-600 font-semibold hover:underline"
                          >
                            টেস্ট
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="API Key"
                          className="input input-bordered input-xs w-full font-mono"
                          value={formData.couriers.steadfast.accounts.narayanganj.apiKey}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              couriers: {
                                ...formData.couriers,
                                steadfast: {
                                  ...formData.couriers.steadfast,
                                  accounts: {
                                    ...formData.couriers.steadfast.accounts,
                                    narayanganj: {
                                      ...formData.couriers.steadfast.accounts.narayanganj,
                                      apiKey: e.target.value,
                                    },
                                  },
                                },
                              },
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Secret Key"
                          className="input input-bordered input-xs w-full font-mono"
                          value={formData.couriers.steadfast.accounts.narayanganj.secretKey}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              couriers: {
                                ...formData.couriers,
                                steadfast: {
                                  ...formData.couriers.steadfast,
                                  accounts: {
                                    ...formData.couriers.steadfast.accounts,
                                    narayanganj: {
                                      ...formData.couriers.steadfast.accounts.narayanganj,
                                      secretKey: e.target.value,
                                    },
                                  },
                                },
                              },
                            })
                          }
                        />
                      </div>

                      {/* Badda */}
                      <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0f2a44]">Badda</span>
                          <button
                            type="button"
                            onClick={() => handleTestSteadfast("badda")}
                            className="text-[10px] text-indigo-600 font-semibold hover:underline"
                          >
                            টেস্ট
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="API Key"
                          className="input input-bordered input-xs w-full font-mono"
                          value={formData.couriers.steadfast.accounts.badda.apiKey}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              couriers: {
                                ...formData.couriers,
                                steadfast: {
                                  ...formData.couriers.steadfast,
                                  accounts: {
                                    ...formData.couriers.steadfast.accounts,
                                    badda: {
                                      ...formData.couriers.steadfast.accounts.badda,
                                      apiKey: e.target.value,
                                    },
                                  },
                                },
                              },
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Secret Key"
                          className="input input-bordered input-xs w-full font-mono"
                          value={formData.couriers.steadfast.accounts.badda.secretKey}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              couriers: {
                                ...formData.couriers,
                                steadfast: {
                                  ...formData.couriers.steadfast,
                                  accounts: {
                                    ...formData.couriers.steadfast.accounts,
                                    badda: {
                                      ...formData.couriers.steadfast.accounts.badda,
                                      secretKey: e.target.value,
                                    },
                                  },
                                },
                              },
                            })
                          }
                        />
                      </div>

                      {/* Jamalpur */}
                      <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0f2a44]">Jamalpur</span>
                          <button
                            type="button"
                            onClick={() => handleTestSteadfast("jamalpur")}
                            className="text-[10px] text-indigo-600 font-semibold hover:underline"
                          >
                            টেস্ট
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="API Key"
                          className="input input-bordered input-xs w-full font-mono"
                          value={formData.couriers.steadfast.accounts.jamalpur.apiKey}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              couriers: {
                                ...formData.couriers,
                                steadfast: {
                                  ...formData.couriers.steadfast,
                                  accounts: {
                                    ...formData.couriers.steadfast.accounts,
                                    jamalpur: {
                                      ...formData.couriers.steadfast.accounts.jamalpur,
                                      apiKey: e.target.value,
                                    },
                                  },
                                },
                              },
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Secret Key"
                          className="input input-bordered input-xs w-full font-mono"
                          value={formData.couriers.steadfast.accounts.jamalpur.secretKey}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              couriers: {
                                ...formData.couriers,
                                steadfast: {
                                  ...formData.couriers.steadfast,
                                  accounts: {
                                    ...formData.couriers.steadfast.accounts,
                                    jamalpur: {
                                      ...formData.couriers.steadfast.accounts.jamalpur,
                                      secretKey: e.target.value,
                                    },
                                  },
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PATHAO COURIER INTEGRATION CARD */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 font-bold text-xl">
                      🚴
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#0f2a44] flex items-center gap-2">
                        Pathao Courier API Integration
                      </h2>
                      <p className="text-xs text-gray-500">
                        Pathao মার্চেন্ট প্যানেলের সাথে স্বয়ংক্রিয় পার্সেল বুকিং সংযোগ।
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${formData.couriers.pathao.isEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {formData.couriers.pathao.isEnabled ? "Active" : "Disabled"}
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={formData.couriers.pathao.isEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          couriers: {
                            ...formData.couriers,
                            pathao: {
                              ...formData.couriers.pathao,
                              isEnabled: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Pathao Base URL
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full font-mono text-sm"
                        value={formData.couriers.pathao.baseUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            couriers: {
                              ...formData.couriers,
                              pathao: {
                                ...formData.couriers.pathao,
                                baseUrl: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Store ID (স্টোর আইডি)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 12345"
                        className="input input-bordered w-full font-mono text-sm"
                        value={formData.couriers.pathao.storeId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            couriers: {
                              ...formData.couriers,
                              pathao: {
                                ...formData.couriers.pathao,
                                storeId: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Client ID *
                      </label>
                      <input
                        type="text"
                        placeholder="Pathao Client ID"
                        className="input input-bordered w-full font-mono text-sm"
                        value={formData.couriers.pathao.clientId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            couriers: {
                              ...formData.couriers,
                              pathao: {
                                ...formData.couriers.pathao,
                                clientId: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Client Secret *
                      </label>
                      <input
                        type="text"
                        placeholder="Pathao Client Secret"
                        className="input input-bordered w-full font-mono text-sm"
                        value={formData.couriers.pathao.clientSecret}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            couriers: {
                              ...formData.couriers,
                              pathao: {
                                ...formData.couriers.pathao,
                                clientSecret: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Username / Email *
                      </label>
                      <input
                        type="text"
                        placeholder="merchant@example.com"
                        className="input input-bordered w-full text-sm"
                        value={formData.couriers.pathao.username}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            couriers: {
                              ...formData.couriers,
                              pathao: {
                                ...formData.couriers.pathao,
                                username: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Password *
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="input input-bordered w-full text-sm"
                        value={formData.couriers.pathao.password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            couriers: {
                              ...formData.couriers,
                              pathao: {
                                ...formData.couriers.pathao,
                                password: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleTestPathao}
                      disabled={testingPathao}
                      className="btn bg-red-600 hover:bg-red-700 text-white"
                    >
                      {testingPathao ? "টেস্টিং..." : "⚡ Test Pathao Connection (টোকেন চেক)"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="btn bg-[#0f2a44] text-white px-8 hover:bg-[#d4af37] hover:text-[#0f2a44] transition-all duration-200 shadow-md"
            >
              <FaSave /> {saving ? "Saving Changes..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </AdminRoute>
  );
}
