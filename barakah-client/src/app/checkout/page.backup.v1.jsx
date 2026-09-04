/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import Container from "@/components/shared/Container";
import SectionTitle from "@/components/shared/SectionTitle";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { pushToDataLayer } from "@/lib/gtm";
import LoadingAnimation from "@/components/shared/LoadingAnimation";
import { FaFacebookMessenger, FaPhoneAlt, FaWhatsapp } from "react-icons/fa";
import { RxCross1 } from "react-icons/rx";

export default function CheckoutPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const { cartItems, totalPrice, clearCart } = useCart();
  const [shipping, setShipping] = useState("inside");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const getCheckoutSessionId = () => {
    let sessionId = localStorage.getItem("checkoutSessionId");

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("checkoutSessionId", sessionId);
    }

    return sessionId;
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      notes: "",
      accountLast4: "",
    },
  });

  const formValues = watch();

  const shippingCost = shipping === "inside" ? 0 : 0;

  const finalTotal = useMemo(
    () => totalPrice + shippingCost,
    [totalPrice, shippingCost],
  );

  const saveAbandonedOrder = async (data) => {
    try {
      const sessionId = getCheckoutSessionId();

      const roundedSubtotal = Number(totalPrice.toFixed(2));
      const roundedShippingCost = Number(shippingCost.toFixed(2));
      const roundedTotal = Number(finalTotal.toFixed(2));

      await fetch(`${baseUrl}/api/orders/abandoned`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,

          customerName: data.name,
          phone: data.phone,
          address: data.address,

          notes: data.notes,

          shippingType: shipping,
          shippingCost: roundedShippingCost,

          items: cartItems.map((item) => ({
            productId: item._id,
            name: item.name,
            price: Number(item.price.toFixed(2)),
            quantity: item.quantity,
            image: item.image,
          })),

          subtotal: roundedSubtotal,
          total: roundedTotal,
        }),
      });
    } catch (error) {
      console.log("Abandoned order save failed:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        formValues.name &&
        formValues.phone &&
        formValues.address &&
        cartItems.length > 0
      ) {
        saveAbandonedOrder(formValues);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [formValues.name, formValues.phone, formValues.address, cartItems]);

  useEffect(() => {
    if (cartItems.length === 0) return;

    const alreadyTracked = sessionStorage.getItem("barakah_begin_checkout");
    if (alreadyTracked) return;

    //pushing to data layer for GTM
    pushToDataLayer({
      event: "begin_checkout",
      ecommerce: {
        currency: "BDT",
        value: Number(finalTotal.toFixed(2)),
        items: cartItems.map((item) => ({
          item_id: item._id || item.productId || "",
          item_name: item.name || "",
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
        })),
      },
    });

    sessionStorage.setItem("barakah_begin_checkout", "true");
  }, []);

  const onSubmit = async (data) => {
    if (cartItems.length === 0) {
      toast.warning("Your cart is empty!", {
        position: "top-right",
      });
      return;
    }

    if (
      (paymentMethod === "bkash" || paymentMethod === "nagad") &&
      !data.accountLast4
    ) {
      toast.warning("আপনার নাম্বারের শেষ ৪ সংখ্যা লিখুন", {
        position: "top-right",
      });
      return;
    }

    const roundedSubtotal = Number(totalPrice.toFixed(2));
    const roundedShippingCost = Number(shippingCost.toFixed(2));
    const roundedTotal = Number(finalTotal.toFixed(2));

    const tracking = JSON.parse(
      localStorage.getItem("barakah_tracking") || "{}",
    );

    const orderData = {
      sessionId: getCheckoutSessionId(),
      customerName: data.name,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      shippingType: shipping,
      shippingCost: roundedShippingCost,
      paymentMethod,
      accountLast4:
        paymentMethod === "bkash" || paymentMethod === "nagad"
          ? data.accountLast4
          : "",
      items: cartItems.map((item) => ({
        productId: item._id,
        name: item.name,
        price: Number(item.price.toFixed(2)),
        quantity: item.quantity,
        image: item.image,
        productCode: item.productCode || "Not Found",
      })),
      subtotal: roundedSubtotal,
      total: roundedTotal,
      source: {
        traffic_source: tracking.utm_source || "direct",
        traffic_medium: tracking.utm_medium || "",
        traffic_campaign: tracking.utm_campaign || "",
      },
    };

    try {
      setLoading(true);

      const res = await fetch(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to place order");
      }

      const orderForTracking = result.data || orderData;
      localStorage.setItem(
        "barakah_last_order",
        JSON.stringify(orderForTracking),
      );

      clearCart();
      reset();

      router.push("/order-success");
    } catch (error) {
      alert(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#f8f6f1] py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h1 className="text-3xl font-bold text-[#0f2a44]">
              আপনার কার্ট খালি
            </h1>
            <p className="mt-3 text-[#0f2a44]/70">
              চেকআউটে যাওয়ার আগে কিছু পণ্য যোগ করুন
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-[#0f2a44] px-6 py-3 text-white transition hover:bg-[#d4af37]"
            >
              কেনাকাটা চালিয়ে যান
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f1] py-12">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-white p-8">
            <LoadingAnimation
              width={300}
              height={300}
              message="Order placing, please wait..."
            />
          </div>
        </div>
      )}
      <Container>
        <div>
          <SectionTitle title="Checkout" />

          <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
            {/* Left */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <h2 className="mb-6 text-2xl font-bold text-[#0f2a44]">
                ডেলিভারি তথ্য
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#0f2a44]">
                    পূর্ণ নাম *
                  </label>
                  <input
                    type="text"
                    maxLength={32}
                    {...register("name", {
                      required: "পূর্ণ নাম আবশ্যক",
                      minLength: {
                        value: 2,
                        message: "নাম কমপক্ষে ২ অক্ষরের হতে হবে",
                      },
                      maxLength: {
                        value: 32,
                        message: "নাম ৩২ অক্ষরের বেশি হতে পারবে না",
                      },
                    })}
                    className="w-full rounded-xl border border-[#0f2a44]/15 px-4 py-3 outline-none focus:border-[#d4af37]"
                    placeholder="আপনার পূর্ণ নাম লিখুন"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#0f2a44]">
                    ফোন নাম্বার *
                  </label>
                  <input
                    type="tel"
                    {...register("phone", {
                      required: "ফোন নাম্বার আবশ্যক",
                      pattern: {
                        value: /^(?:\+8801|01)[3-9]\d{8}$/,
                        message: "সঠিক বাংলাদেশি ফোন নাম্বার দিন",
                      },
                    })}
                    className="w-full rounded-xl border border-[#0f2a44]/15 px-4 py-3 outline-none focus:border-[#d4af37]"
                    placeholder="আপনার ফোন নাম্বার লিখুন"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#0f2a44]">
                    পূর্ণ ঠিকানা *
                  </label>
                  <textarea
                    rows={4}
                    {...register("address", {
                      required: "ঠিকানা আবশ্যক",
                      minLength: {
                        value: 10,
                        message: "ঠিকানা কমপক্ষে 10 অক্ষর হতে হবে",
                      },
                    })}
                    className="w-full rounded-xl border border-[#0f2a44]/15 px-4 py-3 outline-none focus:border-[#d4af37]"
                    placeholder="বাড়ি নং, রাস্তা, এলাকা, থানা..."
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#0f2a44]">
                    অর্ডার নোট (ঐচ্ছিক)
                  </label>
                  <textarea
                    rows={3}
                    {...register("notes")}
                    className="w-full rounded-xl border border-[#0f2a44]/15 px-4 py-3 outline-none focus:border-[#d4af37]"
                    placeholder="ডেলিভারির জন্য বিশেষ নির্দেশনা (যদি থাকে)"
                  />
                </div>
              </div>

              <div className="mt-8">
                <h3 className="mb-4 text-xl font-semibold text-[#0f2a44]">
                  পেমেন্ট পদ্ধতি
                </h3>

                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#0f2a44]/10 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bkash"
                        checked={paymentMethod === "bkash"}
                        onChange={() => setPaymentMethod("bkash")}
                      />
                      <span className="text-[#0f2a44]">
                        বিকাশ (01601014782)
                      </span>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#0f2a44]/10 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="nagad"
                        checked={paymentMethod === "nagad"}
                        onChange={() => setPaymentMethod("nagad")}
                      />
                      <span className="text-[#0f2a44]">নগদ (01601014782)</span>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#0f2a44]/10 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                      />
                      <span className="text-[#0f2a44]">ক্যাশ অন ডেলিভারি</span>
                    </div>
                  </label>
                </div>

                {(paymentMethod === "bkash" || paymentMethod === "nagad") && (
                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-[#0f2a44]">
                      আপনার নাম্বারের শেষ ৪ সংখ্যা *
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      {...register("accountLast4", {
                        required:
                          paymentMethod === "bkash" || paymentMethod === "nagad"
                            ? "শেষ ৪ সংখ্যা আবশ্যক"
                            : false,
                        pattern: {
                          value: /^\d{4}$/,
                          message: "শুধু ৪ সংখ্যার শেষ ডিজিট দিন",
                        },
                      })}
                      className="w-full rounded-xl border border-[#0f2a44]/15 px-4 py-3 outline-none focus:border-[#d4af37]"
                      placeholder="যেমন: ১২৩৪"
                    />
                    {errors.accountLast4 && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.accountLast4.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h3 className="mb-4 text-xl font-semibold text-[#0f2a44]">
                  ডেলিভারি পদ্ধতি
                </h3>

                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#0f2a44]/10 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        value="inside"
                        checked={shipping === "inside"}
                        onChange={() => setShipping("inside")}
                      />
                      <span className="text-[#0f2a44]">ঢাকার ভিতরে</span>
                    </div>
                    <span className="font-medium text-green-600">৳ 0.00</span>
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#0f2a44]/10 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        value="outside"
                        checked={shipping === "outside"}
                        onChange={() => setShipping("outside")}
                      />
                      <span className="text-[#0f2a44]">ঢাকার বাইরে</span>
                    </div>
                    <span className="font-medium text-green-600">৳ 0.00</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-[#0f2a44] px-6 py-4 text-lg font-semibold text-[#f2c94c] transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? "অর্ডার করা হচ্ছে..." : "অর্ডার করুন"}
              </button>
            </form>

            {/* Right */}
            <div className="h-fit rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold text-[#0f2a44]">
                অর্ডার সারসংক্ষেপ
              </h2>

              <div className="flex items-center justify-between">
                <span className="text-[#0f2a44]/70">পেমেন্ট</span>
                <span>
                  {paymentMethod === "bkash"
                    ? "বিকাশ"
                    : paymentMethod === "nagad"
                      ? "নগদ"
                      : "ক্যাশ অন ডেলিভারি"}
                </span>
              </div>

              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div
                    key={item._id || item.productId || index}
                    className="flex items-center justify-between gap-4 border-b border-[#0f2a44]/10 pb-4"
                  >
                    <div>
                      <p className="font-medium text-[#0f2a44]">
                        {item.name}
                      </p>
                      <p className="text-sm text-[#0f2a44]/60">
                        পরিমাণ: {item.quantity}
                      </p>
                    </div>

                    <p className="font-medium text-[#0f2a44]">
                      ৳ {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 text-[#0f2a44]">
                <div className="flex items-center justify-between">
                  <span className="text-[#0f2a44]/70">মোট মূল্য</span>
                  <span>৳ {totalPrice.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#0f2a44]/70">ডেলিভারি</span>
                  <span className="text-green-600">
                    ৳ {shippingCost.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-[#0f2a44]/10 pt-4">
                  <div className="flex items-center justify-between text-xl font-bold">
                    <span>সর্বমোট</span>
                    <span>৳ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Link
                href="/cart"
                className="mt-4 block text-center text-[#0f2a44] transition hover:text-[#d4af37]"
              >
                কার্টে ফিরে যান
              </Link>
            </div>
          </div>
        </div>

        <div className="fixed bottom-5 right-5 z-9999 flex flex-col gap-3 items-end">
          {open && (
            <>
              {/* Messenger */}
              <a
                href="https://web.facebook.com/messages/t/1056581560872471"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg btn-circle bg-white shadow-lg hover:scale-105 transition"
              >
                <FaFacebookMessenger className="text-3xl text-[#0084FF]" />
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/8801346496814"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg btn-circle bg-white shadow-lg hover:scale-105 transition"
              >
                <FaWhatsapp className="text-3xl text-[#25D366]" />
              </a>

              {/* Phone */}
              <a
                href="tel:+8801346496814"
                className="btn btn-lg btn-circle bg-white shadow-lg hover:scale-105 transition"
              >
                <FaPhoneAlt className="text-2xl text-[#34B7F1]" />
              </a>
            </>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="btn btn-lg btn-circle bg-[#d4af37] text-white shadow-lg transition hover:opacity-90"
          >
            {open ? (
              <RxCross1 className="text-xl" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            )}
          </button>
        </div>
        <h1 className="text-sm md:text-lg font-bold text-[#0f2a44] text-center mt-12">
          অর্ডার করতে কোনো সমস্যা হলে নিচের বাটনে ক্লিক করুন।
        </h1>
        <a
          href="tel:+8801346496814"
          className="w-40 md:w-48 mt-4 flex items-center gap-2 mx-auto rounded-xl bg-[#0f2a44] px-6 py-3 text-xs md:text-lg font-semibold text-[#f2c94c] transition hover:opacity-95"
        >
          <FaPhoneAlt />
          এখনই কল করুন
        </a>
      </Container>
    </main>
  );
}
