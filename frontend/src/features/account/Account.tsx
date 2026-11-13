import { Button } from "../../components/Button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { api, json, money } from "../../services/api";
import { useSession } from "../auth/Session";
import type { Order } from "../../types";
import { ErrorMessage, Loading } from "../../components/UI";
export function OrderList({ orders }: { orders: Order[] }) {
  return (
    <div className="orders-list">
      {!orders.length && (
        <p className="empty">
          No orders yet. Your next coffee is waiting in the shop.
        </p>
      )}
      {orders.map((o) => (
        <details className="order-card" key={o.id}>
          <summary>
            <div>
              <strong>{o.reference.slice(0, 16)}…</strong>
              <span>{new Date(o.createdAt).toLocaleDateString()}</span>
            </div>
            <span className="badge">{o.status}</span>
            <strong>{money(o.total)}</strong>
          </summary>
          <p className="demo-caption">Reference: {o.reference}</p>
          {o.items.map((i) => (
            <p className="order-line" key={i.productId}>
              <span>
                {i.name} × {i.quantity}
              </span>
              <strong>{money(i.price * i.quantity)}</strong>
            </p>
          ))}
          <p>
            {o.recipient} · {o.address} · {o.city}, {o.country}
          </p>
          <p className="demo-caption">
            Demonstration order — no payment or shipment.
          </p>
        </details>
      ))}
    </div>
  );
}
export function Account() {
  const { user } = useSession();
  const client = useQueryClient();
  const nav = useNavigate();
  const location = useLocation();
  const ordersOnly = location.pathname.endsWith("/orders");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const orders = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api<Order[]>("/orders/my"),
  });
  return (
    <section className="container section">
      <p className="eyebrow">YOUR AURUM</p>
      <div className="section-heading">
        <h1>Hello, {user?.firstName}.</h1>
        <Button
          type="submit"
          className="text-link"
          onClick={async () => {
            try {
              await api("/auth/logout", { method: "POST" });
              client.clear();
              nav("/login");
            } catch (e) {
              setError(e);
            }
          }}
        >
          Sign out →
        </Button>
      </div>
      <div className="account-tabs">
        <Link to="/account">Profile</Link>
        <Link to="/account/orders">Order history</Link>
        {user?.role === "ADMIN" && <Link to="/admin">Admin dashboard ↗</Link>}
      </div>
      <ErrorMessage error={error} />
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {ordersOnly ? (
        <>
          <h2>Your orders</h2>
          <ErrorMessage error={orders.error} />
          {orders.isPending ? (
            <Loading />
          ) : (
            <OrderList orders={orders.data || []} />
          )}
        </>
      ) : (
        <div className="account-grid">
          <form
            className="panel"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              const f = new FormData(e.currentTarget);
              try {
                await api(
                  "/users/me",
                  json("PUT", {
                    firstName: f.get("firstName"),
                    lastName: f.get("lastName"),
                  }),
                );
                await client.invalidateQueries({ queryKey: ["session"] });
                setMessage("Your profile has been updated.");
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            <h2>Your details</h2>
            <label>
              First name
              <input
                required
                maxLength={80}
                name="firstName"
                defaultValue={user?.firstName}
              />
            </label>
            <label>
              Last name
              <input
                required
                maxLength={80}
                name="lastName"
                defaultValue={user?.lastName}
              />
            </label>
            <label>
              Email
              <input readOnly value={user?.email} />
            </label>
            <Button type="submit" className="" loading={busy}>
              Save profile
            </Button>
          </form>
          <form
            className="panel"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              const f = new FormData(e.currentTarget);
              try {
                await api(
                  "/users/me/password",
                  json("PUT", Object.fromEntries(f)),
                );
                client.clear();
                nav("/login", { state: { from: "/account" } });
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            <h2>Change password</h2>
            <label>
              Current password
              <input
                required
                type="password"
                name="currentPassword"
                autoComplete="current-password"
              />
            </label>
            <label>
              New password
              <input
                required
                type="password"
                name="password"
                minLength={12}
                maxLength={64}
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirm new password
              <input
                required
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
              />
            </label>
            <p className="demo-caption">
              Changing your password signs you out of all sessions.
            </p>
            <Button type="submit" className="" loading={busy}>
              Update password
            </Button>
          </form>
        </div>
      )}
    </section>
  );
}
