# 📦 Sashroyi.Shop — Official Version History & Changelog

Welcome to the official version archive of **Sashroyi.Shop** e-commerce platform.
This document contains detailed changelogs for all versions, detailing newly added features, bug fixes, performance optimizations, and setup instructions.

---

## 📑 Version Summary Matrix

| Version | Milestone Name | Status | Archive File |
| :--- | :--- | :--- | :--- |
| **v2.2.0** | **Latest Production Release** | 🟢 Active / Live | `sashroyi-v2.2.0-latest-production.zip` |
| **v2.1.0** | **Categories & Customizations** | 📦 Archived | `sashroyi-v2.1.0-categories-and-settings.zip` |
| **v2.0.0** | **Admin Settings & Payment Hub** | 📦 Archived | `sashroyi-v2.0.0-admin-and-payments.zip` |
| **v1.0.0** | **Base Architecture & Auth** | 📦 Archived | `sashroyi-v1.0.0-base-architecture.zip` |

---

## 🚀 Version 2.2.0 (Latest Production Release)
**Date:** September 05, 2026  
**Commit:** `b2e3bea`  
**Archive:** `sashroyi-v2.2.0-latest-production.zip`

### ✨ What Was Added / Improved (নতুন কী যোগ হয়েছে):
1. **হেডার-এর নিচে লাইভ প্রোডাক্ট সার্চ বার (`SearchBar.jsx` & `/search` পেজ):**
   - হেডার/ন্যাভবারের ঠিক নিচে একটি বড়, প্রিমিয়াম ও আকর্ষণীয় **প্রোডাক্ট সার্চ বার** বসানো হয়েছে।
   - **Live Autocomplete / Instant Dropdown:** কাস্টমার যেকোনো পণ্যের নাম লিখলেই ছবি ও দামসহ সরাসরি ড্রপডাউনে সাজেশন চলে আসে।
   - **ডেডিকেটেড সার্চ রেজাল্ট পেজ:** এন্টার চাপলে বা 'খুঁজুন' বাটনে চাপলে পুরো সার্চ পেজ ওপেন হয়।
   - ন্যাভবারেও কার্টের পাশে কুইক সার্চ আইকন যুক্ত করা হয়েছে।
2. **ক্যাটাগরি সিস্টেমের সম্পূর্ণ রি-ডিজাইন (`HomeCategories.jsx`):**
   - প্রিমিয়াম ব্যাকড্রপ, হাই-কোয়ালিটি আইকন, সাব-ক্যাটাগরি ব্যাজ এবং স্মুথ হোভার অ্যানিমেশন সহ আধুনিক লুক।
3. **হোমপেজে গ্যাপ ছাড়া "সকল পণ্য" গ্রিড:**
   - ক্যাটাগরি সেকশনের ঠিক নিচেই কোনো বাড়তি গ্যাপ ছাড়া **"সকল পণ্যসমূহ" (All Products)** সরাসরি সুন্দর গ্রিডে শো করে।
4. **অ্যাডমিন প্যানেলে প্রোডাক্ট, ক্যাটাগরি ও সাব-ক্যাটাগরি উপরে-নিচে (Reorder) করার ব্যবস্থা:**
   - **প্রোডাক্ট টেবিল:** প্রতি প্রোডাক্টের পাশে **`↑` (Move Up)** এবং **`↓` (Move Down)** বাটন—ক্লিক করলেই ক্রমানুসার ডাটাবেজে সেভ হয়ে যায় এবং সাইটের হোমপেজে সেই সিরিয়ালে পণ্য আসে।
   - **ক্যাটাগরি ও সাব-ক্যাটাগরি:** অ্যাডমিন থেকে ক্যাটাগরি ও সাব-ক্যাটাগরি উপরে-নিচে নামিয়ে পছন্দমতো সাজানোর সুবিধা।
5. **প্রোডাক্ট যোগ করার ক্ষেত্রে সাব-ক্যাটাগরি ও ডেসক্রিপশন অপশনাল (Optional):**
   - সাব-ক্যাটাগরি সিলেক্ট না করলেও কিংবা বিবরণ না লিখলেও কোনো সমস্যা ছাড়াই প্রোডাক্ট সেভ হয়।
6. **কার্ট পেজে বিশ্বস্ততা স্লোগান:**
   - ডেলিভারি ফ্রি টেক্সট পরিবর্তন করে **"★ আপনার বিশ্বাসই আমাদের অঙ্গীকার ★"** ট্রাস্ট ব্যাজ যোগ করা হয়েছে।
7. **রিপোজিটরি ক্লিন-আপ:**
   - অপ্রয়োজনীয় ডেমো হিরো ভিডিও সেটিংস রিমুভ করা হয়েছে এবং পুরনো সব `.backup` ফাইল মুছে কোডকে হালকা ও দ্রুতগতির করা হয়েছে।

---

## 🎨 Version 2.1.0 (Categories & Customizations)
**Date:** September 04, 2026  
**Commit:** `6cf70c3`  
**Archive:** `sashroyi-v2.1.0-categories-and-settings.zip`

