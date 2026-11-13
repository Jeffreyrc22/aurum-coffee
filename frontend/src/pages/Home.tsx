import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Coffee,
  Leaf,
  Heart,
  Sun,
} from "lucide-react";
import { api } from "../services/api";
import type { Catalog, Category } from "../types";
import { ProductCard, Reveal, ErrorMessage, Loading } from "../components/UI";
export function Home() {
  const products = useQuery({
    queryKey: ["featured"],
    queryFn: () => api<Catalog>("/products?featured=true&size=4"),
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });
  return (
    <>
      <section className="hero">
        <img
          className="hero-photo"
          src="/images/coffee-hero.jpg"
          alt="Freshly roasted coffee beans"
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <Reveal className="hero-content">
          <p className="eyebrow light">AURUM COFFEE · THE DAILY RITUAL</p>
          <h1>
            Good mornings
            <br />
            begin with
            <br />
            <em>exceptional coffee.</em>
          </h1>
          <p>
            Carefully selected beans. Rich, distinctive aromas.
            <br />A moment worth slowing down for.
          </p>
          <div className="hero-links">
            <Link className="button gold" to="/shop">
              Shop the collection <ArrowUpRight size={18} />
            </Link>
            <Link className="hero-story" to="/our-story">
              Our story <ArrowRight size={17} />
            </Link>
          </div>
        </Reveal>
        <div className="hero-caption">
          <span>THE ART OF EXCEPTIONAL COFFEE</span>
          <span>01 — A MORE CONSIDERED CUP</span>
        </div>
      </section>
      <div className="values-strip">
        <span>
          <Leaf />
          Inspired by origin
        </span>
        <span>
          <Coffee />
          Crafted around flavor
        </span>
        <span>
          <Sun />
          Made for your daily ritual
        </span>
      </div>
      <section className="section container">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">MEET YOUR NEXT FAVORITE</p>
            <h2>The AURUM selection.</h2>
          </div>
          <Link className="text-link" to="/shop">
            Explore all coffees <ArrowRight size={16} />
          </Link>
        </Reveal>
        <ErrorMessage error={products.error} />
        {products.isPending ? (
          <Loading />
        ) : (
          <div className="product-grid">
            {products.data?.items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
      <section className="category-section container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR KIND OF COFFEE</p>
            <h2>A world of character.</h2>
          </div>
        </div>
        <ErrorMessage error={categories.error} />
        <div className="category-grid">
          {categories.data?.map((c, i) => (
            <Link
              className={"category-card category-" + i}
              key={c.id}
              to={"/shop?category=" + c.id}
            >
              <span>0{i + 1}</span>
              <Coffee size={48} strokeWidth={1} />
              <div>
                <h3>{c.name}</h3>
                <ArrowUpRight />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="story-section container">
        <img
          src="/images/coffee-story.jpg"
          alt="A carefully prepared cup of coffee"
          loading="lazy"
        />
        <Reveal>
          <p className="eyebrow">MORE THAN WHAT’S IN YOUR CUP</p>
          <h2>
            A small ritual.
            <br />
            <em>A richer everyday.</em>
          </h2>
          <p>
            AURUM begins with a simple idea: a good cup of coffee deserves your
            attention. The aroma, the first sip, the quiet moment before the day
            begins.
          </p>
          <p>
            Our collection explores the character of coffee through origins,
            roasting styles and tasting notes. An invitation to discover what
            you love.
          </p>
          <Link className="text-link" to="/our-story">
            Discover our story <ArrowRight size={17} />
          </Link>
        </Reveal>
      </section>
      <section className="why-section container">
        <p className="eyebrow">THE AURUM APPROACH</p>
        <h2>Every detail, considered.</h2>
        <div className="why-grid">
          {[
            {
              Icon: Leaf,
              title: "Origin at the heart",
              text: "Explore the regions and stories that inspire each coffee.",
            },
            {
              Icon: Coffee,
              title: "Flavor worth exploring",
              text: "Find your profile, from bright and floral to rich and chocolatey.",
            },
            {
              Icon: Heart,
              title: "A ritual of your own",
              text: "The right cup is the one that makes your everyday feel special.",
            },
          ].map(({ Icon, title, text }) => (
            <div key={title}>
              <Icon size={30} strokeWidth={1} />
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="newsletter">
        <p className="eyebrow">LET GOOD THINGS BREW</p>
        <h2>A little AURUM in your inbox.</h2>
        <p>New coffees and stories from the world of specialty coffee.</p>
        <div className="newsletter-pending">
          Newsletter coming soon · sign-ups are not available yet.
        </div>
      </section>
    </>
  );
}
