"use client";

import dynamic from "next/dynamic";

const LazyToast = dynamic(() => import("@/components/shared/ToastClient"), {
  ssr: false,
});

const LazyWhatsApp = dynamic(
  () => import("@/components/shared/WhatsAppFloatButton"),
  { ssr: false }
);

export function DeferredToast() {
  return <LazyToast />;
}

export function DeferredWhatsApp() {
  return <LazyWhatsApp />;
}
