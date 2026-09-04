"use client";

/**
 * ============================================================================
 * FILE: admin/settings/page.jsx
 * VERSION: v2.2.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Complete Website Customization Hub with 7 tabs:
 * 1. Header & Navigation (Logo, Shop name, Tagline, Favicon, Nav Menu Links)
 * 2. Payment Methods & Numbers (bKash, Nagad, Rocket, Cash on Delivery)
 * 3. Footer & Branding (About description, Quick links, Copyright)
 * 4. Top Notice Bar (Enabled, Text, Link, Colors)
 * 5. Hero Section & Video (Headlines, Subtitle, Buttons, YouTube Embed)
 * 6. Contact & Social (Phone, WhatsApp, FB Page, FB Group, Instagram, Messenger, Email, Address)
 * 7. Offer Countdown Timer (Enabled, Title, Target Date)
 * ============================================================================
 */

import { useEffect, useState, useCallback } from "react";
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
  FiCreditCard,
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiShield,
  FiLock,
  FiSearch,
} from "react-icons/fi";

export default function AdminSettingsPage() {
  const baseUrl = "https://sashroyi-api.onrender.com";
  const [activeTab, setActiveTab] = useState("header");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Staff & Role Management State
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userFilter, setUserFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [newStaff, setNewStaff] = useState({
    userName: "",
    email: "",
    phone: "",
    password: "",
    role: "barakahModerator0102",
  });
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [roleUpdatingId, setRoleUpdatingId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

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
    paymentMethods: {
      bkash: {
        isEnabled: true,
        number: "01910037935",
        type: "Personal",
        instructions: "বিকাশ পার্সোনাল নম্বরে Send Money করুন",
      },
      nagad: {
        isEnabled: true,
        number: "01910037935",
        type: "Personal",
        instructions: "নগদ পার্সোনাল নম্বরে Send Money করুন",
      },
      rocket: {
        isEnabled: false,
        number: "01910037935",
        type: "Personal",
        instructions: "রকেট পার্সোনাল নম্বরে Send Money করুন",
      },
      cod: {
        isEnabled: true,
        title: "ক্যাশ অন ডেলিভারি",
        instructions: "পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন",
      },
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
          paymentMethods: {
            bkash: { ...settings.paymentMethods.bkash, ...(d.paymentMethods?.bkash || {}) },
            nagad: { ...settings.paymentMethods.nagad, ...(d.paymentMethods?.nagad || {}) },
            rocket: { ...settings.paymentMethods.rocket, ...(d.paymentMethods?.rocket || {}) },
            cod: { ...settings.paymentMethods.cod, ...(d.paymentMethods?.cod || {}) },
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

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("barakahUser") || "{}");
      setCurrentUser(stored);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!baseUrl) return;
    try {
      setLoadingUsers(true);
      const res = await fetch(`${baseUrl}/api/auth/users`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUsersList(data.data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (activeTab === "staff") {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.userName || !newStaff.email || !newStaff.password) {
      toast.warning("নাম, ইমেইল এবং পাসওয়ার্ড আবশ্যক!", { position: "top-right" });
      return;
    }
    if (newStaff.password.length < 6) {
      toast.warning("পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে!", { position: "top-right" });
      return;
    }
    try {
      setCreatingStaff(true);
      const res = await fetch(`${baseUrl}/api/auth/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "নতুন স্টাফ সফলভাবে যোগ করা হয়েছে!", {
          position: "top-right",
        });
        setNewStaff({
          userName: "",
          email: "",
          phone: "",
          password: "",
          role: "barakahModerator0102",
        });
        fetchUsers();
      } else {
        toast.error(data.message || "স্টাফ যোগ করতে ব্যর্থ হয়েছে", {
          position: "top-right",
        });
      }
    } catch (err) {
      toast.error("সার্ভার ত্রুটি!", { position: "top-right" });
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleUpdateUserRole = async (userId, role) => {
    try {
      setRoleUpdatingId(userId);
      const res = await fetch(`${baseUrl}/api/auth/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("রোল সফলভাবে পরিবর্তন করা হয়েছে!", { position: "top-right" });
        fetchUsers();
      } else {
        toast.error(data.message || "রোল পরিবর্তন ব্যর্থ হয়েছে", { position: "top-right" });
      }
    } catch (err) {
      toast.error("সার্ভার ত্রুটি!", { position: "top-right" });
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId, userName, email) => {
    if (email === "bishalovi4874@gmail.com") {
      toast.error("মূল অ্যাডমিন একাউন্ট ডিলিট করা যাবে না!", { position: "top-right" });
      return;
    }
    if (currentUser?.email === email) {
      toast.error("নিজের একাউন্ট নিজে ডিলিট করা যাবে না!", { position: "top-right" });
      return;
    }
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${userName || email}" এর একাউন্টটি মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      setDeletingUserId(userId);
      const res = await fetch(`${baseUrl}/api/auth/users/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("ইউজার সফলভাবে মুছে ফেলা হয়েছে!", { position: "top-right" });
        fetchUsers();
      } else {
        toast.error(data.message || "ইউজার মুছতে ব্যর্থ হয়েছে", { position: "top-right" });
      }
    } catch (err) {
      toast.error("সার্ভার ত্রুটি!", { position: "top-right" });
    } finally {
      setDeletingUserId(null);
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
    { id: "header", label: "Header & Navigation", icon: <FiGlobe /> },
    { id: "paymentMethods", label: "Payment Methods (পেমেন্ট নম্বর)", icon: <FiCreditCard /> },
    { id: "staff", label: "Admin & Moderator (অ্যাডমিন/মডারেটর)", icon: <FiUsers /> },
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
              <FiSettings className="text-[#d4af37]" /> Website Customization & Settings
            </h1>
            <p className="text-sm text-gray-500">
              হেডার, বিকাশ/নগদ পেমেন্ট নম্বর, ফুটার, মেনু লিঙ্ক, ব্যানার ও সোশ্যাল লিঙ্ক কাস্টমাইজ করুন।
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
                    placeholder="https://... বা Google Drive / ImgBB লিঙ্ক"
                    className="input input-bordered w-full font-mono text-xs"
                    value={settings.header.logoUrl}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        header: { ...settings.header, logoUrl: e.target.value },
                      })
                    }
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    💡 গুগল ড্রাইভ, ImgBB বা যেকোনো ইমেজ লিঙ্ক দেওয়া যাবে (গুগল ড্রাইভ লিঙ্ক স্বয়ংক্রিয়ভাবে কাজ করবে)।
                  </p>
                  {settings.header.logoUrl && (
                    <div className="mt-2 flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500 font-medium">লোগো প্রিভিউ:</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={settings.header.logoUrl.includes("drive.google.com")
                          ? settings.header.logoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
                            ? `https://lh3.googleusercontent.com/d/${settings.header.logoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)[1]}`
                            : settings.header.logoUrl
                          : settings.header.logoUrl}
                        alt="Logo Preview"
                        className="h-8 max-w-[120px] object-contain rounded bg-white p-1 border"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Favicon URL (ফেভিকন লিঙ্ক - Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://.../favicon.ico বা Google Drive লিঙ্ক"
                    className="input input-bordered w-full font-mono text-xs"
                    value={settings.header.faviconUrl}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        header: { ...settings.header, faviconUrl: e.target.value },
                      })
                    }
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    💡 ব্রাউজার ট্যাবে প্রদর্শিত ছোট আইকন।
                  </p>
                  {settings.header.faviconUrl && (
                    <div className="mt-2 flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500 font-medium">ফেভিকন প্রিভিউ:</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={settings.header.faviconUrl.includes("drive.google.com")
                          ? settings.header.faviconUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
                            ? `https://lh3.googleusercontent.com/d/${settings.header.faviconUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)[1]}`
                            : settings.header.faviconUrl
                          : settings.header.faviconUrl}
                        alt="Favicon Preview"
                        className="h-6 w-6 object-contain rounded bg-white p-0.5 border"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
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

          {/* TAB 2: Payment Methods & Numbers */}
          {activeTab === "paymentMethods" && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-lg font-bold text-[#0f2a44] flex items-center gap-2">
                  <FiCreditCard className="text-[#d4af37]" /> Payment Methods & Number Settings (পেমেন্ট পদ্ধতি ও নম্বর)
                </h2>
                <p className="text-xs text-gray-500">
                  চেকআউট পেজে প্রদর্শিত বিকাশ, নগদ, রকেট এবং ক্যাশ অন ডেলিভারির নম্বর ও বিবরণ সেট করুন।
                </p>
              </div>

              {/* bKash Configuration */}
              <div className="rounded-xl border border-pink-200 bg-pink-50/30 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-pink-600"></span>
                    <h3 className="text-base font-bold text-pink-900">
                      bKash (বিকাশ পেমেন্ট)
                    </h3>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-secondary"
                    checked={settings.paymentMethods?.bkash?.isEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        paymentMethods: {
                          ...settings.paymentMethods,
                          bkash: {
                            ...settings.paymentMethods.bkash,
                            isEnabled: e.target.checked,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      bKash Account Number (বিকাশ নম্বর) *
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full font-mono font-semibold"
                      placeholder="019XXXXXXXX"
                      value={settings.paymentMethods?.bkash?.number || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          paymentMethods: {
                            ...settings.paymentMethods,
                            bkash: {
                              ...settings.paymentMethods.bkash,
                              number: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Account Type (অ্যাকাউন্ট টাইপ)
                    </label>
                    <select
                      className="select select-bordered w-full bg-white"
                      value={settings.paymentMethods?.bkash?.type || "Personal"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          paymentMethods: {
                            ...settings.paymentMethods,
                            bkash: {
                              ...settings.paymentMethods.bkash,
                              type: e.target.value,
                            },
                          },
                        })
                      }
                    >
                      <option value="Personal">Personal (পার্সোনাল)</option>
                      <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                      <option value="Agent">Agent (এজেন্ট - Cash Out)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Payment Instructions / Note (কাস্টমারকে প্রদর্শিত নির্দেশিকা)
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="বিকাশ পার্সোনাল নম্বরে Send Money করুন"
                      value={settings.paymentMethods?.bkash?.instructions || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          paymentMethods: {
                            ...settings.paymentMethods,
                            bkash: {
                              ...settings.paymentMethods.bkash,
                              instructions: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Nagad Configuration */}
              <div className="rounded-xl border border-orange-200 bg-orange-50/30 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-orange-600"></span>
                    <h3 className="text-base font-bold text-orange-900">
                      Nagad (নগদ পেমেন্ট)
                    </h3>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-warning"
                    checked={settings.paymentMethods?.nagad?.isEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        paymentMethods: {
                          ...settings.paymentMethods,
                          nagad: {
                            ...settings.paymentMethods.nagad,
                            isEnabled: e.target.checked,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Nagad Account Number (নগদ নম্বর) *
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full font-mono font-semibold"
                      placeholder="019XXXXXXXX"
                      value={settings.paymentMethods?.nagad?.number || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          paymentMethods: {
                            ...settings.paymentMethods,
                            nagad: {
                              ...settings.paymentMethods.nagad,
                              number: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Account Type (অ্যাকাউন্ট টাইপ)
                    </label>
                    <select
                      className="select select-bordered w-full bg-white"
                      value={settings.paymentMethods?.nagad?.type || "Personal"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          paymentMethods: {
                            ...settings.paymentMethods,
                            nagad: {
                              ...settings.paymentMethods.nagad,
                              type: e.target.value,
                            },
                          },
                        })
                      }
                    >
                      <option value="Personal">Personal (পার্সোনাল)</option>
                      <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                      <option value="Agent">Agent (এজেন্ট - Cash Out)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Payment Instructions / Note (কাস্টমারকে প্রদর্শিত নির্দেশিকা)
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="নগদ পার্সোনাল নম্বরে Send Money করুন"
                      value={settings.paymentMethods?.nagad?.instructions || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          paymentMethods: {
                            ...settings.paymentMethods,
                            nagad: {
                              ...settings.paymentMethods.nagad,
                              instructions: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Rocket Configuration */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-purple-600"></span>
                    <h3 className="text-base font-bold text-purple-900">
                      Rocket (রকেট পেমেন্ট)
                    </h3>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.paymentMethods?.rocket?.isEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        paymentMethods: {
                          ...settings.paymentMethods,
                          rocket: {
                            ...settings.paymentMethods.rocket,
                            isEnabled: e.target.checked,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Rocket Account Number (রকেট নম্বর)
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full font-mono font-semibold"
                      placeholder="019XXXXXXXXX"
                      value={settings.paymentMethods?.rocket?.number || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          paymentMethods: {
                            ...settings.paymentMethods,
                            rocket: {
                              ...settings.paymentMethods.rocket,
                              number: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Account Type (অ্যাকাউন্ট টাইপ)
                    </label>
                    <select
                      className="select select-bordered w-full bg-white"
                      value={settings.paymentMethods?.rocket?.type || "Personal"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          paymentMethods: {
                            ...settings.paymentMethods,
                            rocket: {
                              ...settings.paymentMethods.rocket,
                              type: e.target.value,
                            },
                          },
                        })
                      }
                    >
                      <option value="Personal">Personal (পার্সোনাল)</option>
                      <option value="Merchant">Merchant (মার্চেন্ট)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Payment Instructions / Note
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="রকেট নম্বরে Send Money করুন"
                      value={settings.paymentMethods?.rocket?.instructions || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          paymentMethods: {
                            ...settings.paymentMethods,
                            rocket: {
                              ...settings.paymentMethods.rocket,
                              instructions: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Cash On Delivery Configuration */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-600"></span>
                    <h3 className="text-base font-bold text-emerald-900">
                      Cash On Delivery (ক্যাশ অন ডেলিভারি)
                    </h3>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={settings.paymentMethods?.cod?.isEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        paymentMethods: {
                          ...settings.paymentMethods,
                          cod: {
                            ...settings.paymentMethods.cod,
                            isEnabled: e.target.checked,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Method Title (পদ্ধতির নাম)
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="ক্যাশ অন ডেলিভারি"
                      value={settings.paymentMethods?.cod?.title || "ক্যাশ অন ডেলিভারি"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          paymentMethods: {
                            ...settings.paymentMethods,
                            cod: {
                              ...settings.paymentMethods.cod,
                              title: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Instructions / Note (নির্দেশিকা)
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন"
                      value={settings.paymentMethods?.cod?.instructions || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          paymentMethods: {
                            ...settings.paymentMethods,
                            cod: {
                              ...settings.paymentMethods.cod,
                              instructions: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Staff & Roles (Admin & Moderator Management) */}
          {activeTab === "staff" && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#0f2a44] flex items-center gap-2">
                      <FiUsers className="text-[#d4af37]" /> Admin & Moderator Management (অ্যাডমিন ও মডারেটর ম্যানেজমেন্ট)
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      নতুন অ্যাডমিন বা মডারেটর যুক্ত করুন, রোল পরিবর্তন করুন এবং অ্যাক্সেস পরিচালনা করুন।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchUsers}
                    className="btn btn-sm btn-outline text-[#0f2a44] hover:bg-[#0f2a44] hover:text-white"
                  >
                    রিফ্রেশ তালিকা
                  </button>
                </div>

                {/* Role Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                  <div className="flex items-center gap-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                      <FiShield size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-indigo-700 uppercase">মোট অ্যাডমিন</p>
                      <h4 className="text-2xl font-bold text-indigo-950">
                        {usersList.filter((u) => u.role === "barakahAdmin1234").length}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                      <FiUserCheck size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 uppercase">মোট মডারেটর</p>
                      <h4 className="text-2xl font-bold text-emerald-950">
                        {usersList.filter((u) => u.role === "barakahModerator0102").length}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700 text-white shadow-sm">
                      <FiUsers size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase">মোট কাস্টমার / ইউজার</p>
                      <h4 className="text-2xl font-bold text-slate-900">
                        {usersList.filter((u) => u.role !== "barakahAdmin1234" && u.role !== "barakahModerator0102").length}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add New Staff Form */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="border-b pb-3 mb-5">
                  <h3 className="text-base font-bold text-[#0f2a44] flex items-center gap-2">
                    <FiUserPlus className="text-emerald-600" /> নতুন অ্যাডমিন / মডারেটর যোগ করুন
                  </h3>
                  <p className="text-xs text-gray-500">
                    নতুন স্টাফের বিস্তারিত ও রোল সিলেক্ট করে একাউন্ট তৈরি করুন।
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      নাম (Full Name) *
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full text-sm"
                      placeholder="যেমন: মোঃ সাকিব হাসান"
                      value={newStaff.userName}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, userName: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      ইমেইল (Email Address) *
                    </label>
                    <input
                      type="email"
                      className="input input-bordered w-full text-sm font-mono"
                      placeholder="user@example.com"
                      value={newStaff.email}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      ফোন নম্বর (Phone)
                    </label>
                    <input
                      type="tel"
                      className="input input-bordered w-full text-sm font-mono"
                      placeholder="019XXXXXXXX"
                      value={newStaff.phone}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, phone: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      পাসওয়ার্ড (Password) *
                    </label>
                    <input
                      type="password"
                      className="input input-bordered w-full text-sm"
                      placeholder="কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড"
                      value={newStaff.password}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, password: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      রোল নির্বাচন করুন (Role) *
                    </label>
                    <select
                      className="select select-bordered w-full text-sm font-semibold"
                      value={newStaff.role}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, role: e.target.value })
                      }
                    >
                      <option value="barakahModerator0102">
                        💼 Moderator (মডারেটর - অর্ডার ও প্রোডাক্ট নিয়ন্ত্রণ)
                      </option>
                      <option value="barakahAdmin1234">
                        🛡️ Admin (অ্যাডমিন - সম্পূর্ণ অ্যাক্সেস)
                      </option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleCreateStaff}
                      disabled={creatingStaff}
                      className="btn bg-emerald-600 hover:bg-emerald-700 text-white w-full shadow-sm gap-2"
                    >
                      {creatingStaff ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <FiUserPlus />
                      )}
                      <span>{creatingStaff ? "যোগ করা হচ্ছে..." : "স্টাফ যোগ করুন"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Users & Staff List */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#0f2a44]">
                      সকল স্টাফ ও ইউজার তালিকা ({usersList.length})
                    </h3>
                    <p className="text-xs text-gray-500">
                      যেকোনো ইউজারের রোল পরিবর্তন বা স্টাফ রিমুভ করুন।
                    </p>
                  </div>

                  {/* Filter & Search */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="নাম বা ইমেইল খুঁজুন..."
                        className="input input-sm input-bordered pl-8 text-xs w-48 sm:w-56"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>

                    <select
                      className="select select-sm select-bordered text-xs font-semibold"
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                    >
                      <option value="all">সব ইউজার ({usersList.length})</option>
                      <option value="admins">
                        অ্যাডমিন ({usersList.filter((u) => u.role === "barakahAdmin1234").length})
                      </option>
                      <option value="moderators">
                        মডারেটর ({usersList.filter((u) => u.role === "barakahModerator0102").length})
                      </option>
                      <option value="customers">কাস্টমার / সাধারণ ইউজার</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                {loadingUsers ? (
                  <div className="flex h-48 items-center justify-center">
                    <span className="loading loading-spinner loading-md text-[#0f2a44]"></span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr className="bg-gray-50 text-xs font-bold text-gray-600">
                          <th>ইউজার</th>
                          <th>যোগাযোগ</th>
                          <th>বর্তমান রোল</th>
                          <th>রোল পরিবর্তন</th>
                          <th className="text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList
                          .filter((u) => {
                            if (userFilter === "admins") return u.role === "barakahAdmin1234";
                            if (userFilter === "moderators") return u.role === "barakahModerator0102";
                            if (userFilter === "customers")
                              return (
                                u.role !== "barakahAdmin1234" &&
                                u.role !== "barakahModerator0102"
                              );
                            return true;
                          })
                          .filter((u) => {
                            if (!userSearch) return true;
                            const q = userSearch.toLowerCase();
                            return (
                              u.userName?.toLowerCase().includes(q) ||
                              u.email?.toLowerCase().includes(q) ||
                              u.phone?.toLowerCase().includes(q)
                            );
                          })
                          .map((u) => {
                            const isAdmin = u.role === "barakahAdmin1234";
                            const isModerator = u.role === "barakahModerator0102";
                            const isRoot = u.email === "bishalovi4874@gmail.com";
                            const isSelf = currentUser?.email === u.email;

                            return (
                              <tr key={u._id} className="hover:bg-gray-50/80 transition">
                                <td>
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white shadow-sm ${
                                        isAdmin
                                          ? "bg-indigo-600"
                                          : isModerator
                                          ? "bg-emerald-600"
                                          : "bg-slate-500"
                                      }`}
                                    >
                                      {u.userName ? u.userName.charAt(0).toUpperCase() : "U"}
                                    </div>
                                    <div>
                                      <p className="font-bold text-[#0f2a44] text-sm flex items-center gap-1.5">
                                        {u.userName || "No Name"}
                                        {isRoot && (
                                          <span className="badge badge-warning badge-xs font-semibold">
                                            Root Owner
                                          </span>
                                        )}
                                        {isSelf && (
                                          <span className="badge badge-neutral badge-xs font-semibold">
                                            You
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[11px] text-gray-400">
                                        {u.createdAt
                                          ? new Date(u.createdAt).toLocaleDateString("bn-BD")
                                          : "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  <p className="font-mono text-xs text-gray-700">{u.email}</p>
                                  {u.phone && (
                                    <p className="font-mono text-xs text-gray-500">{u.phone}</p>
                                  )}
                                </td>

                                <td>
                                  {isAdmin ? (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800">
                                      <FiShield size={13} /> Admin
                                    </span>
                                  ) : isModerator ? (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                                      <FiUserCheck size={13} /> Moderator
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                      Customer / User
                                    </span>
                                  )}
                                </td>

                                <td>
                                  {isRoot ? (
                                    <span className="text-xs text-gray-400 font-medium">
                                      স্থায়ী অ্যাডমিন
                                    </span>
                                  ) : (
                                    <select
                                      className="select select-bordered select-xs text-xs font-semibold disabled:opacity-50"
                                      value={u.role || "customer"}
                                      disabled={roleUpdatingId === u._id}
                                      onChange={(e) =>
                                        handleUpdateUserRole(u._id, e.target.value)
                                      }
                                    >
                                      <option value="barakahAdmin1234">🛡️ Admin</option>
                                      <option value="barakahModerator0102">💼 Moderator</option>
                                      <option value="customer">👤 Customer</option>
                                    </select>
                                  )}
                                </td>

                                <td className="text-right">
                                  {isRoot || isSelf ? (
                                    <span className="text-xs text-gray-400">—</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteUser(u._id, u.userName, u.email)
                                      }
                                      disabled={deletingUserId === u._id}
                                      className="btn btn-ghost btn-xs text-red-500 hover:bg-red-50"
                                      title="রিমুভ করুন"
                                    >
                                      {deletingUserId === u._id ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                      ) : (
                                        <FiTrash2 size={15} />
                                      )}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>

                    {usersList.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        কোনো ইউজার পাওয়া যায়নি।
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Footer & Branding */}
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

          {/* TAB 4: Notice Bar */}
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

          {/* TAB 5: Hero Banner & Video */}
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

          {/* TAB 6: Contact & Social */}
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

          {/* TAB 7: Offer Countdown Timer */}
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
