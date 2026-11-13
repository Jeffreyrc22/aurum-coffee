import { describe, it, expect } from "vitest";
import { normalizeCart, setQuantity } from "./cart";
describe("persistent cart boundary", () => {
  it("rejects malformed and duplicate stored values", () =>
    expect(
      normalizeCart([
        { productId: 1, quantity: 2 },
        { productId: 1, quantity: 4 },
        { productId: 2, quantity: -1 },
        { productId: "3", quantity: 1 },
        null,
      ]),
    ).toEqual([{ productId: 1, quantity: 2 }]));
  it("removes zero quantities and retains other items", () =>
    expect(
      setQuantity(
        [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
        1,
        0,
      ),
    ).toEqual([{ productId: 2, quantity: 1 }]));
  it("caps quantities without trusting localStorage", () =>
    expect(setQuantity([], 1, 1000)).toEqual([{ productId: 1, quantity: 99 }]));
  it("keeps the payload free of untrusted prices", () =>
    expect(normalizeCart([{ productId: 1, quantity: 2, price: 0.01 }])).toEqual(
      [{ productId: 1, quantity: 2 }],
    ));
  it("recovers from invalid storage shapes", () =>
    expect(normalizeCart({ items: [] })).toEqual([]));
});
