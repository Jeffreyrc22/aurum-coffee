import { useEffect, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { Button } from "./Button";
import { useCart } from "../features/cart/CartProvider";
import type { Product } from "../types";
export function AddToCartButton({
  product,
  full = false,
}: {
  product: Product;
  full?: boolean;
}) {
  const cart = useCart();
  const [added, setAdded] = useState(false);
  const quantity =
    cart.items.find((item) => item.productId === product.id)?.quantity || 0;
  const unavailable = product.stock < 1;
  const atLimit = quantity >= Math.min(product.stock, 99);
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(timer);
  }, [added]);
  return (
    <Button
      size={full ? "md" : "sm"}
      className={`${full ? "full " : ""}${added ? "is-added" : ""}`}
      disabled={unavailable || atLimit}
      aria-label={
        unavailable
          ? `${product.name} is sold out`
          : atLimit
            ? `All available ${product.name} is in your bag`
            : `Add ${product.name} to cart`
      }
      onClick={() => {
        cart.add(product.id, product.stock);
        setAdded(true);
      }}
    >
      {added ? (
        <Check size={17} className="cart-confirmation" />
      ) : (
        <ShoppingBag size={17} />
      )}
      <span aria-live="polite">
        {unavailable
          ? "Sold out"
          : added
            ? "Added to bag"
            : atLimit
              ? "In your bag"
              : "Add to bag"}
      </span>
    </Button>
  );
}
