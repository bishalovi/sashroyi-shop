"use client";

import Link from "next/link";
import { FaCircleCheck } from "react-icons/fa6";
import { useEffect } from "react";
import { pushToDataLayer } from "@/lib/gtm";

export default function OrderSuccessPage() {
  useEffect(() => {
    const tracking = JSON.parse(
      localStorage.getItem("barakah_tracking") || "{}",
    );
    const savedOrder = localStorage.getItem("barakah_last_order");
    if (!savedOrder || savedOrder === "undefined") return;

    let order;
    try {
      order = JSON.parse(savedOrder);
    } catch (error) {
      return;
    }

    pushToDataLayer({
      event: "purchase",
      traffic_source: tracking.utm_source || "direct",
      traffic_medium: tracking.utm_medium || "",
      traffic_campaign: tracking.utm_campaign || "",
      fbclid: tracking.fbclid || "",
      ttclid: tracking.ttclid || "",
      gclid: tracking.gclid || "",
      customer_name: order.customerName,
      customer_phone: order.phone,
      customer_address: order.address,
      shipping_type: order.shippingType,
      payment_method: order.paymentMethod,
      ecommerce: {
        transaction_id: order._id || order.orderId || "BARAKAH_ORDER",
        value: Number(order.total || 0),
        currency: "BDT",
        items: (order.items || []).map((item) => ({
          item_id: item.productId || item._id || "",
          item_name: item.name || "",
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
        })),
      },
    });

    localStorage.removeItem("barakah_last_order");
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f6f1] py-16">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <FaCircleCheck className="text-4xl text-green-600" />
          </div>

          <h1 className="mt-6 text-4xl font-bold text-[#0f2a44]">
            আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-[#0f2a44]/70">
            আপনার অর্ডারের জন্য ধন্যবাদ। আমরা আপনার অর্ডারটি গ্রহণ করেছি এবং
            শীঘ্রই নিশ্চিত করার জন্য আপনার সাথে যোগাযোগ করব।
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/"
              className="rounded-2xl bg-[#0f2a44] px-3 py-4 text-center font-semibold text-white transition hover:bg-[#d4af37]"
            >
              হোম পেজে ফিরে যান
            </Link>

            <Link
              href="/category/wall-clock/islamic"
              className="rounded-2xl border border-[#0f2a44]/15 px-3 py-4 text-center font-semibold text-[#0f2a44] transition hover:bg-[#faf7f0]"
            >
              কেনাকাটা চালিয়ে যান
            </Link>
          </div>
        </div>
        <p className="text-xs text-black/80 text-center mt-16">
          Need Website? Contact with{" "}
          <a
            href="https://wa.me/88016229733026"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0b91eb] hover:underline animate-pulse font-semibold"
          >
            Rayhan
          </a>
        </p>
      </div>
    </main>
  );
}
