"use client";

/**
 * ============================================================================
 * FILE: admin/settings/page.jsx
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Website Settings & Customization Hub with 5 clean tabs:
 * 1. General & Branding
 * 2. Notice Bar
 * 3. Hero Section & Video
 * 4. Contact & Social
 * 5. Offer Countdown Timer
 * ============================================================================
 */

import { useEffect, useState } from "react";
import AdminRoute from "@/components/auth/AdminRoute";
import { toast } from "react-toastify";
import {
  FiSettings,
  FiSave,
  FiVolume2,
  FiImage,
  FiPhone,
  FiClock,
  FiGlobe,
} from "react-icons/fi";

export default function AdminSettingsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    general: {
      shopName: "Barakah",
      tagline: "Blessings in every moment",
      logoUrl: "",
      faviconUrl: "",
    },
    noticeBar: {
      isEnabled: true,
      text: "🔥 যেকোনো ২টি প্রোডাক্ট অর্ডারে ডেলিভারি সম্পূর্ণ ফ্রি!",
      link: "",
      bgColor: "#0f2a44",
      textColor: "#f2c94c",
    },
    hero: {
      badgeText: "Blessings in every moment",
      title: "Barakah - Islamic Clock & Canvas",
      subtitle:
        "Discover curated collections of premium Islamic wall clocks and canvas art. Crafted with elegance for those who value faith and beauty.",
      primaryBtnText: "Shop Now",
      primaryBtnLink: "/category/wall-clock/natural",
      secondaryBtnText: "Explore Categories",
      secondaryBtnLink: "/category/wall-canvas/natural",
      videoUrl: "https://www.youtube.com/embed/amRfomXo1_0?rel=0",
    },
    contact: {
      phone: "01810529221",
      whatsapp: "01810529221",
      facebookPage: "https://www.facebook.com/profile.php?id=61575470920192",
      messengerUrl: "https://m.me/61575470920192",
      instagram: "https://www.instagram.com/saheen_shuvo/?hl=en",
      facebookGroup: "https://facebook.com/groups/893573157040880/",
      email: "barakahislamicclock@gmail.com",
      address: "Dhaka, Bangladesh",
    },
    offerTimer: {
      isEnabled: true,
      title: "সীমিত সময়ের বিশেষ অফার!",
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16),
    },
  });

  useEffect(() => {
    fetchSettings();
  }, [baseUrl]);

  const fetchSettings = async () => {
    if (!baseUrl) return;
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/settings/admin`);
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setSettings({
          general: { ...settings.general, ...(d.general || {}) },
          noticeBar: { ...settings.noticeBar, ...(d.noticeBar || {}) },
          hero: { ...settings.hero, ...(d.hero || {}) },
          contact: { ...settings.contact, ...(d.contact || {}) },
          offerTimer: {
            ...settings.offerTimer,
            ...(d.offerTimer || {}),
            targetDate: d.offerTimer?.targetDate
              ? new Date(d.offerTimer.targetDate).toISOString().slice(0, 16)
              : settings.offerTimer.targetDate,
          },
        });
      }
    } catch (err) {
      toast.error("Failed to load settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`${baseUrl}/api/settings/admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Website settings saved successfully!");
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

  const tabs = [
    { id: "general", label: "General & Branding", icon: <FiGlobe /> },
    { id: "noticeBar", label: "Notice Bar", icon: <FiVolume2 /> },
    { id: "hero", label: "Hero Banner & Video", icon: <FiImage /> },
    { id: "contact", label: "Contact & Social", icon: <FiPhone /> },
    { id: "offerTimer", label: "Offer Countdown", icon: <FiClock /> },
  ];

  return (
    <AdminRoute>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#0f2a44] sm:text-3xl flex items-center gap-3">
              <FiSettings className="text-[#d4af37]" /> Website Customization & Settings
            </h1>
            <p className="text-sm text-gray-500">
              Manage website banners, notice bar, contact links, and countdown timer.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn bg-[#0f2a44] text-white hover:bg-[#d4af37] hover:text-[#0f2a44] transition-all duration-200"
          >
            <FiSave /> {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-[#0f2a44] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: General & Branding */}
          {activeTab === "general" && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-bold text-[#0f2a44] border-b pb-3">
                General & Branding Settings
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Shop / Website Name (সাইটের নাম)
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={settings.general.shopName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, shopName: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Tagline / Slogan (স্লোগান)
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={settings.general.tagline}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, tagline: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Logo Image URL (লোগো ছবির লিঙ্ক)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="input input-bordered w-full"
                    value={settings.general.logoUrl}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, logoUrl: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Favicon URL (ফেভিকন লিঙ্ক)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="input input-bordered w-full"
                    value={settings.general.faviconUrl}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, faviconUrl: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Notice Bar */}
          {activeTab === "noticeBar" && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-lg font-bold text-[#0f2a44]">
                    Top Announcement / Notice Bar
                  </h2>
                  <p className="text-xs text-gray-500">
                    Display a highlighted notice or promotional banner at the very top of the website.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-success"
                  checked={settings.noticeBar.isEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      noticeBar: {
                        ...settings.noticeBar,
                        isEnabled: e.target.checked,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Notice Text (নোটিশের লেখা)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 🔥 যেকোনো ২টি প্রোডাক্ট অর্ডারে ডেলিভারি ফ্রি!"
                    className="input input-bordered w-full"
                    value={settings.noticeBar.text}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        noticeBar: { ...settings.noticeBar, text: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Target Link (ঐচ্ছিক ক্লিক লিংক)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /category/wall-clock/natural or https://..."
                    className="input input-bordered w-full"
                    value={settings.noticeBar.link}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        noticeBar: { ...settings.noticeBar, link: e.target.value },
                      })
                    }
                  />
                </div>

                {/* Live Preview */}
                <div className="pt-2">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Live Preview (প্রিভিউ):</p>
                  <div className="rounded-lg bg-[#0f2a44] p-2.5 text-center text-sm font-medium text-[#f2c94c] shadow-inner">
                    {settings.noticeBar.text || "আপনার নোটিশ এখানে শো করবে"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Hero Banner & Video */}
          {activeTab === "hero" && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-bold text-[#0f2a44] border-b pb-3">
                Hero Section & Video Banner
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Hero Badge Text (ছোট ব্যাজ টেক্সট)
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={settings.hero.badgeText}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, badgeText: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Main Headline Title (প্রধান শিরোনাম)
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={settings.hero.title}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, title: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Hero Subtitle / Description (বিস্তারিত বিবরণ)
                  </label>
                  <textarea
                    rows={3}
                    className="textarea textarea-bordered w-full"
                    value={settings.hero.subtitle}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, subtitle: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Primary Button Text (প্রথম বাটন নাম)
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={settings.hero.primaryBtnText}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, primaryBtnText: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Primary Button Link (প্রথম বাটন লিংক)
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={settings.hero.primaryBtnLink}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, primaryBtnLink: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Secondary Button Text (দ্বিতীয় বাটন নাম)
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={settings.hero.secondaryBtnText}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, secondaryBtnText: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Secondary Button Link (দ্বিতীয় বাটন লিংক)
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={settings.hero.secondaryBtnLink}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, secondaryBtnLink: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    YouTube Video URL / Embed Link (হোমপেজ ভিডিও লিংক)
                  </label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/embed/..."
                    className="input input-bordered w-full"
                    value={settings.hero.videoUrl}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, videoUrl: e.target.value },
                      })
                    }
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Format: https://www.youtube.com/embed/VIDEO_ID?rel=0
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Contact & Social */}
          {activeTab === "contact" && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-bold text-[#0f2a44] border-b pb-3">
                Contact Information & Social Links
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Primary Phone Number (কল করার নম্বর)
                  </label>
                  <input
                    type="text"
                    placeholder="018XXXXXXXX"
                    className="input input-bordered w-full"
                    value={settings.contact.phone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, phone: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    WhatsApp Number (হোয়াটসঅ্যাপ নম্বর)
                  </label>
                  <input
                    type="text"
                    placeholder="019XXXXXXXX"
                    className="input input-bordered w-full"
                    value={settings.contact.whatsapp}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, whatsapp: e.target.value },
                      })
                    }
                  />
                  {settings.contact.whatsapp && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <span>✓ WhatsApp প্রিভিউ:</span>
                      <a
                        href={`https://wa.me/${String(settings.contact.whatsapp).replace(/[^\d]/g, "").startsWith("88") ? String(settings.contact.whatsapp).replace(/[^\d]/g, "") : "88" + String(settings.contact.whatsapp).replace(/[^\d]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold"
                      >
                        টেস্ট লিঙ্ক ক্লিক করুন
                      </a>
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Facebook Page URL (ফেসবুক পেজ লিংক)
                  </label>
                  <input
                    type="text"
                    placeholder="https://facebook.com/..."
                    className="input input-bordered w-full"
                    value={settings.contact.facebookPage}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, facebookPage: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Messenger URL (মেসেঞ্জার চ্যাট লিংক)
                  </label>
                  <input
                    type="text"
                    placeholder="https://m.me/..."
                    className="input input-bordered w-full"
                    value={settings.contact.messengerUrl}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, messengerUrl: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Instagram Profile URL (ইনস্টাগ্রাম লিংক)
                  </label>
                  <input
                    type="text"
                    placeholder="https://instagram.com/..."
                    className="input input-bordered w-full"
                    value={settings.contact.instagram}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, instagram: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Facebook Group URL (ফেসবুক গ্রুপ লিংক)
                  </label>
                  <input
                    type="text"
                    placeholder="https://facebook.com/groups/..."
                    className="input input-bordered w-full"
                    value={settings.contact.facebookGroup}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, facebookGroup: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Support Email (ইমেইল ঠিকানা)
                  </label>
                  <input
                    type="email"
                    placeholder="info@example.com"
                    className="input input-bordered w-full"
                    value={settings.contact.email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, email: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Office / Store Address (ঠিকানা)
                  </label>
                  <input
                    type="text"
                    placeholder="Dhaka, Bangladesh"
                    className="input input-bordered w-full"
                    value={settings.contact.address}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, address: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Offer Countdown Timer */}
          {activeTab === "offerTimer" && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-lg font-bold text-[#0f2a44]">
                    Offer Countdown Timer
                  </h2>
                  <p className="text-xs text-gray-500">
                    Manage promotional countdown timer shown on product pages and homepage.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-success"
                  checked={settings.offerTimer.isEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      offerTimer: {
                        ...settings.offerTimer,
                        isEnabled: e.target.checked,
                      },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Offer Headline (অফারের শিরোনাম)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. সীমিত সময়ের বিশেষ অফার!"
                    className="input input-bordered w-full"
                    value={settings.offerTimer.title}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        offerTimer: {
                          ...settings.offerTimer,
                          title: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Target End Date & Time (অফার শেষ হওয়ার তারিখ ও সময়)
                  </label>
                  <input
                    type="datetime-local"
                    className="input input-bordered w-full font-semibold"
                    value={settings.offerTimer.targetDate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        offerTimer: {
                          ...settings.offerTimer,
                          targetDate: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn bg-[#0f2a44] text-white px-8 hover:bg-[#d4af37] hover:text-[#0f2a44] transition-all duration-200"
            >
              <FiSave /> {saving ? "Saving Changes..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </AdminRoute>
  );
}
