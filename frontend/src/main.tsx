import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { SessionProvider } from "./features/auth/Session";
import { CartProvider } from "./features/cart/CartProvider";
import { StoreLayout } from "./layouts/StoreLayout";
import { Home } from "./pages/Home";
import { Catalog, ProductDetail, Story, Contact } from "./pages/Catalog";
import { AuthPage, Protected } from "./features/auth/AuthPages";
import { CartPage, Checkout } from "./features/checkout/Checkout";
import { Account } from "./features/account/Account";
const Admin = React.lazy(() =>
  import("./features/admin/Admin").then((m) => ({ default: m.Admin })),
);
import "./styles/main.css";
const query = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={query}>
      <BrowserRouter>
        <MotionConfig reducedMotion="user">
          <SessionProvider>
            <CartProvider>
              <React.Suspense fallback={<p className="loading">Loading…</p>}>
                <Routes>
                  <Route element={<StoreLayout />}>
                    <Route index element={<Home />} />
                    <Route path="shop" element={<Catalog />} />
                    <Route path="shop/:slug" element={<ProductDetail />} />
                    <Route path="our-story" element={<Story />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="login" element={<AuthPage />} />
                    <Route path="register" element={<AuthPage register />} />
                    <Route path="cart" element={<CartPage />} />
                    <Route
                      path="checkout"
                      element={
                        <Protected>
                          <Checkout />
                        </Protected>
                      }
                    />
                    <Route
                      path="account"
                      element={
                        <Protected>
                          <Account />
                        </Protected>
                      }
                    />
                    <Route
                      path="account/orders"
                      element={
                        <Protected>
                          <Account />
                        </Protected>
                      }
                    />
                    <Route
                      path="*"
                      element={
                        <div className="container section">
                          <h1>Page not found.</h1>
                          <Link to="/">Return home</Link>
                        </div>
                      }
                    />
                  </Route>
                  <Route
                    path="admin"
                    element={
                      <Protected admin>
                        <Admin />
                      </Protected>
                    }
                  />
                  <Route
                    path="admin/:section"
                    element={
                      <Protected admin>
                        <Admin />
                      </Protected>
                    }
                  />
                  <Route
                    path="admin/:section/:id"
                    element={
                      <Protected admin>
                        <Admin />
                      </Protected>
                    }
                  />
                </Routes>
              </React.Suspense>
            </CartProvider>
          </SessionProvider>
        </MotionConfig>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
