export const pushToDataLayer = (data) => {
  if (typeof window !== "undefined") {
    // 1. DataLayer for GTM
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);

    // 2. Direct Meta Pixel Bridge (if fbq is loaded)
    if (typeof window.fbq === "function" && data.event) {
      if (data.event === "view_item") {
        window.fbq("track", "ViewContent", {
          content_name: data.ecommerce?.items?.[0]?.item_name || "",
          content_ids: [data.ecommerce?.items?.[0]?.item_id || ""],
          content_type: "product",
          value: Number(data.ecommerce?.value || 0),
          currency: data.ecommerce?.currency || "BDT",
        });
      } else if (data.event === "add_to_cart") {
        window.fbq("track", "AddToCart", {
          content_name: data.ecommerce?.items?.[0]?.item_name || "",
          content_ids: [data.ecommerce?.items?.[0]?.item_id || ""],
          content_type: "product",
          value: Number(data.ecommerce?.value || 0),
          currency: data.ecommerce?.currency || "BDT",
        });
      } else if (data.event === "begin_checkout") {
        window.fbq("track", "InitiateCheckout", {
          value: Number(data.ecommerce?.value || 0),
          currency: data.ecommerce?.currency || "BDT",
          num_items: data.ecommerce?.items?.length || 1,
        });
      } else if (data.event === "purchase") {
        window.fbq("track", "Purchase", {
          value: Number(data.ecommerce?.value || 0),
          currency: data.ecommerce?.currency || "BDT",
          content_type: "product",
          contents: (data.ecommerce?.items || []).map((item) => ({
            id: item.item_id,
            quantity: item.quantity,
            item_price: item.price,
          })),
        });
      }
    }

    // 3. Direct TikTok Pixel Bridge (if ttq is loaded)
    if (typeof window.ttq?.track === "function" && data.event) {
      if (data.event === "view_item") {
        window.ttq.track("ViewContent", {
          content_name: data.ecommerce?.items?.[0]?.item_name || "",
          content_id: data.ecommerce?.items?.[0]?.item_id || "",
          content_type: "product",
          value: Number(data.ecommerce?.value || 0),
          currency: "BDT",
        });
      } else if (data.event === "add_to_cart") {
        window.ttq.track("AddToCart", {
          content_name: data.ecommerce?.items?.[0]?.item_name || "",
          content_id: data.ecommerce?.items?.[0]?.item_id || "",
          content_type: "product",
          value: Number(data.ecommerce?.value || 0),
          currency: "BDT",
        });
      } else if (data.event === "begin_checkout") {
        window.ttq.track("InitiateCheckout", {
          value: Number(data.ecommerce?.value || 0),
          currency: "BDT",
        });
      } else if (data.event === "purchase") {
        window.ttq.track("CompletePayment", {
          value: Number(data.ecommerce?.value || 0),
          currency: "BDT",
          contents: (data.ecommerce?.items || []).map((item) => ({
            content_id: item.item_id,
            content_name: item.item_name,
            quantity: item.quantity,
            price: item.price,
          })),
        });
      }
    }
  }
};