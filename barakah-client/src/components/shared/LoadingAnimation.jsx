"use client";

import Lottie from "lottie-react";
import loadingAnimation from "@/../public/loadingAnimationLottie.json";

export default function LoadingAnimation({
  width = 300,
  height = 300,
  message = "Loading...",
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-84">
      <Lottie animationData={loadingAnimation} style={{ width, height }} />
      {message && (
        <p className="text-sm font-medium text-gray-800 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
} 
