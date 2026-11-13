import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api, money } from "../services/api";
import type { Catalog as CatalogData, Category, Product } from "../types";
import { ErrorMessage, Loading, ProductCard } from "../components/UI";
import { AddToCartButton } from "../components/AddToCartButton";
import { useState } from "react";
export function Catalog() {
  const [params, setParams] = useSearchParams();
  const query = useQuery({
    queryKey: ["catalog", params.toString()],
    queryFn: () => api<CatalogData>("/products?" + params),
  });
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });
  const meta = useQuery({
    queryKey: ["catalog-meta"],
    queryFn: () => api<{ origins: string[] }>("/catalog-meta"),
  });
  function filter(key: string, value: string) {
    const p = new URLSearchParams(params);
    p.delete("page");
    value ? p.set(key, value) : p.delete(key);
    setParams(p);
  }
  return (
    <section className="container section shop-page">
      <p className="eyebrow">THE COLLECTION</p>
      <h1>Find your everyday extraordinary.</h1>
      <p className="intro">
        Distinct origins. Thoughtful roasts. A coffee for every kind of morning.
      </p>
      <div className="shop-filters">
        <label>
          Search
          <input
            type="search"
            value={params.get("q") || ""}
            onChange={(e) => filter("q", e.target.value)}
            placeholder="Search coffees"
          />
        </label>
        <label>
          Category
          <select
            value={params.get("category") || ""}
            onChange={(e) => filter("category", e.target.value)}
          >
            <option value="">All collections</option>
            {cats.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Origin
          <select
            value={params.get("origin") || ""}
            onChange={(e) => filter("origin", e.target.value)}
          >
            <option value="">All origins</option>
            {meta.data?.origins.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label>
          Min $
          <input
            type="number"
            min="0"
            value={params.get("minPrice") || ""}
            onChange={(e) => filter("minPrice", e.target.value)}
          />
        </label>
        <label>
          Max $
          <input
            type="number"
            min="0"
            value={params.get("maxPrice") || ""}
            onChange={(e) => filter("maxPrice", e.target.value)}
          />
        </label>
        <label>
          Sort
          <select
            value={params.get("sort") || "name"}
            onChange={(e) => filter("sort", e.target.value)}
          >
            <option value="name">Name</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>
      <ErrorMessage error={query.error} />
      {query.isPending ? (
        <Loading />
      ) : (
        <>
          <div className="results-line">
            <span>{query.data?.total || 0} coffees</span>
            <button className="text-link" onClick={() => setParams({})}>
              Clear filters
            </button>
          </div>
          <div className="product-grid catalog-grid">
            {query.data?.items.map((p) => (
              <ProductCard p={p} key={p.id} />
            ))}
          </div>
          {!query.data?.items.length && (
            <p className="empty">No coffees match these filters.</p>
          )}
          <div className="pagination">
            {Array.from({ length: query.data?.pages || 0 }, (_, i) => (
              <button
                className={
                  i === Number(params.get("page") || 0) ? "selected" : ""
                }
                key={i}
                onClick={() => {
                  const p = new URLSearchParams(params);
                  p.set("page", String(i));
                  setParams(p);
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
export function ProductDetail() {
  const { slug } = useParams();
  const q = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api<Product>("/products/slug/" + slug),
  });
  const p = q.data;
  const [image, setImage] = useState<string | null>(null);
  const related = useQuery({
    queryKey: ["related", p?.category.id],
    queryFn: () =>
      api<CatalogData>("/products?category=" + p?.category.id + "&size=4"),
    enabled: !!p,
  });
  if (q.isPending) return <Loading />;
  if (!p)
    return (
      <div className="container section">
        <ErrorMessage error={q.error} />
      </div>
    );
  return (
    <div className="container section">
      <Link className="text-link" to="/shop">
        ← Back to collection
      </Link>
      <div className="product-detail">
        <div>
          <img
            className="detail-photo"
            src={image || p.mainImage}
            alt={p.name}
          />
          {p.galleryImages.length > 0 && (
            <div className="gallery">
              {[p.mainImage, ...p.galleryImages].map((src) => (
                <button key={src} onClick={() => setImage(src)}>
                  <img src={src} alt={"View " + p.name} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="eyebrow">
            {p.category.name} · {p.origin}
          </p>
          <h1>{p.name}</h1>
          <p className="tasting-notes">{p.shortDescription}</p>
          <p className="detail-price">
            {money(p.price)} <small>USD · {p.weight}g</small>
          </p>
          <p>
            {p.description
              .replace(/^Demo product\. A fictional /, "A ")
              .replace(" Created for this portfolio store.", "")}
          </p>
          <dl className="coffee-specs">
            <div>
              <dt>Roast</dt>
              <dd>{p.roastLevel}</dd>
            </div>
            <div>
              <dt>Origin</dt>
              <dd>{p.origin}</dd>
            </div>
            <div>
              <dt>Availability</dt>
              <dd>{p.stock > 0 ? p.stock + " in stock" : "Sold out"}</dd>
            </div>
          </dl>
          <AddToCartButton product={p} full />
          <Link className="text-link" to="/cart">
            View shopping bag →
          </Link>
        </div>
      </div>
      <h2>You might also enjoy.</h2>
      <div className="product-grid">
        {related.data?.items
          .filter((r) => r.id !== p.id)
          .slice(0, 3)
          .map((r) => (
            <ProductCard key={r.id} p={r} />
          ))}
      </div>
    </div>
  );
}
export function Story() {
  return (
    <section className="container section story-page">
      <p className="eyebrow">OUR STORY</p>
      <h1>
        For the moments
        <br />
        <em>that matter.</em>
      </h1>
      <img
        src="/images/coffee-story.jpg"
        alt="Coffee served as an everyday ritual"
      />
      <div>
        <h2>The art of slowing down.</h2>
        <p>
          AURUM is a specialty coffee experience built around curiosity,
          considered design and the pleasure of a daily ritual. Its collection
          takes inspiration from Colombian coffee regions and familiar tasting
          profiles.
        </p>
        <p>
          From bright, delicate notes to deep chocolate tones, discover a
          profile that feels like yours. Take a moment, explore the collection,
          and make your morning ritual a little richer.
        </p>
        <Link to="/shop" className="button dark">
          Explore the collection
        </Link>
      </div>
    </section>
  );
}
export function Contact() {
  return (
    <section className="container section narrow">
      <p className="eyebrow">CONTACT</p>
      <h1>Let’s talk coffee.</h1>
      <p>Our customer support channel is coming soon.</p>
      <div className="notice">
        No messages are collected or sent from this page. You can manage your
        account and view your recorded orders directly.
      </div>
      <Link className="button dark" to="/account">
        Your account
      </Link>
      <Link className="text-link" to="/shop">
        Back to the shop →
      </Link>
    </section>
  );
}
