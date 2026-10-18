import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import App from "./App.jsx";
import { CartProvider } from "./CartContext.jsx";
import { WishlistProvider } from "./WishlistContext.jsx";

createRoot(document.getElementById("root")).render(
  <CartProvider>
    <WishlistProvider>
      <App />
    </WishlistProvider>
  </CartProvider>
);
