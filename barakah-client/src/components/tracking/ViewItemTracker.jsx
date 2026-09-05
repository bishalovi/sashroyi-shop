"use client";

import { useEffect } from "react";
import { pushToDataLayer } from "@/lib/gtm";
import { trackMetaEvent } from "@/lib/metaTracking";

export default function ViewItemTracker({ product }) {
  useEffect(() => {
    if (!product?._id) return;

    const isVariable = product.productType === "variable" && Array.isArray(product.variations) && product.variations.length > 0;
    const defaultVar = isVariable ? (product.variations.find((v) => v.isDefault) || product.variations[0]) : null;

    const initialPrice = defaultVar ? Number(defaultVar.price || 0) : Number(product.price || 0);
    const initialName = defaultVar ? `${product.name} (${defaultVar.name})` : (product.name || "");
    const initialItemId = defaultVar ? `${product._id}_${defaultVar.id}` : String(product._id || "");

    pushToDataLayer({
      event: "view_item",
      ecommerce: {
        currency: "BDT",
        value: initialPrice,
        items: [
          {
            item_id: initialItemId,
            item_name: initialName,
            item_variant: defaultVar?.name || "Default",
            price: initialPrice,
            quantity: 1,
          },
        ],
      },
    });

    trackMetaEvent("ViewContent", {
      content_name: initialName,
      content_category: product.category || "General",
      content_ids: [initialItemId],
      content_type: "product",
      value: initialPrice,
      currency: "BDT",
    });
  }, [product?._id]);

  return null;
}
