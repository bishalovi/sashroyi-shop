# 📘 Sashroyi.Shop — Official Development History & Client Chat Logs

> **Platform:** Sashroyi.Shop (Islamic Wall Clock & Canvas E-commerce)  
> **Repository:** `bishalovi/sashroyi-shop`  
> **Maintainer / Lead Developer:** Rayhan  
> **Tech Stack:** Next.js (App Router), React 19, Tailwind CSS, Express.js, Node.js, MongoDB Atlas, Render, Vercel

---

## 📑 নির্বাহী সারসংক্ষেপ (Executive Summary & Version Index)

| Version | Release Date | Milestone Title | Key Focus Area | Deployment Status |
| :--- | :--- | :--- | :--- | :--- |
| **`v2.5.0`** | `10-Nov-2026` | **Full Funnel EMQ Maximizer & A-Z Tracking Audit** | 100% City/State/ZIP, ViewContent contents, Deduplication | 🟢 **Production Live** |
| **`v2.4.0`** | `09-Sep-2026` | **Explicit AddToCart & Direct Checkout Funnel** | AddToCart Button vs Buy Now, Clean Funnel | 📦 Archived |
| **`v2.3.0`** | `08-Sep-2026` | **Meta CAPI & GTM Tracking Hub** | Pixel Deduplication, CAPI, GTM Decoupling | 📦 Archived |
| **`v2.2.0`** | `05-Sep-2026` | **Live Search Bar & Category Reordering** | Autocomplete Search, Product/Category Up-Down | 📦 Archived |
| **`v2.1.0`** | `04-Sep-2026` | **Dynamic Categories & Customizations** | Slug Routing, Google Drive Auto-Conversion | 📦 Archived |
| **`v2.0.0`** | `04-Sep-2026` | **Admin Settings & Payment Methods Hub** | Central Admin Settings, bKash/Nagad Numbers | 📦 Archived |
| **`v1.0.0`** | `03-Sep-2026` | **Base Architecture & Authentication** | Next.js Architecture, JWT Auth, Cart System | 📦 Archived |

---

## 🚀 Session Log: 10 November 2026 — Milestone v2.5.0 (Full Funnel EMQ Maximizer & A-Z Tracking Audit)

### 📋 1. Context & User Requirement (ব্যবহারকারীর অনুরোধ ও সমস্যা)
- **Problem Statement (সমস্যা):**  
  ব্যবহারকারী Meta Events Manager-এ Event Match Quality (EMQ) স্কোর কম থাকার কারণ জানতে চান। স্পেসিফিকালি:
  1. `City` ও `State` ম্যাচিং কভারেজ মাত্র ৫০% দেখাচ্ছিল।
  2. `Browser ID (fbp)` ৫০% দেখাচ্ছিল।
  3. `Click ID (fbc)` মিসিংয়ের কারণে EMQ স্কোর প্রায় ০.৭ পিছিয়ে ছিল।
  4. ব্যবহারকারীর সরাসরি নির্দেশ: *"browser r server side valo kore dekho datalayer hote a to z check diye problem ber kore dao"* (DataLayer থেকে শুরু করে ব্রাউজার ও সার্ভার CAPI ট্র্যাকিংয়ের A to Z অডিট ও সমাধান)।

---

### 🔍 2. Technical Audit & Root Cause Analysis (প্রযুক্তিগত কারণ অনুসন্ধান)
1. **ব্রাউজার অ্যাডভান্সড ম্যাচিং-এ City ও State না থাকা:**
   - সার্ভার CAPI থেকে ঠিকানা অনুযায়ী `city`, `state`, `zip` পাঠানো হচ্ছিল। কিন্তু ব্রাউজার সাইডে `fbq('init', pixelId, am)` শুধুমাত্র ফোন ও নাম পাঠাচ্ছিল।
   - ফলে মেটার কাছে মোট ইভেন্টের কেবল সার্ভার অংশটি (৫০%) City/State পাচ্ছিল, ব্রাউজার অংশ (৫০%) পাচ্ছিল না। মোট কভারেজ দাঁড়াত ৫০%।
