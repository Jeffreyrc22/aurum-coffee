import { Button } from "../../components/Button";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Minus, Plus, Trash2, Check } from "lucide-react";
import { useCart } from "../cart/CartProvider";
import { useSession } from "../auth/Session";
import { api, json, money } from "../../services/api";
import type { Product, Order } from "../../types";
import { ErrorMessage, Loading } from "../../components/UI";
function useCartProducts() {
  const cart = useCart();
  const qs = useQueries({
    queries: cart.items.map((i) => ({
      queryKey: ["cart-product", i.productId],
      queryFn: () => api<Product>("/products/" + i.productId),
      retry: false,
      staleTime: 0,
    })),
  });
  return {
    cart,
    qs,
    loading: qs.some((q) => q.isPending),
    total: qs.reduce(
      (sum, q, i) => sum + (q.data?.price || 0) * cart.items[i].quantity,
      0,
    ),
    invalid: qs.some(
      (q, i) =>
        q.isError || (!!q.data && q.data.stock < cart.items[i].quantity),
    ),
  };
}
export function CartPage() {
  const { cart, qs, loading, total, invalid } = useCartProducts();
  return (
    <section className="container section">
      <p className="eyebrow">YOUR DAILY RITUAL, READY TO GO</p>
      <h1>Your shopping bag.</h1>
      {!cart.items.length ? (
        <div className="empty">
          <p>Your bag is waiting for something good.</p>
          <Link className="" to="/shop">
            Explore our coffees
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {cart.items.map((item, i) => {
              const p = qs[i].data;
              return (
                <div className="cart-row" key={item.productId}>
                  {p && <img src={p.mainImage} alt={p.name} />}
                  <div>
                    <h3>{p?.name || "Unavailable product"}</h3>
                    <p>
                      {p
                        ? `${p.weight}g · ${p.roastLevel}`
                        : "Remove this item to continue."}
                    </p>
                    {p && p.stock < item.quantity && (
                      <p className="field-error">Only {p.stock} available.</p>
                    )}
                    <div className="quantity">
                      <Button
                        type="submit"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          cart.set(item.productId, item.quantity - 1)
                        }
                      >
                        <Minus size={14} />
                      </Button>
                      <span>{item.quantity}</span>
                      <Button
                        type="submit"
                        aria-label="Increase quantity"
                        disabled={
                          !p || item.quantity >= p.stock || item.quantity >= 99
                        }
                        onClick={() =>
                          cart.set(item.productId, item.quantity + 1)
                        }
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                  <strong>{p ? money(p.price * item.quantity) : "—"}</strong>
                  <Button
                    type="submit"
                    variant="destructive"
                    aria-label="Remove product"
                    onClick={() => cart.set(item.productId, 0)}
                  >
                    <Trash2 size={17} />
                  </Button>
                </div>
              );
            })}
            <Button type="submit" className="text-link" onClick={cart.clear}>
              Clear bag
            </Button>
          </div>
          <aside className="summary">
            <h2>Order summary</h2>
            <p>
              <span>Subtotal</span>
              <strong>{money(total)}</strong>
            </p>
            <p>
              <span>Demo shipping</span>
              <span>$0.00</span>
            </p>
            <div className="summary-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            {loading ? (
              <Loading />
            ) : invalid ? (
              <p className="notice error">
                Update unavailable items before checkout.
              </p>
            ) : (
              <Link className=" full" to="/checkout">
                Continue to checkout →
              </Link>
            )}
            <p className="demo-caption">
              Demo checkout. No card details, charges or real shipments.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
const shippingSchema = z.object({
  recipient: z.string().trim().min(2, "Enter a recipient.").max(160),
  address: z.string().trim().min(4, "Enter an address.").max(300),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(2).max(30),
  country: z.string().trim().min(2).max(100),
});
type Shipping = z.infer<typeof shippingSchema>;
export function Checkout() {
  const { cart, qs, loading, total, invalid } = useCartProducts();
  const { user } = useSession();
  const client = useQueryClient();
  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState<Shipping | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [key] = useState(() => crypto.randomUUID());
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Shipping>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      recipient: user?.firstName + " " + user?.lastName,
      country: "Colombia",
    },
  });
  if (order)
    return (
      <section className="container section narrow confirmation">
        <div className="check-circle">
          <Check />
        </div>
        <p className="eyebrow">ORDER RECORDED</p>
        <h1>A good thing is brewing.</h1>
        <p>
          Your demonstration order has been saved. No payment was taken and
          nothing will be shipped.
        </p>
        <div className="notice">
          <strong>{order.reference}</strong>
          <p>
            {money(order.total)} · {order.status}
          </p>
        </div>
        <Link className="" to="/account/orders">
          View order history
        </Link>
      </section>
    );
  if (!cart.items.length)
    return (
      <section className="container section">
        <h1>Your bag is empty.</h1>
        <Link to="/shop">Explore the collection</Link>
      </section>
    );
  return (
    <section className="container section">
      <p className="eyebrow">DEMONSTRATION CHECKOUT</p>
      <h1>A few details. Then coffee.</h1>
      <div className="checkout-steps">
        <span className={step === 1 ? "current" : ""}>01 Customer</span>
        <span className={step === 2 ? "current" : ""}>02 Shipping</span>
        <span className={step === 3 ? "current" : ""}>03 Review</span>
      </div>
      <div className="cart-layout">
        <div className="checkout-content">
          {step === 1 ? (
            <>
              <h2>Customer information</h2>
              <p>
                {user?.firstName} {user?.lastName}
                <br />
                {user?.email}
              </p>
              <Link className="text-link" to="/account">
                Edit your profile
              </Link>
              <p className="notice">
                Use fictional delivery information. This checkout does not
                collect payments or arrange deliveries.
              </p>
              <Button type="submit" className="" onClick={() => setStep(2)}>
                Continue to shipping
              </Button>
            </>
          ) : step === 2 ? (
            <form
              onSubmit={handleSubmit((v) => {
                setShipping(v);
                setStep(3);
              })}
            >
              <h2>Shipping details</h2>
              {(
                [
                  "recipient",
                  "address",
                  "city",
                  "postalCode",
                  "country",
                ] as const
              ).map((k) => (
                <label key={k}>
                  {
                    {
                      recipient: "Recipient",
                      address: "Street address",
                      city: "City",
                      postalCode: "Postal code",
                      country: "Country",
                    }[k]
                  }
                  <input {...register(k)} />
                  <span className="field-error">{errors[k]?.message}</span>
                </label>
              ))}
              <Button
                type="button"
                className="text-link"
                onClick={() => setStep(1)}
              >
                ← Back
              </Button>
              <Button type="submit" className="">
                Review order
              </Button>
            </form>
          ) : (
            <>
              <h2>Review your demo order</h2>
              <p>
                {shipping?.recipient}
                <br />
                {shipping?.address}
                <br />
                {shipping?.city}, {shipping?.postalCode}
                <br />
                {shipping?.country}
              </p>
              {qs.map((q, i) => (
                <p key={i}>
                  {q.data?.name} × {cart.items[i].quantity}
                </p>
              ))}
              <p className="notice">
                The server rechecks stock and current prices at confirmation. No
                payment information is requested.
              </p>
              <ErrorMessage error={error} />
              <Button
                type="submit"
                className="text-link"
                loading={busy}
                onClick={() => setStep(2)}
              >
                ← Edit shipping
              </Button>
              <Button
                type="submit"
                className=""
                loading={busy}
                disabled={invalid || loading}
                onClick={async () => {
                  setError(null);
                  setBusy(true);
                  try {
                    const result = await api<Order>(
                      "/orders",
                      json("POST", {
                        ...shipping,
                        idempotencyKey: key,
                        items: cart.items,
                      }),
                    );
                    setOrder(result);
                    cart.clear();
                    await client.invalidateQueries();
                  } catch (e) {
                    setError(e);
                    await client.invalidateQueries({
                      queryKey: ["cart-product"],
                    });
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Recording order…" : "Confirm demo order"}
              </Button>
            </>
          )}
        </div>
        <aside className="summary">
          <h2>Your selection</h2>
          {qs.map((q, i) => (
            <p key={i}>
              <span>
                {q.data?.name || "Loading…"} × {cart.items[i].quantity}
              </span>
              <strong>
                {money((q.data?.price || 0) * cart.items[i].quantity)}
              </strong>
            </p>
          ))}
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          {invalid && (
            <p className="notice error">
              Your bag contains unavailable items.{" "}
              <Link to="/cart">Update bag</Link>
            </p>
          )}
          <p className="demo-caption">
            USD · Demonstration prices · Free demo shipping
          </p>
        </aside>
      </div>
    </section>
  );
}
