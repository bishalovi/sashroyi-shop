"use client";

import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-[#0f2a44] via-[#1e3a5f] to-[#0f2a44]" />

      {/* Gold radial glow */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_40%,#f5d76e,transparent_60%)]" />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left side text */}
          <div className="max-w-2xl">
            <span className="mb-6 inline-block rounded-full bg-[#d4af37]/20 px-4 py-1.5 text-sm font-medium uppercase tracking-wider text-[#f5d76e]">
              Blessings in every moment
            </span>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl font-serif">
              Barakah <br />
              <span className="bg-linear-to-r from-[#d4af37] via-[#f5d76e] to-[#b8962e] bg-clip-text text-transparent">
                Islamic Clock & Canvas
              </span>
            </h1>

            <p className="mb-8 max-w-lg text-lg leading-relaxed text-white/80">
              Discover curated collections of premium Islamic wall clocks and
              canvas art. Crafted with elegance for those who value faith and
              beauty.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/category/wall-clock/natural"
                className="inline-flex items-center gap-2 rounded-lg bg-[#d4af37] px-7 py-3.5 font-semibold text-[#1a1a1a] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Shop Now <FaArrowRight />
              </Link>

              <Link
                href="/category/wall-canvas/natural"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-white/40 px-7 py-3.5 font-semibold text-white transition-all duration-300 hover:bg-white/10"
              >
                Explore Categories
              </Link>
            </div>
          </div>

          {/* Right side video */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[320px]">
              {/* Glow */}
              <div className="absolute inset-0 rounded-[28px] bg-[#d4af37]/20 blur-2xl" />

              {/* Video card */}
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-sm">
                <div className="aspect-9/16 overflow-hidden rounded-[22px]">
                  <iframe
                    className="h-full w-full"
                    src="https://www.youtube.com/embed/amRfomXo1_0?rel=0"
                    title="Barakah"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