2. **`fbp` কভারেজ কম থাকার কারণ:**
   - ব্রাউজারে `fbevents.js` স্ক্রিপ্ট লোড হওয়ার আগে প্রথম `PageView` ফায়ার হয়ে গেলে ব্রাউজার কুকিতে `_fbp` তৈরি হতো না।
   - এখন `getOrCreateFbp()` সিনক্রোনাসলি প্রথম মিলিসেকেন্ডেই কুকি ও লোকালস্টোরেজে `_fbp` তৈরি ও প্রিজার্ভ করে, ফলে ব্রাউজার ও সার্ভার উভয়েই ১০০% কভারেজ পায়।
3. **`fbc` (Click ID) এর সঠিক হ্যান্ডলিং:**
   - ফেসবুক অ্যাড থেকে আসা ক্লিকে URL-এ থাকা `fbclid` পার্স করে `_fbc` তৈরি ও ৯০ দিনের জন্য সংরক্ষণ নিশ্চিত করা হয়েছে।
4. **`ViewContent` ও `Purchase` স্ট্যান্ডার্ড প্যারামিটার অসম্পূর্ণতা:**
   - `ViewItemTracker.jsx`-এ `contents` অ্যারে বাদ পড়েছিল।
   - `order-success/page.js`-এ `content_ids` বাদ পড়েছিল।
   - `CategoryViewTracker.jsx`-এ কারেন্সি ছিল কিন্তু ভ্যালু ছিল না।
5. **চেকআউট পেজে রেস কন্ডিশন ও ডাবল `begin_checkout`:**
   - কার্ট লোড হওয়ার আগে `[]` অবস্থায় ইফেক্ট রিটার্ন করায় রিলোডে `InitiateCheckout` মিস হচ্ছিল।
   - পেজে দুটি আলাদা `useEffect` একই `begin_checkout` ডাটালেয়ারে পুশ করছিল।

---

### 🛠️ 3. Implementation Details & Solutions (গৃহীত পদক্ষেপ ও সমাধান)
- **`metaTracking.js`:** ব্রাউজার অ্যাডভান্সড ম্যাচিং-এ `BD_LOCATIONS` ইন্টিগ্রেশন করে `ct`, `st`, `zp` অন্তর্ভুক্ত করা হয়েছে।
- **`ViewItemTracker.jsx`:** `ViewContent` ইভেন্টে স্ট্যান্ডার্ড `contents` অ্যারে যুক্ত করা হয়েছে।
- **`order-success/page.js`:** `Purchase` ইভেন্টে `content_ids` যুক্ত করা হয়েছে।
- **`checkout/page.jsx`:** `useRef` ও `sessionStorage` গার্ডের মাধ্যমে `cartItems` প্রস্তুত হওয়া মাত্রই নিখুঁতভাবে ১ বার `InitiateCheckout` ও `begin_checkout` ফায়ার এবং পেমেন্ট বাছাইয়ে `add_payment_info` পুশ।
- **`CategoryViewTracker.jsx`:** ক্যাটাগরি পেজে ডায়াগনস্টিক ভ্যালু ওয়ার্নিং সমাধান।
- **টেস্ট কোড ও সেকেন্ডারি CAPI ফাইন টিউনিং:** URL সেশন টেস্ট কোড প্রায়োরিটাইজেশন এবং পারচেজে অতিরিক্ত সেকেন্ডারি CAPI কল এলিমিনেশন করে মেটায় নিখুঁত ১:১ Deduplication বাস্তবায়ন।

---

## 🚀 Session Log: 08 September 2026 — Milestone v2.3.0

