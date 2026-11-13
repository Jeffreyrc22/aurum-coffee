import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { CartItem } from "../../types";
import { normalizeCart, setQuantity } from "./cart";
const Context = createContext<{
  items: CartItem[];
  add: (id: number, stock: number) => void;
  set: (id: number, n: number) => void;
  clear: () => void;
}>({ items: [], add: () => {}, set: () => {}, clear: () => {} });
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return normalizeCart(
        JSON.parse(localStorage.getItem("aurum-cart") || "[]"),
      );
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("aurum-cart", JSON.stringify(items));
    } catch {
      /* Cart still works in memory. */
    }
  }, [items]);
  return (
    <Context.Provider
      value={{
        items,
        add: (id, stock) =>
          setItems((old) =>
            setQuantity(
              old,
              id,
              Math.min(
                stock,
                (old.find((i) => i.productId === id)?.quantity || 0) + 1,
              ),
            ),
          ),
        set: (id, n) => setItems((old) => setQuantity(old, id, n)),
        clear: () => setItems([]),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useCart = () => useContext(Context);
