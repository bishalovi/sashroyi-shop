"use client";

import { useEffect } from "react";
import { pushToDataLayer } from "@/lib/gtm";

export default function ViewItemTracker({ product }) {
  useEffect(() => {
    if (!product?._id) return;

    pushToDataLayer({
      event: "view_item",
      ecommerce: {
        currency: "BDT",
        value: Number(product.price || 0),
        items: [
          {
            item_id: String(product._id || ""),
            item_name: product.name || "",
            price: Number(product.price || 0),
            quantity: 1,
          },
        ],
      },
    });
  }, [product?._id]);

  return null;
}
