"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiCheckCircle, FiCopy, FiExternalLink, FiGlobe, FiSave, FiSearch } from "react-icons/fi";

const DEFAULT_SEO = {
  siteTitle: "Sashroyi | Kitchen, Home & Living & Household Essentials",
  siteDescription:
    "সাশ্রয়ী মূল্যে সেরা মানের Kitchen & Dining, Home & Living, Baby Care এবং দৈনন্দিন প্রয়োজনীয় পণ্য অর্ডার করুন sashroyi.shop থেকে।",
  siteKeywords:
    "Sashroyi, sashroyi.shop, online shopping Bangladesh, kitchen dining, home living",
  ogImage: "",
  googleSiteVerification: "",
  bingSiteVerification: "",
  llmsEnabled: true,
  llmsCustomSummary: "",
  sitemapEnabled: true,
};

function getApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (
    envUrl &&
    (typeof window === "undefined" ||
      window.location.hostname === "localhost" ||
      (!envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")))
  ) {
    return envUrl;
  }
  return "https://sashroyi-api.onrender.com";
}

export default function AdminSeoPage() {
  const baseUrl = getApiBaseUrl();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.sashroyi.shop";

  const [seo, setSeo] = useState(DEFAULT_SEO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async (retryCount = 0) => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/settings/admin`);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data?.seo) {
        setSeo({ ...DEFAULT_SEO, ...json.data.seo });
      }
    } catch (err) {
      if (retryCount < 1) {
        setTimeout(() => fetchSettings(retryCount + 1), 2000);
        return;
      }
      console.error("Failed to fetch SEO settings:", err);
      toast.error("SEO সেটিংস লোড করতে সমস্যা হয়েছে (সার্ভার রেসপন্স করেনি, আবার চেষ্টা করুন)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [baseUrl]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSeo((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`${baseUrl}/api/settings/admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seo }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "সেভ করা যায়নি");
      }
      toast.success("SEO ও Webmaster সেটিংস সফলভাবে সেভ হয়েছে!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "সেভ করতে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const copyUrl = (url, label) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success(`${label} কপি করা হয়েছে!`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-[#e5dccf] rounded"></div>
          <div className="h-48 bg-white rounded-xl border border-[#e5dccf]"></div>
          <div className="h-48 bg-white rounded-xl border border-[#e5dccf]"></div>
        </div>
      </div>
    );
  }

  const autoEndpoints = [
    { label: "Sitemap XML", url: `${siteUrl}/sitemap.xml`, desc: "নতুন প্রোডাক্ট অ্যাড করলেই অটো আপডেট হয়" },
    { label: "Robots TXT", url: `${siteUrl}/robots.txt`, desc: "সার্চ ইঞ্জিন ক্রলার রুলস" },
    { label: "LLMs TXT", url: `${siteUrl}/llms.txt`, desc: "AI Search (ChatGPT, Perplexity, Gemini) এর জন্য অটো গাইড" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[#3d2f1f] flex items-center gap-2">
          <FiSearch className="text-[#d4af37]" />
          SEO & Webmaster Tools
        </h1>
        <p className="text-sm text-[#3d2f1f]/70 mt-1">
          Google Search Console, Bing Webmaster, Open Graph, Sitemap এবং llms.txt এখান থেকে অটো ও ম্যানুয়ালি কন্ট্রোল করুন।
        </p>
      </div>

      {/* Auto Endpoints Overview */}
      <div className="bg-white rounded-2xl border border-[#e5dccf] p-5 shadow-xs space-y-3">
        <h2 className="text-base font-semibold text-[#3d2f1f] flex items-center gap-2">
          <FiCheckCircle className="text-emerald-600" />
          অটো-জেনারেটেড SEO লিংকসমূহ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {autoEndpoints.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-[#e5dccf] bg-[#faf7f0]/60 p-3 flex flex-col justify-between gap-2"
            >
              <div>
                <div className="text-sm font-semibold text-[#3d2f1f]">{item.label}</div>
                <div className="text-xs text-[#3d2f1f]/65 mt-0.5">{item.desc}</div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => copyUrl(item.url, item.label)}
                  className="btn btn-xs bg-white border-[#e5dccf] text-[#3d2f1f] hover:bg-[#d4af37] hover:text-white"
                >
                  <FiCopy /> Copy
                </button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-xs btn-ghost text-[#0f2a44]"
                >
                  <FiExternalLink /> Open
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Search Engine Verification */}
        <div className="bg-white rounded-2xl border border-[#e5dccf] p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-semibold text-[#3d2f1f] flex items-center gap-2">
            <FiGlobe className="text-[#d4af37]" />
            Google Search Console & Bing Webmaster Verification
          </h2>
          <p className="text-xs text-[#3d2f1f]/65">
            HTML tag থেকে শুধু <code className="bg-[#faf7f0] px-1.5 py-0.5 rounded">content=&quot;...&quot;</code> এর ভেতরের কোডটি এখানে পেস্ট করুন—অটোমেটিক সাইটের হেডারে যুক্ত হয়ে যাবে।
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3d2f1f] mb-1">
                Google Search Console Verification Code
              </label>
              <input
                type="text"
                name="googleSiteVerification"
                value={seo.googleSiteVerification}
                onChange={handleChange}
                placeholder="e.g. abc123xyz_google_verification_code"
                className="w-full rounded-xl border border-[#e5dccf] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3d2f1f] mb-1">
                Bing Webmaster Tools Verification Code
              </label>
              <input
                type="text"
                name="bingSiteVerification"
                value={seo.bingSiteVerification}
                onChange={handleChange}
                placeholder="e.g. 1234567890ABCDEF1234567890ABCDEF"
                className="w-full rounded-xl border border-[#e5dccf] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>
        </div>

        {/* Open Graph & Global Meta Tags */}
        <div className="bg-white rounded-2xl border border-[#e5dccf] p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-semibold text-[#3d2f1f]">
            Open Graph & Global Meta Tags (হোমপেজ ও ডিফল্ট)
          </h2>

          <div>
            <label className="block text-sm font-medium text-[#3d2f1f] mb-1">
              Default Site Title
            </label>
            <input
              type="text"
              name="siteTitle"
              value={seo.siteTitle}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#e5dccf] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3d2f1f] mb-1">
              Default Meta Description
            </label>
            <textarea
              rows={3}
              name="siteDescription"
              value={seo.siteDescription}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#e5dccf] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#3d2f1f] mb-1">
                Global Keywords (কমা দিয়ে)
              </label>
              <input
                type="text"
                name="siteKeywords"
                value={seo.siteKeywords}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#e5dccf] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3d2f1f] mb-1">
                Default Open Graph Image URL (Facebook/WhatsApp শেয়ার ছবি)
              </label>
              <input
                type="url"
                name="ogImage"
                value={seo.ogImage}
                onChange={handleChange}
                placeholder="https://res.cloudinary.com/..."
                className="w-full rounded-xl border border-[#e5dccf] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>
        </div>

        {/* llms.txt & Sitemap Controls */}
        <div className="bg-white rounded-2xl border border-[#e5dccf] p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-semibold text-[#3d2f1f]">
            Sitemap ও llms.txt (AI Search SEO)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 rounded-xl border border-[#e5dccf] p-3.5 cursor-pointer">
              <input
                type="checkbox"
                name="sitemapEnabled"
                checked={seo.sitemapEnabled}
                onChange={handleChange}
                className="h-4 w-4 accent-[#d4af37]"
              />
              <span className="text-sm font-medium text-[#3d2f1f]">
                Auto Sitemap.xml চালু রাখুন
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-[#e5dccf] p-3.5 cursor-pointer">
              <input
                type="checkbox"
                name="llmsEnabled"
                checked={seo.llmsEnabled}
                onChange={handleChange}
                className="h-4 w-4 accent-[#d4af37]"
              />
              <span className="text-sm font-medium text-[#3d2f1f]">
                Auto llms.txt চালু রাখুন
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3d2f1f] mb-1">
              llms.txt Custom Summary (ঐচ্ছিক — খালি রাখলে অটো তৈরি হবে)
            </label>
            <textarea
              rows={2}
              name="llmsCustomSummary"
              value={seo.llmsCustomSummary}
              onChange={handleChange}
              placeholder="আপনার শপ সম্পর্কে AI সার্চ ইঞ্জিনের জন্য সংক্ষিপ্ত বর্ণনা..."
              className="w-full rounded-xl border border-[#e5dccf] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto rounded-xl bg-[#d4af37] px-8 py-3 font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <FiSave />
          <span>{saving ? "সেভ হচ্ছে..." : "Save SEO Settings (সেভ করুন)"}</span>
        </button>
      </form>
    </div>
  );
}
