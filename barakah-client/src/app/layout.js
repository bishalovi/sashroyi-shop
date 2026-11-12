/* eslint-disable @next/next/no-img-element */
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WhatsAppFloatButton from "@/components/shared/WhatsAppFloatButton";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { Hind_Siliguri } from "next/font/google";
import { ToastContainer } from "react-toastify";
import Script from "next/script";
import "react-toastify/dist/ReactToastify.css";
import UTMTracker from "@/components/tracking/UTMTracker";
import DynamicTrackingProvider from "@/components/tracking/DynamicTrackingProvider";
import DeviceGuard from "@/components/security/DeviceGuard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sashroyi.shop";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://sashroyi-api.onrender.com";

export async function generateMetadata() {
  let seo = {};
  let shopName = "Sashroyi Shop";

  try {
    const res = await fetch(`${API_URL}/api/settings/public`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json = await res.json();
      seo = json?.data?.seo || {};
      shopName = json?.data?.general?.shopName || "Sashroyi Shop";
    }
  } catch {
    // Fallback to defaults if API is unavailable
  }

  const defaultTitle =
    seo.siteTitle || "Sashroyi | Kitchen, Home & Living & Household Essentials";
  const defaultDescription =
    seo.siteDescription ||
    "সাশ্রয়ী মূল্যে সেরা মানের Kitchen & Dining, Home & Living, Baby Care এবং দৈনন্দিন প্রয়োজনীয় পণ্য অর্ডার করুন sashroyi.shop থেকে।";
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
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body className={`${banglaFont.className} flex min-h-screen flex-col`}>
        {/* Meta Pixel Script inside BODY as required by Next.js App Router */}
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

        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="light"
        />

        <UTMTracker />
        <DynamicTrackingProvider />
        <SettingsProvider>
          <DeviceGuard />
          <CartProvider>
            <AuthProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <WhatsAppFloatButton />
            </AuthProvider>
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