### 📋 1. Context & User Requirement (ব্যবহারকারীর অনুরোধ ও সমস্যা)
- **Problem Statement (সমস্যা):**  
  ব্যবহারকারী Meta Events Manager-এর **Test Events** টুল থেকে অ্যাক্টিভিটি শেয়ার করেন। দেখা যায় প্রতিটি ব্রাউজার অ্যাকশনে (`PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`) **২ বার করে ইভেন্ট ফায়ার হচ্ছে** (Double Counting / Duplicate Tracking)।
  - **১ম ইভেন্ট আইডি:** কাস্টম ট্র্যাকিং আইডি (যেমন: `addtocart_1788847187438_186`, `initiatecheckout_...`, অর্ডার আইডি)।
  - **২য় ইভেন্ট আইডি:** মেটা অটো-প্লাগইন আইডি (যেমন: `ob3_plugin-set_...`)।
- **Key Questions & Expectations (জিজ্ঞাসা ও চাহিদা):**
  1. কোডের মধ্যে কি কোনো পুরনো বা অতিরিক্ত GTM / Meta Pixel স্ক্রিপ্ট রয়ে গেছে?
  2. অ্যাডমিন প্যানেল (`/admin/tracking`) থেকে কীভাবে Tag Manager অন/অফ এবং Container ID পরিবর্তন করা যাবে?
  3. প্রজেক্টের প্রতিটি আপডেটের পর যেন একটি প্রফেশনাল টেক্সট ডকুমেন্টে সকল কথোপকথন ও কাজের হিস্ট্রি সুবিন্যস্ত থাকে।

---

### 🔍 2. Technical Root Cause Analysis (প্রযুক্তিগত কারণ অনুসন্ধান)
1. **GTM DataLayer ও Pixel কনফ্লিক্ট (`src/lib/gtm.js`):**  
   - `gtm.js` ফাইলের `pushToDataLayer` ফাংশনে DataLayer পুশের পাশাপাশি সরাসরি `window.fbq("track", ...)` কল করা ছিল কোনো `eventID` ছাড়া।
   - অপরদিকে কম্পোনেন্টগুলো (`ProductDetailsActions.jsx`, `CartContext.jsx`, `checkout/page.jsx`) আলাদাভাবে `trackMetaEvent()` কল করে `eventID` সহ ফায়ার করছিল।
   - ফলে প্রতি ক্লিকে ব্রাউজার থেকে **দুটি আলাদা Meta Pixel ইভেন্ট** নির্গত হচ্ছিল।
2. **Deduplication ব্যর্থতা:**  
   - যেহেতু `gtm.js` এর ইভেন্টে কোনো `eventID` ছিল না, Meta Pixel স্ক্রিপ্ট তাকে নামহীন বা ওপেন-ব্রিজ ইভেন্ট হিসেবে `ob3_plugin-set_...` আইডি অ্যাসাইন করেছিল। আইডি মিল না থাকায় Meta এদের ডিডুপ্লিকেট করতে পারছিল না।

---

### 🛠️ 3. Implementation Details & Solutions (গৃহীত পদক্ষেপ ও কোড সমাধান)

#### ক. `src/lib/gtm.js` সংশোধন:
- `pushToDataLayer` ফাংশন থেকে অপ্রয়োজনীয় ডিরেক্ট `fbq` এবং `ttq` ব্রিজ সম্পূর্ণ অপসারণ করা হয়েছে।
- এখন DataLayer শুধুমাত্র বিশুদ্ধ GTM `window.dataLayer.push(data)` হিসেবে দায়িত্ব পালন করে।

#### খ. `src/app/order-success/page.js` আপগ্রেড:
- অর্ডার কমপ্লিশন স্ক্রিনে পারচেজ ইভেন্টকে `trackMetaEvent("Purchase", ...)` এর আওতায় নিয়ে আসা হয়েছে।
- কাস্টমার ডাটা (ফোন নম্বর, নাম, ডেলিভারি ঠিকানা, মোট মূল্য, অর্ডার আইডি) স্বয়ংক্রিয়ভাবে হ্যাশ হয়ে ব্রাউজার পিক্সেল এবং সার্ভার CAPI উভয়েই একসাথে সেন্ড হয়।

