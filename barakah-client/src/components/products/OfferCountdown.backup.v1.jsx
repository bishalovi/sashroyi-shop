"use client";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { offers } from "@/config/offers";

export default function OfferCountdown({ product, category, subcategory }) {
  const router = useRouter();
  const { addToCart, clearCart } = useCart();
  const [timeLeft, setTimeLeft] = useState({
    h: 12,
    m: 59,
    s: 59,
  });

  let offerKey = "default";

  // Category page
  if (category === "others" && subcategory === "islamic") {
    offerKey = "islamic";
  }

  if (
    (category === "others" && subcategory === "others") ||
    (category === "others" && subcategory === "special2")
  ) {
    offerKey = "others";
  }

  // Product details page
  if (product?.category === "others" && product?.subcategory === "islamic") {
    offerKey = "islamic";
  }

  // Product details page
  if (product?.category === "others" && product?.subcategory === "others") {
    offerKey = "others";
  }

  const offer = offers[offerKey];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { h, m, s } = prev;

        if (s > 0) {
          s--;
        } else if (m > 0) {
          m--;
          s = 59;
        } else if (h > 0) {
          h--;
          m = 59;
          s = 59;
        }

        return { h, m, s };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeBlocks = [
    { v: timeLeft.h, l: "HRS" },
    { v: timeLeft.m, l: "MIN" },
    { v: timeLeft.s, l: "SEC" },
  ];

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();

    clearCart();
    addToCart({ ...product, quantity: 1 });
    router.push("/checkout");
  };

  return (
    <section className="bg-linear-to-br from-[#0f2a44] via-[#1e3a5f] to-[#0f2a44]">
      {/* Sleek countdown banner */}
      <div className="text-white pt-8 pb-6 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          {/* Left Side */}
          <div className="flex items-center gap-3 md:justify-self-start justify-center">
            <span className="text-4xl">⏳</span>

            <div>
              <p className="text-xl uppercase tracking-widest opacity-70">
                Limited Offer
              </p>

              <p className="text-xl font-semibold text-[#d4af37]">
                অফার শেষ হতে বাকি
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2 font-mono">
            {timeBlocks.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="relative px-4 py-2 rounded-md bg-white/10 backdrop-blur border border-white/20 min-w-16 text-center">
                  <div className="text-4xl font-bold leading-none text-[#d4af37]">
                    {String(t.v).padStart(2, "0")}
                  </div>

                  <div className="text-[10px] tracking-widest opacity-60 mt-1">
                    {t.l}
                  </div>
                </div>

                {i < 2 && (
                  <span className="text-xl font-bold text-[#d4af37]">:</span>
                )}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="md:justify-self-end justify-center flex">
            {product ? (
              <button
                onClick={handleBuyNow}
                className="px-5 py-2 rounded-full text-lg font-bold text-[#0f2a44] hover:scale-105 transition bg-[#d4af37]"
              >
                অর্ডার করুন →
              </button>
            ) : (
              <button className="px-5 py-2 rounded-full text-lg font-bold text-[#0f2a44] hover:scale-105 transition bg-[#d4af37]">
                অর্ডার করুন →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Offer Bar */}
      <div className=" text-white text-center text-xl font-semibold pb-8">
        <span className="text-2xl text-[#d4af37]">{offer.title}</span> <br></br>
        {offer.text}
      </div>
    </section>
  );
}
