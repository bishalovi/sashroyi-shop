"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Client Error caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="mb-2 text-xl font-bold text-[#0f2a44]">
        কিছু একটা সমস্যা হয়েছে
      </h2>
      <p className="mb-6 max-w-md text-sm text-gray-600">
        পেজটি লোড হতে সাময়িক সমস্যা হচ্ছে। অনুগ্রহ করে নিচের বাটনে ক্লিক করে পুনরায় চেষ্টা করুন।
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-[#0f2a44] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d4af37]"
        >
          আবার চেষ্টা করুন
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          হোমে ফিরে যান
        </button>
      </div>
    </div>
  );
}
