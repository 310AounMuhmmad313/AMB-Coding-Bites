import React, { createContext, useContext, useEffect, useState } from "react";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("burger_wishlist")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("burger_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const isInWishlist = (id) => wishlist.some((x) => x.id === id);

  const toggleWishlist = (item) => {
    setWishlist((old) => {
      const found = old.find((x) => x.id === item.id);
      if (found) return old.filter((x) => x.id !== item.id);
      return [...old, { id: item.id, image: item.image, title: item.title, price: item.price }];
    });
  };

  const removeFromWishlist = (id) =>
    setWishlist((old) => old.filter((x) => x.id !== id));

  const count = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{ wishlist, isInWishlist, toggleWishlist, removeFromWishlist, count }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
