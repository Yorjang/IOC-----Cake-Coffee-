
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  import { AuthProvider } from "./app/contexts/AuthContext";
  import { CartProvider } from "./app/contexts/CartContext";
  import { WishlistProvider } from "./app/contexts/WishlistContext";

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <App />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
  