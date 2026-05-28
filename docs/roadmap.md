# Grovia Platform — Implementation Roadmap

**Version:** 1.0  
**Date:** 2026-05-27  
**Status:** Active  
**Scope:** Full platform — 10 milestones, package-first, marketplace-first, SaaS-ready  
**Source:** Derived from `docs/architecture/system-architecture.md`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Package Creation Order](#2-package-creation-order)
3. [App Creation Order](#3-app-creation-order)
4. [Implementation Phases](#4-implementation-phases)
5. [Architecture Milestones](#5-architecture-milestones)
6. [Verification Milestones](#6-verification-milestones)
7. [Release Milestones](#7-release-milestones)
8. [Marketplace Readiness Milestones](#8-marketplace-readiness-milestones)
9. [Scalability Milestones](#9-scalability-milestones)
10. [GSD Workflow Reference](#10-gsd-workflow-reference)

---

## 1. Executive Summary

Grovia is a marketplace-ready, white-label ecommerce platform built as a Turborepo monorepo. This roadmap sequences 10 milestones from an empty repository to a self-serve SaaS marketplace platform.

**Sequencing principles:**
- **Package-first:** shared packages are scaffolded and typed before any app imports from them
- **Dependency-ordered:** packages build from foundation (no deps) to feature layer (consumers)
- **Marketplace-first:** storefront, vendor, and orders take priority over internal tooling
- **SaaS-ready from day one:** `tenantId` on every model, config-driven systems, no hardcoded assumptions

**Milestone overview:**

| # | Milestone | Priority | Goal |
|---|-----------|----------|------|
| M0 | Platform Foundation | Critical | Monorepo + all packages + all apps scaffolded |
| M1 | Auth & Identity | Critical | JWT, RBAC, session across all apps |
| M2 | Product Catalog | Critical | Full catalog, ISR listing, SSR detail |
| M3 | Cart, Checkout & Orders | Critical | End-to-end purchase flow with Stripe |
| M4 | Admin Dashboard | High | Admin operations — products, orders, users, vendors |
| M5 | Vendor Marketplace | High | Multi-vendor onboarding, orders, payouts |
| M6 | Marketplace Launch | High | Search, SEO, email, media, production deploy |
| M7 | White-label & Multi-tenancy | Medium | Domain routing, tenant config, token overrides |
| M8 | SaaS Evolution | Medium | Self-serve onboarding, Stripe Billing, DB isolation |
| M9 | Scale & Performance | Future | Typesense, K8s, Redis cluster, ClickHouse |

---

## 2. Package Creation Order

Packages must be created in dependency order. A package must be scaffolded and typed before any downstream package or app imports from it.

### Layer 1 — Foundation (no internal deps)

| Order | Package | Exports | Why First |
|-------|---------|---------|-----------|
| 1 | `@grovia/types` | TypeScript interfaces, enums — zero runtime code | Consumed by every other package and app. No deps means no blockers. |
| 2 | `@grovia/utils` | Pure, stateless functions — zero external deps | Consumed by validation, config, shared, auth, ui. Must exist before them. |

### Layer 2 — Domain (depends on Layer 1 only)

| Order | Package | Exports | Depends On |
|-------|---------|---------|-----------|
| 3 | `@grovia/validation` | Zod schemas, inferred input types | `@grovia/types` |
| 4 | `@grovia/config` | Tenant-aware config loader, typed env vars, Zod env schema | `@grovia/types`, `@grovia/utils` |
| 5 | `@grovia/shared` | Route constants, API endpoint map, error helpers, formatters | `@grovia/types`, `@grovia/utils` |

### Layer 3 — Feature (depends on Layers 1–2)

| Order | Package | Exports | Depends On |
|-------|---------|---------|-----------|
| 6 | `@grovia/theme` | Design tokens, Tailwind preset, CSS custom properties | `@grovia/types` — no React dependency |
| 7 | `@grovia/ui` | React components (shadcn/ui + Radix base + commerce components) | `@grovia/theme`, `@grovia/types`, `@grovia/utils` |
| 8 | `@grovia/auth` | Server: JWT/session/password. Client: `useAuth`, `AuthGuard`, `withAuth` | `@grovia/types`, `@grovia/utils`, `@grovia/config` |

### Layer 4 — Apps (consumers only)

Apps import from packages but never export back to them. They are always created after all packages they depend on are scaffolded.

### Package scaffold template

Every package follows this structure:

```
packages/<name>/
├── src/
│   ├── index.ts     # Public exports only — never expose internals
│   └── ...
├── package.json     # name: @grovia/<name>, private: true
└── tsconfig.json    # extends ../../tsconfig.base.json
```

---

## 3. App Creation Order

Apps are created after the packages they depend on are scaffolded. App creation order follows API-first, then frontend consumers.

| Order | App | Depends On | Why This Order |
|-------|-----|-----------|----------------|
| 1 | `apps/api` | `@grovia/types`, `@grovia/validation`, `@grovia/config`, `@grovia/shared` | Backend has no UI deps. Provides the API surface that frontends consume. |
| 2 | `apps/storefront` | All packages | Customer-facing. Highest traffic. Most SEO and performance constraints. |
| 3 | `apps/admin` | All packages | Internal dashboard. Depends on same API as storefront but no SEO concerns. |
| 4 | `apps/vendor` | All packages | Vendor dashboard. Shares most patterns with admin. Created after admin establishes conventions. |

Each app is scaffolded as a minimal Next.js App Router project with:
- Root layout wired to `@grovia/theme` (Tailwind preset + CSS variables)
- `@grovia/ui` imported and rendered in a health-check page
- `@grovia/auth` `AuthGuard` applied to protected route groups
- Typed API client in `lib/api-client.ts` using `@grovia/shared` `createApiClient`

---

## 4. Implementation Phases

---

### Milestone 0 — Platform Foundation

**Goal:** Working monorepo with all 8 packages scaffolded and typed, all 4 apps returning a health response, CI green, and zero circular dependencies.

#### Phase 0.1 — Monorepo Tooling

- [ ] Initialize pnpm workspace (`pnpm-workspace.yaml` — `apps/*`, `packages/*`)
- [ ] Configure Turborepo (`turbo.json`) — tasks: `build`, `dev`, `lint`, `check-types`, `test`
- [ ] Root `tsconfig.base.json` — strict mode, path aliases, composite builds
- [ ] Root ESLint config — extends recommended, TypeScript rules, import order
- [ ] Prettier config — consistent formatting across all packages and apps
- [ ] `madge` installed at root — circular dependency detection
- [ ] `.npmrc` — `shamefully-hoist=false`, strict package isolation

#### Phase 0.2 — Package Scaffold (dependency order)

- [ ] `@grovia/types` — `src/index.ts` with placeholder type exports, `tsconfig.json`, `package.json`
- [ ] `@grovia/utils` — `src/index.ts` with `formatCurrency`, `formatDate`, `slugify`, `generateId`
- [ ] `@grovia/validation` — `src/index.ts` with placeholder Zod schemas, imports `@grovia/types`
- [ ] `@grovia/config` — `src/index.ts` with env loader, Zod env schema, `getConfig()` function
- [ ] `@grovia/shared` — `src/constants/` with ROUTES, API_ENDPOINTS; `src/helpers/` with `buildApiUrl`, `parseApiError`
- [ ] `@grovia/theme` — `src/tokens/` (colors, typography, spacing, radii, shadows), `src/tailwind/preset.ts`, `src/css/variables.css`
- [ ] `@grovia/ui` — shadcn/ui init, `Button`, `Input`, `Card`, `Badge`, `Spinner` base components
- [ ] `@grovia/auth` — `src/server/` (JWT, password, session), `src/client/` (useAuth hook, AuthGuard component), `src/types.ts`

#### Phase 0.3 — App Scaffold

- [ ] `apps/api` — Fastify app, `GET /health` route, MongoDB connection via Mongoose, Dockerfile
- [ ] `apps/storefront` — Next.js 14 App Router, root layout with `@grovia/theme` Tailwind preset, `@grovia/ui` smoke-test page
- [ ] `apps/admin` — Next.js 14 App Router, root layout with theme, `(dashboard)` route group placeholder
- [ ] `apps/vendor` — Next.js 14 App Router, root layout with theme, `(dashboard)` route group placeholder

#### Phase 0.4 — CI Pipeline

- [ ] GitHub Actions workflow: `turbo run lint check-types test build` on every push
- [ ] `npx madge --circular packages/ apps/` step — fails CI on any circular dependency
- [ ] ESLint `no-restricted-imports` rules — enforce package boundary (apps cannot import from other apps)
- [ ] `turbo run build` cache configured — only rebuilds changed packages

**Verification gate:**
- `turbo run lint check-types` exits 0 — zero TypeScript errors, zero lint errors
- `turbo run build` succeeds for all 8 packages and all 4 apps
- `GET /api/health` returns `{ status: "ok" }` with HTTP 200
- All three Next.js apps render root page in development without errors
- `madge --circular` reports 0 cycles

**Exit criteria:** All packages typed and buildable. All apps scaffolded and runnable. CI green. Zero circular dependencies established as invariant.

---

### Milestone 1 — Auth & Identity System

**Goal:** Secure, role-based authentication across all apps. JWT in memory, refresh token in HttpOnly cookie, RBAC enforced on every protected API route.

#### Phase 1.1 — `@grovia/types` — Auth Types

- [ ] `User`, `AuthUser`, `Session`, `Permission` interfaces
- [ ] `UserRole` enum: `CUSTOMER`, `VENDOR`, `ADMIN`, `SUPERADMIN`

#### Phase 1.2 — `@grovia/auth` Implementation

- [ ] `src/server/jwt.ts` — `signJWT(payload, secret, expiresIn)`, `verifyJWT(token, secret)`
- [ ] `src/server/password.ts` — `hashPassword(plain)`, `verifyPassword(plain, hash)` — bcrypt, cost 12
- [ ] `src/server/session.ts` — `createSession(userId)`, `destroySession(token)` — Redis-backed opaque tokens
- [ ] `src/client/useAuth.ts` — Zustand store: `{ user, accessToken, login, logout, refreshToken }`
- [ ] `src/client/AuthGuard.tsx` — HOC that redirects unauthenticated users to `/login`
- [ ] `src/client/withAuth.ts` — page-level wrapper with role-based access check

#### Phase 1.3 — API Auth Module

- [ ] `modules/auth/auth.model.ts` — Mongoose User schema: `email`, `passwordHash`, `role`, `tenantId`, `vendorId?`, timestamps
- [ ] `modules/auth/auth.service.ts` — `register()`, `login()`, `refresh()`, `logout()` — pure, testable
- [ ] `modules/auth/auth.controller.ts` — request parsing, validation via `@grovia/validation`, response formatting
- [ ] `modules/auth/auth.routes.ts` — `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- [ ] Refresh token storage: Redis with TTL 30 days, rotate on every use
- [ ] Rate limiting on auth endpoints: 10 req/min per IP via Redis

#### Phase 1.4 — API Middleware

- [ ] `middleware/auth.ts` — extracts + verifies JWT from `Authorization: Bearer`, attaches `req.user`
- [ ] `middleware/rbac.ts` — role guard factory: `requireRole(UserRole.ADMIN)` → 403 on mismatch
- [ ] `middleware/tenant.ts` — placeholder: resolves single default tenant, attaches `req.tenant`
- [ ] Middleware stack wired: `[rate-limiter] → [cors] → [auth] → [tenant] → [rbac] → [controller]`

#### Phase 1.5 — Storefront Auth Pages

- [ ] `app/login/page.tsx` — login form with React Hook Form, `LoginSchema` from `@grovia/validation`
- [ ] `app/register/page.tsx` — register form with `CreateUserSchema`
- [ ] `stores/auth.store.ts` — Zustand store for access token + user state (memory only, no localStorage)
- [ ] `lib/api-client.ts` — fetch wrapper: injects `Authorization` header, handles 401 → refresh → retry

#### Phase 1.6 — Dashboard Route Guards

- [ ] `apps/admin` — `AuthGuard` wraps `(dashboard)` layout with `ADMIN` role check → redirect `/login`
- [ ] `apps/vendor` — `AuthGuard` wraps `(dashboard)` layout with `VENDOR` role check → redirect `/login`
- [ ] `apps/storefront/app/account/` — `AuthGuard` wraps account routes with `CUSTOMER` role check

**Verification gate:**
- Customer registers → logs in → receives JWT (memory) + refresh token (HttpOnly cookie)
- `GET /admin` with customer JWT → 403
- `GET /vendor` with admin JWT → 403
- Refresh token rotates on use — old token rejected after rotation
- Auth state survives page refresh via refresh flow, not localStorage persistence
- Integration tests cover: register, login, refresh, logout, role rejection (all 4 roles)

**Exit criteria:** Secure auth working across all three apps. RBAC enforced at API layer. No token exposure in localStorage.

---

### Milestone 2 — Product Catalog

**Goal:** Full product and category system. Storefront renders ISR product listing and SSR product detail. Admin can manage products and categories.

#### Phase 2.1 — `@grovia/types` — Catalog Types

- [ ] `Product`, `ProductVariant`, `ProductImage`, `ProductStatus` (`DRAFT`, `ACTIVE`, `ARCHIVED`)
- [ ] `Category`, `CategoryTree`
- [ ] `InventoryItem`, `StockLevel`, `StockMovement`

#### Phase 2.2 — `@grovia/validation` — Catalog Schemas

- [ ] `ProductSchema`, `CreateProductSchema`, `UpdateProductSchema`
- [ ] `ProductVariantSchema`, `CreateProductVariantSchema`
- [ ] `CategorySchema`, `CreateCategorySchema`
- [ ] `ProductFilterSchema` — query params for listing endpoint

#### Phase 2.3 — API Product Module

- [ ] `modules/products/products.model.ts` — Mongoose schema with `tenantId`, `vendorId`, `status`, `slug`, `variants[]`, compound indexes
- [ ] `modules/products/products.service.ts` — CRUD, pagination, filtering, slug generation
- [ ] `modules/products/products.routes.ts`:
  - `GET /products` — public, paginated, filterable (ISR-compatible)
  - `GET /products/:slug` — public, single product (SSR-compatible)
  - `POST /products` — admin or vendor, creates product
  - `PUT /products/:id` — admin or owner vendor
  - `DELETE /products/:id` — admin or owner vendor
- [ ] `modules/categories/` — Category CRUD, tree builder (recursive children query)
- [ ] `modules/inventory/` — stock tracking: `reserve()`, `release()`, `decrement()`, low-stock events via BullMQ

#### Phase 2.4 — `@grovia/ui` — Catalog Components

- [ ] `ProductCard` — image, title, price, vendor badge, add-to-cart button
- [ ] `ProductGallery` — image carousel with zoom
- [ ] `VariantSelector` — size/color option picker
- [ ] `CategoryBreadcrumb` — accessible breadcrumb trail
- [ ] `FilterSidebar` — price range, category, availability filters

#### Phase 2.5 — Storefront Product Pages

- [ ] `app/(shop)/page.tsx` — homepage (ISR, revalidate: 60s) with featured products + categories
- [ ] `app/(shop)/products/page.tsx` — product listing (ISR, revalidate: 30s) with filters, sorting, pagination
- [ ] `app/(shop)/products/[slug]/page.tsx` — product detail (SSR) with gallery, variants, stock, add-to-cart
- [ ] `app/(shop)/categories/[slug]/page.tsx` — category page (ISR, revalidate: 30s)
- [ ] TanStack Query for client-side product interactions (wishlist, reviews — later)

#### Phase 2.6 — Admin Product Management

- [ ] `app/(dashboard)/products/page.tsx` — product list with `DataTable`, search, status filter
- [ ] `app/(dashboard)/products/new/page.tsx` — product create form
- [ ] `app/(dashboard)/products/[id]/edit/page.tsx` — product edit form
- [ ] `app/(dashboard)/categories/page.tsx` — category tree management

**Verification gate:**
- Product listing page renders in < 2s (ISR cache hit)
- Product detail page renders with fresh stock level (SSR, no stale data)
- Admin can create, edit, archive, and delete products
- Products filtered correctly by `tenantId` — no cross-tenant data
- Category tree renders correctly with nested children
- `madge --circular` still 0 after M2 additions

**Exit criteria:** Full product catalog live. ISR listing + SSR detail working. Admin CRUD operational.

---

### Milestone 3 — Cart, Checkout & Orders

**Goal:** Complete purchase flow — Cart → Checkout → Stripe Payment → Order created → Confirmation email.

#### Phase 3.1 — Cart State (Storefront)

- [ ] `stores/cart.store.ts` — Zustand: `items[]`, `addItem()`, `removeItem()`, `updateQuantity()`, `clear()`, derived `total`, `itemCount`
- [ ] Cart persisted to localStorage (client-only, hydrated on mount)
- [ ] `@grovia/ui` — `CartDrawer`, `CartItemRow`, `CartSummary`, `MiniCartIcon` (count badge)
- [ ] Cart validates stock availability on open (TanStack Query, `staleTime: 0`)

#### Phase 3.2 — `@grovia/types` & `@grovia/validation` — Order & Checkout Types

- [ ] `Order`, `OrderItem`, `OrderStatus` enum (`PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`)
- [ ] `Address`, `ShippingMethod`, `PaymentIntent`
- [ ] `AddressSchema`, `CheckoutSchema`, `CreateOrderSchema`

#### Phase 3.3 — Checkout Flow (Storefront)

- [ ] `app/(checkout)/checkout/page.tsx` — multi-step checkout shell
- [ ] Step 1 — Address: shipping address form (React Hook Form + `AddressSchema`)
- [ ] Step 2 — Shipping: shipping method selection with rate display
- [ ] Step 3 — Payment: Stripe Elements (Card Element or Payment Element)
- [ ] Step 4 — Confirmation: order number, summary, estimated delivery
- [ ] Guest checkout supported (no account required)

#### Phase 3.4 — API Order Module

- [ ] `modules/orders/orders.model.ts` — Order Mongoose schema with state machine, `tenantId`, `vendorId[]`, `items[]`, `payment`, `shipping`
- [ ] `modules/orders/orders.service.ts` — `createOrder()`, `updateStatus()`, `cancelOrder()`, `getCustomerOrders()`
- [ ] `modules/orders/orders.routes.ts`:
  - `POST /orders` — creates order, reserves inventory, initiates payment
  - `GET /orders/:id` — customer or admin/vendor scoped
  - `PATCH /orders/:id/status` — admin/vendor only
  - `GET /orders` — admin: all orders; vendor: vendor orders; customer: own orders
- [ ] `modules/payments/` — Stripe payment intent creation, webhook handler (`payment_intent.succeeded`, `payment_intent.payment_failed`) with signature verification
- [ ] `modules/shipping/` — rate calculation stub with extensible carrier interface

#### Phase 3.5 — Background Jobs

- [ ] `queues/email.queue.ts` — `OrderConfirmationJob`, `ShippingNotificationJob`
- [ ] `queues/inventory.queue.ts` — `ReserveStockJob` (on order create), `ReleaseStockJob` (on cancel)
- [ ] Responsive HTML order confirmation email template (logo, items, totals, tracking link placeholder)
- [ ] BullMQ job retry with exponential backoff (max 3 retries)

**Verification gate:**
- Customer adds item → proceeds to checkout → pays with test Stripe card → order persists in DB
- Stripe `payment_intent.succeeded` webhook → order status updates to `CONFIRMED`
- Stock decrements on `CONFIRMED`, releases on `CANCELLED`
- Order confirmation email received within 60s of payment
- Payment failure surfaces clear error in UI, cart items preserved
- Order state machine tested: all valid transitions pass, invalid transitions return 422

**Exit criteria:** End-to-end purchase flow working. Stripe integrated. Inventory managed. Emails firing.

---

### Milestone 4 — Admin Dashboard

**Goal:** Full admin control center. Platform-wide product management, order lifecycle, user management, vendor approval, basic analytics.

#### Phase 4.1 — Admin Layout & Shell

- [ ] `@grovia/ui` — `Sidebar`, `SidebarNav`, `PageHeader`, `StatCard`, `DataTable` (sortable, filterable, paginated), `DateRangePicker`
- [ ] Admin app shell: persistent collapsible sidebar, breadcrumb trail, mobile-responsive navigation
- [ ] Admin `(dashboard)` layout with role guard (M1) validated

#### Phase 4.2 — Order Management

- [ ] Order list: status tabs (All, Pending, Confirmed, Shipped, Delivered, Cancelled), date range filter, full-text search
- [ ] Order detail: line items, customer info, payment status, shipping tracking, timeline
- [ ] Manual status transitions: confirm, mark shipped (with tracking number), cancel with reason
- [ ] Bulk actions: confirm selected, export CSV

#### Phase 4.3 — User Management

- [ ] Customer list with search, registration date, order count
- [ ] Customer detail: profile, order history, addresses
- [ ] Admin user invite (email → temporary password → force reset on first login)
- [ ] Role assignment: promote customer to admin, suspend account

#### Phase 4.4 — Vendor Management

- [ ] Vendor application list: pending applications with profile details
- [ ] Approve / reject with reason — triggers `VendorApprovedJob` (welcome email + access grant)
- [ ] Vendor profile overview: product count, order count, total revenue, payout balance
- [ ] Suspend vendor: disables dashboard access, hides products from storefront

#### Phase 4.5 — Analytics (Basic)

- [ ] `modules/analytics/` — aggregation endpoints:
  - `GET /analytics/revenue` — total revenue, by-day for period (7d/30d/90d)
  - `GET /analytics/orders` — order count by status, average order value
  - `GET /analytics/products` — top 10 products by revenue
- [ ] Admin analytics dashboard: revenue chart (recharts), order volume, AOV, conversion funnel stub

**Verification gate:**
- Admin can manage full product/order/user lifecycle without leaving the dashboard
- Vendor approval triggers email + access grant end-to-end
- Analytics endpoints respond within 500ms with proper indexes
- All admin routes reject non-ADMIN tokens with 403
- No cross-tenant data visible in any admin view

**Exit criteria:** Full admin operations live. Vendor approval pipeline end-to-end working.

---

### Milestone 5 — Vendor Marketplace

**Goal:** Multi-vendor marketplace operational. Vendors onboard, manage their products and orders, track payouts, see their own analytics.

#### Phase 5.1 — Vendor Onboarding

- [ ] `modules/vendors/vendors.model.ts` — Vendor profile: businessName, description, status (`PENDING`, `APPROVED`, `SUSPENDED`), `tenantId`, commissionRate
- [ ] Storefront vendor application page (`/sell`) — business details form, terms acceptance
- [ ] Admin approval integration (M4) — on approve, sets `user.role = VENDOR`, links `user.vendorId`
- [ ] Vendor welcome email with dashboard link + credentials

#### Phase 5.2 — Vendor Product Management

- [ ] Vendor product list: scoped to `req.user.vendorId` — no cross-vendor visibility
- [ ] Vendor product create/edit/delete with all product fields + variant management
- [ ] Image upload: presigned URL from `POST /uploads/presign` → direct upload to Cloudflare R2/S3
- [ ] Inventory management per product variant: stock level adjustments, low-stock alerts

#### Phase 5.3 — Vendor Order Management

- [ ] Vendor order list: orders containing this vendor's products only (joined on `vendorId` in order items)
- [ ] Order detail: vendor-scoped line items, shipping address, customer first name only
- [ ] Fulfillment actions: mark item shipped + tracking number, update estimated delivery
- [ ] Bulk fulfillment: mark multiple orders as shipped

#### Phase 5.4 — Commission & Payouts

- [ ] Commission model: `commissionRate` on Vendor, calculated per order item on `CONFIRMED`
- [ ] `modules/payouts/` — payout ledger: `vendorEarning = itemSubtotal - commission`
- [ ] Payout statuses: `PENDING`, `APPROVED`, `PAID`
- [ ] Admin payout management: batch approve pending payouts, mark as processed with reference
- [ ] Vendor payout dashboard: total earnings, pending balance, paid history

#### Phase 5.5 — Vendor Analytics

- [ ] `modules/analytics/` vendor-scoped endpoints — all filtered by `req.user.vendorId`
- [ ] Vendor analytics dashboard: revenue by day, order count, top-selling products, payout summary

**Verification gate:**
- Vendor A cannot read or write Vendor B's products via API — 403 returned, tested with integration tests
- Commission calculated correctly on every order item at configured rate
- Vendor approval → dashboard access → product creation → product visible in storefront: full E2E verified
- Cross-vendor data access attempt returns 403 (not 200 with empty data)
- Payout ledger balances correctly across multiple orders

**Exit criteria:** Multi-vendor marketplace operational. Data isolation verified at API level. Payouts tracked end-to-end.

---

### Milestone 6 — Marketplace Launch

**Goal:** Production-ready marketplace. Search, SEO, promotions, transactional emails, media management, deployed to production domains.

#### Phase 6.1 — Search

- [ ] `modules/search/` — MongoDB text index on `products.name`, `products.description`, `products.tags`
- [ ] `GET /search?q=&category=&minPrice=&maxPrice=&vendor=` — full-text search with facet counts
- [ ] Storefront search bar: debounced instant search (300ms), results dropdown
- [ ] Storefront search results page: filtered, sorted, paginated
- [ ] Search index rebuild job (BullMQ) — triggered on product create/update/archive

#### Phase 6.2 — Promotions & Discounts

- [ ] `modules/promotions/` — discount codes: percentage, fixed amount, free shipping; validity window, usage limit
- [ ] Cart discount application: client validates code via API, API re-validates on order creation
- [ ] Admin promotion management: create, activate, deactivate, view usage stats
- [ ] Storefront: discount code input in cart drawer with live feedback

#### Phase 6.3 — SEO Optimization

- [ ] `metadata` export on every storefront `page.tsx` — title, description, OG tags
- [ ] Product detail: JSON-LD `Product` structured data (schema.org)
- [ ] Category pages: JSON-LD `BreadcrumbList`
- [ ] `app/sitemap.ts` — dynamic sitemap including all active product slugs and category slugs
- [ ] `app/robots.txt` — disallows checkout, account, admin paths
- [ ] OG image for product pages via `@vercel/og` or static CDN image

#### Phase 6.4 — Media Management

- [ ] `POST /uploads/presign` — generates presigned R2/S3 URL for direct client upload (never buffers through API)
- [ ] Media metadata stored in DB after successful upload (URL, size, MIME type)
- [ ] Next.js `Image` component configured with R2 CDN domain for optimization
- [ ] Admin media library: view, tag, delete uploaded assets

#### Phase 6.5 — Email System (Full)

- [ ] All transactional emails implemented: welcome, order confirmation, order shipped, password reset, vendor approved, payout processed
- [ ] Responsive HTML templates: logo, semantic markup, tested in dark mode
- [ ] SPF, DKIM, DMARC records configured on sending domain
- [ ] `queues/email.queue.ts` — all email types registered with dead-letter handling

#### Phase 6.6 — Production Deployment

- [ ] All environment variables validated at startup via `@grovia/config` (Zod, missing vars = crash with clear error)
- [ ] Secrets in environment vault — never committed
- [ ] `apps/storefront` → Vercel (production domain, custom domain)
- [ ] `apps/admin` → Vercel (admin subdomain)
- [ ] `apps/vendor` → Vercel (vendor subdomain)
- [ ] `apps/api` → Railway (production, auto-deploy from `main`)
- [ ] MongoDB Atlas M10+, Redis Cloud single node
- [ ] Smoke test suite: register → add to cart → checkout → order confirmed → email received
- [ ] Uptime monitoring (Better Uptime or similar) on all endpoints

**Verification gate:**
- Product pages indexed by Google Search Console (structured data validated)
- Search returns relevant results in < 500ms
- End-to-end order flow works in production with real payment method
- Email deliverability > 95% (Mailtrap inbox test, SPF/DKIM verified)
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms on product listing and detail
- Zero secrets committed — `git grep` for keys returns empty

**Exit criteria:** Marketplace live in production. All core flows verified. SEO, search, email, media working. Smoke tests green.

---

### Milestone 7 — White-label & Multi-tenancy

**Goal:** Tenant-aware platform. Per-tenant branding, domain routing, config system, feature flags. Two tenants with different domains render distinct storefronts from one codebase.

#### Phase 7.1 — Tenant Data Model

- [ ] `modules/tenants/tenants.model.ts` — Tenant: `domain`, `slug`, `branding` (logo, favicon, colors, fonts), `features` (flag map), `limits` (maxProducts, maxVendors), `planId`
- [ ] `@grovia/config` — `TenantConfig` schema fully implemented with Zod
- [ ] `@grovia/config` — `getTenantConfig(tenantId)`: DB lookup → Redis cache (TTL: 5 min) → returns typed config
- [ ] All existing Mongoose models verified to include `tenantId` with index

#### Phase 7.2 — Domain-to-Tenant Resolution

- [ ] `middleware/tenant.ts` — upgraded: reads `Host` header → DB lookup → Redis cache (TTL: 1 min) → attaches `req.tenant`
- [ ] Wildcard DNS: `*.grovia.app` → Vercel wildcard deployment → tenant resolved from subdomain
- [ ] Custom domain: tenant sets CNAME → Vercel domain added via API → tenant config updated
- [ ] Storefront root layout: reads `TenantConfig` in RSC, passes to client via context

#### Phase 7.3 — Per-tenant Theme Override

- [ ] Storefront `app/layout.tsx` — server component reads `TenantConfig.branding.colors` → generates CSS `<style>` override block with `--color-primary`, `--color-secondary`, etc.
- [ ] Override block injected into `<head>` — zero JavaScript on client for theme application
- [ ] Logo and favicon read from `TenantConfig.branding` — renders correct asset per tenant
- [ ] `@grovia/theme` token defaults remain as fallback — partial overrides supported

#### Phase 7.4 — Feature Flag System

- [ ] `@grovia/config` — `FeatureFlags` typed interface: `enableVendorMarketplace`, `enablePromotions`, `enableReviews`, `enableWishlist`, etc.
- [ ] API middleware: reads `req.tenant.features` → returns 404 on disabled feature endpoint
- [ ] Storefront: conditional rendering based on feature flags from `TenantConfig`
- [ ] Admin UI: per-tenant feature flag management panel

#### Phase 7.5 — White-label Storefront

- [ ] Per-tenant SEO metadata: site name, site description, OG defaults from `TenantConfig`
- [ ] Per-tenant email templates: from name, logo URL, brand colors in templates
- [ ] Per-tenant footer content: contact info, social links, legal pages — all from config

**Verification gate:**
- Tenant A (`shop-a.grovia.app`) and Tenant B (`shop-b.grovia.app`) render distinct branding with zero code changes
- Feature disabled for Tenant A is inaccessible in storefront and returns 404 from API
- Tenant config cached in Redis — DB not hit on every request
- Cross-tenant data blocked at middleware — tested with integration tests
- Custom domain resolves correctly to correct tenant storefront

**Exit criteria:** Multi-tenant theming and config system live. Domain routing working. Feature flags enforced.

---

### Milestone 8 — SaaS Evolution

**Goal:** Self-serve tenant onboarding, Stripe Billing subscription management, optional DB isolation, tenant admin portal.

#### Phase 8.1 — Self-serve Tenant Onboarding

- [ ] Public signup page: business name, desired domain, plan selection
- [ ] Provisioning BullMQ worker: creates Tenant record, seeds default config, sends welcome email, creates admin user for tenant owner
- [ ] Onboarding complete in < 5 minutes from payment to storefront access
- [ ] `apps/tenant-admin` — new Next.js app: branding, domain, team, billing management

#### Phase 8.2 — Stripe Billing

- [ ] Stripe Products + Prices configured for each plan (Starter, Growth, Pro)
- [ ] `modules/billing/` — subscription create, update, cancel; usage event reporting
- [ ] Stripe Billing webhooks: `customer.subscription.updated`, `invoice.payment_failed`, `invoice.paid`
- [ ] Plan limits enforced at API: exceeding product/vendor limit → 402 with upgrade prompt
- [ ] Billing portal embed in `apps/tenant-admin` (Stripe Customer Portal)

#### Phase 8.3 — Tenant Admin Portal (`apps/tenant-admin`)

- [ ] Branding configurator: color picker, logo upload, font selection — live preview
- [ ] Domain management: CNAME setup guide, domain verification status
- [ ] Feature flag self-management: enable/disable features within plan entitlements
- [ ] Team member management: invite, role assignment, remove
- [ ] Billing portal: current plan, invoices, payment method, upgrade/downgrade

#### Phase 8.4 — DB Isolation (per-tenant, when needed)

- [ ] `api/lib/db.ts` — connection pool manager: `getConnection(tenantId)` returns existing or creates new Mongoose connection
- [ ] Provisioning worker creates isolated MongoDB Atlas database on tenant creation (configurable: shared vs. isolated)
- [ ] Migration runner scoped to individual tenant DB — all schema changes applied per-tenant

**Verification gate:**
- New tenant signs up → pays → storefront accessible with their branding within 5 minutes (automated E2E test)
- Stripe webhook correctly updates plan on upgrade/downgrade
- DB-isolated tenant's connection cannot query another tenant's database
- Tenant admin updates branding → storefront reflects change within 60s (cache TTL)
- Plan limit enforcement: creating product beyond plan limit returns 402

**Exit criteria:** Self-serve SaaS onboarding live. Billing integrated. Tenant admin portal operational.

---

### Milestone 9 — Scale & Performance

**Goal:** Production-scale infrastructure proven under load. Typesense search, Redis cluster, Kubernetes API deployment, ClickHouse analytics.

#### Phase 9.1 — Typesense Search

- [ ] Deploy Typesense cluster (Typesense Cloud or self-hosted)
- [ ] `modules/search/` — replace MongoDB text search with Typesense Node.js client
- [ ] Product sync BullMQ worker: real-time Typesense index updates on product create/update/archive
- [ ] Storefront instant search: debounced query at 150ms, sub-100ms results from Typesense
- [ ] Faceted search: category, price range, vendor, rating, availability
- [ ] Typo-tolerance enabled (edit distance 1 for queries > 4 chars)

#### Phase 9.2 — Infrastructure Scale-up

- [ ] MongoDB Atlas M30+ with 3-node replica set
- [ ] Read preference `secondaryPreferred` for analytics module queries
- [ ] Redis cluster: 3 shards — sessions, queues, cache on separate shard slots
- [ ] BullMQ workers extracted to standalone `apps/workers` process — independent deployment, autoscaling
- [ ] Rate limiter: per-tenant plan-based limits (Starter: 100 req/min, Pro: 1000 req/min)

#### Phase 9.3 — Kubernetes Deployment

- [ ] Helm chart for `apps/api`: Deployment, Service, HPA (CPU: scale at 70%, min 3 pods, max 10)
- [ ] Helm chart for `apps/workers`: Deployment, separate resource limits
- [ ] Health probe: `GET /health` (liveness), `GET /ready` (readiness — checks Mongo + Redis connection)
- [ ] Secrets via Kubernetes Secrets + external secret store (Doppler or AWS Secrets Manager)
- [ ] Zero-downtime deploys: rolling update strategy, `minReadySeconds: 30`

#### Phase 9.4 — Analytics Data Warehouse

- [ ] ClickHouse cluster (ClickHouse Cloud) for event storage
- [ ] `queues/analytics.queue.ts` — ships structured events: `order.created`, `product.viewed`, `search.performed`, `checkout.abandoned`
- [ ] Analytics dashboard upgrade: cohort analysis, funnel metrics, revenue by tenant, top-searched terms
- [ ] Retention: ClickHouse MergeTree with TTL 2 years

#### Phase 9.5 — Performance Audit

- [ ] `@next/bundle-analyzer` — per-page JS budget: storefront initial JS < 150kb gzipped
- [ ] Dynamic imports for heavy components: `ProductGallery`, `CheckoutForm`, Framer Motion animations
- [ ] MongoDB `explain()` audit on all hot paths — all queries < 100ms at p95
- [ ] CDN cache audit: ISR cache hit ratio > 90% for product listing and category pages
- [ ] Core Web Vitals regression test: run Lighthouse CI on every main branch deploy

**Verification gate:**
- Typesense search returns results in < 100ms at p99 (load test: 100 concurrent search queries)
- API handles 1000 concurrent users without > 1% error rate (k6 load test)
- K8s HPA scales from 3 → 8 pods under load, scales back down after cooldown
- Storefront initial JS bundle < 150kb gzipped (bundle analyzer verified)
- All MongoDB queries < 100ms at p95 (explain plan audit complete)

**Exit criteria:** Platform proven at scale. Search world-class. Infrastructure production-hardened for 1000 CCU.

---

## 5. Architecture Milestones

These milestones represent structural decisions that must be validated at specific points. Each is a one-time gate — once achieved, it must be maintained by CI enforcement.

| # | Milestone | Achieved After | Deliverable | CI Enforcement |
|---|-----------|---------------|-------------|----------------|
| A1 | Dependency graph locked — zero circular deps | M0 | `madge --circular` = 0 | CI step fails on any cycle |
| A2 | Package boundary rules enforced | M0 | ESLint `no-restricted-imports` blocking cross-app imports | Lint step |
| A3 | Auth architecture validated | M1 | JWT in memory, refresh in HttpOnly cookie, RBAC tested | Integration test suite |
| A4 | Rendering strategy matrix applied | M2 | ISR / SSR / CSR applied correctly to each page type | Manual audit + Lighthouse |
| A5 | State management patterns established | M3 | Zustand (cart/ui/auth), TanStack Query (server), RHF (forms) — no mixing | Code review gate |
| A6 | Multi-vendor data isolation verified | M5 | `vendorId` enforced at middleware + service layer | Integration tests with cross-vendor assertions |
| A7 | Tenant architecture live | M7 | Domain → tenant resolution, config caching, token overrides working | E2E test: two-tenant scenario |
| A8 | Event-driven order lifecycle | M8 | BullMQ event bus for order lifecycle events (confirm, ship, cancel) | Integration tests for all job types |
| A9 | DB isolation strategy implemented | M9 | Connection pool manager with per-tenant connection option | Integration test: cross-connection isolation |

---

## 6. Verification Milestones

Each milestone closes only after its verification gate passes. No milestone is marked done without verification.

| # | Verification | Scope | Pass Criteria |
|---|-------------|-------|--------------|
| V0 | Foundation health | Monorepo, 8 packages, 4 apps, CI | 0 type errors, 0 lint errors, all apps build, CI green, 0 circular deps |
| V1 | Auth security | Auth flows, token storage, RBAC enforcement | No token in localStorage, refresh rotates, correct roles enforce correct access |
| V2 | Catalog integrity | Products, categories, inventory | ISR cache correct, SSR renders fresh stock, admin CRUD complete, tenantId scope enforced |
| V3 | Purchase flow | Cart → checkout → Stripe → order → email | Full E2E: add item → pay → order in DB → stock decremented → email received within 60s |
| V4 | Admin operations | Product/order/user/vendor management | Admin manages full platform lifecycle, vendor approval pipeline E2E, analytics responding |
| V5 | Vendor isolation | Vendor data boundaries | Vendor A returns 403 on Vendor B's resources — tested with direct API calls |
| V6 | Launch readiness | SEO, Core Web Vitals, production deploy, email | CWV passing, smoke tests green, product indexed by Search Console, email deliverable |
| V7 | Tenant isolation | Multi-tenant config + data + branding | Two tenants render distinct UX, cross-tenant data blocked, feature flags respected |
| V8 | SaaS billing | Onboarding, plans, webhooks, tenant admin | New tenant: signup → pay → storefront accessible in < 5 min, plan limits enforced |
| V9 | Scale thresholds | Search, load, infrastructure, bundle | 1000 CCU handled, Typesense < 100ms p99, bundle < 150kb, all queries < 100ms p95 |

---

## 7. Release Milestones

| Release | Version | Trigger | What Ships |
|---------|---------|---------|-----------|
| Alpha | `v0.1.0` | V0 passed | Monorepo scaffold, all packages typed, all apps Hello World |
| Alpha | `v0.2.0` | V1 passed | Secure auth system across all apps |
| Alpha | `v0.3.0` | V2 passed | Full product catalog — ISR listing, SSR detail, admin CRUD |
| Beta | `v0.4.0` | V3 passed | Cart, checkout, Stripe payment, orders, confirmation email |
| Beta | `v0.5.0` | V4 passed | Admin dashboard — products, orders, users, vendors, analytics |
| Beta | `v0.6.0` | V5 passed | Multi-vendor marketplace — vendor onboarding, products, orders, payouts |
| RC | `v1.0.0-rc` | M6 complete | Production deploy, search, SEO, promotions, email, media |
| **Launch** | **`v1.0.0`** | **V6 passed** | **Marketplace public launch — all MR gates verified** |
| v1.1 | `v1.1.0` | V7 passed | White-label and multi-tenancy live |
| SaaS Beta | `v2.0.0-beta` | M8 complete | Self-serve onboarding, Stripe Billing, tenant admin portal |
| **SaaS Launch** | **`v2.0.0`** | **V8 passed** | **SaaS platform — self-serve tenants, billing, DB isolation** |
| Scale | `v3.0.0` | V9 passed | Typesense search, K8s, Redis cluster, ClickHouse analytics |

---

## 8. Marketplace Readiness Milestones

A marketplace launch is authorized only when all MR gates below are verified. Every gate is binary — pass or not shipped.

| # | Capability | Required Milestone | Verification Signal |
|---|-----------|-------------------|---------------------|
| MR1 | Multi-vendor product catalog | M5 | Vendors independently publish products visible in storefront |
| MR2 | Vendor data isolation | M5 | Cross-vendor API access returns 403 — integration test passing |
| MR3 | Customer purchase flow | M3 | Add to cart → pay → order confirmed → email received (E2E test) |
| MR4 | Commission & payout tracking | M5 | Commission calculated on every order item, payout ledger accurate |
| MR5 | Vendor onboarding pipeline | M5 | Apply → admin approve → vendor dashboard access → product live (E2E) |
| MR6 | Product search & discovery | M6 | Search returns relevant results; category, price, vendor filters work |
| MR7 | SEO-ready storefront | M6 | Product pages pass Search Console structured data test, sitemap live |
| MR8 | Transactional emails | M6 | Order confirm, shipping, vendor approved emails firing in production |
| MR9 | Admin platform oversight | M4 | Admin manages all vendors, orders, users without data leakage |
| MR10 | Production deployment | M6 | All apps on production domains, smoke tests green, uptime monitoring active |

**Marketplace Launch Gate:** MR1–MR10 all verified → `v1.0.0` release authorized.

---

## 9. Scalability Milestones

These thresholds define when to act on scaling. Do not scale prematurely — build when the threshold is reached.

| # | Threshold | Milestone | Scaling Action |
|---|-----------|-----------|----------------|
| S1 | 10k products in catalog | M5 | Add compound indexes: `{ tenantId, status, createdAt }` on `products` collection |
| S2 | 1k orders/day | M6 | Extract BullMQ workers from API process to standalone `apps/workers` service |
| S3 | 100k products in catalog | M9.1 | Replace MongoDB text search with Typesense — 10× search latency improvement |
| S4 | 50k orders/month | M9.2 | Upgrade MongoDB Atlas M30+, replica set secondary reads for analytics |
| S5 | 10+ active tenants | M7 | Redis caching for `getTenantConfig()` — TTL 5 min, invalidate on config update |
| S6 | 100+ active tenants | M8 | Evaluate DB-per-tenant isolation — provision isolated DBs for Pro plan tenants |
| S7 | 1000 CCU on API | M9.3 | Deploy API on Kubernetes with HPA (min 3 pods, max 10, CPU threshold 70%) |
| S8 | 500k orders/month | M9.4 | ClickHouse analytics data warehouse — offload aggregation from MongoDB |
| S9 | `@grovia/ui` > 50 components | Post-M6 | Split into `@grovia/ui-core` (primitives) + `@grovia/ui-commerce` (domain components) |
| S10 | Turbo build > 5 min | Post-M7 | Enable Turbo remote caching; evaluate monorepo sharding |
| S11 | Redis memory > 70% | M9.2 | Partition Redis: separate instances for sessions, queues, cache |
| S12 | API p95 latency > 200ms | M9 | Query explain audit → add missing indexes; evaluate read replica routing |

---

## 10. GSD Workflow Reference

Every milestone phase follows the GSD engineering workflow. No exceptions.

```
1. Discuss    → /gsd-discuss-phase   — clarify requirements, surface risks, resolve ambiguity
2. Plan       → /gsd-plan-phase      — generate atomic task list, define exit criteria
3. Execute    → /gsd-execute-phase   — implement with atomic commits per task
4. Verify     → /gsd-verify-work     — validate against the phase's verification gate
5. Commit     → git commit           — clean, signed, conventional commit message
```

### Per-phase non-negotiables

- **Package before app:** No app imports from a package that hasn't been scaffolded and typed first.
- **Atomic commits:** Each task in a phase is committed independently. Never batch unrelated changes.
- **Verification before close:** No phase or milestone closes without its verification gate passing.
- **No premature abstraction:** A shared package is created only when two consumers need it.
- **No hardcoded values:** All configuration through `@grovia/config`. All shared types through `@grovia/types`.
- **`tenantId` on every model:** Added from day one — retrofitting is expensive. No exceptions.
- **Never bypass security checks:** No `--no-verify`, no auth middleware skip, no hardcoded test credentials in shipped code.

### Branch strategy

```
main        → production-only; every merge is a deployable release
develop     → integration branch; all features merge here first
feature/*   → one branch per milestone phase (e.g. feature/m3-checkout)
hotfix/*    → production patches only; merge to main + develop
```

### Key commands

```bash
# Start development (all apps + packages)
pnpm turbo run dev

# Verify before any commit
pnpm turbo run lint check-types test

# Check circular dependencies (must be 0)
npx madge --circular packages/ apps/

# Build all packages and apps
pnpm turbo run build

# Run a single app in development
pnpm turbo run dev --filter=storefront
pnpm turbo run dev --filter=api
```

---

*Generated from `docs/architecture/system-architecture.md` and `docs/vision.md`*  
*Version 1.0 — 2026-05-27 — Update when structural decisions change*
