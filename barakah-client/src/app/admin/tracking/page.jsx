"use client";

/**
 * ============================================================================
 * FILE: admin/tracking/page.jsx
 * VERSION: v1.0.1
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Admin Tracking Hub for managing GTM, Facebook Pixel & CAPI, TikTok Pixel & CAPI.
 * Includes tabs, toggles, test codes, live connection testing, and deletion.
 *
 * IMPLEMENTATION DETAILS:
 * - 3 Dedicated visual tabs matching Barakah Admin design system.
 * - Real-time save, toggle, and reset with Toast notifications.
 * - Password reveal for sensitive CAPI access tokens.
 * - Integrated live test event button to trigger sample orders in Meta/TikTok Events Manager.
 * ============================================================================
 */

import { useEffect, useState } from "react";
import AdminRoute from "@/components/auth/AdminRoute";
import { toast } from "react-toastify";
import {
  FaGoogle,
  FaFacebook,
  FaTiktok,
  FaSave,
  FaTrashAlt,
  FaVial,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

export default function AdminTrackingPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const [activeTab, setActiveTab] = useState("gtm");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showTokens, setShowTokens] = useState({ fb: false, tt: false });

  const [formData, setFormData] = useState({
    gtm: {
      containerId: "",
      isEnabled: false,
    },
    facebook: {
      pixelId: "",
      capiAccessToken: "",
      testEventCode: "",
      isEnabled: false,
      isCapiEnabled: false,
    },
    tiktok: {
      pixelId: "",
      accessToken: "",
      testEventCode: "",
      isEnabled: false,
      isCapiEnabled: false,
    },
  });

  // Fetch current tracking settings
  useEffect(() => {
    fetchSettings();
  }, [baseUrl]);

  const fetchSettings = async () => {
    if (!baseUrl) return;
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/tracking/admin`);
      const data = await res.json();
      if (data.success && data.data) {
        setFormData({
          gtm: {
            containerId: data.data.gtm?.containerId || "",
            isEnabled: Boolean(data.data.gtm?.isEnabled),
          },
          facebook: {
            pixelId: data.data.facebook?.pixelId || "",
            capiAccessToken: data.data.facebook?.capiAccessToken || "",
            testEventCode: data.data.facebook?.testEventCode || "",
            isEnabled: Boolean(data.data.facebook?.isEnabled),
            isCapiEnabled: Boolean(data.data.facebook?.isCapiEnabled),
          },
          tiktok: {
            pixelId: data.data.tiktok?.pixelId || "",
            accessToken: data.data.tiktok?.accessToken || "",
            testEventCode: data.data.tiktok?.testEventCode || "",
            isEnabled: Boolean(data.data.tiktok?.isEnabled),
            isCapiEnabled: Boolean(data.data.tiktok?.isCapiEnabled),
          },
        });
      }
    } catch (err) {
      toast.error("Failed to load tracking settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save Settings
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${baseUrl}/api/tracking/admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Tracking settings saved successfully!");
      } else {
        toast.error(result.message || "Failed to save settings");
      }
    } catch (err) {
      toast.error("Error saving settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete / Reset specific platform
  const handleDelete = async (platform) => {
    if (
      !window.confirm(
        `Are you sure you want to clear and reset ${platform.toUpperCase()} settings?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/api/tracking/admin/${platform}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`${platform.toUpperCase()} settings reset successfully!`);
        fetchSettings();
      } else {
        toast.error(result.message || "Failed to reset");
      }
    } catch (err) {
      toast.error("Error resetting: " + err.message);
    }
  };

  // Test Event Trigger
  const handleTestEvent = async (platform) => {
    try {
      setTesting(true);
      const payload = {
        platform,
        pixelId:
          platform === "facebook"
            ? formData.facebook.pixelId
            : formData.tiktok.pixelId,
        accessToken:
          platform === "facebook"
            ? formData.facebook.capiAccessToken
            : formData.tiktok.accessToken,
        testEventCode:
          platform === "facebook"
            ? formData.facebook.testEventCode
            : formData.tiktok.testEventCode,
      };

      if (!payload.pixelId || !payload.accessToken) {
        toast.warning("Please enter Pixel ID and Access Token first!");
        setTesting(false);
        return;
      }

      const res = await fetch(`${baseUrl}/api/tracking/admin/test-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(
          `Test event sent to ${platform.toUpperCase()}! Check Events Manager.`
        );
      } else {
        toast.error(result.message || "Test event failed");
      }
    } catch (err) {
      toast.error("Test event failed: " + err.message);
    } finally {
      setTesting(false);
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
            <h1 className="text-2xl font-bold text-[#0f2a44] sm:text-3xl">
              Tracking & Pixel Hub
            </h1>
            <p className="text-sm text-gray-500">
              Manage GTM, Facebook Pixel & CAPI, and TikTok tracking in one place.
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

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab("gtm")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "gtm"
                ? "bg-[#0f2a44] text-white shadow"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FaGoogle /> Google Tag Manager (GTM)
            {formData.gtm.isEnabled && (
              <span className="badge badge-success badge-xs">Active</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("facebook")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "facebook"
                ? "bg-[#1877F2] text-white shadow"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FaFacebook /> Facebook / Meta (Pixel & CAPI)
            {formData.facebook.isEnabled && (
              <span className="badge badge-success badge-xs">Active</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("tiktok")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "tiktok"
                ? "bg-black text-white shadow"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FaTiktok /> TikTok (Pixel & Events API)
            {formData.tiktok.isEnabled && (
              <span className="badge badge-success badge-xs">Active</span>
            )}
          </button>
        </div>

        {/* TAB 1: GTM */}
        {activeTab === "gtm" && (
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0f2a44]">
                  Google Tag Manager Configuration
                </h2>
                <p className="text-xs text-gray-500">
                  Controls client-side DataLayer & GTM injection across all storefront pages.
                </p>
              </div>
              <button
                onClick={() => handleDelete("gtm")}
                className="btn btn-ghost btn-sm text-error"
                title="Reset GTM Settings"
              >
                <FaTrashAlt /> Reset
              </button>
            </div>

            {/* Enable Switch */}
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 border border-gray-100">
              <div>
                <span className="font-semibold text-gray-800">
                  GTM Active Status
                </span>
                <p className="text-xs text-gray-500">
                  Enable or Pause GTM script loading on the website.
                </p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-success"
                checked={formData.gtm.isEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gtm: { ...formData.gtm, isEnabled: e.target.checked },
                  })
                }
              />
            </div>

            {/* GTM Container ID Input */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                GTM Container ID
              </label>
              <input
                type="text"
                placeholder="e.g. GTM-NJRMC2M4"
                className="input input-bordered w-full font-mono"
                value={formData.gtm.containerId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gtm: { ...formData.gtm, containerId: e.target.value },
                  })
                }
              />
              <p className="mt-1 text-xs text-gray-400">
                Enter your GTM Container ID found in tagmanager.google.com
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Facebook / Meta */}
        {activeTab === "facebook" && (
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#1877F2]">
                  Facebook (Meta) Pixel & Conversion API (CAPI)
                </h2>
                <p className="text-xs text-gray-500">
                  Full dual-layer tracking (Browser Pixel + Server-Side CAPI with iOS 14+ bypass).
                </p>
              </div>
              <button
                onClick={() => handleDelete("facebook")}
                className="btn btn-ghost btn-sm text-error"
                title="Reset Facebook Settings"
              >
                <FaTrashAlt /> Reset
              </button>
            </div>

            {/* Pixel Toggle & CAPI Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-xl bg-blue-50/50 p-4 border border-blue-100">
                <div>
                  <span className="font-semibold text-gray-800">
                    Browser Pixel Status
                  </span>
                  <p className="text-xs text-gray-500">
                    Injects fbq scripts into customer browser.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={formData.facebook.isEnabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      facebook: {
                        ...formData.facebook,
                        isEnabled: e.target.checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-blue-50/50 p-4 border border-blue-100">
                <div>
                  <span className="font-semibold text-gray-800">
                    Server-Side CAPI Status
                  </span>
                  <p className="text-xs text-gray-500">
                    Sends orders directly from Node.js to Meta Graph API.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={formData.facebook.isCapiEnabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      facebook: {
                        ...formData.facebook,
                        isCapiEnabled: e.target.checked,
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* Pixel ID */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Meta Pixel ID
              </label>
              <input
                type="text"
                placeholder="e.g. 2021970064834572"
                className="input input-bordered w-full font-mono"
                value={formData.facebook.pixelId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    facebook: {
                      ...formData.facebook,
                      pixelId: e.target.value,
                    },
                  })
                }
              />
            </div>

            {/* CAPI Access Token */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-gray-700">
                  Conversion API (CAPI) Access Token
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setShowTokens({ ...showTokens, fb: !showTokens.fb })
                  }
                  className="text-xs text-primary flex items-center gap-1"
                >
                  {showTokens.fb ? <FaEyeSlash /> : <FaEye />}{" "}
                  {showTokens.fb ? "Hide Token" : "Show Token"}
                </button>
              </div>
              <input
                type={showTokens.fb ? "text" : "password"}
                placeholder="EAAB..."
                className="input input-bordered w-full font-mono text-xs"
                value={formData.facebook.capiAccessToken}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    facebook: {
                      ...formData.facebook,
                      capiAccessToken: e.target.value,
                    },
                  })
                }
              />
              <p className="mt-1 text-xs text-gray-400">
                Generate this in Meta Events Manager &gt; Settings &gt; Conversions API &gt; Generate Access Token
              </p>
            </div>

            {/* Test Event Code */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Test Event Code (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. TEST12345"
                  className="input input-bordered flex-1 font-mono uppercase"
                  value={formData.facebook.testEventCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      facebook: {
                        ...formData.facebook,
                        testEventCode: e.target.value,
                      },
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => handleTestEvent("facebook")}
                  disabled={testing}
                  className="btn btn-outline btn-primary"
                >
                  <FaVial /> {testing ? "Sending..." : "Send Test Event"}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Use the Test Events code from Meta Events Manager to verify live server-side events.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: TikTok */}
        {activeTab === "tiktok" && (
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-black">
                  TikTok Pixel & Events API
                </h2>
                <p className="text-xs text-gray-500">
                  Track TikTok Ad campaigns via Browser Pixel and Events API.
                </p>
              </div>
              <button
                onClick={() => handleDelete("tiktok")}
                className="btn btn-ghost btn-sm text-error"
                title="Reset TikTok Settings"
              >
                <FaTrashAlt /> Reset
              </button>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div>
                  <span className="font-semibold text-gray-800">
                    TikTok Pixel Status
                  </span>
                  <p className="text-xs text-gray-500">
                    Injects ttq scripts into storefront.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-neutral"
                  checked={formData.tiktok.isEnabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tiktok: {
                        ...formData.tiktok,
                        isEnabled: e.target.checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div>
                  <span className="font-semibold text-gray-800">
                    TikTok Events API Status
                  </span>
                  <p className="text-xs text-gray-500">
                    Dispatches orders to business-api.tiktok.com.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-neutral"
                  checked={formData.tiktok.isCapiEnabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tiktok: {
                        ...formData.tiktok,
                        isCapiEnabled: e.target.checked,
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* TikTok Pixel ID */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                TikTok Pixel ID
              </label>
              <input
                type="text"
                placeholder="e.g. CXXXXXXXXXXXXXXX"
                className="input input-bordered w-full font-mono"
                value={formData.tiktok.pixelId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tiktok: {
                      ...formData.tiktok,
                      pixelId: e.target.value,
                    },
                  })
                }
              />
            </div>

            {/* TikTok Access Token */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-gray-700">
                  TikTok Events API Access Token
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setShowTokens({ ...showTokens, tt: !showTokens.tt })
                  }
                  className="text-xs text-neutral flex items-center gap-1"
                >
                  {showTokens.tt ? <FaEyeSlash /> : <FaEye />}{" "}
                  {showTokens.tt ? "Hide Token" : "Show Token"}
                </button>
              </div>
              <input
                type={showTokens.tt ? "text" : "password"}
                placeholder="Enter TikTok Access Token"
                className="input input-bordered w-full font-mono text-xs"
                value={formData.tiktok.accessToken}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tiktok: {
                      ...formData.tiktok,
                      accessToken: e.target.value,
                    },
                  })
                }
              />
            </div>

            {/* Test Event Code */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                TikTok Test Event Code (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. TEST12345"
                  className="input input-bordered flex-1 font-mono uppercase"
                  value={formData.tiktok.testEventCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tiktok: {
                        ...formData.tiktok,
                        testEventCode: e.target.value,
                      },
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => handleTestEvent("tiktok")}
                  disabled={testing}
                  className="btn btn-outline"
                >
                  <FaVial /> {testing ? "Sending..." : "Send Test Event"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}
