"use client";

import { useEffect } from "react";
import { pushToDataLayer } from "@/lib/gtm";
import { trackMetaEvent } from "@/lib/metaTracking";

export default function CategoryViewTracker({ categoryName, categorySlug, subcategorySlug, products = [] }) {
  useEffect(() => {
    if (!categorySlug) return;

    const title = categoryName || categorySlug;
    const productIds = products.slice(0, 10).map((p) => String(p._id || p.id));
    const items = products.slice(0, 10).map((p, index) => ({
      item_id: String(p._id || p.id),
      item_name: p.name || "",
      item_category: categorySlug,
      price: Number(p.price || 0),
      index: index + 1,
    }));

    // 1. Google Tag Manager (view_item_list)
    pushToDataLayer({
      event: "view_item_list",
      ecommerce: {
        item_list_name: title,
        item_list_id: categorySlug,
        items,
      },
    });

    // 2. Meta Pixel & CAPI (ViewContent for Category)
    trackMetaEvent("ViewContent", {
      content_name: title,
      content_category: categorySlug,
      content_type: "product_group",
      content_ids: productIds,
      contents: products.slice(0, 5).map((p) => ({
        id: String(p._id || p.id),
        quantity: 1,
        item_price: Number(p.price || 0),
      })),
      num_items: products.length,
      currency: "BDT",
    });

    // 3. Custom / Standard ViewCategory Event
    trackMetaEvent("ViewCategory", {
      category_name: title,
      category_slug: categorySlug,
      subcategory_slug: subcategorySlug || "all",
      total_products: products.length,
    });
  }, [categorySlug, subcategorySlug]);

  return null;
}
