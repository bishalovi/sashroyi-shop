# CLAUDE.md - Instructions for Claude (Claude.ai & Claude Code)

This repository contains the full production codebase for **Sashroyi.shop** (and its sister store **Top.skbazarbd.com**).

## 🛠️ Build & Run Commands
- **Backend (Express API)**:
  - Directory: `barakah-server`
  - Install: `npm install`
  - Run dev/prod: `npm start` or `node index.js` (runs on `http://localhost:8000`)
- **Frontend (Next.js 16 App Router)**:
  - Directory: `barakah-client`
  - Install: `npm install`
  - Run dev: `npm run dev` (runs on `http://localhost:3000`)
  - Build check: `npm run build` (MUST succeed with exit code 0 on all 26 routes)
  - Run prod: `npm start`

## 🏗️ Architecture & Key Paths
- `barakah-client/src/app/page.js`: Homepage with optimized slimProduct mappings.
- `barakah-client/src/app/products/[id]/page.js`: Server-rendered product detail page with Schema.org JSON-LD and dynamic metadata.
- `barakah-client/src/components/products/ProductDetailsClient.jsx`: Interactive storefront gallery, variations selector, WhatsApp order button, sticky bar integration.
- `barakah-client/src/components/products/MobileStickyBuyBar.jsx`: Floating sticky buy now bar on mobile.
- `barakah-client/src/app/checkout/page.jsx`: Single-page high-converting checkout with live district/zone delivery charge calculation and Meta CAPI purchase event firing.
- `barakah-client/src/app/admin/`: Admin dashboard (orders, products, abandoned orders, settings, shipping, tracking, system core).
- `barakah-server/controllers/product.controller.js`: Product CRUD with variable products and galleryImages support.
- `barakah-server/controllers/order.controller.js`: Order lifecycle, statuses, and CAPI server-side event dispatch.
- `barakah-server/config/db.js`: MongoDB native driver connection pool.

## 🔐 Credentials & Environment Variables
- **Backend (`barakah-server/.env`)**:
  - `PORT=8000`
  - `DB_NAME=barakah_db`
  - `MONGODB_URI=mongodb+srv://epicmartbd99_db_user:ougAVIhBfqubEsvl@cluster0.thqp4fv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
- **Frontend (`barakah-client/.env.local` / `.env.production`)**:
  - `NEXT_PUBLIC_SITE_URL=https://sashroyi.shop`
  - `NEXT_PUBLIC_API_URL=https://sashroyi-api.onrender.com`
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=miigc3z4`
  - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default`

## ⚠️ Important Rules for Claude
1. **Never use hover-zoom or magnification on product images.** The user requires clean, natural rendering.
2. **Always preserve the `🚚 ফ্রি ডেলিভারি` badge.** When `isFreeShipping: true`, show badges on cards, details, and CTA buttons.
3. **Multi-tenant safety.** Storefront detects domain via `src/lib/seoConfig.js`. Sashroyi runs on `main` branch, Top Skbazar runs on `top-skbazar` branch.
4. **Always verify compilation.** Before finishing tasks, run `cd barakah-client && npm run build` to confirm 0 errors.
