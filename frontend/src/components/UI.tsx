import type { ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { money } from "../services/api";
import { AddToCartButton } from "./AddToCartButton";

export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
export function ErrorMessage({ error }: { error: unknown }) {
  return error ? (
    <p className="notice error" role="alert">
      {error instanceof Error ? error.message : String(error)}
    </p>
  ) : null;
}
export function Loading() {
  return (
    <p className="loading" role="status">
      Brewing something good…
    </p>
  );
}
export function ProductCard({ p }: { p: Product }) {
  return (
    <article className="product-card">
      <Link to={"/shop/" + p.slug} className="product-image">
        <img
          src={p.mainImage}
          alt={p.name + " coffee packaging illustration"}
          loading="lazy"
        />
        {p.featured && <span className="product-badge">AURUM SELECTION</span>}
        <span className="product-arrow">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="product-origin">
        {p.origin} <span>{p.weight}g</span>
      </div>
      <Link to={"/shop/" + p.slug}>
        <h3>{p.name}</h3>
      </Link>
      <p>{p.shortDescription}</p>
      <div className="product-foot">
        <strong>{money(p.price)}</strong>
        <AddToCartButton product={p} />
      </div>
    </article>
  );
}