#### গ. অ্যাডমিন প্যানেল ট্র্যাকিং হাব (`/admin/tracking`):
- অ্যাডমিন প্যানেলে **Google Tag Manager** ট্যাবে টগল সুইচ (Active/Inactive) এবং Container ID ইনপুট ফিল্ড যাচাই করা হয়েছে।
- এর মাধ্যমে কোনো কোড পরিবর্তন ছাড়াই অ্যাডমিন থেকে মুহূর্তের মধ্যে GTM স্ক্রিপ্ট চালু বা বন্ধ করা যায়।

#### ঘ. গিট ভার্সনিং ও ক্লাউড সিঙ্ক:
- Commit `1cabc0a`: `fix(tracking): remove duplicate pixel bridges from gtm.js and clean purchase tracking`
- Commit `ad1d0d6`: `docs: update CHANGELOG.md with Version 2.3.0 release notes`
- Commit `a5592b7`: `docs: add CHAT_HISTORY_AND_UPDATES.md for complete conversation and update logs`

---

## 🚀 Session Log: 05 September 2026 — Milestone v2.2.0

### 📋 User Requirements:
1. হেডারের ঠিক নিচে একটি প্রিমিয়াম লাইভ প্রোডাক্ট সার্চ বার বসানো।
2. সার্চ বক্সে টাইপ করার সাথে সাথে লাইভ ড্রপডাউনে প্রোডাক্ট ইমেজ, ক্যাটাগরি ও প্রাইস সহ অটো-কমপ্লিট সাজেশন আসা।
3. হোমপেজে ক্যাটাগরির নিচেই কোনো ফাঁকা জায়গা ছাড়া সরাসরি "সকল পণ্যসমূহ" গ্রিড শো করা।
4. অ্যাডমিন প্যানেল থেকে প্রোডাক্ট এবং ক্যাটাগরি উপরে-নিচে (Move Up / Down) নামিয়ে ড্র্যাগ/অর্ডার সাজানোর সুবিধা।
5. কার্ট পেজে ডেলিভারি ফ্রি টেক্সট পরিবর্তন করে বিশ্বস্ততার স্লোগান দেওয়া।

### 🛠️ Implementation Details:
- **কম্পোনেন্ট:** `src/components/shared/SearchBar.jsx` এবং `src/app/search/page.js` তৈরি।
- **ডিজাইন:** `src/components/home/HomeCategories.jsx` নতুন গ্লাস-মরফিজম ও ব্যাকড্রপ দিয়ে আধুনিকায়ন।
- **ডাটাবেজ ও অ্যাডমিন:** প্রোডাক্ট স্কিমায় `sortOrder` ফিল্ড যুক্ত করে টেবিলে `↑` ও `↓` বাটনের মাধ্যমে রিয়্যাল-টাইম সাজানোর ব্যবস্থা।
- **কার্ট ট্রাস্ট ব্যাজ:** কার্ট পেজে *"★ আপনার বিশ্বাসই আমাদের অঙ্গীকার ★"* স্লোগান যুক্ত করা হয়েছে।

---

## 🚀 Session Log: 04 September 2026 — Milestone v2.1.0

### 📋 User Requirements:
1. সম্পূর্ণ ডায়নামিক ক্যাটাগরি ও সাব-ক্যাটাগরি স্লাগ রাউটিং তৈরি।
2. গুগল ড্রাইভ থেকে কপি করা ইমেজ লিঙ্ক স্বয়ংক্রিয়ভাবে সরাসরি প্রদর্শনের উপযোগী করা।
3. প্রোডাক্ট ডিটেইলস পেজের বাটনের কালার অদলবদল (কার্ট বাটন আউটলাইন, এখনই কিনুন বাটন সলিড ব্লু)।
4. ফুটারে মেইনটেইনার ইনফো (`Maintained by Rayhan`) এবং অফিসিয়াল WhatsApp নম্বর আপডেট।

