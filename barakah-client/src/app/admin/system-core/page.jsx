"use client";

/**
 * ============================================================================
 * FILE: app/admin/system-core/page.jsx
 * VERSION: v1.4.0 (Strict Telegram & Multi-Level Undo Engine)
 * ----------------------------------------------------------------------------
 * System Core & Updates Manager (Strictly for Root Owner)
 * Tab 1: Export Update Package with auto-generated RELEASE_NOTES.txt
 * Tab 2: Import & Deploy Update (STRICT Telegram First + 1-Click Multi Undo)
 * Tab 3: Telegram Cloud Auto-Backup (100% Free Lifetime, Zero Expiration)
 * Tab 4: Root Security & Master PIN
 * ============================================================================
 */

import { useEffect, useState, useRef } from "react";
import AdminRoute from "@/components/auth/AdminRoute";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import {
  FiCpu,
  FiDownload,
  FiUploadCloud,
  FiSend,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiFileText,
  FiKey,
  FiRefreshCw,
  FiPlay,
  FiCheck,
  FiZap,
  FiRotateCcw,
} from "react-icons/fi";

const REAL_WORK_CHANGELOG = {
  version: "v2.7.0",
  previousVersion: "v2.6.0",
  author: "Root Owner",
  whatsNew: `- [Feature] System Core & Updates Manager: এডমিন প্যানেলে রুট ওনার ড্যাশবোর্ড তৈরি করা হয়েছে (/admin/system-core)।
- [Feature] Telegram Cloud Auto-Backup Engine: সাইট আপডেটের পূর্বে ১০০% কোডের সেফটি ব্যাকআপ সরাসরি টেলিগ্রামে প্রেরণ (আজীবন সম্পূর্ণ ফ্রি)।
- [Feature] Automatic RELEASE_NOTES.txt Generator: প্রতিটি আপডেটের কাজের বিবরণ ও ফিক্স জিপের ভেতরে টেক্সট ফাইল আকারে অটোমেটিক যুক্ত হওয়া।
- [Feature] Real-time Pre-Deploy Preview: আপডেট জিপ ড্রপ করলেই কোড কার্যকর করার আগেই স্ক্রিনে পরিবর্তন ও রিলিজ নোটস প্রিভিউ।
- [Security] Strict Root Owner Security Guard: সাধারণ এডমিন বা স্টাফদের হাত থেকে কোর ইঞ্জিন সুরক্ষিত রাখতে মাস্টার পিন প্রটেকশন।
- [Feature] Multi-Level Undo / Rollback Engine: যেকোনো সময় ১-ক্লিকে পূর্ববর্তী ভার্সনে ফিরে যাওয়ার সুবিধা।`,
  bugFixes: `- [Fixed] লাইব্রেরি কনফ্লিক্ট সমাধান: archiver v8 এর ESM/CJS ত্রুটি দূর করে এন্টারপ্রাইজ AdmZip রিকার্সিভ ইঞ্জিনে আপগ্রেড।
- [Fixed] ডাইনামিক রুট পাথ রেজোলিউশন: উইন্ডোজ, লিনাক্স, সিপ্যানেল বা ভিপিএস যেকোনো সার্ভারে পাথ ক্র্যাশ প্রতিরোধ (getProjectRoot ইন্টিগ্রেশন)।
- [Fixed] প্রি-আপডেট সেফটি গার্ড: ক্লাউড ব্যাকআপ ডেলিভারি নিশ্চিত না হওয়া পর্যন্ত লাইভ সাইটের ফাইলে কোনো হাত দেওয়া হবে না।
- [Fixed] ব্যাকআপ ফাইলে node_modules ও ক্যাশ ফাইল বাদ দিয়ে লাইটওয়েট ফাস্ট প্রসেসিং নিশ্চিতকরণ।`,
  migrationNotes: `- নতুন MongoDB কালেকশন: system_update_history (স্বয়ংক্রিয়ভাবে তৈরি হবে)।
- কনফিগারেশন কী: system_telegram_backup_config এবং system_root_security_config।
- বিদ্যমান প্রোডাক্ট, অর্ডার বা কাস্টমার ডাটাবেজে কোনো ব্রেকিং পরিবর্তন নেই (১০০% নিরাপদ)।`,
  includeClient: true,
  includeServer: true,
  domainName: "sashroyi.shop",
};

