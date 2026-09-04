"use client";

/**
 * ============================================================================
 * FILE: admin/settings/page.jsx
 * VERSION: v2.0.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Complete Website Customization Hub with 6 tabs:
 * 1. Header & Navigation (Logo, Shop name, Tagline, Favicon, Nav Menu Links)
 * 2. Footer & Branding (About description, Quick links, Copyright)
 * 3. Top Notice Bar (Enabled, Text, Link, Colors)
 * 4. Hero Section & Video (Headlines, Subtitle, Buttons, YouTube Embed)
 * 5. Contact & Social (Phone, WhatsApp, FB Page, FB Group, Instagram, Messenger, Email, Address)
 * 6. Offer Countdown Timer (Enabled, Title, Target Date)
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
  FiMenu,
  FiPlus,
  FiTrash2,
  FiExternalLink,
} from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function AdminSettingsPage() {
  const baseUrl = "https://sashroyi-api.onrender.com";
  const [activeTab, setActiveTab] = useState("header");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    header: {
      shopName: "Sashroyi",
      tagline: "Blessings in every moment",
      logoUrl: "",
      faviconUrl: "",
      navLinks: [
        { label: "Home", url: "/" },
        { label: "Wall Clock", url: "/category/wall-clock/natural" },
        { label: "Wall Canvas", url: "/category/wall-canvas/natural" },
        { label: "Wall Art", url: "/category/wall-art/natural" },
        { label: "Round Clock", url: "/category/round-clock/natural" },
        { label: "Others", url: "/category/others/natural" },
      ],
    },
    footer: {
      aboutText: "Premium Islamic Wall Clocks & Canvas Art. Crafted with elegance for your home.",
      copyrightText: "© 2026 Sashroyi. All rights reserved.",
      quickLinks: [
        { label: "Home", url: "/" },
        { label: "Wall Clocks", url: "/category/wall-clock/natural" },
        { label: "Wall Canvas", url: "/category/wall-canvas/natural" },
        { label: "Facebook Group", url: "https://facebook.com/groups/" },
      ],
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
      title: "Sashroyi - Islamic Clock & Canvas",
      subtitle:
        "Discover curated collections of premium Islamic wall clocks and canvas art. Crafted with elegance for those who value faith and beauty.",
      primaryBtnText: "Shop Now",
      primaryBtnLink: "/category/wall-clock/natural",
      secondaryBtnText: "Explore Categories",
      secondaryBtnLink: "/category/wall-canvas/natural",
      videoUrl: "https://www.youtube.com/embed/amRfomXo1_0?rel=0",
    },
    contact: {
      phone: "01910037935",
      whatsapp: "01910037935",
      facebookPage: "https://www.facebook.com/",
      messengerUrl: "https://m.me/",
      instagram: "https://www.instagram.com/",
      facebookGroup: "https://facebook.com/groups/",
      email: "sashroyi@gmail.com",
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
          header: {
            shopName: d.header?.shopName || d.general?.shopName || settings.header.shopName,
            tagline: d.header?.tagline || d.general?.tagline || settings.header.tagline,
            logoUrl: d.header?.logoUrl || d.general?.logoUrl || settings.header.logoUrl,
            faviconUrl: d.header?.faviconUrl || d.general?.faviconUrl || settings.header.faviconUrl,
            navLinks: d.header?.navLinks || settings.header.navLinks,
          },
          footer: {
            aboutText: d.footer?.aboutText || settings.footer.aboutText,
            copyrightText: d.footer?.copyrightText || settings.footer.copyrightText,
            quickLinks: d.footer?.quickLinks || settings.footer.quickLinks,
          },
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
        toast.success("সব সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
      } else {
        toast.error(result.message || "Failed to save settings");
      }
    } catch (err) {
      toast.error("Error saving settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Nav link helpers
  const handleAddNavLink = () => {
    setSettings((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        navLinks: [...(prev.header.navLinks || []), { label: "New Link", url: "/" }],
      },
    }));
  };

  const handleUpdateNavLink = (idx, field, value) => {
    const updated = [...(settings.header.navLinks || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    setSettings((prev) => ({
      ...prev,
      header: { ...prev.header, navLinks: updated },
    }));
  };

  const handleRemoveNavLink = (idx) => {
    const updated = settings.header.navLinks.filter((_, i) => i !== idx);
    setSettings((prev) => ({
      ...prev,
      header: { ...prev.header, navLinks: updated },
    }));
  };

  // Quick link helpers
  const handleAddQuickLink = () => {
    setSettings((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        quickLinks: [...(prev.footer.quickLinks || []), { label: "New Link", url: "/" }],
      },
    }));
  };

  const handleUpdateQuickLink = (idx, field, value) => {
    const updated = [...(settings.footer.quickLinks || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    setSettings((prev) => ({
      ...prev,
      footer: { ...prev.footer, quickLinks: updated },
    }));
  };

  const handleRemoveQuickLink = (idx) => {
    const updated = settings.footer.quickLinks.filter((_, i) => i !== idx);
    setSettings((prev) => ({
      ...prev,
      footer: { ...prev.footer, quickLinks: updated },
    }));
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
    { id: "header", label: "Header & Navigation", icon: <FiGlobe /> },
    { id: "footer", label: "Footer & Branding", icon: <FiMenu /> },
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
              <FiSettings className="text-[#d4af37]" /> Website Header, Footer & Settings
            </h1>
            <p className="text-sm text-gray-500">
              হেডার, ফুটার, মেনু লিঙ্ক, ব্যানার, নোটিশ বার ও সোশ্যাল লিঙ্ক কাস্টমাইজ করুন।
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn bg-[#0f2a44] text-white hover:bg-[#d4af37] hover:text-[#0f2a44] transition-all duration-200 shadow-md"
          >
            <FiSave /> {saving ? "সংরক্ষণ হচ্ছে..." : "Save All Changes (সেভ করুন)"}
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
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: Header & Navigation */}
          {activeTab === "header" && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-lg font-bold text-[#0f2a44]">
                  Header & Main Navigation Settings
                </h2>
                <p className="text-xs text-gray-500">
                  ওয়েবসাইটের লোগো, শপের নাম, ট্যাগলাইন এবং প্রধান মেনুর লিঙ্কগুলো সাজান।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Shop / Website Name (সাইটের নাম) *
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={settings.header.shopName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        header: { ...settings.header, shopName: e.target.value },
                      })
                    }
                    placeholder="Sashroyi"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Tagline / Slogan (ট্যাগলাইন বা স্লোগান)
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={settings.header.tagline}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        header: { ...settings.header, tagline: e.target.value },
                      })
                    }
                    placeholder="Blessings in every moment"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Logo Image URL (লোগো ছবির লিঙ্ক - Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://... (ফাঁকা রাখলে ডিফল্ট লোগো শো করবে)"
                    className="input input-bordered w-full"
                    value={settings.header.logoUrl}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        header: { ...settings.header, logoUrl: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Favicon URL (ফেভিকন লিঙ্ক - Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://.../favicon.ico"
                    className="input input-bordered w-full"
                    value={settings.header.faviconUrl}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        header: { ...settings.header, faviconUrl: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              {/* Navigation Menu Links */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#0f2a44]">
                      Header Navbar Links (প্রধান মেনু লিঙ্কসমূহ)
                    </h3>
                    <p className="text-xs text-gray-500">
                      ন্যাভবারে প্রদর্শিত মেনু লিঙ্কগুলো এডিট করুন, নতুন লিঙ্ক যোগ করুন বা মুছুন।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNavLink}
                    className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 gap-1"
                  >
                    <FiPlus /> Add Menu Link
                  </button>
                </div>

                <div className="space-y-3">
                  {settings.header.navLinks?.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row gap-2 items-center bg-gray-50 p-3 rounded-xl border border-gray-200"
                    >
                      <span className="text-xs font-bold text-gray-400 w-6 text-center">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Link Label (e.g. Wall Clock)"
                        value={link.label}
                        onChange={(e) => handleUpdateNavLink(idx, "label", e.target.value)}
                        className="input input-bordered input-sm flex-1 w-full font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Link URL (e.g. /category/wall-clock/natural)"
                        value={link.url}
                        onChange={(e) => handleUpdateNavLink(idx, "url", e.target.value)}
                        className="input input-bordered input-sm flex-1 w-full font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNavLink(idx)}
                        className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50"
                        title="Remove Link"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Footer & Branding */}
          {activeTab === "footer" && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-lg font-bold text-[#0f2a44]">
                  Footer & Branding Settings
                </h2>
                <p className="text-xs text-gray-500">
                  ফুটারের সংক্ষিপ্ত পরিচিতি, কুইক লিঙ্ক ও কপিরাইট তথ্য নিয়ন্ত্রণ করুন।
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  About Store / Footer Description (সংক্ষিপ্ত পরিচিতি)
                </label>
                <textarea
                  rows={3}
                  className="textarea textarea-bordered w-full"
                  value={settings.footer.aboutText}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, aboutText: e.target.value },
                    })
                  }
                  placeholder="Premium Islamic Wall Clocks & Canvas Art..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Copyright Text (কপিরাইট বার্তা)
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={settings.footer.copyrightText}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, copyrightText: e.target.value },
                    })
                  }
                  placeholder="© 2026 Sashroyi. All rights reserved."
                />
              </div>

              {/* Developer Attribution Info */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <p className="text-xs font-semibold text-amber-900 mb-1">
                  💡 Developer Attribution (ডেভেলপার ক্রেডিট):
                </p>
                <p className="text-xs text-amber-800">
                  Developed by <span className="font-bold text-[#d4af37]">Rayhan</span> (WhatsApp: 016229733026) স্বয়ংক্রিয়ভাবে ফুটারের নিচে সংরক্ষিত রয়েছে।
                </p>
              </div>

              {/* Footer Quick Links */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#0f2a44]">
                      Footer Quick Links (ফুটার কুইক লিঙ্কসমূহ)
                    </h3>
                    <p className="text-xs text-gray-500">
                      ফুটারের কুইক লিঙ্ক কলামে দেখানোর জন্য লিঙ্ক যুক্ত করুন।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddQuickLink}
                    className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 gap-1"
                  >
                    <FiPlus /> Add Quick Link
                  </button>
                </div>

                <div className="space-y-3">
                  {settings.footer.quickLinks?.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row gap-2 items-center bg-gray-50 p-3 rounded-xl border border-gray-200"
                    >
                      <span className="text-xs font-bold text-gray-400 w-6 text-center">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Link Label (e.g. Wall Clocks)"
                        value={link.label}
                        onChange={(e) => handleUpdateQuickLink(idx, "label", e.target.value)}
                        className="input input-bordered input-sm flex-1 w-full font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Link URL (e.g. /category/wall-clock/natural)"
                        value={link.url}
                        onChange={(e) => handleUpdateQuickLink(idx, "url", e.target.value)}
                        className="input input-bordered input-sm flex-1 w-full font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveQuickLink(idx)}
                        className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50"
                        title="Remove Link"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Notice Bar */}
          {activeTab === "noticeBar" && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-lg font-bold text-[#0f2a44]">
                    Top Announcement / Notice Bar
                  </h2>
                  <p className="text-xs text-gray-500">
                    ওয়েবসাইটের একেবারে শীর্ষে নোটিশ বা বিশেষ অফার ব্যানার দেখান।
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

          {/* TAB 4: Hero Banner & Video */}
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

          {/* TAB 5: Contact & Social */}
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
                    placeholder="019XXXXXXXX"
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
                    placeholder="sashroyi@gmail.com"
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

          {/* TAB 6: Offer Countdown Timer */}
          {activeTab === "offerTimer" && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-lg font-bold text-[#0f2a44]">
                    Offer Countdown Timer
                  </h2>
                  <p className="text-xs text-gray-500">
                    প্রোডাক্ট পেজ এবং হোমপেজে অফার কাউন্টডাউন টাইমার পরিচালনা করুন।
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
              className="btn bg-[#0f2a44] text-white px-8 hover:bg-[#d4af37] hover:text-[#0f2a44] transition-all duration-200 shadow-md"
            >
              <FiSave /> {saving ? "Saving Changes..." : "Save Settings (সেটিংস সংরক্ষণ করুন)"}
            </button>
          </div>
        </form>
      </div>
    </AdminRoute>
  );
}
