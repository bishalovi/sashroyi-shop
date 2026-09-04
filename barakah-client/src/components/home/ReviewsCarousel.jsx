"use client";

import Image from "next/image";
import { FaStar } from "react-icons/fa";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

// Import styles
import "swiper/css";
import "swiper/css/pagination";

export default function ReviewsCarousel({ reviews }) {
  return (
    <Swiper
      modules={[Pagination]}
      spaceBetween={24}
      slidesPerView={1}
      loop={true}
      pagination={{
        type: "fraction",
        clickable: true,
      }}
      breakpoints={{
        640: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 4 },
      }}
      className="px-2 md:px-12"
    >
      {reviews.map((review) => (
        <SwiperSlide key={review._id}>
          <div className="mx-auto rounded-2xl bg-white  p-6 shadow-md transition hover:shadow-xl">
            <div className="flex justify-center pb-2">
              <Image
                src={review.image}
                alt={review.name}
                width={300}
                height={200}
                className="w-full rounded-xl border-2 border-[#d4af37] object-cover"
              />
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
