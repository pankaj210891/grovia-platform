# Grovia Platform — System Architecture

**Version:** 1.0  
**Date:** 2026-05-27  
**Status:** Approved  
**Scope:** Full platform — monorepo, packages, apps, API, auth, theme, state, deployment, SaaS evolution

---

## Table of Contents

1. [Overview](#1-overview)
2. [Monorepo Architecture](#2-monorepo-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Package Boundaries & Dependency Graph](#4-package-boundaries--dependency-graph)
5. [App Responsibility Boundaries](#5-app-responsibility-boundaries)
6. [Auth Architecture](#6-auth-architecture)
7. [API Architecture](#7-api-architecture)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Theme Architecture](#9-theme-architecture)
10. [State Management Strategy](#10-state-management-strategy)
11. [Deployment Strategy](#11-deployment-strategy)
12. [Scalability Analysis](#12-scalability-analysis)
13. [Implementation Order](#13-implementation-order)
14. [Architecture Risks](#14-architecture-risks)
15. [Future SaaS Evolution](#15-future-saas-evolution)

---

## 1. Overview

Grovia is a **marketplace-ready, white-label ecommerce platform** built as a Turborepo monorepo. The architecture is designed for:

- **Modular growth** — add capabilities without rewiring existing systems
- **White-label delivery** — tenant-level config controls branding, features, and domain
- **SaaS evolution** — multi-tenant SaaS with per-tenant isolation is an explicit future state
- **Developer velocity** — shared packages eliminate duplication across four apps

### Platform Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                     grovia-platform (monorepo)               │
│                                                             │
│  ┌──────────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐  │
│  │  storefront  │  │  admin   │  │ vendor │  │   api   │  │
│  │  (Next.js)   │  │ (Next.js)│  │(Next.js│  │ (Node)  │  │
│  └──────┬───────┘  └────┬─────┘  └───┬────┘  └────┬────┘  │
│         │               │             │              │       │
│  ┌──────▼───────────────▼─────────────▼──────────────▼───┐  │
│  │              Shared Packages Layer                      │  │
│  │  ui │ theme │ auth │ types │ validation │ config │ ... │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Architecture

### Why Turborepo

- **Incremental builds** — only rebuilds what changed, including transitive deps
- **Remote caching** — CI cache sharing across team and machines
- **Task orchestration** — `build` waits for `^build` (deps first), dev runs concurrently
- **Single version graph** — one lockfile, consistent dep versions across all apps

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Turbo Task Graph

```
dev       → runs all apps in parallel (persistent, no cache)
build     → packages build first (^build), then apps
lint      → packages lint first (^lint), then apps
check-types → packages type-check first, then apps
test      → runs per-package with cache
```

### Package Manager

- **pnpm** — workspace hoisting with strict isolation
- Packages declare explicit deps; no implicit hoisting leakage
- `.npmrc` sets `shamefully-hoist=false` to enforce clean boundaries

---

## 3. Folder Structure

```
grovia-platform/
├── apps/
│   ├── storefront/          # Customer-facing ecommerce (Next.js App Router)
│   │   ├── app/
│   │   │   ├── (shop)/      # Public shop routes
│   │   │   ├── (checkout)/  # Checkout flow routes
│   │   │   ├── account/     # Authenticated customer routes
│   │   │   └── api/         # Next.js route handlers (BFF thin layer)
│   │   ├── components/      # Storefront-specific components
│   │   ├── hooks/           # Storefront-specific hooks
│   │   ├── stores/          # Zustand stores (cart, ui state)
│   │   ├── lib/             # Storefront utilities, API client
│   │   └── public/
│   │
│   ├── admin/               # Admin dashboard (Next.js App Router)
│   │   ├── app/
│   │   │   ├── (dashboard)/ # Admin route group
│   │   │   └── api/         # Admin-specific route handlers
│   │   ├── components/      # Admin-specific components
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── lib/
│   │
│   ├── vendor/              # Vendor dashboard (Next.js App Router)
│   │   ├── app/
│   │   │   ├── (dashboard)/
│   │   │   └── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── lib/
│   │
│   ├── api/                 # Backend API (Node.js / Express or Fastify)
│   │   ├── src/
│   │   │   ├── modules/     # Domain modules (products, orders, users, ...)
│   │   │   │   └── products/
│   │   │   │       ├── products.controller.ts
│   │   │   │       ├── products.service.ts
│   │   │   │       ├── products.model.ts
│   │   │   │       └── products.routes.ts
│   │   │   ├── middleware/  # Auth, rate-limit, tenant, error
│   │   │   ├── queues/      # BullMQ job definitions and processors
│   │   │   ├── lib/         # DB connection, Redis, config bootstrap
│   │   │   └── app.ts
│   │   └── Dockerfile
│   │
│   └── docs/                # Internal docs site (optional, Nextra/MDX)
│
├── packages/
│   ├── ui/                  # Reusable React components
│   ├── theme/               # Design tokens + theme engine
│   ├── auth/                # Auth utilities (session, JWT, helpers)
│   ├── types/               # Shared TypeScript types and interfaces
│   ├── validation/          # Zod schemas (shared across API + frontend)
│   ├── config/              # Global config system (tenant-aware)
│   ├── shared/              # Constants, formatters, helpers
│   └── utils/               # Pure utility functions
│
├── docs/
│   ├── architecture/
│   ├── decisions/           # ADRs
│   ├── phases/
│   └── audits/
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── CLAUDE.md
```

---

## 4. Package Boundaries & Dependency Graph

### Package Dependency Rules

```
RULE: Dependencies only flow downward. Never upward. Never circular.

apps/* → can import from packages/*
packages/* → can only import from packages/* at lower layers
```

### Dependency Layers (top → bottom)

```
Layer 4 (Apps)
  storefront | admin | vendor | api

Layer 3 (Feature Packages)
  ui | auth

Layer 2 (Domain Packages)
  config | validation | shared

Layer 1 (Foundation Packages)
  types | utils
```

### Dependency Graph

```
storefront ──→ ui, theme, auth, types, validation, config, shared, utils
admin      ──→ ui, theme, auth, types, validation, config, shared, utils
vendor     ──→ ui, theme, auth, types, validation, config, shared, utils
api        ──→ types, validation, config, shared, utils

ui         ──→ theme, types, utils
auth       ──→ types, utils, config
config     ──→ types, utils
validation ──→ types
shared     ──→ types, utils
theme      ──→ types
utils      ──→ (no internal deps — pure functions only)
types      ──→ (no internal deps — type definitions only)
```

### Package Contracts

#### `packages/types`
```typescript
// Exports: all shared TypeScript interfaces and enums
export type { Product, Order, User, Vendor, Tenant, CartItem, ... }
export enum { OrderStatus, UserRole, ProductStatus, ... }
// No runtime code. Type-only exports.
```

#### `packages/utils`
```typescript
// Exports: pure, stateless utility functions
export { formatCurrency, formatDate, slugify, generateId, ... }
// No side effects. No external dependencies.
```

#### `packages/validation`
```typescript
// Exports: Zod schemas — used by both API (server) and frontend (client)
export { ProductSchema, OrderSchema, CreateUserSchema, ... }
export type { ProductInput, OrderInput, CreateUserInput, ... }
// Inferred types are re-exported for convenience.
```

#### `packages/config`
```typescript
// Exports: tenant-aware config loader and typed config shapes
export { getConfig, getTenantConfig } from './config'
export type { AppConfig, TenantConfig, FeatureFlags } from './types'
// Config is environment-driven. No hardcoded values.
```

#### `packages/shared`
```typescript
// Exports: cross-cutting constants, domain-specific helpers
export { ROUTES, API_ENDPOINTS, ORDER_STATUSES, CURRENCIES } from './constants'
export { buildApiUrl, parseApiError, ... } from './helpers'
```

#### `packages/theme`
```typescript
// Exports: design tokens, Tailwind config extension, CSS variables
export { tokens } from './tokens'            // semantic token map
export { tailwindPreset } from './tailwind'  // Tailwind preset
export type { ThemeConfig, ColorScale } from './types'
// No React dependency. Pure CSS/JSON config.
```

#### `packages/ui`
```typescript
// Exports: React component library built on shadcn/ui + Radix
export { Button, Input, Card, Modal, ... } from './components'
export { useToast, useDialog } from './hooks'
// Depends on: theme (for tokens), types, utils
// Peer deps: react, react-dom, tailwind
```

#### `packages/auth`
```typescript
// Exports: auth helpers, session utilities, role guards
export { createSession, validateToken, hashPassword } from './server'  // server-only
export { useAuth, AuthGuard, withAuth } from './client'               // client-safe
export type { Session, AuthUser, Permission } from './types'
// Server exports must be tree-shakeable from client bundles.
```

---

## 5. App Responsibility Boundaries

### `apps/storefront` — Customer Storefront

**Owns:**
- Product discovery (catalog, search, filters, PDP)
- Shopping cart (client-side Zustand, server-validated on checkout)
- Checkout flow (address, payment, order confirmation)
- Customer account (orders, profile, addresses, wishlists)
- Marketing pages (home, collections, promotions)

**Does NOT own:**
- Inventory management
- Order fulfillment
- Vendor onboarding
- Admin operations

**API surface:** Reads from `api` (products, catalog, promotions). Writes for cart events, orders, customer data.

**Rendering strategy:**
```
Static (ISR)  → product listing pages, category pages, home
Dynamic SSR   → product detail pages (stock/price accuracy)
Client-side   → cart, user account, checkout steps
```

---

### `apps/admin` — Platform Admin Dashboard

**Owns:**
- Platform-wide user management
- Vendor approval and oversight
- Order management and fulfilment triggers
- Product catalogue moderation
- Analytics and reporting
- Tenant/white-label configuration
- Feature flag management
- Content management (banners, promotions)

**Does NOT own:**
- Storefront presentation logic
- Vendor-specific inventory operations (delegates to vendor app)

**Rendering strategy:**
```
All CSR (SPA-mode)  → authenticated dashboard, no public pages
SSR where needed    → initial page load performance for large tables
```

---

### `apps/vendor` — Vendor Dashboard

**Owns:**
- Vendor profile and settings
- Product CRUD (vendor's own products)
- Inventory management
- Order management (vendor's orders)
- Payout and settlement views
- Analytics (vendor-scoped)

**Does NOT own:**
- Platform-wide data
- Other vendors' data
- Customer management

**Authorization:** All API calls include vendor-scoped JWT. API enforces data isolation.

---

### `apps/api` — Backend API Service

**Owns:**
- All data persistence (MongoDB via Mongoose)
- Business logic enforcement
- Authentication & token issuance
- Authorization (RBAC)
- Background job processing (BullMQ)
- Third-party integrations (payment, email, shipping)
- Webhook handling
- Admin and vendor data isolation

**Does NOT own:**
- UI rendering
- Client-side state
- Frontend routing

**Domain modules:**
```
modules/
├── auth/          # Login, register, token refresh, logout
├── users/         # Customer profiles
├── vendors/       # Vendor profiles, onboarding
├── products/      # Product CRUD, variants, media
├── categories/    # Category tree management
├── inventory/     # Stock tracking
├── orders/        # Order lifecycle, state machine
├── cart/          # Server-side cart (optional — for persistent carts)
├── payments/      # Payment intent, webhook handling
├── shipping/      # Carrier integration, rate calculation
├── notifications/ # Email, push, SMS triggers
├── tenants/       # Tenant/white-label config
├── analytics/     # Aggregated metrics endpoints
└── search/        # Search indexing, query
```

---

## 6. Auth Architecture

### Auth Flow

```
[Client] → POST /api/auth/login
         → API validates credentials
         → Issues: Access Token (JWT, 15min) + Refresh Token (opaque, 30d, stored in HttpOnly cookie)
         → Access Token stored in memory (not localStorage)

[Client] → Subsequent requests: Authorization: Bearer <access_token>
         → API validates JWT (stateless)

[Client] → Access token expires → POST /api/auth/refresh
         → API validates refresh token (Redis lookup)
         → Issues new access + refresh token pair (rotation)
```

### Token Strategy

| Token | Type | Storage | Expiry | Purpose |
|-------|------|---------|--------|---------|
| Access Token | JWT (signed) | Memory / React state | 15 min | API authorization |
| Refresh Token | Opaque UUID | HttpOnly cookie | 30 days | Token rotation |
| Session (SSR) | Encrypted cookie | Next.js cookie | 7 days | SSR-safe session |

### RBAC Model

```typescript
enum UserRole {
  CUSTOMER  = 'customer',    // storefront access only
  VENDOR    = 'vendor',      // vendor dashboard + own resources
  ADMIN     = 'admin',       // admin dashboard + platform resources
  SUPERADMIN = 'superadmin', // tenant management (future SaaS)
}
```

**Permission enforcement:**
- API middleware checks role from JWT on every protected route
- Vendor-scoped routes additionally check `req.user.vendorId === resource.vendorId`
- Frontend route guards (`AuthGuard` from `packages/auth`) protect dashboard pages

### `packages/auth` Split

```
packages/auth/
├── server/     # hashPassword, verifyPassword, signJWT, verifyJWT, createSession
├── client/     # useAuth hook, AuthGuard component, withAuth HOC
├── types.ts    # Session, AuthUser, Permission types
└── index.ts    # Re-exports with tree-shaking safety
```

Server exports must never be imported in client bundles. Next.js server-only package enforces this at build time.

---

## 7. API Architecture

### Framework Choice

**Express** (pragmatic, well-understood) or **Fastify** (higher throughput, schema validation built-in).  
Recommendation: **Fastify** — native JSON schema validation, plugin system, and 2× Express throughput under load.

### Module Structure (Domain-Driven)

Each module is self-contained:
```
modules/products/
├── products.routes.ts      # Route registration + middleware chain
├── products.controller.ts  # Request parsing, response formatting
├── products.service.ts     # Business logic (pure, testable)
├── products.model.ts       # Mongoose model + schema
└── products.types.ts       # Module-local types (extends packages/types)
```

### Middleware Stack

```
Request → [rate-limiter] → [cors] → [auth] → [tenant] → [rbac] → [controller]
```

| Middleware | Purpose |
|------------|---------|
| `rate-limiter` | Redis-backed rate limiting per IP/user |
| `cors` | Origin whitelist (tenant-aware) |
| `auth` | JWT verification, attaches `req.user` |
| `tenant` | Resolves tenant from domain/header, attaches `req.tenant` |
| `rbac` | Role and permission check for route |

### Background Jobs (BullMQ)

```
queues/
├── email.queue.ts         # Transactional emails (order confirm, welcome)
├── inventory.queue.ts     # Stock reservation, restock alerts
├── notification.queue.ts  # Push notifications
├── analytics.queue.ts     # Event aggregation
└── webhook.queue.ts       # Outbound webhooks to vendors
```

Jobs are defined in `api`, processed by workers in the same service (initially). Workers can be extracted to a separate process as load grows.

### Database Strategy (MongoDB)

**Connection:** Single Mongoose connection pool with `maxPoolSize: 10` (tunable).

**Multi-tenancy at DB level (Phase 1):** Tenant field on every document. Application-level filtering via `tenant` middleware.

**Multi-tenancy at DB level (Phase 2 SaaS):** Database-per-tenant for full isolation. Mongoose connection switching per request.

**Indexes strategy:**
- Compound indexes on `{ tenantId, status }` for all domain collections
- Text indexes on `products` for search
- TTL index on sessions collection

**Schema conventions:**
```typescript
// Every tenant-scoped model includes:
tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true }
createdAt: Date  // auto via timestamps: true
updatedAt: Date
```

---

## 8. Frontend Architecture

### Rendering Strategy Matrix

| Page Type | Strategy | Reason |
|-----------|---------|--------|
| Home / Collections | ISR (revalidate: 60s) | Marketing content changes slowly |
| Category pages | ISR (revalidate: 30s) | Product lists change moderately |
| Product detail | SSR | Price/stock must be fresh |
| Search results | SSR or CSR | Query-dependent, personalized |
| Cart / Checkout | CSR | User-specific, real-time |
| Account pages | CSR (behind auth) | Fully personalized |
| Admin dashboard | CSR | No SEO requirement, SPA behavior |
| Vendor dashboard | CSR | No SEO requirement |

### Data Fetching Pattern

```
Server Components (RSC)  → for initial page data, static content
TanStack Query           → for client-side data fetching, caching, mutations
Server Actions           → for form submissions (where appropriate)
Route Handlers (api/)    → thin BFF proxies, no business logic
```

### API Client Pattern

Each app defines a typed API client:
```typescript
// apps/storefront/lib/api-client.ts
const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  getToken: () => store.getState().auth.accessToken,
})
```

`createApiClient` lives in `packages/shared` — a thin fetch wrapper with token injection, error normalization, and retry logic.

### Component Hierarchy

```
apps/storefront/
  └── app/                          # Next.js layouts and pages (route segments)
      └── (shop)/products/[slug]/
          └── page.tsx              # RSC — fetches initial data
              └── ProductDetail     # Client component — interactive
                  ├── ProductGallery
                  ├── ProductInfo
                  │   ├── AddToCart (Zustand write)
                  │   └── WishlistToggle
                  └── RelatedProducts (TanStack Query — lazy)

packages/ui/
  └── components/
      ├── Button, Input, Card, ...  # Base design system components
      ├── ProductCard               # Shared across storefront + admin previews
      └── DataTable                 # Used by admin and vendor dashboards
```

---

## 9. Theme Architecture

### Design Token System

```
packages/theme/
├── tokens/
│   ├── colors.ts      # Brand palette, semantic color map
│   ├── typography.ts  # Font families, scales, weights
│   ├── spacing.ts     # Spacing scale
│   ├── radii.ts       # Border radius scale
│   ├── shadows.ts     # Shadow tokens
│   └── index.ts       # Aggregated token export
├── tailwind/
│   └── preset.ts      # Tailwind preset consuming tokens
├── css/
│   └── variables.css  # CSS custom properties (--color-primary, ...)
└── types.ts
```

### White-label Token Override

Tenants override the base token set via `TenantConfig`:
```typescript
interface TenantConfig {
  branding: {
    colors: Partial<ColorTokens>  // override primary, secondary, accent
    logo: string                  // URL
    favicon: string
    fonts?: { heading?: string; body?: string }
  }
}
```

At runtime, the storefront reads `TenantConfig` from `packages/config` and generates a CSS variable override block injected into `<head>`. This enables per-tenant theming with zero JavaScript overhead on the client.

### Dark/Light Mode

- CSS custom properties drive all semantic colors
- `data-theme="dark"` on `<html>` swaps the variable set
- shadcn/ui's built-in theming wired to the token system
- `next-themes` handles system preference detection

---

## 10. State Management Strategy

### Principle: Minimal Global State

Global state is reserved for cross-cutting concerns. Server state lives in TanStack Query. URL state lives in the URL. Local state lives in components.

### State Responsibilities

| State Type | Tool | Scope | Examples |
|-----------|------|-------|---------|
| Server state | TanStack Query | Global cache | Products, orders, user profile |
| Cart state | Zustand | Global | Cart items, totals |
| UI state | Zustand | Global | Sidebar open, toast queue |
| Auth state | Zustand | Global | Current user, access token |
| Form state | React Hook Form | Local | Checkout forms, product forms |
| URL state | Next.js router | URL | Filters, pagination, search query |

### Zustand Store Design

```typescript
// apps/storefront/stores/cart.store.ts
interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, qty: number) => void
  clear: () => void
}

// Middleware: persist to localStorage (client only), devtools in dev
const useCartStore = create<CartStore>()(
  persist(devtools(cartSlice), { name: 'grovia-cart' })
)
```

```typescript
// apps/storefront/stores/ui.store.ts
interface UiStore {
  cartOpen: boolean
  mobileMenuOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleMobileMenu: () => void
}
```

### TanStack Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,         // 1 min before refetch
      gcTime: 5 * 60_000,        // 5 min cache retention
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

---

## 11. Deployment Strategy

### Phase 1: Monolithic Deployment (Launch)

```
┌──────────────────────────────────────────┐
│            Vercel / Railway               │
│                                          │
│  storefront  ──→  Vercel (Next.js)       │
│  admin       ──→  Vercel (Next.js)       │
│  vendor      ──→  Vercel (Next.js)       │
│  api         ──→  Railway / Render       │
│                                          │
│  MongoDB     ──→  MongoDB Atlas (M10+)   │
│  Redis       ──→  Upstash / Redis Cloud  │
│  Media       ──→  Cloudflare R2 / S3     │
└──────────────────────────────────────────┘
```

### Phase 2: Containerized Deployment (Scale)

```
┌────────────────────────────────────────────────┐
│                    Kubernetes                   │
│                                                │
│  ┌─────────┐  ┌───────┐  ┌────────┐           │
│  │   api   │  │workers│  │ cron   │           │
│  │ (3 pods)│  │(2 pods│  │(1 pod) │           │
│  └────┬────┘  └───┬───┘  └───┬────┘           │
│       └──────────┬┘          │                 │
│               Redis          MongoDB Atlas      │
│              (cluster)       (replica set)      │
│                                                │
│  CDN (Cloudflare) → Next.js apps (Vercel/K8s)  │
└────────────────────────────────────────────────┘
```

### Environment Configuration

```
.env.local          # Local development
.env.staging        # Staging environment
.env.production     # Production (secrets in vault, not committed)
```

Environment variables are typed and validated at startup via `packages/config` using Zod.

### CI/CD Pipeline

```
push to main
  → turbo run lint check-types test
  → turbo run build
  → deploy api (Railway/K8s)
  → deploy storefront (Vercel)
  → deploy admin (Vercel)
  → deploy vendor (Vercel)
  → run smoke tests
```

---

## 12. Scalability Analysis

### Package Scalability

| Risk | Severity | Mitigation |
|------|---------|-----------|
| `packages/ui` grows bloated | Medium | Split into `ui-core` and `ui-commerce` if >50 components |
| `packages/types` becomes a dumping ground | High | Enforce: only types that cross 2+ packages belong here |
| `packages/validation` schema drift from API | High | Single source of truth: schemas live in `validation`, API and frontend both import |
| Circular dependency creep | High | Automated check via `madge` in CI |

### API Scalability

| Concern | Mitigation |
|---------|-----------|
| Single API process bottleneck | Horizontal scaling (stateless JWT, Redis session) |
| Background jobs choking API | Extract BullMQ workers to separate process |
| MongoDB read contention | Read replicas for analytics, secondary reads |
| Search at scale | Replace MongoDB text search with Elasticsearch/Typesense at 100k+ products |
| File uploads | Stream directly to object storage (R2/S3), never through API process |

### Frontend Scalability

| Concern | Mitigation |
|---------|-----------|
| Build times grow with pages | Turborepo incremental builds + Vercel ISR |
| Bundle size | Per-app code splitting, dynamic imports for heavy components |
| TanStack Query cache memory | Bounded `gcTime`, manual cache invalidation on mutations |

### Data Architecture Scalability

```
Phase 1 (0–50k orders/month):
  → Single MongoDB Atlas cluster (M10)
  → All tenants in shared collections, filtered by tenantId
  → Redis single node for sessions + queues

Phase 2 (50k–500k orders/month):
  → MongoDB Atlas M30+ with replica set
  → Redis cluster (3 shards)
  → Separate analytics DB (read replica or ClickHouse)

Phase 3 (500k+ orders/month, SaaS):
  → DB-per-tenant strategy
  → Connection pooling via PgBouncer-equivalent for Mongo
  → Event-driven architecture for cross-module communication
```

### Bottlenecks to Watch

1. **Checkout throughput** — payment provider rate limits, inventory contention
2. **Media delivery** — unoptimized images; mitigate with CDN + Next.js Image
3. **Search latency** — MongoDB text search degrades; replace early with Typesense
4. **Vendor dashboard queries** — aggregations over large order sets; add indexes + pagination

---

## 13. Implementation Order

### Phase 0: Platform Foundation

Goal: Working monorepo with typed packages and dev tooling.

```
1. Configure Turborepo tasks (build, dev, lint, check-types, test)
2. Set up packages/types       → shared TypeScript types
3. Set up packages/utils       → pure utility functions
4. Set up packages/validation  → Zod schemas (empty, grow with features)
5. Set up packages/config      → environment config loader
6. Set up packages/shared      → constants, helpers
7. Set up packages/theme       → design tokens, Tailwind preset
8. Set up packages/ui          → shadcn/ui base, Button, Input, Card
9. Set up packages/auth        → JWT utilities, session helpers
10. Scaffold apps/api           → Fastify app, DB connection, health route
11. Scaffold apps/storefront    → Next.js App Router, theme wired
12. Scaffold apps/admin         → Next.js App Router, theme wired
13. Scaffold apps/vendor        → Next.js App Router, theme wired
```

### Phase 1: Auth & User System

```
1. Auth module in api (register, login, refresh, logout)
2. MongoDB user model
3. JWT + refresh token flow
4. Auth state in packages/auth client
5. Login/register pages in storefront
6. AuthGuard on admin and vendor routes
```

### Phase 2: Product Catalog

```
1. Product model + schema (api)
2. Category model + tree
3. Product CRUD endpoints (admin-gated)
4. Vendor product endpoints (vendor-scoped)
5. Storefront product listing (ISR)
6. Product detail page (SSR)
```

### Phase 3: Cart & Checkout

```
1. Zustand cart store (storefront)
2. Cart UI (drawer, mini-cart)
3. Checkout flow (address → shipping → payment → confirmation)
4. Order model and creation endpoint
5. Payment integration (Stripe)
6. Order confirmation email (BullMQ + email queue)
```

### Phase 4: Vendor & Marketplace

```
1. Vendor onboarding flow
2. Vendor product management
3. Vendor order management
4. Commission calculation
5. Payout management
```

### Phase 5: White-label & SaaS

```
1. Tenant model and config system
2. Domain-to-tenant resolution
3. Per-tenant token overrides
4. Feature flag system
5. Tenant onboarding flow
6. Billing integration
```

---

## 14. Architecture Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Package boundary violations (direct imports across layers) | High | High | ESLint `no-restricted-imports` + `madge` CI check |
| `packages/types` becomes too broad, causing churn | Medium | High | Only types shared across 2+ packages; local types stay local |
| Auth token leakage (access token in localStorage) | Medium | Critical | Store in memory only; refresh token in HttpOnly cookie |
| MongoDB schema drift (no migrations) | High | Medium | Mongoose schema versioning strategy; migration scripts tracked in `api/migrations/` |
| Vendor data isolation bug (tenant/vendor ID not enforced) | Low | Critical | Middleware-enforced, integration tests for all vendor routes |
| Bundle bloat from `packages/ui` | Medium | Medium | Barrel export audit; use named imports only |
| Over-engineering shared packages early | Medium | Medium | Build packages only when second consumer exists — avoid premature abstraction |

---

## 15. Future SaaS Evolution

### SaaS Readiness Checklist

The current architecture is designed to evolve toward SaaS with minimal structural change:

| Capability | Phase 1 State | SaaS Target |
|-----------|--------------|-------------|
| Multi-tenancy | `tenantId` field on models | DB-per-tenant option |
| White-labeling | Token overrides via config | Full per-tenant domain + branding |
| Feature flags | Config-driven | Per-tenant flag management |
| Billing | N/A | Stripe Billing, per-tenant subscription |
| Tenant onboarding | Manual | Self-serve signup flow |
| Tenant isolation | App-level filter | DB-level isolation + row security |
| Analytics | Shared dashboard | Per-tenant analytics portal |

### SaaS Evolution Steps

```
Step 1: Tenant config system (packages/config)
  → TenantConfig schema with branding, features, limits
  → Config loaded per request from DB + cache (Redis)

Step 2: Self-serve tenant onboarding
  → Signup flow → provisioning worker → tenant record created
  → Default config seeded from template

Step 3: Billing integration
  → Stripe Billing (subscriptions, usage-based)
  → Usage events emitted from API → Stripe metered billing

Step 4: DB isolation (when needed)
  → Switch from tenantId filter to connection-per-tenant
  → Connection pool manager in api/lib/db.ts

Step 5: Tenant admin portal
  → New app: apps/tenant-admin
  → Tenant owners manage their own configuration, users, branding
```

### Event-Driven Path

As the platform grows, replace direct service calls with events:

```
Order placed
  → OrderCreatedEvent → [inventory reserved] [email sent] [analytics logged] [vendor notified]

Current:  synchronous service calls in orders.service.ts
Future:   BullMQ event bus → each consumer independent
```

This enables extracting services independently without changing call sites.

---

## Appendix A: Package Conventions

Every package follows this structure:
```
packages/<name>/
├── src/
│   ├── index.ts          # Public exports only (barrel)
│   └── ...               # Internal implementation
├── package.json
└── tsconfig.json
```

`package.json` template:
```json
{
  "name": "@grovia/<name>",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "check-types": "tsc --noEmit",
    "lint": "eslint src/"
  }
}
```

- Use `@grovia/` namespace for all internal packages
- All exports go through `src/index.ts` — no deep imports
- No barrel re-exports of implementation details

---

## Appendix B: Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Package name | `@grovia/<name>` | `@grovia/ui` |
| File names | kebab-case | `product-card.tsx` |
| Components | PascalCase | `ProductCard` |
| Hooks | camelCase, `use` prefix | `useCartStore` |
| API routes | kebab-case | `/api/v1/product-variants` |
| Env vars | UPPER_SNAKE_CASE | `NEXT_PUBLIC_API_URL` |
| Mongo collections | camelCase plural | `products`, `orderItems` |
| Zod schemas | PascalCase + `Schema` suffix | `ProductSchema` |

---

*Generated by architecture-planning + package-design + scalability-audit skills.*  
*Review and update this document when structural decisions change.*
