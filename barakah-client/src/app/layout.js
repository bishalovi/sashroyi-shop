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

import { getSiteUrl, getApiUrl } from "@/lib/seoConfig";

const SITE_URL = getSiteUrl();
const API_URL = getApiUrl();

export async function generateMetadata() {
  let seo = {};
  let shopName = "Sk Bazar";

  try {
    const res = await fetch(`${API_URL}/api/settings/public`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json = await res.json();
      seo = json?.data?.seo || {};
      shopName = json?.data?.general?.shopName || "Sk Bazar";
    }
  } catch {
    // Fallback to defaults if API is unavailable
  }

  const defaultTitle =
    seo.siteTitle || "Sk Bazar | Best Online Shopping in Bangladesh";
  const defaultDescription =
    seo.siteDescription ||
    "সেরা মূল্যে সেরা মানের পণ্য অর্ডার করুন top.skbazarbd.com থেকে।";
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
      locale: "bn_BD",
      siteName: shopName,
      title: defaultTitle,
      description: defaultDescription,
      ...(seo.ogImage
        ? {
            images: [{ url: seo.ogImage, alt: shopName }],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDescription,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
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
  weight: ["400", "600", "700"],
  display: "swap",
  preload: false,
  variable: "--font-inter",
});

const playfairFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  preload: false,
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
        {/* Instant Meta Pixel loader (non-blocking afterInteractive) */}
        <Script
          id="meta-pixel-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){
                if((arguments[0]==='track'||arguments[0]==='trackCustom')&&(!arguments[3]||!arguments[3].eventID)){
                  return;
                }
                n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)
              };
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq.disablePushState = true;
            `,
          }}
        />

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
