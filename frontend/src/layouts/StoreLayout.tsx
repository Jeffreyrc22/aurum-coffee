import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Search,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "../components/Button";
import { useCart } from "../features/cart/CartProvider";
import { useSession } from "../features/auth/Session";
export function StoreLayout() {
  const cart = useCart();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    setSearch(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a href="#content" className="skip">
        Skip to content
      </a>
      <div className="announcement">
        A little ritual. An extraordinary cup.{" "}
        <span>EXPLORE YOUR DAILY RITUAL</span>
      </div>
      <header className="store-header">
        <Link className="brand" to="/">
          AURUM<span>COFFEE</span>
        </Link>
        <nav className={open ? "open" : ""}>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/our-story">Our Story</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          {user?.role === "ADMIN" && <NavLink to="/admin">Dashboard</NavLink>}
        </nav>
        <div className="header-actions">
          <Button
            variant="icon"
            aria-label="Search coffees"
            onClick={() => setSearch(!search)}
          >
            <Search size={19} />
          </Button>
          <Link
            className="nav-account button outline"
            aria-label={user ? "My account" : "Sign in"}
            to={user ? "/account" : "/login"}
          >
            <UserRound size={17} />
            <span>{user ? "My account" : "Sign in"}</span>
          </Link>
          {!user && (
            <Link className="nav-register button dark" to="/register">
              Create account
            </Link>
          )}
          <Link className="cart-link" aria-label="Shopping bag" to="/cart">
            <ShoppingBag size={19} />
            <span>{cart.items.reduce((n, i) => n + i.quantity, 0)}</span>
          </Link>
          <Button
            variant="icon"
            className="mobile-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
        {search && (
          <form
            className="search-bar"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q");
              navigate("/shop?q=" + encodeURIComponent(String(q)));
              setSearch(false);
            }}
          >
            <input
              autoFocus
              name="q"
              aria-label="Search by coffee name"
              placeholder="Find your next favorite coffee…"
            />
            <Button type="submit">
              Search <Search size={16} />
            </Button>
          </form>
        )}
      </header>
      <main id="content">
        <Outlet />
      </main>
      <footer>
        <div className="footer-grid">
          <div>
            <Link className="brand" to="/">
              AURUM<span>COFFEE</span>
            </Link>
            <p>
              Exceptional coffee.
              <br />
              Everyday moments, elevated.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/shop">Our coffees</Link>
            <Link to="/our-story">Our story</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div>
            <h4>Your AURUM</h4>
            <Link to="/account">My account</Link>
            <Link to="/account/orders">Order history</Link>
            <Link to="/cart">Shopping bag</Link>
          </div>
          <div className="footer-note">
            <h4>A considered coffee experience.</h4>
            <p>
              Explore distinctive coffees and find a new favorite for the
              moments that matter.
            </p>
            <Link to="/shop">
              Discover the collection <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AURUM Coffee</span>
          <span>USD · AURUM Coffee</span>
        </div>
      </footer>
    </>
  );
}
