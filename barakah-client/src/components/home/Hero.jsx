"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

export default function Hero() {
  const baseUrl = "https://sashroyi-api.onrender.com";
  const [heroConfig, setHeroConfig] = useState({
    badgeText: "Blessings in every moment",
    title: "Barakah - Islamic Clock & Canvas",
    subtitle:
      "Discover curated collections of premium Islamic wall clocks and canvas art. Crafted with elegance for those who value faith and beauty.",
    primaryBtnText: "Shop Now",
    primaryBtnLink: "/category/kitchen-dining",
    secondaryBtnText: "Explore Categories",
    secondaryBtnLink: "/category/home-living",
    videoUrl: "https://www.youtube.com/embed/amRfomXo1_0?rel=0",
  });

  useEffect(() => {
    if (!baseUrl) return;
    fetch(`${baseUrl}/api/settings/public`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data?.hero) {
          setHeroConfig((prev) => ({ ...prev, ...res.data.hero }));
        }
      })
      .catch((err) => console.error("Error loading hero config:", err));
  }, [baseUrl]);

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
              {heroConfig.badgeText}
            </span>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl font-serif">
              {heroConfig.title}
            </h1>

            <p className="mb-8 max-w-lg text-lg leading-relaxed text-white/80">
              {heroConfig.subtitle}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href={heroConfig.primaryBtnLink || "/search"}
                className="inline-flex items-center gap-2 rounded-lg bg-[#d4af37] px-7 py-3.5 font-semibold text-[#1a1a1a] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                {heroConfig.primaryBtnText || "Shop Now"} <FaArrowRight />
              </Link>

              <Link
                href={heroConfig.secondaryBtnLink || "/search"}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-white/40 px-7 py-3.5 font-semibold text-white transition-all duration-300 hover:bg-white/10"
              >
                {heroConfig.secondaryBtnText || "Explore Categories"}
              </Link>
            </div>
          </div>

          {/* Right side video */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[320px]">
              {/* Glow */}
              <div className="absolute inset-0 rounded-[28px] bg-[#d4af37]/20 blur-2xl" />

              {/* Video card */}
              <div className="relative rounded-[28px] border-2 border-[#d4af37]/40 bg-[#0b1d30]/80 p-3 shadow-2xl backdrop-blur-sm">
                <div className="relative aspect-9/16 w-full overflow-hidden rounded-[20px] bg-black">
                  <iframe
                    src={heroConfig.videoUrl || "https://www.youtube.com/embed/amRfomXo1_0?rel=0"}
                    title="Product Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full object-cover"
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
