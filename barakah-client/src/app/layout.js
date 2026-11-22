/* eslint-disable @next/next/no-img-element */
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { DeferredToast, DeferredWhatsApp } from "@/components/shared/DeferredWidgets";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { Hind_Siliguri, Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import UTMTracker from "@/components/tracking/UTMTracker";
import DynamicTrackingProvider from "@/components/tracking/DynamicTrackingProvider";
import DeviceGuard from "@/components/security/DeviceGuard";

import { getSiteUrl, getApiUrl, isTopSkbazarHost } from "@/lib/seoConfig";
import { headers } from "next/headers";

export async function generateMetadata() {
  let host = "";
  try {
    const h = await headers();
    host = h.get("x-forwarded-host") || h.get("host") || "";
  } catch {}

  const isTop = isTopSkbazarHost(host);
  const SITE_URL = isTop ? "https://top.skbazarbd.com" : getSiteUrl();
  const API_URL = isTop ? "https://topskbazar-api.onrender.com" : getApiUrl();

  let seo = {};
  let shopName = isTop ? "Sk Bazar" : "Sashroyi Shop";

  try {
    const res = await fetch(`${API_URL}/api/settings/public`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json = await res.json();
      seo = json?.data?.seo || {};
      shopName = json?.data?.general?.shopName || (isTop ? "Sk Bazar" : "Sashroyi Shop");
    }
  } catch {
    // Fallback to defaults if API is unavailable
  }

  const rawTitle =
    seo.siteTitle || (isTop ? "Sk Bazar | Best Online Shopping in BD" : "Sashroyi | Kitchen, Home & Living Essentials");
  const defaultTitle = rawTitle.length > 60 ? rawTitle.substring(0, 57).trim() + "..." : rawTitle;

  const rawDescription =
    seo.siteDescription || (isTop ? "সেরা মূল্যে সেরা মানের পণ্য অর্ডার করুন top.skbazarbd.com থেকে।" : "সাশ্রয়ী মূল্যে সেরা মানের Kitchen & Dining, Home & Living এবং দৈনন্দিন প্রয়োজনীয় পণ্য অর্ডার করুন sashroyi.shop থেকে।");
  const defaultDescription = rawDescription.length > 160 ? rawDescription.substring(0, 157).trim() + "..." : rawDescription;

  const defaultOgImage = `${SITE_URL}/logo.svg`;
  const resolvedOgImage = seo.ogImage || defaultOgImage;

  const keywords = seo.siteKeywords
    ? seo.siteKeywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;

  const verification = {};
  if (seo.googleSiteVerification) {
    verification.google = seo.googleSiteVerification;
  }
  if (seo.bingSiteVerification) {
    verification.other = {
      "msvalidate.01": seo.bingSiteVerification,
    };
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: defaultTitle,
      template: "%s",
    },
    description: defaultDescription,
    keywords,
    openGraph: {
      type: "website",
      url: SITE_URL,
      locale: "bn_BD",
      siteName: shopName,
      title: defaultTitle,
      description: defaultDescription,
      images: [
        {
          url: resolvedOgImage,
          alt: shopName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDescription,
      images: [resolvedOgImage],
    },
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
    robots: {
      index: true,
      follow: true,
    },
  };
}

const banglaFont = Hind_Siliguri({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-bangla",
});

const interFont = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const playfairFont = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${banglaFont.variable} ${interFont.variable} ${playfairFont.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      </head>
      <body className={`${banglaFont.className} flex min-h-screen flex-col`}>
        <DeferredToast />

        <UTMTracker />
        <DynamicTrackingProvider />
        <SettingsProvider>
          <DeviceGuard />
          <CartProvider>
            <AuthProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <DeferredWhatsApp />
            </AuthProvider>
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
