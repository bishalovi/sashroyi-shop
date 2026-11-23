# SASHROYI.SHOP - AI AGENT ARCHITECTURE & DEVELOPMENT RULES

This document instructs any Cloud AI Agent (Cursor, Claude Code, GitHub Copilot, Windsurf, Bolt, or ChatGPT) working on this codebase.

---

## 1. PROJECT ARCHITECTURE OVERVIEW

This repository is a full-stack, high-performance E-commerce platform built specifically for fast conversion and minimal latency in Bangladesh:

- **Frontend (`barakah-client/`)**:
  - Framework: Next.js 16 (App Router) with React 19 / Turbopack
  - Styling: Tailwind CSS & DaisyUI
  - State Management: React Context (`CartContext`, `SettingsContext`, `AuthContext`)
  - Form Handling: `react-hook-form`
  - Image Optimization: `getOptimizedImageUrl` via Cloudinary (`w_800`, `w_160` thumbnails)
  - Tracking: Client-side Meta Pixel & Server-side Meta CAPI relay, Google Tag Manager (GTM DataLayer)

- **Backend (`barakah-server/`)**:
  - Framework: Node.js with Express.js
  - Database: MongoDB Native Driver (with connection caching in `config/db.js`)
  - Storage: MongoDB collections (`products`, `orders`, `categories`, `users`, `settings`, `reviews`, `blacklists`, `shippings`, `tracking_events`)
  - Meta CAPI: `services/capi.service.js` with SHA256 hashed customer parameters (fn, ph, em, ct, zp)

---

## 2. MULTI-TENANT DEPLOYMENT RULES

The codebase serves two live domains depending on host headers:
1. **Sashroyi Shop**:
   - Domain: `https://sashroyi.shop`
   - Backend API: `https://sashroyi-api.onrender.com`
   - Git Branch: `main`
2. **Top SK Bazar**:
   - Domain: `https://top.skbazarbd.com`
   - Backend API: `https://topskbazar-api.onrender.com`
   - Git Branch: `top-skbazar`

> **CRITICAL RULE FOR AI:** Whenever modifying frontend components or controllers that affect both stores, ensure changes are verified on `main` and kept compatible or cherry-picked to `top-skbazar`. Always check `src/lib/seoConfig.js` for dynamic host detection.

---

## 3. STRICT UI & UX GUIDELINES (USER PREFERENCES)

1. **NO HOVER ZOOM ON PRODUCT IMAGES:**
   - The user strictly dislikes hover zoom magnification or lens zoom libraries.
   - Images must render cleanly with natural object-cover (`Image` or `img`) and smooth cross-fade transition.
2. **FREE DELIVERY BADGE (🚚 ফ্রি ডেলিভারি):**
   - Products with `isFreeShipping: true` must display the `🚚 ফ্রি ডেলিভারি` badge on the product card, product details page, and dynamic CTA buttons.
   - Always ensure `isFreeShipping` is passed through any mapper (e.g. `slimProduct` in `app/page.js`).
3. **IMAGE GALLERY BEHAVIOR:**
   - Storefront product display has compact side arrows (`‹` and `›`), mobile touch swipe, and a thumbnail strip below.
   - When navigating photos, thumbnails must auto-scroll smoothly into center view.
   - Small thumbnails must NOT have text/label boxes over them.
4. **MOBILE FIRST & ZERO CLS:**
   - Keep page load fast. Avoid unnecessary libraries. Always test with `npm run build` to verify 0 compile errors.

---

## 4. ENVIRONMENT VARIABLES

### Backend (`barakah-server/.env`):
```env
PORT=8000
DB_NAME=barakah_db
MONGODB_URI=mongodb+srv://epicmartbd99_db_user:ougAVIhBfqubEsvl@cluster0.thqp4fv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### Frontend (`barakah-client/.env.local` / `.env.production`):
```env
NEXT_PUBLIC_SITE_URL=https://sashroyi.shop
NEXT_PUBLIC_API_URL=https://sashroyi-api.onrender.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=miigc3z4
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
```

---

## 5. COMMON COMMANDS & VERIFICATION

- **Run Server:** `cd barakah-server && npm install && npm start`
- **Run Client:** `cd barakah-client && npm install && npm run dev`
- **Verify Production Build (ALWAYS RUN BEFORE COMMITTING):**
  ```bash
  cd barakah-client && npm run build
  ```
  *Ensure all routes compile with Exit code 0.*
- **Check MongoDB Status:** Database collection ping in `barakah-server/config/db.js`.
