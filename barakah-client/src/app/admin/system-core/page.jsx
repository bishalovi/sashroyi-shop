"use client";

/**
 * ============================================================================
 * FILE: app/admin/system-core/page.jsx
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * System Core & Updates Manager (Strictly for Root Owner)
 * Tab 1: Export Update Package with auto-generated RELEASE_NOTES.txt
 * Tab 2: Import & Deploy Update (Reads notes -> Backs up to Google Drive -> Applies)
 * Tab 3: Google Drive Cloud Backup & Vault
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
  FiHardDrive,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiFileText,
  FiKey,
  FiExternalLink,
  FiRefreshCw,
  FiPlay,
  FiLayers,
  FiCheck,
} from "react-icons/fi";

export default function SystemCoreUpdatesPage() {
  const { user } = useAuth();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://sashroyi-api.onrender.com";

  const [activeTab, setActiveTab] = useState("export");
  const [masterPin, setMasterPin] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(true);

  // Tab 1: Export State
  const [exportData, setExportData] = useState({
    version: "v2.7.0",
    previousVersion: "v2.6.0",
    author: "Root Owner",
    whatsNew: "- নতুন কুরিয়ার ট্র্যাকিং ও দ্রুত চেকআউট ফিচার যোগ করা হয়েছে।\n- প্রোডাক্ট পেজের ইমেজ লোডিং স্পিড বৃদ্ধি করা হয়েছে।",
    bugFixes: "- কার্ট পেজে কুপন ডাবল কাউন্টিং বাগ ফিক্স করা হয়েছে।\n- মোবাইল ডিভাইসে ড্রয়ার স্ক্রল সমস্যা সমাধান করা হয়েছে।",
    migrationNotes: "- কোনো ডাটাবেজ ব্রেকিং চেঞ্জ নেই।\n- অটোমেটিক ব্যাকএন্ড প্রসেস রিলোড হবে।",
    includeClient: true,
    includeServer: true,
    domainName: "sashroyi.shop",
  });
  const [exporting, setExporting] = useState(false);

  // Tab 2: Import State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0); // 0: idle, 1: local backup, 2: google drive, 3: extract, 4: complete
  const [deployResult, setDeployResult] = useState(null);
  const fileInputRef = useRef(null);

  // Tab 3: Google Drive State
  const [driveConfig, setDriveConfig] = useState({
    isEnabled: true,
    clientEmail: "",
    parentFolderId: "",
    credentialsJson: "",
  });
  const [testingDrive, setTestingDrive] = useState(false);
  const [driveTestResult, setDriveTestResult] = useState(null);
  const [savingDrive, setSavingDrive] = useState(false);

  // Tab 4: Security PIN State
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  // Update History
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Headers helper
  const getHeaders = (extra = {}) => {
    return {
      "x-user-role": user?.role || "barakahAdmin1234",
      "x-user-email": user?.email || "",
      "x-root-pin": masterPin,
      ...extra,
    };
  };

  // Fetch Drive Config & History
  useEffect(() => {
    fetchDriveConfig();
    fetchHistory();
  }, []);

  const fetchDriveConfig = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/system-update/drive-config`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setDriveConfig((prev) => ({
          ...prev,
          isEnabled: data.isEnabled,
          clientEmail: data.clientEmail || "",
          parentFolderId: data.parentFolderId || "",
        }));
      }
    } catch (err) {
      console.warn("Could not fetch drive config:", err.message);
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

      // Download the zip blob
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

    // Auto upload for preview
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

  // 3. SAFE DEPLOY HANDLER
  const handleDeployUpdate = async () => {
    if (!previewData || !previewData.tempFilePath) {
      toast.error("কোনো আপডেট ফাইল রেডি নেই");
      return;
    }

    const confirmDeploy = window.confirm(
      `আপনি কি নিশ্চিত যে বর্তমান সাইটে ${previewData.version} ইনস্টল করতে চান?\n\nপ্রথমে বর্তমান সাইটের শতভাগ ব্যাকআপ আপনার গুগল ড্রাইভে আপলোড করা হবে, তারপর নতুন কোড লাইভ হবে।`
    );
    if (!confirmDeploy) return;

    try {
      setDeploying(true);
      setDeployStep(1); // 1. Creating backup

      setTimeout(() => setDeployStep(2), 2000); // 2. Uploading to Google Drive

      const res = await fetch(`${baseUrl}/api/system-update/deploy`, {
        method: "POST",
        headers: getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          tempFileName: previewData.tempFilePath,
          domainName: window.location.hostname || "main_domain",
          skipDriveUpload: false,
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

  // 4. TEST GOOGLE DRIVE
  const handleTestDrive = async () => {
    try {
      setTestingDrive(true);
      setDriveTestResult(null);

      const res = await fetch(`${baseUrl}/api/system-update/test-drive`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      setDriveTestResult(data);

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("ড্রাইভ টেস্ট ব্যর্থ: " + err.message);
    } finally {
      setTestingDrive(false);
    }
  };

  // 5. SAVE DRIVE CONFIG
  const handleSaveDriveConfig = async (e) => {
    e.preventDefault();
    try {
      setSavingDrive(true);
      const res = await fetch(`${baseUrl}/api/system-update/drive-config`, {
        method: "POST",
        headers: getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(driveConfig),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("গুগল ড্রাইভ কনফিগারেশন সংরক্ষিত হয়েছে!");
        fetchDriveConfig();
      } else {
        toast.error(data.message || "সংরক্ষণ ব্যর্থ হয়েছে");
      }
    } catch (err) {
      toast.error("ত্রুটি: " + err.message);
    } finally {
      setSavingDrive(false);
    }
  };

  // 6. SAVE MASTER PIN
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
              এক ক্লিকে মেইন সাইট থেকে কোড এক্সপোর্ট করুন এবং ১০টি সাইটে গুগল ড্রাইভ অটো-ব্যাকআপ সহ নিরাপদে ডিপ্লয় করুন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              Domain: <strong className="text-[#d4af37]">{exportData.domainName}</strong>
            </span>
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
            onClick={() => setActiveTab("drive")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xs ${
              activeTab === "drive"
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-white text-[#3d2f1f] hover:bg-[#faf7f0] border border-[#e5dccf]"
            }`}
          >
            <FiHardDrive />
            ৩. Google Drive & Backup Vault
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
              <div className="border-b border-[#e5dccf] pb-3">
                <h2 className="text-lg font-bold text-[#3d2f1f] flex items-center gap-2">
                  <FiDownload className="text-[#d4af37]" /> নতুন আপডেট প্যাকেজ তৈরি করুন
                </h2>
                <p className="text-xs text-[#3d2f1f]/70 mt-0.5">
                  এখানে আপনি কী কী নতুন কাজ করেছেন এবং আগের কী ভুল ঠিক করেছেন তা লিখে এক ক্লিকে .zip প্যাকেজ ডাউনলোড করুন।
                </p>
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
                      className="input input-bordered w-full rounded-xl text-sm"
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
                  <label className="block text-xs font-bold text-[#3d2f1f] mb-1">
                    [+] What's New (নতুন কী কী কাজ হয়েছে - পয়েন্ট আকারে লিখুন)
                  </label>
                  <textarea
                    rows={4}
                    value={exportData.whatsNew}
                    onChange={(e) => setExportData({ ...exportData, whatsNew: e.target.value })}
                    className="textarea textarea-bordered w-full rounded-xl text-sm leading-relaxed"
                    placeholder="- নতুন ফিচার বা সেকশন..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3d2f1f] mb-1">
                    [-] Resolved Issues & Bug Fixes (আগের ভার্সনের কী কী ভুল/সমস্যা ঠিক করা হয়েছে)
                  </label>
                  <textarea
                    rows={4}
                    value={exportData.bugFixes}
                    onChange={(e) => setExportData({ ...exportData, bugFixes: e.target.value })}
                    className="textarea textarea-bordered w-full rounded-xl text-sm leading-relaxed text-red-700 bg-red-50/30"
                    placeholder="- কোন সমস্যাগুলো ফিক্স করা হয়েছে..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3d2f1f] mb-1">
                    [!] Database & Migration Notes (ডাটাবেজ বা সেটিংস নির্দেশনা)
                  </label>
                  <input
                    type="text"
                    value={exportData.migrationNotes}
                    onChange={(e) => setExportData({ ...exportData, migrationNotes: e.target.value })}
                    className="input input-bordered w-full rounded-xl text-sm"
                    placeholder="e.g. কোনো স্কিমা চেঞ্জ নেই / অটো মাইগ্রেশন"
                  />
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
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

                <div className="pt-3">
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

                <pre className="mt-3 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap text-emerald-400 bg-gray-900/60 p-3 rounded-lg border border-gray-800 max-h-[460px] overflow-y-auto">
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

        {/* TAB 2: IMPORT & DEPLOY (FOR 10 SITES) */}
        {activeTab === "import" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#e5dccf] shadow-xs">
              <div className="border-b border-[#e5dccf] pb-3 mb-5">
                <h2 className="text-lg font-bold text-[#3d2f1f] flex items-center gap-2">
                  <FiUploadCloud className="text-[#d4af37]" /> আপডেট ফাইল আপলোড ও ডিপ্লয়মেন্ট
                </h2>
                <p className="text-xs text-[#3d2f1f]/70 mt-0.5">
                  মেইন সাইট থেকে ডাউনলোড করা জিপ ফাইলটি এখানে ড্রপ করুন। সিস্টেম স্বয়ংক্রিয়ভাবে বর্তমান কোডটি প্রথমে আপনার গুগল ড্রাইভে সেভ করবে, তারপর সাইট আপডেট করবে।
                </p>
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

                  {/* Release Notes Viewer */}
                  <div>
                    <h4 className="text-xs font-bold text-[#3d2f1f] mb-2 flex items-center gap-1.5">
                      <FiFileText className="text-[#d4af37]" /> এই আপডেটের বিস্তারিত রিলিজ নোটস (Release Notes):
                    </h4>
                    <pre className="text-xs font-mono bg-white p-4 rounded-xl border border-[#e5dccf] text-[#1e293b] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto shadow-inner">
                      {previewData.releaseNotesText}
                    </pre>
                  </div>

                  {/* Deploy Action */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-[#3d2f1f]/80 flex items-center gap-1.5">
                      <FiShield className="text-emerald-600 text-sm" />
                      <span>গুগল ড্রাইভে বর্তমান সাইটের ব্যাকআপ সম্পন্ন হওয়ার পরেই আপডেট চালু হবে।</span>
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

                  {/* DEPLOY PROGRESS STEPPER */}
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
                            গুগল ড্রাইভে ব্যাকআপ জিপটি আপলোড করা হচ্ছে...
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${deployStep >= 3 ? "bg-emerald-600 text-white" : "bg-gray-200"}`}>
                            {deployStep > 3 ? <FiCheck /> : "৩"}
                          </span>
                          <span className={deployStep === 3 ? "font-bold text-[#0f2a44]" : ""}>
                            গুগল ড্রাইভ আপলোড সম্পন্ন! নতুন আপডেট ফাইল আনপ্যাক করা হচ্ছে...
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

                  {/* DEPLOY SUCCESS BANNER */}
                  {deployResult && (
                    <div className="mt-4 p-5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <FiCheckCircle className="text-emerald-600 text-lg" />
                        <span>{deployResult.message}</span>
                      </div>
                      <p className="text-xs">
                        পূর্ববর্তী ভার্সনের ব্যাকআপ ফাইল: <strong>{deployResult.backupFileName}</strong>
                      </p>
                      {deployResult.googleDriveBackup?.link && (
                        <div className="pt-2">
                          <a
                            href={deployResult.googleDriveBackup.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f2a44] bg-[#d4af37] px-3.5 py-1.5 rounded-lg hover:bg-yellow-500 shadow-xs"
                          >
                            <FiExternalLink /> গুগল ড্রাইভে সংরক্ষিত ব্যাকআপ দেখুন
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RECENT DEPLOY HISTORY */}
            <div className="bg-white rounded-2xl p-6 border border-[#e5dccf] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5dccf] mb-4">
                <h3 className="text-base font-bold text-[#3d2f1f] flex items-center gap-2">
                  <FiClock className="text-[#d4af37]" /> আপডেট ও ব্যাকআপের ইতিহাস (Deployment History)
                </h3>
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
                        <th>গুগল ড্রাইভ লিংক</th>
                        <th>স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#faf7f0]">
                          <td className="font-bold text-[#0f2a44]">{item.version}</td>
                          <td>{item.domainName}</td>
                          <td>{new Date(item.appliedAt).toLocaleString()}</td>
                          <td>
                            {item.googleDriveLink ? (
                              <a
                                href={item.googleDriveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <FiExternalLink /> View in Drive
                              </a>
                            ) : (
                              <span className="text-gray-400">Local Only</span>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-success badge-sm text-white font-bold">
                              {item.status}
                            </span>
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

        {/* TAB 3: GOOGLE DRIVE CLOUD BACKUP */}
        {activeTab === "drive" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#e5dccf] shadow-xs space-y-5">
              <div className="border-b border-[#e5dccf] pb-3">
                <h2 className="text-lg font-bold text-[#3d2f1f] flex items-center gap-2">
                  <FiHardDrive className="text-[#d4af37]" /> গুগল ড্রাইভ অটো-ব্যাকআপ কনফিগারেশন
                </h2>
                <p className="text-xs text-[#3d2f1f]/70 mt-0.5">
                  গুগল ক্লাউড কনসোল থেকে পাওয়া সার্ভিস একাউন্টের তথ্য এখানে পেস্ট করুন। কোনো প্রকার টাকা বা সাবস্ক্রিপশন ফি ছাড়াই এটি সম্পূর্ণ ফ্রি।
                </p>
              </div>

              <form onSubmit={handleSaveDriveConfig} className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#faf7f0] border border-[#e5dccf]">
                  <input
                    type="checkbox"
                    id="driveEnabled"
                    checked={driveConfig.isEnabled}
                    onChange={(e) => setDriveConfig({ ...driveConfig, isEnabled: e.target.checked })}
                    className="checkbox checkbox-warning checkbox-sm"
                  />
                  <label htmlFor="driveEnabled" className="text-xs font-bold text-[#3d2f1f] cursor-pointer">
                    আপডেটের পূর্বে স্বয়ংক্রিয়ভাবে গুগল ড্রাইভে ব্যাকআপ চালু রাখুন (Recommended)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3d2f1f] mb-1">
                    Google Drive Folder ID (যে ফোল্ডারে ব্যাকআপ জিপগুলো জমা হবে)
                  </label>
                  <input
                    type="text"
                    value={driveConfig.parentFolderId}
                    onChange={(e) => setDriveConfig({ ...driveConfig, parentFolderId: e.target.value })}
                    placeholder="e.g. 1a2B3c4D5e6F7g8H9i..."
                    className="input input-bordered w-full rounded-xl text-sm"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    আপনার গুগল ড্রাইভে একটি ফোল্ডার খুলে তার ইউআরএল-এর শেষের অংশটি এখানে দিন।
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3d2f1f] mb-1">
                    Google Service Account JSON Key (সম্পূর্ণ JSON কোড পেস্ট করুন)
                  </label>
                  <textarea
                    rows={6}
                    value={driveConfig.credentialsJson}
                    onChange={(e) => setDriveConfig({ ...driveConfig, credentialsJson: e.target.value })}
                    placeholder={`{\n  "type": "service_account",\n  "project_id": "...",\n  "client_email": "...",\n  "private_key": "..."\n}`}
                    className="textarea textarea-bordered w-full rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestDrive}
                    disabled={testingDrive}
                    className="btn btn-outline border-[#d4af37] text-[#0f2a44] hover:bg-[#d4af37] hover:text-[#0f2a44] rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    {testingDrive ? <FiRefreshCw className="animate-spin" /> : <FiPlay />}
                    Test Drive Connection (কানেকশন পরীক্ষা করুন)
                  </button>

                  <button
                    type="submit"
                    disabled={savingDrive}
                    className="btn bg-[#0f2a44] hover:bg-[#1e3a5f] text-[#d4af37] rounded-xl text-xs font-bold px-6 shadow-sm"
                  >
                    {savingDrive ? "সেভ হচ্ছে..." : "Save Drive Settings"}
                  </button>
                </div>

                {driveTestResult && (
                  <div className={`mt-3 p-4 rounded-xl text-xs border ${driveTestResult.success ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-300 text-red-800"}`}>
                    <div className="font-bold mb-1 flex items-center gap-1.5">
                      {driveTestResult.success ? <FiCheckCircle className="text-emerald-600" /> : <FiAlertTriangle className="text-red-600" />}
                      <span>{driveTestResult.message}</span>
                    </div>
                    {driveTestResult.success && (
                      <p className="text-[11px] mt-0.5">
                        টার্গেট ফোল্ডার: <strong>{driveTestResult.targetFolder}</strong> (ম্যাচিং ফাইলস: {driveTestResult.filesFound} টি)
                      </p>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Quick Setup Instructions */}
            <div className="bg-[#0f2a44] text-white rounded-2xl p-6 border border-[#d4af37]/30 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#d4af37] flex items-center gap-2 mb-3">
                  <FiKey /> ২ মিনিটে ফ্রি ড্রাইভ সেটআপ গাইড:
                </h3>
                <ol className="text-xs text-white/80 space-y-2.5 list-decimal pl-4 leading-relaxed">
                  <li>
                    <strong>Google Cloud Console</strong>-এ গিয়ে একটি নতুন প্রোজেক্ট তৈরি করুন (সম্পূর্ণ ফ্রি)।
                  </li>
                  <li>
                    <strong>Enabled APIs & Services</strong>-এ গিয়ে <strong>Google Drive API</strong> সার্চ করে "Enable" বাটনে চাপুন।
                  </li>
                  <li>
                    <strong>Credentials</strong> সেকশন থেকে <strong>"Create Service Account"</strong> বানিয়ে তার Keys থেকে <strong>JSON Key</strong> ডাউনলোড করুন।
                  </li>
                  <li>
                    আপনার গুগল ড্রাইভে একটি ফোল্ডার খুলে সার্ভিস একাউন্টের ইমেইলটিকে সেই ফোল্ডারে <strong>"Editor"</strong> শেয়ার পারমিশন দিন।
                  </li>
                  <li>
                    JSON ফাইলের পুরো টেক্সটটি বামের বক্সে পেস্ট করে <strong>"Save Drive Settings"</strong> চাপুন।
                  </li>
                </ol>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10 text-[11px] text-white/60">
                কোনো প্রকার টাকা বা কার্ডের প্রয়োজন নেই। যেকোনো জিমেইল দিয়ে ফ্রি করা যায়।
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
