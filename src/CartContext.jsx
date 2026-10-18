import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("burger_cart")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("burger_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart((old) => {
      const found = old.find((x) => x.id === item.id);
      if (found) {
        return old.map((x) =>
          x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x,
        );
      }
      return [...old, { ...item, quantity: 1 }];
    });
  };

  const increase = (id) =>
    setCart((old) =>
      old.map((x) => (x.id === id ? { ...x, quantity: x.quantity + 1 } : x)),
    );

  const decrease = (id) =>
    setCart((old) =>
      old
        .map((x) => (x.id === id ? { ...x, quantity: x.quantity - 1 } : x))
        .filter((x) => x.quantity > 0),
    );

  const remove = (id) => setCart((old) => old.filter((x) => x.id !== id));
  const clearCart = () => setCart([]);

  const count = cart.reduce((sum, x) => sum + x.quantity, 0);
  const total = cart.reduce((sum, x) => sum + Number(x.price) * x.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increase,
        decrease,
        remove,
        clearCart,
        count,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
