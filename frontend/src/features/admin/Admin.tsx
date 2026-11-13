import { Button } from "../../components/Button";
import { NavLink, Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  LayoutDashboard,
  Package,
  Tags,
  Warehouse,
  ShoppingBag,
  Users,
  Settings,
  ArrowUpRight,
  Plus,
  Pencil,
} from "lucide-react";
import { api, json, money } from "../../services/api";
import type {
  Product,
  Category,
  Order,
  User,
  Stats,
  Movement,
} from "../../types";
import { ErrorMessage, Loading } from "../../components/UI";
import { OrderList } from "../account/Account";
import { useSession } from "../auth/Session";
const sections = [
  ["", "Dashboard", LayoutDashboard],
  ["products", "Products", Package],
  ["categories", "Categories", Tags],
  ["inventory", "Inventory", Warehouse],
  ["orders", "Orders", ShoppingBag],
  ["customers", "Customers", Users],
  ["settings", "Settings", Settings],
] as const;
const transitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};
export function Admin() {
  const { section = "", id } = useParams();
  const { user } = useSession();
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link className="brand" to="/">
          AURUM<span>STORE MANAGEMENT</span>
        </Link>
        <nav>
          {sections.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              end={path === ""}
              to={"/admin" + (path ? "/" + path : "")}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <Link className="back-store" to="/shop">
          View storefront <ArrowUpRight size={16} />
        </Link>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <span>Workspace / {section || "Overview"}</span>
          <span>{user?.firstName} · Administrator</span>
        </header>
        <main>
          {section === "products" && id ? (
            <ProductEditor id={id} />
          ) : section === "products" || section === "inventory" ? (
            <ProductManagement inventory={section === "inventory"} />
          ) : section === "categories" ? (
            <CategoryManagement />
          ) : section === "orders" ? (
            <OrderManagement />
          ) : section === "customers" ? (
            <Customers />
          ) : section === "settings" ? (
            <StoreSettings />
          ) : section === "" ? (
            <Dashboard />
          ) : (
            <h1>Page not found</h1>
          )}
        </main>
      </div>
    </div>
  );
}
function Dashboard() {
  const q = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api<Stats>("/admin/stats"),
  });
  if (q.isPending) return <Loading />;
  if (!q.data) return <ErrorMessage error={q.error} />;
  const s = q.data;
  const metrics = [
    ["Total products", s.totalProducts],
    ["Active products", s.activeProducts],
    ["Low stock", s.lowStock],
    ["Total orders", s.totalOrders],
    ["Pending orders", s.pendingOrders],
    ["Demo revenue", money(s.demoRevenue)],
  ];
  const dates = Object.entries(s.ordersByDate);
  return (
    <>
      <p className="eyebrow">STORE OVERVIEW</p>
      <div className="section-heading">
        <div>
          <h1>A fresh perspective.</h1>
          <p>Live figures from your AURUM database.</p>
        </div>
        <Link className="" to="/admin/products/new">
          <Plus size={16} /> Add product
        </Link>
      </div>
      <div className="kpi-grid">
        {metrics.map(([title, value]) => (
          <div className="kpi" key={title}>
            <span>{title}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="panel">
        <h2>Orders over time</h2>
        {dates.length < 2 ? (
          <p className="muted">
            A daily chart will appear once orders exist on at least two
            different dates.
          </p>
        ) : (
          <div className="chart">
            {dates.slice(-14).map(([date, n]) => (
              <div key={date}>
                <span>{date}</span>
                <div
                  style={{
                    width:
                      Math.max(
                        3,
                        (n / Math.max(...dates.map((d) => d[1]))) * 65,
                      ) + "%",
                  }}
                />
                <strong>{n}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="notice">
        Demo revenue is the value of non-cancelled demonstration orders. It does
        not represent collected payments.
      </p>
    </>
  );
}
function ProductManagement({ inventory }: { inventory: boolean }) {
  const q = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api<Product[]>("/admin/products"),
  });
  const m = useQuery({
    queryKey: ["inventory"],
    queryFn: () => api<Movement[]>("/admin/inventory"),
    enabled: inventory,
  });
  const client = useQueryClient();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState<number | null>(null);
  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">CATALOG OPERATIONS</p>
          <h1>{inventory ? "Inventory" : "Products"}</h1>
        </div>
        <Link className="" to="/admin/products/new">
          <Plus size={16} /> Add product
        </Link>
      </div>
      <ErrorMessage error={error || q.error} />
      {q.isPending ? (
        <Loading />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {q.data?.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <img src={p.mainImage} alt="" />
                      <div>
                        <strong>{p.name}</strong>
                        <small>
                          {p.weight}g · {p.roastLevel}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{p.category.name}</td>
                  <td>{money(p.price)}</td>
                  <td>
                    <span className={p.stock <= 10 ? "badge low" : "badge"}>
                      {p.stock}
                    </span>
                  </td>
                  <td>{p.active ? "Active" : "Inactive"}</td>
                  <td>
                    <div className="table-actions">
                      <Link to={"/admin/products/" + p.id}>
                        <Pencil size={14} /> Edit
                      </Link>
                      {p.active && <Link to={"/shop/" + p.slug}>View</Link>}
                      {p.active && (
                        <Button
                          type="submit"
                          disabled={busy === p.id}
                          onClick={async () => {
                            setBusy(p.id);
                            try {
                              await api("/admin/products/" + p.id, {
                                method: "DELETE",
                              });
                              await client.invalidateQueries();
                            } catch (e) {
                              setError(e);
                            } finally {
                              setBusy(null);
                            }
                          }}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {inventory && (
        <div className="panel">
          <h2>Recent inventory movements</h2>
          <ErrorMessage error={m.error} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Change</th>
                  <th>Reason</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {m.data?.map((v) => (
                  <tr key={v.id}>
                    <td>
                      {q.data?.find((p) => p.id === v.productId)?.name ||
                        v.productId}
                    </td>
                    <td>
                      {v.delta > 0 ? "+" : ""}
                      {v.delta}
                    </td>
                    <td>{v.reason.replaceAll("_", " ")}</td>
                    <td>{new Date(v.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
function ProductEditor({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api<Product[]>("/admin/products"),
    enabled: id !== "new",
  });
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });
  if (id !== "new" && q.isPending) return <Loading />;
  const p = q.data?.find((p) => p.id === Number(id));
  if (id !== "new" && !p)
    return <ErrorMessage error={q.error || "Product not found."} />;
  return <ProductForm key={id} product={p} categories={cats.data || []} />;
}
function ProductForm({
  product: p,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const nav = useNavigate();
  const client = useQueryClient();
  const [image, setImage] = useState(
    p?.mainImage || "/images/coffee-cream.svg",
  );
  const [gallery, setGallery] = useState(p?.galleryImages || []);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<unknown>();
  async function upload(file: File | undefined, galleryImage = false) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const f = new FormData();
      f.set("file", file);
      const result = await api<{ url: string }>("/admin/images", {
        method: "POST",
        body: f,
      });
      galleryImage
        ? setGallery((v) => [...v, result.url])
        : setImage(result.url);
    } catch (e) {
      setError(e);
    } finally {
      setUploading(false);
    }
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api(
        "/admin/products" + (p ? "/" + p.id : ""),
        json(p ? "PUT" : "POST", {
          ...f,
          price: Number(f.price),
          categoryId: Number(f.categoryId),
          weight: Number(f.weight),
          stock: Number(f.stock),
          active: f.active === "on",
          featured: f.featured === "on",
          mainImage: image,
          galleryImages: gallery,
          version: p?.version || 0,
        }),
      );
      await client.invalidateQueries();
      nav("/admin/products");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="text-link" to="/admin/products">
        ← Products
      </Link>
      <h1>{p ? "Edit coffee" : "A new addition."}</h1>
      <form className="product-editor" onSubmit={save}>
        <div className="panel">
          <h2>Product details</h2>
          <div className="form-grid">
            <label>
              Name
              <input
                required
                name="name"
                maxLength={120}
                defaultValue={p?.name}
              />
            </label>
            <label>
              Slug
              <input
                required
                name="slug"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                defaultValue={p?.slug}
                placeholder="new-coffee"
              />
            </label>
          </div>
          <label>
            Tasting notes / short description
            <input
              required
              name="shortDescription"
              maxLength={240}
              defaultValue={p?.shortDescription}
            />
          </label>
          <label>
            Full description
            <textarea
              required
              name="description"
              rows={5}
              maxLength={10000}
              defaultValue={p?.description}
            />
          </label>
          <div className="form-grid">
            <label>
              Category
              <select
                name="categoryId"
                required
                defaultValue={p?.category.id || ""}
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Origin
              <input
                required
                name="origin"
                maxLength={100}
                defaultValue={p?.origin}
              />
            </label>
            <label>
              Roast
              <select
                name="roastLevel"
                defaultValue={p?.roastLevel || "Medium"}
              >
                {["Light", "Medium", "Medium-dark", "Dark"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              Weight (g)
              <input
                required
                type="number"
                name="weight"
                min={1}
                max={10000}
                defaultValue={p?.weight || 250}
              />
            </label>
            <label>
              Price (USD)
              <input
                required
                type="number"
                name="price"
                min="0.01"
                max="999999.99"
                step="0.01"
                defaultValue={p?.price}
              />
            </label>
            <label>
              Stock
              <input
                required
                type="number"
                name="stock"
                min="0"
                max="100000"
                defaultValue={p?.stock || 0}
              />
            </label>
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              name="active"
              defaultChecked={p?.active ?? true}
            />{" "}
            Active in storefront
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={p?.featured ?? false}
            />{" "}
            Featured collection
          </label>
        </div>
        <div className="panel image-editor">
          <h2>Product imagery</h2>
          <img src={image} alt="Product preview" />
          <label>
            Main image (JPEG / PNG, max 5 MB)
            <input
              type="file"
              accept="image/png,image/jpeg"
              disabled={uploading}
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
          <label>
            Or choose a demo illustration
            <select
              value={image.startsWith("/images/") ? image : ""}
              onChange={(e) => e.target.value && setImage(e.target.value)}
            >
              <option value="">Uploaded image</option>
              {["cream", "green", "rose", "brown"].map((c) => (
                <option key={c} value={"/images/coffee-" + c + ".svg"}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <h3>Gallery ({gallery.length}/8)</h3>
          <div className="gallery">
            {gallery.map((src, i) => (
              <Button
                type="button"
                key={i}
                title="Remove image"
                onClick={() => setGallery(gallery.filter((_, n) => n !== i))}
              >
                <img src={src} alt={"Gallery " + (i + 1)} />
                Remove
              </Button>
            ))}
          </div>
          <input
            aria-label="Upload gallery image"
            type="file"
            accept="image/jpeg,image/png"
            disabled={uploading || gallery.length >= 8}
            onChange={(e) => upload(e.target.files?.[0], true)}
          />
          <ErrorMessage error={error} />
          <Button type="submit" className=" full" disabled={busy || uploading}>
            {uploading ? "Uploading…" : busy ? "Saving…" : "Save product"}
          </Button>
          <p className="demo-caption">
            Active products become available in the live API immediately after
            saving.
          </p>
        </div>
      </form>
    </>
  );
}
function CategoryManagement() {
  const q = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });
  const client = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  return (
    <>
      <h1>Categories</h1>
      <ErrorMessage error={error || q.error} />
      <div className="account-grid">
        <div className="panel">
          <h2>Collections</h2>
          {q.data?.map((c) => (
            <div className="category-row" key={c.id}>
              <div>
                <strong>{c.name}</strong>
                <small>{c.slug}</small>
              </div>
              <Button type="submit" onClick={() => setEditing(c)}>
                Edit
              </Button>
              <Button
                type="submit"
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api("/admin/categories/" + c.id, {
                      method: "DELETE",
                    });
                    await client.invalidateQueries({
                      queryKey: ["categories"],
                    });
                  } catch (e) {
                    setError(e);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
        <form
          key={editing?.id || "new"}
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            setBusy(true);
            setError(null);
            try {
              await api(
                "/admin/categories" + (editing ? "/" + editing.id : ""),
                json(
                  editing ? "PUT" : "POST",
                  Object.fromEntries(new FormData(form)),
                ),
              );
              await client.invalidateQueries();
              setEditing(null);
              form.reset();
            } catch (e) {
              setError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>{editing ? "Edit category" : "New category"}</h2>
          <label>
            Name
            <input
              required
              name="name"
              maxLength={80}
              defaultValue={editing?.name}
            />
          </label>
          <label>
            Slug
            <input
              required
              name="slug"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={100}
              defaultValue={editing?.slug}
            />
          </label>
          <Button type="submit" className="" loading={busy}>
            Save category
          </Button>
          {editing && (
            <Button type="button" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          )}
        </form>
      </div>
    </>
  );
}
function OrderManagement() {
  const q = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => api<Order[]>("/admin/orders"),
  });
  const client = useQueryClient();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  return (
    <>
      <h1>Demo orders</h1>
      <p>Validated transitions keep stock and order history consistent.</p>
      <ErrorMessage error={error || q.error} />
      {q.isPending ? (
        <Loading />
      ) : (
        q.data?.map((o) => (
          <div className="admin-order" key={o.id}>
            <OrderList orders={[o]} />
            {transitions[o.status]?.length > 0 && (
              <label>
                Change status
                <select
                  value=""
                  disabled={busy}
                  onChange={async (e) => {
                    if (!e.target.value) return;
                    setBusy(true);
                    setError(null);
                    try {
                      await api(
                        "/admin/orders/" + o.id + "/status",
                        json("PATCH", { status: e.target.value }),
                      );
                      await client.invalidateQueries();
                    } catch (e) {
                      setError(e);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <option value="">Select next status</option>
                  {transitions[o.status].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        ))
      )}
      {q.data?.length === 0 && (
        <p className="empty">No orders have been placed yet.</p>
      )}
    </>
  );
}
function Customers() {
  const q = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => api<User[]>("/admin/customers"),
  });
  return (
    <>
      <h1>Customers</h1>
      <ErrorMessage error={q.error} />
      {q.isPending ? (
        <Loading />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {q.data?.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.firstName} {c.lastName}
                  </td>
                  <td>{c.email}</td>
                  <td>{c.role}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
function StoreSettings() {
  const q = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<Record<string, string | number>>("/admin/settings"),
  });
  return (
    <>
      <h1>Store configuration</h1>
      <p>
        Read-only runtime settings. Security and database credentials are
        configured on the server.
      </p>
      <ErrorMessage error={q.error} />
      <div className="panel">
        {q.data &&
          Object.entries(q.data).map(([k, v]) => (
            <p className="order-line" key={k}>
              <strong>{k}</strong>
              <span>{v}</span>
            </p>
          ))}
        <a
          href="/swagger-ui/index.html"
          target="_blank"
          rel="noreferrer"
          className="text-link"
        >
          API documentation ↗
        </a>
      </div>
    </>
  );
}
