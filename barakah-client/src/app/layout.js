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

export const metadata = {
  title: "Sashroyi | Islamic Wall Clock & Canvas",
  description:
    "Shop premium Islamic wall clocks and canvas art. Elegant designs for your home. Maintained by Rayhan.",
};

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
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '3090216584507410');
              fbq('track', 'PageView');
            `,
          }}
        />

        {/* Meta Pixel Noscript */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=3090216584507410&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

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