### ✨ What Was Added / Improved:
1. **১০০% ডায়নামিক ক্যাটাগরি ও স্লাগ রাউটিং:**
   - `/category/[main]` এবং `/category/[main]/[sub]` রাউট তৈরি।
   - অ্যাডমিন প্যানেলে নতুন ক্যাটাগরি ও সাব-ক্যাটাগরি যোগ/সম্পাদনা/মুছে ফেলার পূর্ণাঙ্গ ব্যবস্থা।
2. **Google Drive ইমেজ লিঙ্ক স্বয়ংক্রিয় রূপান্তর (Auto-Conversion):**
   - লোগো ও ফেভিকনে গুগল ড্রাইভ লিঙ্ক বসালে তা স্বয়ংক্রিয়ভাবে ডিরেক্ট ডিসপ্লে ইমেজে রূপান্তর হওয়ার অ্যালগরিদম।
3. **বাটন কালার অদলবদল (Button Color Swap):**
   - "কার্টে যোগ করুন" পেয়েছে আউটলাইন/বর্ডার স্টাইল।
   - "এখনই কিনুন" পেয়েছে সলিড ব্লু ব্যাকগ্রাউন্ড স্টাইল।
4. **মেইনটেইনার অ্যাট্রিবিউশন আপডেট:**
   - ফুটারে `Maintained by Rayhan` এবং সঠিক WhatsApp নম্বর `01629733036` সেট করা হয়েছে।

---

## ⚙️ Version 2.0.0 (Admin Settings & Payment Hub)
**Date:** September 04, 2026  
**Commit:** `55a5f0d`  
**Archive:** `sashroyi-v2.0.0-admin-and-payments.zip`

### ✨ What Was Added / Improved:
1. **সেন্ট্রাল ওয়েবসাইট সেটিংস হাব (`/admin/settings`):**
   - হেডার ও মেনুবার কাস্টমাইজেশন (লোগো, সাইটের নাম, মেনু লিঙ্ক)।
   - ফুটার ও ব্র্যান্ডিং সেটিংস।
   - নোটিশ বার সেটিংস (অ্যাক্টিভ/ইনঅ্যাক্টিভ, টেক্সট, লিঙ্ক)।
2. **পেমেন্ট মেথড ও নম্বর সেটিংস:**
   - বিকাশ (bKash), নগদ (Nagad), রকেট (Rocket) ও ক্যাশ অন ডেলিভারির নম্বর ও ইন্সট্রাকশন অ্যাডমিন থেকে সরাসরি পরিবর্তন করার ব্যবস্থা।
   - চেকআউট পেজে লাইভ নম্বর ও কিউআর প্রদর্শন।
3. **অ্যাডমিন ও মডারেটর স্টাফ ম্যানেজমেন্ট:**
   - সেটিংস থেকে নতুন অ্যাডমিন ও মডারেটর যোগ করা, রোল পরিবর্তন ও ডিলিট করার পূর্ণ সুবিধা।
4. **ডায়নামিক ট্র্যাকিং (Meta Pixel & GTM):**
   - অ্যাডমিন সেটিংস থেকে পিক্সেল ও ট্যাগ ম্যানেজার পরিবর্তন এবং স্বয়ংক্রিয় স্ক্রিপ্ট ইনজেকশন।

---

## 🏗️ Version 1.0.0 (Base Architecture & Auth)
**Date:** September 03, 2026  
**Commit:** `a1deb13`  
**Archive:** `sashroyi-v1.0.0-base-architecture.zip`

### ✨ What Was Added:
1. মূল Next.js App Router আর্কিটেকচার এবং Tailwind CSS ডিজাইন সিস্টেম।
2. MongoDB ডাটাবেজ কানেক্টিভিটি এবং Render API ডিপ্লয়মেন্ট।
3. ইউজার অথেন্টিকেশন (JWT, Login, Register, Protected Routes)।
4. কার্ট সিস্টেম (`CartContext`), প্রোডাক্ট পেজ এবং অর্ডার প্লেসমেন্ট।

---

## 💻 কীভাবে যেকোনো ভার্সনের জিপ আপনার পিসিতে চালাবেন (How to Run Any ZIP)

১. `versions_archive` ফোল্ডার থেকে আপনার প্রয়োজনীয় ভার্সনের `.zip` ফাইলটি যেকোনো ফোল্ডারে এক্সট্রাক্ট (Extract) করুন।
২. ফোল্ডারের ভেতর টার্মিনাল ওপেন করুন এবং নিচের কমান্ডগুলো চালান:

### ক্লায়েন্ট (Frontend) রান করতে:
```bash
cd barakah-client
npm install
npm run dev
```
ব্রাউজারে যান: `http://localhost:3000`

### সার্ভার (Backend) রান করতে:
```bash
cd barakah-server
npm install
node index.js
```
ব্রাউজারে যান: `http://localhost:5000`
