import type { CartItem } from "../../types";
export function normalizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  return value
    .filter(
      (x): x is CartItem =>
        !!x &&
        Number.isSafeInteger(x.productId) &&
        x.productId > 0 &&
        Number.isInteger(x.quantity) &&
        x.quantity > 0 &&
        x.quantity <= 99 &&
        !seen.has(x.productId) &&
        !!seen.add(x.productId),
    )
    .slice(0, 50)
    .map((x) => ({ productId: x.productId, quantity: x.quantity }));
}
export function setQuantity(
  items: CartItem[],
  productId: number,
  quantity: number,
): CartItem[] {
  const rest = items.filter((i) => i.productId !== productId);
  return quantity <= 0
    ? rest
    : normalizeCart([...rest, { productId, quantity: Math.min(99, quantity) }]);
}
