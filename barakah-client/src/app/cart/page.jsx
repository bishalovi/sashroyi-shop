"use client";

import Link from "next/link";
import Image from "next/image";
import { FaTrashAlt } from "react-icons/fa";
import { useCart } from "@/contexts/CartContext";
import Container from "@/components/shared/Container";
import SectionTitle from "@/components/shared/SectionTitle";
import { useEffect, useState } from "react";
import { pushToDataLayer } from "@/lib/gtm";

export default function CartPage() {
  const [shipping, setShipping] = useState("inside");
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    totalPrice,
  } = useCart();

  useEffect(() => {
    if (cartItems.length === 0) return;

    const cartSignature = JSON.stringify(
      cartItems.map((item) => ({
        id: item._id || item.productId,
        q: item.quantity,
      })),
    );

    const lastTracked = sessionStorage.getItem("barakah_view_cart_signature");
    if (lastTracked === cartSignature) return;

    pushToDataLayer({
      event: "view_cart",
      ecommerce: {
        currency: "BDT",
        value: Number(totalPrice || 0),
        items: cartItems.map((item) => ({
          item_id: item._id || item.productId || "",
          item_name: item.name || "",
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
        })),
      },
    });

    sessionStorage.setItem("barakah_view_cart_signature", cartSignature);
  }, [cartItems, totalPrice]);

  return (
    <main className="min-h-screen bg-[#f8f6f1] py-12">
      <Container>
        <div className="">
          <SectionTitle title="Your Shopping Cart" />

          {cartItems.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-[#0f2a44]">
                Your cart is empty
              </h2>
              <p className="mt-3 text-[#0f2a44]/70">
                Add some beautiful products to your cart.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-xl bg-[#0f2a44] px-6 py-3 text-white transition hover:bg-[#d4af37]"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.8fr_0.9fr]">
              {/* Left side */}
              <div className="space-y-5">
                {cartItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-[#f8f6f1]">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-[#0f2a44]">
                          {item.name}
                        </h2>
                        <p className="text-md text-[#0f2a44]/65 capitalize">
                          {item.category?.replace("-", " ")}
                        </p>
                        <p className="mt-2 text-xl font-bold text-[#0f2a44]">
                          ৳ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-[#0f2a44]/65 transition hover:text-red-500"
                        aria-label="Remove item"
                      >
                        <FaTrashAlt size={18} />
                      </button>

                      <div className="flex items-center rounded-full border border-[#0f2a44]/15 bg-[#f8f6f1] px-2 py-1">
                        <button
                          onClick={() => decreaseQuantity(item._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#0f2a44] transition hover:bg-white"
                        >
                          -
                        </button>

                        <span className="min-w-8 text-center text-lg font-medium text-[#0f2a44]">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => increaseQuantity(item._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#0f2a44] transition hover:bg-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right side */}
              <div className="h-fit rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl md:text-2xl font-bold text-[#0f2a44]">
                  অর্ডার সারসংক্ষেপ
                </h2>

                <div className="space-y-4 ">
                  <div className="flex items-center justify-between text-[#0f2a44]/75">
                    <span>মোট মূল্য</span>
                    <span>৳ {totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="my-6 border-t border-[#0f2a44]/10" />

                <div className="mb-6 flex items-center justify-between text-xl font-bold text-[#0f2a44]">
                  <span>সর্বমোট</span>
                  <span>৳ {totalPrice.toFixed(2)}</span>
                </div>

                <p className="text-green-600 text-center pb-2">সারা বাংলাদেশে ডেলিভারি চার্জ সম্পুর্ণ ফ্রি!</p>

                <Link
                  href="/checkout"
                  className="block w-full rounded-2xl bg-[#0f2a44] px-6 py-4 text-center font-semibold text-[#f2c94c] transition hover:opacity-95"
                >
                  অর্ডার করতে এগিয়ে যান
                </Link>

                <Link
                  href="/"
                  className="mt-5 block text-center text-[#0f2a44] transition hover:text-[#d4af37]"
                >
                  কেনাকাটা চালিয়ে যান
                </Link>
              </div>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