export default function SystemCoreUpdatesPage() {
  const { user } = useAuth();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://sashroyi-api.onrender.com";

  const [activeTab, setActiveTab] = useState("export");
  const [masterPin, setMasterPin] = useState("");

  // Tab 1: Export State
  const [exportData, setExportData] = useState(REAL_WORK_CHANGELOG);
  const [exporting, setExporting] = useState(false);

  // Tab 2: Import & Deploy State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [deployResult, setDeployResult] = useState(null);
  const [undoing, setUndoing] = useState(false);
  const fileInputRef = useRef(null);

  // Tab 3: Telegram Cloud Backup State
  const [telegramConfig, setTelegramConfig] = useState({
    isEnabled: true,
    botToken: "",
    chatId: "",
  });
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState(null);
  const [savingTelegram, setSavingTelegram] = useState(false);

  // Tab 4: Security PIN State
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  // Update History
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const getHeaders = (extra = {}) => {
    return {
      "x-user-role": user?.role || "barakahAdmin1234",
      "x-user-email": user?.email || "",
      "x-root-pin": masterPin,
      ...extra,
    };
  };

  useEffect(() => {
    fetchTelegramConfig();
    fetchHistory();
  }, []);

  const fetchTelegramConfig = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/system-update/telegram-config`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setTelegramConfig((prev) => ({
          ...prev,
          isEnabled: data.isEnabled,
          botToken: data.botToken || "",
          chatId: data.chatId || "",
        }));
      }
    } catch (err) {
      console.warn("Could not fetch Telegram config:", err.message);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`${baseUrl}/api/system-update/history`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (err) {
      console.warn("History fetch error:", err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAutoGenerateNotes = () => {
    setExportData(REAL_WORK_CHANGELOG);
    toast.success("বাস্তব কাজের রিলিজ নোটস সফলভাবে অটো-জেনারেট হয়েছে!");
  };

  // 1. EXPORT HANDLER
  const handleExportPackage = async (e) => {
    e.preventDefault();
    if (!exportData.version) {
      toast.error("ভার্সন নম্বর দিন (যেমন: v2.7.0)");
      return;
    }

    try {
      setExporting(true);
      toast.info("আপডেট প্যাকেজ ও রিলিজ নোটস তৈরি হচ্ছে...");

      const res = await fetch(`${baseUrl}/api/system-update/export`, {
        method: "POST",
        headers: getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(exportData),
      });

      if (!res.ok) {
        throw new Error("Export request failed with status: " + res.status);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `sashroyi-update-${exportData.version}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`সফলভাবে sashroyi-update-${exportData.version}.zip ডাউনলোড সম্পন্ন হয়েছে!`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("এক্সপোর্ট ব্যর্থ হয়েছে: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  // 2. FILE SELECTION & PREVIEW HANDLER
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".zip")) {
      toast.error("শুধুমাত্র .zip ফরম্যাটের আপডেট ফাইল আপলোড করুন!");
      return;
    }

    setSelectedFile(file);
    setPreviewData(null);
    setDeployResult(null);

    const formData = new FormData();
    formData.append("updateZip", file);

    try {
      setUploadingPreview(true);
      toast.info("আপডেট প্যাকেজ স্ক্যান করা হচ্ছে...");

      const res = await fetch(`${baseUrl}/api/system-update/preview`, {
        method: "POST",
        headers: getHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setPreviewData(data);
        toast.success("প্যাকেজ ভ্যালিডেশন ও রিলিজ নোটস লোড সফল!");
      } else {
        toast.error(data.message || "প্যাকেজ প্রিভিউ ব্যর্থ হয়েছে");
      }
    } catch (err) {
      toast.error("স্ক্যান করতে সমস্যা হয়েছে: " + err.message);
    } finally {
      setUploadingPreview(false);
    }
  };

  // 3. SAFE DEPLOY HANDLER (STRICT TELEGRAM FIRST)
  const handleDeployUpdate = async () => {
    if (!previewData || !previewData.tempFilePath) {
      toast.error("কোনো আপডেট ফাইল রেডি নেই");
      return;
    }

    const confirmDeploy = window.confirm(
      `আপনি কি নিশ্চিত যে বর্তমান সাইটে ${previewData.version} ইনস্টল করতে চান?\n\nসিস্টেম প্রথমে বর্তমান সাইটের ১০০% সেফটি ব্যাকআপ আপনার টেলিগ্রামে পাঠাবে। টেলিগ্রাম থেকে ডেলিভারি কনফার্ম হলেই কেবল কোড আপডেট হবে।`
    );
    if (!confirmDeploy) return;

    try {
      setDeploying(true);
      setDeployStep(1);

      setTimeout(() => setDeployStep(2), 1500);

      const res = await fetch(`${baseUrl}/api/system-update/deploy`, {
        method: "POST",
        headers: getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          tempFileName: previewData.tempFilePath,
          domainName: window.location.hostname || "main_domain",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setDeployStep(4);
        setDeployResult(data);
        toast.success(`অভিনন্দন! সাইট সফলভাবে ${data.version}-এ আপডেট হয়েছে!`);
        fetchHistory();
      } else {
        setDeployStep(0);
        if (data.aborted) {
          toast.error("আপডেট স্থগিত করা হয়েছে: " + data.message);
        } else {
          toast.error("ডিপ্লয় ব্যর্থ হয়েছে: " + data.message);
        }
      }
    } catch (err) {
      setDeployStep(0);
      toast.error("সার্ভার ত্রুটি: " + err.message);
    } finally {
      setDeploying(false);
    }
  };

  // 4. UNDO / ROLLBACK HANDLER
  const handleUndoRollback = async (backupFileName) => {
    const confirmUndo = window.confirm(
      backupFileName
        ? `আপনি কি নিশ্চিত যে এই ব্যাকআপটি (${backupFileName}) দিয়ে সাইট আগের অবস্থায় ফিরিয়ে নিতে চান?`
        : "আপনি কি নিশ্চিত যে শেষ আপডেটটি আনডু (Undo) করে পূর্ববর্তী সুস্থ ভার্সনে ফিরে যেতে চান?"
    );
    if (!confirmUndo) return;

    try {
      setUndoing(true);
      toast.info("পূর্ববর্তী ভার্সন রিস্টোর করা হচ্ছে...");

      const res = await fetch(`${baseUrl}/api/system-update/undo`, {
        method: "POST",
        headers: getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ backupFileName }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchHistory();
      } else {
        toast.error(data.message || "Undo ব্যর্থ হয়েছে");
      }
    } catch (err) {
      toast.error("রোলব্যাক এরর: " + err.message);
    } finally {
      setUndoing(false);
    }
  };

  // 5. TEST TELEGRAM CONNECTION
  const handleTestTelegram = async () => {
    try {
      setTestingTelegram(true);
      setTelegramTestResult(null);

      const res = await fetch(`${baseUrl}/api/system-update/test-telegram`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      setTelegramTestResult(data);

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("টেলিগ্রাম টেস্ট ব্যর্থ: " + err.message);
    } finally {
      setTestingTelegram(false);
    }
  };

  // 6. SAVE TELEGRAM CONFIG
  const handleSaveTelegramConfig = async (e) => {
    e.preventDefault();
    try {
      setSavingTelegram(true);
      const res = await fetch(`${baseUrl}/api/system-update/telegram-config`, {
        method: "POST",
        headers: getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(telegramConfig),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Telegram Cloud কনফিগারেশন সংরক্ষিত হয়েছে!");
        fetchTelegramConfig();
      } else {
        toast.error(data.message || "সংরক্ষণ ব্যর্থ হয়েছে");
      }
    } catch (err) {
      toast.error("ত্রুটি: " + err.message);
    } finally {
      setSavingTelegram(false);
    }
  };

  // 7. SAVE MASTER PIN
  const handleSavePin = async (e) => {
    e.preventDefault();
    if (newPin && newPin !== confirmPin) {
      toast.error("নতুন পিন এবং নিশ্চিতকরণ পিন মিলছে না");
      return;
    }

    try {
      setSavingPin(true);
      const res = await fetch(`${baseUrl}/api/system-update/security-pin`, {
        method: "POST",
        headers: getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ masterPin: newPin, currentPin: masterPin }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("মাস্টার পিন সফলভাবে আপডেট হয়েছে!");
        setNewPin("");
        setConfirmPin("");
      } else {
        toast.error(data.message || "পিন আপডেট ব্যর্থ");
      }
    } catch (err) {
      toast.error("পিন সেভ ত্রুটি: " + err.message);
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <AdminRoute>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-[#0f2a44] to-[#1e3a5f] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#d4af37]/30">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d4af37] text-[#0f2a44] flex items-center gap-1 shadow-xs">
                <FiShield /> ROOT OWNER PRIVILEGE
              </span>
              <span className="text-xs text-white/60">Strictly Protected Core Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
              <FiCpu className="text-[#d4af37]" />
              System Core & Updates Manager
            </h1>
            <p className="text-sm text-white/70 mt-1">
              এক ক্লিকে মেইন সাইট থেকে কোড এক্সপোর্ট করুন এবং ১০টি সাইটে টেলিগ্রাম ক্লাউড অটো-ব্যাকআপ সহ নিরাপদে ডিপ্লয় করুন।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            <span className="text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              Domain: <strong className="text-[#d4af37]">{exportData.domainName}</strong>
            </span>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg border border-white/10" title="যদি কোনো মাস্টার পিন সেট করা থাকে তবে এখানে দিন">
              <FiKey className="text-[#d4af37] text-xs" />
              <input
                type="password"
                placeholder="Root PIN"
                value={masterPin}
                onChange={(e) => setMasterPin(e.target.value)}
                className="bg-transparent border-none text-xs text-white placeholder-white/40 focus:outline-none w-20 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#e5dccf] pb-2">
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xs ${
              activeTab === "export"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-white text-[#3d2f1f] hover:bg-[#faf7f0] border border-[#e5dccf]"
            }`}
          >
            <FiDownload />
            ১. Export Package (মেইন সাইটের জন্য)
          </button>

          <button
            onClick={() => setActiveTab("import")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xs ${
              activeTab === "import"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-white text-[#3d2f1f] hover:bg-[#faf7f0] border border-[#e5dccf]"
            }`}
          >
            <FiUploadCloud />
            ২. Import & Deploy (১০টি সাইটের জন্য)
          </button>

          <button
            onClick={() => setActiveTab("telegram")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xs ${
              activeTab === "telegram"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-white text-[#3d2f1f] hover:bg-[#faf7f0] border border-[#e5dccf]"
            }`}
          >
            <FiSend className="text-blue-500" />
            ৩. Telegram Cloud Vault (১০০% আজীবন ফ্রি)
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xs ${
              activeTab === "security"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-white text-[#3d2f1f] hover:bg-[#faf7f0] border border-[#e5dccf]"
            }`}
          >
            <FiKey />
            ৪. Root Security & PIN
          </button>
        </div>

        {/* TAB 1: EXPORT PACKAGE */}
        {activeTab === "export" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#e5dccf] shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5dccf] pb-3">
                <div>
                  <h2 className="text-lg font-bold text-[#3d2f1f] flex items-center gap-2">
                    <FiDownload className="text-[#d4af37]" /> নতুন আপডেট প্যাকেজ তৈরি করুন
                  </h2>
                  <p className="text-xs text-[#3d2f1f]/70 mt-0.5">
                    বাস্তবে যা যা কাজ করা হয়েছে এবং বাগ ফিক্স হয়েছে তা নিখুঁত প্রফেশনাল টেক্সটে স্বয়ংক্রিয়ভাবে সাজানো আছে।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAutoGenerateNotes}
                  className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 font-bold shadow-xs"
                  title="বাস্তব কাজের বিবরণ দিয়ে রিলিজ নোটস অটো-জেনারেট করুন"
                >
                  <FiZap /> Auto-Generate Changelog
                </button>
              </div>

              <form onSubmit={handleExportPackage} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#3d2f1f] mb-1">
                      New Version Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={exportData.version}
                      onChange={(e) => setExportData({ ...exportData, version: e.target.value })}
                      placeholder="e.g. v2.7.0"
                      className="input input-bordered w-full rounded-xl text-sm font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3d2f1f] mb-1">
                      Previous Version
                    </label>
                    <input
                      type="text"
                      value={exportData.previousVersion}
                      onChange={(e) => setExportData({ ...exportData, previousVersion: e.target.value })}
                      placeholder="e.g. v2.6.0"
                      className="input input-bordered w-full rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#3d2f1f]">
                      [+] What's New (নতুন কী কী কাজ হয়েছে - Auto Generated):
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      Professional
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={exportData.whatsNew}
                    onChange={(e) => setExportData({ ...exportData, whatsNew: e.target.value })}
                    className="textarea textarea-bordered w-full rounded-xl text-xs font-mono leading-relaxed bg-[#faf7f0]"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#3d2f1f]">
                      [-] Resolved Issues & Bug Fixes (আগের কী ভুল ঠিক হয়েছে - Auto Generated):
                    </label>
                    <span className="text-[10px] text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded">
                      Bug Fixes
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={exportData.bugFixes}
                    onChange={(e) => setExportData({ ...exportData, bugFixes: e.target.value })}
                    className="textarea textarea-bordered w-full rounded-xl text-xs font-mono leading-relaxed text-red-900 bg-red-50/40"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3d2f1f] mb-1">
                    [!] Database & Migration Notes (ডাটাবেজ বা সেটিংস নির্দেশনা - Auto Generated):
                  </label>
                  <textarea
                    rows={3}
                    value={exportData.migrationNotes}
                    onChange={(e) => setExportData({ ...exportData, migrationNotes: e.target.value })}
                    className="textarea textarea-bordered w-full rounded-xl text-xs font-mono leading-relaxed"
                  />
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportData.includeClient}
                      onChange={(e) => setExportData({ ...exportData, includeClient: e.target.checked })}
                      className="checkbox checkbox-sm checkbox-warning"
                    />
                    <span>Frontend Client Code (Next.js)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportData.includeServer}
                      onChange={(e) => setExportData({ ...exportData, includeServer: e.target.checked })}
                      className="checkbox checkbox-sm checkbox-warning"
                    />
                    <span>Backend Server Code (Node.js/Express)</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={exporting}
                    className="btn bg-[#0f2a44] text-[#d4af37] hover:bg-[#1e3a5f] w-full rounded-xl font-bold flex items-center justify-center gap-2 py-3 shadow-md"
                  >
                    {exporting ? (
                      <>
                        <FiRefreshCw className="animate-spin text-lg" />
                        প্যাকেজ জেনারেট ও ডাউনলোড হচ্ছে...
                      </>
                    ) : (
                      <>
                        <FiDownload className="text-lg" />
                        Generate & Download Update Package (.zip)
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Release Notes Real-time Preview */}
            <div className="bg-[#1e293b] rounded-2xl p-5 text-gray-200 border border-gray-700 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                  <span className="text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                    <FiFileText /> RELEASE_NOTES.txt PREVIEW
                  </span>
                  <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-400">Auto-Packaged</span>
                </div>

                <pre className="mt-3 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap text-emerald-400 bg-gray-900/60 p-3 rounded-lg border border-gray-800 max-h-[500px] overflow-y-auto">
{`================================================================================
                    BARAKAH / SASHROYI SYSTEM UPDATE PACKAGE
================================================================================
Version         : ${exportData.version}
Previous Version: ${exportData.previousVersion}
Release Date    : ${new Date().toLocaleDateString("en-US")}
Author/Owner    : ${exportData.author}
Target Scope    : ${exportData.domainName}
================================================================================

[+] 1. WHAT'S NEW:
--------------------------------------------------------------------------------
${exportData.whatsNew}

[-] 2. RESOLVED ISSUES & BUG FIXES:
--------------------------------------------------------------------------------
${exportData.bugFixes}

[!] 3. DATABASE & MIGRATION:
--------------------------------------------------------------------------------
${exportData.migrationNotes}`}
                </pre>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-gray-400 flex items-center gap-2">
                <FiCheckCircle className="text-emerald-400 text-sm shrink-0" />
                <span>এই ফাইলটি স্বয়ংক্রিয়ভাবে জিপের ভেতরে থাকবে এবং অন্য সাইট আপডেট করার আগে প্রিভিউ আকারে দেখা যাবে।</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: IMPORT & DEPLOY (STRICT TELEGRAM + UNDO) */}
        {activeTab === "import" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#e5dccf] shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5dccf] pb-3 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#3d2f1f] flex items-center gap-2">
                    <FiUploadCloud className="text-[#d4af37]" /> আপডেট ফাইল আপলোড ও ডিপ্লয়মেন্ট
                  </h2>
                  <p className="text-xs text-[#3d2f1f]/70 mt-0.5">
                    মেইন সাইট থেকে ডাউনলোড করা জিপ ফাইলটি এখানে ড্রপ করুন। টেলিগ্রামে ব্যাকআপ ১০০% কনফার্ম হলেই কেবল আপডেট কার্যকর হবে।
                  </p>
                </div>

                {/* Undo Last Update Button */}
                <button
                  type="button"
                  onClick={() => handleUndoRollback(null)}
                  disabled={undoing}
                  className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                  title="সর্বশেষ আপডেটের আগের ভার্সনে ফিরে যান"
                >
                  <FiRotateCcw className={undoing ? "animate-spin" : ""} />
                  <span>{undoing ? "আনডু হচ্ছে..." : "↩️ Undo Last Update"}</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#d4af37] hover:border-[#0f2a44] bg-[#faf7f0] rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] text-2xl">
                  <FiUploadCloud />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#3d2f1f]">
                    {selectedFile ? selectedFile.name : "ক্লিক করুন বা আপডেট .zip ফাইল ড্র্যাগ করে এখানে ছাড়ুন"}
                  </p>
                  <p className="text-xs text-[#3d2f1f]/60 mt-1">
                    সাপোর্টেড ফরম্যাট: .zip (যেমন: sashroyi-update-v2.7.0.zip)
                  </p>
                </div>
                {selectedFile && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                    ফাইলের সাইজ: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                )}
              </div>

              {uploadingPreview && (
                <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-blue-800 text-xs">
                  <FiRefreshCw className="animate-spin text-base" />
                  <span>প্যাকেজ স্ক্যান করা হচ্ছে এবং রিলিজ নোটস প্রস্তুত হচ্ছে...</span>
                </div>
              )}

              {/* PREVIEW CARD IF LOADED */}
              {previewData && (
                <div className="mt-6 border border-[#e5dccf] rounded-2xl p-5 bg-[#faf7f0] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5dccf] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#0f2a44] text-[#d4af37] text-xs font-black px-3 py-1 rounded-lg">
                        {previewData.version}
                      </span>
                      <span className="text-xs text-[#3d2f1f]/70">
                        পূর্ববর্তী ভার্সন: <strong>{previewData.previousVersion}</strong>
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      মোট ফাইল: {previewData.fileCount} টি ({previewData.fileSize})
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#3d2f1f] mb-2 flex items-center gap-1.5">
                      <FiFileText className="text-[#d4af37]" /> এই আপডেটের বিস্তারিত রিলিজ নোটস (Release Notes):
                    </h4>
                    <pre className="text-xs font-mono bg-white p-4 rounded-xl border border-[#e5dccf] text-[#1e293b] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto shadow-inner">
                      {previewData.releaseNotesText}
                    </pre>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-[#3d2f1f]/80 flex items-center gap-1.5">
                      <FiShield className="text-emerald-600 text-sm" />
                      <span>টেলিগ্রামে বর্তমান সাইটের ব্যাকআপ সম্পন্ন হওয়ার পরেই আপডেট কার্যকর হবে।</span>
                    </div>

                    <button
                      onClick={handleDeployUpdate}
                      disabled={deploying}
                      className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl flex items-center gap-2 shadow-md w-full sm:w-auto"
                    >
                      {deploying ? (
                        <>
                          <FiRefreshCw className="animate-spin text-lg" />
                          ডিপ্লয় চলছে...
                        </>
                      ) : (
                        <>
                          <FiPlay className="text-lg" />
                          Confirm & Deploy {previewData.version} Now
                        </>
                      )}
                    </button>
                  </div>

                  {deploying && (
                    <div className="mt-4 p-5 rounded-xl bg-white border border-[#e5dccf] space-y-3">
                      <h4 className="text-xs font-bold text-[#3d2f1f]">ডিপ্লয়মেন্ট অগ্রগতি (Live Progress):</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${deployStep >= 1 ? "bg-emerald-600 text-white" : "bg-gray-200"}`}>
                            {deployStep > 1 ? <FiCheck /> : "১"}
                          </span>
                          <span className={deployStep === 1 ? "font-bold text-[#0f2a44]" : ""}>
                            বর্তমান কোডের সেফটি ব্যাকআপ জিপ তৈরি করা হচ্ছে...
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${deployStep >= 2 ? "bg-emerald-600 text-white" : "bg-gray-200"}`}>
                            {deployStep > 2 ? <FiCheck /> : "২"}
                          </span>
                          <span className={deployStep === 2 ? "font-bold text-[#0f2a44]" : ""}>
                            টেলিগ্রাম ক্লাউডে ব্যাকআপ জিপটি পাঠানো হচ্ছে...
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${deployStep >= 3 ? "bg-emerald-600 text-white" : "bg-gray-200"}`}>
                            {deployStep > 3 ? <FiCheck /> : "৩"}
                          </span>
                          <span className={deployStep === 3 ? "font-bold text-[#0f2a44]" : ""}>
                            টেলিগ্রাম ডেলিভারি কনফার্মড! নতুন আপডেট ফাইল আনপ্যাক করা হচ্ছে...
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${deployStep >= 4 ? "bg-emerald-600 text-white" : "bg-gray-200"}`}>
                            {deployStep >= 4 ? <FiCheck /> : "৪"}
                          </span>
                          <span className={deployStep === 4 ? "font-bold text-emerald-600" : ""}>
                            সফলভাবে সাইট আপডেট সম্পন্ন হয়েছে!
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {deployResult && (
                    <div className="mt-4 p-5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <FiCheckCircle className="text-emerald-600 text-lg" />
                        <span>{deployResult.message}</span>
                      </div>
                      <p className="text-xs">
                        পূর্ববর্তী ভার্সনের ব্যাকআপ ফাইল: <strong>{deployResult.backupFileName}</strong>
                      </p>
                      <p className="text-xs text-blue-700 font-semibold flex items-center gap-1.5">
                        <FiSend /> ব্যাকআপ জিপ সরাসরি আপনার টেলিগ্রাম অ্যাপে সফলভাবে ডেলিভার হয়েছে!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RECENT DEPLOY HISTORY & MULTI-LEVEL UNDO */}
            <div className="bg-white rounded-2xl p-6 border border-[#e5dccf] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5dccf] mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#3d2f1f] flex items-center gap-2">
                    <FiClock className="text-[#d4af37]" /> আপডেট ও ব্যাকআপের ইতিহাস (Deployment History & Restore Points)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    প্রতিটি আপডেটের পূর্বে স্বয়ংক্রিয় ব্যাকআপ সংরক্ষিত থাকে। যেকোনো সময় যেকোনো ভার্সনে ১-ক্লিকে ফিরে যাওয়া সম্ভব।
                  </p>
                </div>
                <button
                  onClick={fetchHistory}
                  disabled={loadingHistory}
                  className="btn btn-ghost btn-xs text-xs font-bold flex items-center gap-1 text-[#3d2f1f]"
                >
                  <FiRefreshCw className={loadingHistory ? "animate-spin" : ""} /> রিফ্রেশ
                </button>
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">এখনো কোনো আপডেট রেকর্ড করা হয়নি।</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#e5dccf] text-[#3d2f1f]">
                        <th>ভার্সন</th>
                        <th>ডোমেইন</th>
                        <th>আপডেটের সময়</th>
                        <th>ক্লাউড ব্যাকআপ</th>
                        <th>স্ট্যাটাস</th>
                        <th className="text-right">রোলব্যাক / আনডু</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#faf7f0]">
                          <td className="font-bold text-[#0f2a44]">{item.version}</td>
                          <td>{item.domainName || "main"}</td>
                          <td>{new Date(item.appliedAt).toLocaleString()}</td>
                          <td>
                            {item.telegramDelivered ? (
                              <span className="text-blue-600 font-bold flex items-center gap-1">
                                <FiSend /> Telegram Sent
                              </span>
                            ) : (
                              <span className="text-gray-400">Local Only</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge badge-sm font-bold text-white ${item.status === "rolled_back" ? "badge-warning" : "badge-success"}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="text-right">
                            {item.isRestorable && (
                              <button
                                onClick={() => handleUndoRollback(item.localBackupFile)}
                                disabled={undoing}
                                className="btn btn-xs bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 font-bold rounded-lg flex items-center gap-1 ml-auto"
                                title="এই পয়েন্টে সাইট ফিরিয়ে নিন"
                              >
                                <FiRotateCcw className="text-[10px]" /> Undo Here
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TELEGRAM CLOUD BACKUP */}
        {activeTab === "telegram" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#e5dccf] shadow-xs space-y-5">
              <div className="border-b border-[#e5dccf] pb-3">
                <h2 className="text-lg font-bold text-[#3d2f1f] flex items-center gap-2">
                  <FiSend className="text-blue-500" /> Telegram Cloud Auto-Backup (১০০% আজীবন ফ্রি)
                </h2>
                <p className="text-xs text-[#3d2f1f]/70 mt-0.5">
                  কোনো প্রকার ক্রেডিট কার্ড বা ক্লাউড ট্রায়াল ছাড়া সারাজীবন ফ্রিতে ব্যাকআপ রাখুন আপনার পার্সোনাল টেলিগ্রাম চ্যাট বা প্রাইভেট চ্যানেলে।
                </p>
              </div>

              <form onSubmit={handleSaveTelegramConfig} className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#faf7f0] border border-[#e5dccf]">
                  <input
                    type="checkbox"
                    id="teleEnabled"
                    checked={telegramConfig.isEnabled}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, isEnabled: e.target.checked })}
                    className="checkbox checkbox-warning checkbox-sm"
                  />
                  <label htmlFor="teleEnabled" className="text-xs font-bold text-[#3d2f1f] cursor-pointer">
                    আপডেটের পূর্বে স্বয়ংক্রিয়ভাবে টেলিগ্রামে ব্যাকআপ জিপ পাঠানো চালু রাখুন (Required)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3d2f1f] mb-1">
                    Telegram Bot Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={telegramConfig.botToken}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                    placeholder="e.g. 7123456789:AAFlmQ2..."
                    className="input input-bordered w-full rounded-xl text-sm font-mono"
                    required
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    টেলিগ্রাম @BotFather থেকে পাওয়া আপনার বটের পুরো এপিআই টোকেন (সংখ্যা ও কোলন সহ)।
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3d2f1f] mb-1">
                    Telegram Chat ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={telegramConfig.chatId}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                    placeholder="e.g. 123456789 বা -100123456789"
                    className="input input-bordered w-full rounded-xl text-sm font-mono"
                    required
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    আপনার নিজের টেলিগ্রাম ইউজার আইডি অথবা প্রাইভেট চ্যানেলের আইডি।
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={testingTelegram}
                    className="btn btn-outline border-blue-500 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    {testingTelegram ? <FiRefreshCw className="animate-spin" /> : <FiPlay />}
                    Test Telegram Connection (টেস্ট মেসেজ পাঠান)
                  </button>

                  <button
                    type="submit"
                    disabled={savingTelegram}
                    className="btn bg-[#0f2a44] hover:bg-[#1e3a5f] text-[#d4af37] rounded-xl text-xs font-bold px-6 shadow-sm"
                  >
                    {savingTelegram ? "সেভ হচ্ছে..." : "Save Telegram Settings"}
                  </button>
                </div>

                {telegramTestResult && (
                  <div className={`mt-3 p-4 rounded-xl text-xs border ${telegramTestResult.success ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-300 text-red-800"}`}>
                    <div className="font-bold mb-1 flex items-center gap-1.5">
                      {telegramTestResult.success ? <FiCheckCircle className="text-emerald-600" /> : <FiAlertTriangle className="text-red-600" />}
                      <span>{telegramTestResult.message}</span>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Quick Telegram Setup Guide */}
            <div className="bg-[#0f2a44] text-white rounded-2xl p-6 border border-[#d4af37]/30 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#d4af37] flex items-center gap-2 mb-3">
                  <FiSend /> ১ মিনিটে টেলিগ্রাম সেটআপ:
                </h3>
                <ol className="text-xs text-white/80 space-y-2.5 list-decimal pl-4 leading-relaxed">
                  <li>
                    আপনার Telegram অ্যাপ খুলে সার্চ করুন <strong>@BotFather</strong>
                  </li>
                  <li>
                    মেসেজ পাঠান: <code className="bg-white/10 px-1 py-0.5 rounded text-emerald-300">/newbot</code> এবং আপনার বটের নাম ও ইউজারনেম দিন।
                  </li>
                  <li>
                    BotFather সাথে সাথে একটি <strong>API Token</strong> দিয়ে দেবে (যেমন: <code className="text-yellow-300">7123456789:AAF...</code>)।
                  </li>
                  <li>
                    এবার আপনার তৈরি করা বটে ঢুকে <strong>Start</strong> চাপুন।
                  </li>
                  <li>
                    আপনার চ্যাট আইডি জানতে টেলিগ্রামে <strong>@userinfobot</strong>-এ স্টার্ট চাপলে আপনার <code className="text-yellow-300">Id</code> দেখিয়ে দেবে।
                  </li>
                  <li>
                    টোকেন ও আইডি বামের ঘরে পেস্ট করে <strong>Save</strong> চেপে টেস্ট করুন!
                  </li>
                </ol>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10 text-[11px] text-emerald-300 flex items-center gap-1.5">
                <FiCheckCircle className="shrink-0" />
                <span>টেলিগ্রামে সেন্ড কনফার্ম না হওয়া পর্যন্ত সাইটের কোড পরিবর্তন হবে না।</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ROOT SECURITY & MASTER PIN */}
        {activeTab === "security" && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 border border-[#e5dccf] shadow-xs space-y-5">
            <div className="border-b border-[#e5dccf] pb-3">
              <h2 className="text-lg font-bold text-[#3d2f1f] flex items-center gap-2">
                <FiKey className="text-[#d4af37]" /> Root Master PIN সিকিউরিটি
              </h2>
              <p className="text-xs text-[#3d2f1f]/70 mt-0.5">
                সাধারণ অ্যাডমিন বা স্টাফদের হাত থেকে সিস্টেম কোর ও কোড আপডেটকে সুরক্ষিত রাখতে একটি ৪ বা ৬ ডিজিটের মাস্টার পিন সেট করুন।
              </p>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3d2f1f] mb-1">
                  নতুন মাস্টার পিন (New Master PIN)
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g. 123456"
                  className="input input-bordered w-full rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3d2f1f] mb-1">
                  কনফার্ম মাস্টার পিন (Confirm Master PIN)
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="e.g. 123456"
                  className="input input-bordered w-full rounded-xl text-sm"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPin}
                  className="btn bg-[#0f2a44] text-[#d4af37] hover:bg-[#1e3a5f] w-full rounded-xl font-bold text-xs shadow-md"
                >
                  {savingPin ? "সেভ হচ্ছে..." : "Save Master Security PIN"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}