### 🛠️ Implementation Details:
- **রাউটিং:** `/category/[main]` এবং `/category/[main]/[sub]` ডায়নামিক এসইও ফ্রেন্ডলি রাউট তৈরি।
- **ড্রাইভ কনভার্টার:** গুগল ড্রাইভের ভিউ লিঙ্ক থেকে সরাসরি `drive.google.com/uc?export=view&id=...` তে কনভার্ট করার ইউটিলিটি যোগ।
- **বাটন রি-স্টাইলিং:** Tailwind CSS দিয়ে বাটনের অ্যাকসেন্ট ও হোভার কালার পারফেক্ট করা।

---

## 🚀 Session Log: 04 September 2026 — Milestone v2.0.0

### 📋 User Requirements:
1. অ্যাডমিন প্যানেলে সেন্ট্রাল সেটিংস হাব তৈরি করা (`/admin/settings`)।
2. বিকাশ, নগদ, রকেট এবং ক্যাশ অন ডেলিভারি নম্বর ও কিউআর কোড অ্যাডমিন থেকে পরিবর্তনের সুবিধা।
3. অ্যাডমিন ও মডারেটর স্টাফ ম্যানেজমেন্ট (নতুন ইউজার রোল যোগ, এডিট ও ডিলিট)।
4. নোটিশ বার সেটিংস (হেডারের উপরে জরুরি ঘোষণার জন্য টেক্সট ও লিঙ্ক)।

### 🛠️ Implementation Details:
- **কন্ট্রোলার ও রুট:** `settings.controller.js` এবং `settings.routes.js` তৈরি।
- **পেমেন্ট গেটওয়ে হাব:** পেমেন্ট মেথড ডায়নামিক করে চেকআউট পেজের সাথে সিঙ্ক করা।
- **অথরাইজেশন:** রোল-বেসড অ্যাক্সেস কন্ট্রোল (RBAC) দিয়ে স্টাফ ম্যানেজমেন্ট পেজ তৈরি।

---

## 🚀 Session Log: 03 September 2026 — Milestone v1.0.0

### 📋 User Requirements:
1. সম্পূর্ণ নতুন ই-কমার্স প্ল্যাটফর্মের ভিত্তি তৈরি করা (Next.js App Router + Node.js/Express + MongoDB)।
2. ইউজার রেজিস্ট্রেশন, লগইন এবং অ্যাডমিন প্রটেক্টেড রাউট।
3. শপিং কার্ট সিস্টেম (`CartContext`), প্রোডাক্ট পেজ এবং অর্ডার প্লেসমেন্ট ফ্লো।

### 🛠️ Implementation Details:
- **ফ্রন্টএন্ড:** Next.js 15, Tailwind CSS, React Toastify, React Icons।
- **ব্যাকএন্ড:** Express.js REST API, Mongoose ORM, JWT Token Authentication, Bcrypt Password Hashing।
- **ডাটাবেজ:** MongoDB Atlas ক্লাউড ডাটাবেজ ইন্টিগ্রেশন।

---

## 📌 ডেভেলপার গাইড ও ডকুমেন্টেশন মেইনটেন্যান্স রুলস
1. প্রতিবার ক্লায়েন্টের সাথে যেকোনো নতুন ফিচার, বাগ ফিক্স বা পরিবর্তন নিয়ে আলোচনা সম্পন্ন হলে এই ফাইলে নতুন সেশন লগ আকারে যুক্ত করতে হবে।
2. লগে স্পষ্টভাবে **ইউজার রিকোয়েস্ট**, **সমস্যার কারণ**, **কোড পরিবর্তন** এবং **গিট কমিট রেফারেন্স** অন্তর্ভুক্ত থাকতে হবে।
3. কোড পুশের পাশাপাশি এই ডকুমেন্টটিও গিটহাবে আপডেট করে সুরক্ষিত রাখতে হবে।
