"use client";

import dynamic from "next/dynamic";

const ReviewsCarousel = dynamic(() => import("./ReviewsCarousel"), {
  ssr: false,
  loading: () => <div className="min-h-[260px]" />,
});

export default function ReviewsCarouselLazy({ reviews }) {
  return <ReviewsCarousel reviews={reviews} />;
}
