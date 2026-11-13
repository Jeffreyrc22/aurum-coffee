# AURUM Coffee

A full-stack specialty coffee storefront with a React customer experience, Spring Boot REST API and PostgreSQL persistence. Checkout records demonstration orders only: no payment, email or shipment is performed.

## Features
- Searchable, paginated catalog with origin, category and price filters; product imagery and related coffees.
- Registration, HttpOnly sessions, profiles, password changes and isolated order history.
- Persistent local shopping bag; server-authoritative pricing, stock locking and idempotent checkout.
- Administrator catalog/category management, image upload, inventory, customers, orders and calculated KPIs.
- Shared espresso/cream Button variants, transient cart confirmation, disabled/loading/focus states and responsive layouts.

## Architecture and database
React 19 / TypeScript / Vite / React Router / TanStack Query / React Hook Form / Zod / Motion / Lucide / Tailwind. Java 21 / Spring Boot 3.5 / Spring Security / JPA / Flyway / PostgreSQL 17.
The browser uses a same-origin `/api` proxy. Controllers validate DTOs; CommerceService applies transactional rules; JPA repositories lock stock and orders. Flyway migrations define users, categories, products, product_images, orders, order_items, inventory_movements and database-backed sessions. Order items retain price/name snapshots. CUSTOMER and ADMIN permissions are enforced server-side.

## Local setup
This checkout has an ignored portable runtime under `.runtime`. It is not included in source distributions.
```powershell
./scripts/Start-Local.ps1
./scripts/Stop-Local.ps1
```
Store: http://127.0.0.1:5174. API: http://127.0.0.1:8080. Generated local administrator credentials are private in `.runtime/local-env.json`; do not commit or share that file.
For a fresh machine install Java 21, Maven, Node 24 and PostgreSQL 17. Create a database and set `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` (16+ characters). Run `mvn spring-boot:run` in backend and `npm ci; npm run dev` in frontend. Default database configuration is in application.yml. Bootstrap only creates the initial admin when absent; it never promotes an existing customer.

## Docker
Copy `.env.example` to `.env`, set unique database/admin credentials, then run `docker compose up --build`. Visit localhost:8088. The reverse proxy serves the SPA and API together. Set SESSION_SECURE=true behind a correctly configured HTTPS deployment. Docker manifests are provided, but Docker was unavailable on the development machine and this path has not been executed.

## Build and verification
```powershell
cd frontend
npm ci
npm run build
npm test
cd ../backend
mvn verify
cd ..
./scripts/Test-Local.ps1
```
The portable integration runner uses an isolated aurum_test database and a temporary API on 8081; it requires the built backend JAR. It does not reset the store database. Verified: frontend build; 5 cart tests; 4 Java rule tests; 18 integration checks covering authentication, CSRF, authorization, catalog edits, stock concurrency, idempotency, transitions, session revocation and admin endpoints. Desktop/mobile screenshots are under docs/screenshots. The main JavaScript bundle was reduced from 581.60 kB to 293.04 kB by splitting forms, motion and query libraries. Two non-blocking third-party annotation warnings remain. Java verification passed again on 2026-11-13.

## API and security
OpenAPI is available to authenticated administrators at `/swagger-ui/index.html`. Public read endpoints: products, categories, catalog-meta. Authentication: auth/csrf, auth/register, auth/login, auth/logout. Protected: users/me, users/me/password, orders, orders/my. Administrative endpoints under `/api/admin` manage products/categories/orders/images and expose inventory/customers/stats/settings.
Passwords use BCrypt; sessions are HttpOnly/SameSite=Lax; unsafe requests require CSRF. Order ownership, roles, totals and inventory are checked server-side. Uploads are decoded/re-encoded JPEG/PNG images with size/dimension checks and generated names. No secrets are shipped to the frontend. The in-memory login limiter is intended for a single instance; use a shared limiter at production scale. Email delivery, password recovery and real payments are not configured. Production requires HTTPS, backup/restore procedures, monitoring and operational review.

## Visual update files
frontend/src/components/Button.tsx, AddToCartButton.tsx, UI.tsx; layouts/StoreLayout.tsx; pages/Home.tsx and Catalog.tsx; features/auth/AuthPages.tsx, checkout/Checkout.tsx, account/Account.tsx, admin/Admin.tsx; styles/main.css; index.html; public/images/coffee-*.svg. Backend endpoints and database schema were not altered for the UI refresh.

## Assets and roadmap
Coffee photography: Unsplash photo-1447933601403-0c6688de566e and photo-1442512595331-e89e73853f31, used under the Unsplash license (https://unsplash.com/license). Packaging SVGs are original illustrative assets. Roadmap: production email, payment-provider integration, fulfillment, finer admin pagination and broader browser automation.

Source repository: https://github.com/Jeffreyrc22/aurum-coffee


