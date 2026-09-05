"use client";

import { pushToDataLayer } from "@/lib/gtm";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === "undefined") return [];

    const storedCart = localStorage.getItem("barakah-cart");
    return storedCart ? JSON.parse(storedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("barakah-cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const getItemKey = (item) => {
    return `${item._id || item.id}_${item.selectedVariationId || "single"}`;
  };

  const addToCart = (product) => {
    const selectedQuantity = product.quantity || 1;
    const cartKey = getItemKey(product);
    const itemName = product.variationTitle
      ? `${product.name} (${product.variationTitle})`
      : product.name || "";

    toast.success("Product added to cart!", {
      position: "top-right",
    });

    pushToDataLayer({
      event: "add_to_cart",
      ecommerce: {
        currency: "BDT",
        value: Number(product.price || 0) * Number(selectedQuantity),
        items: [
          {
            item_id: product.selectedVariationId
              ? `${product._id || product.id}_${product.selectedVariationId}`
              : String(product._id || product.id || ""),
            item_name: itemName,
            item_variant: product.variationTitle || "Default",
            price: Number(product.price || 0),
            quantity: Number(selectedQuantity),
          },
        ],
      },
    });

    setCartItems((prev) => {
      const existingItem = prev.find((item) => getItemKey(item) === cartKey);

      if (existingItem) {
        return prev.map((item) =>
          getItemKey(item) === cartKey
            ? { ...item, quantity: item.quantity + selectedQuantity }
            : item,
        );
      }

      return [
        ...prev,
        {
          ...product,
          cartKey,
          quantity: selectedQuantity,
        },
      ];
    });
  };

  const removeFromCart = (keyOrId) => {
    toast.success("Product removed from cart!", {
      position: "top-right",
    });
    setCartItems((prev) =>
      prev.filter((item) => getItemKey(item) !== keyOrId && item._id !== keyOrId && item.cartKey !== keyOrId),
    );
  };

  const increaseQuantity = (keyOrId) => {
    setCartItems((prev) =>
      prev.map((item) =>
        getItemKey(item) === keyOrId || item._id === keyOrId || item.cartKey === keyOrId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  };

  const decreaseQuantity = (keyOrId) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          getItemKey(item) === keyOrId || item._id === keyOrId || item.cartKey === keyOrId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItems = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
