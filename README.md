# 🏘️ NeighborLink

**Your Neighborhood, Connected**

NeighborLink is a hyperlocal directory and community platform that connects residents to verified local service vendors, essential emergency services, and their neighbors — all within a configurable radius from their location.

> Enter your location once → get a living map of everything and everyone that serves your neighborhood — hospitals, entertainment, local vendors — with verified contact details, in-app booking, and a safe two-sided marketplace.

---

## ✨ Features

### 🔍 Service Directory & Discovery
- **Essential Services** — Hospitals, pharmacies, police stations, fire stations, ATMs, banks, schools, and entertainment venues mapped around your location
- **Vendor Marketplace** — Browse and book 13 categories of local service providers: newspaper, cable/DTH, milk delivery, LPG gas, water can, electrician, plumber, carpenter, AC technician, maid/cook, laundry, tutor, and more
- **Radius-based Search** — Filter services within 500m, 1km, 3km, or 5km of your address
- **Full-text Search** — Powered by Meilisearch for instant, typo-tolerant search across vendors and services
- **Vendor Comparison** — Side-by-side comparison of vendors on ratings, price, response time, and distance

### 📅 Booking & Reviews
- **In-app Booking** — Book vendor services with time-slot selection (pending → accepted → completed flow)
- **Ratings & Reviews** — 1–5 star rating system with written comments
- **Automatic Badge Tiers** — Vendors are promoted to "Top Rated" after 20+ reviews at 4.5★ average (computed via BullMQ background jobs)

### 💬 Communication
- **In-app Chat** — Direct messaging between residents and vendors with read receipts
- **Notifications** — Booking updates, new reviews, new messages, vendor verification, and system announcements

### 🏛️ Community
- **Bulletin Board** — Post announcements, lost & found, garage sales, and general community posts
- **Local Events** — Create and discover neighborhood events (festivals, meetings, notices)
- **Civic Reports** — Report civic issues (potholes, garbage, broken streetlights) with photo uploads and geo-tagging
- **Carpool** — Offer or find rides with seat counts and pricing
- **Jobs Board** — Post and find local gigs (cleaning, gardening, delivery, tutoring, pet care, babysitting)

### 🚨 Safety
- **SOS Emergency Button** — Always-visible floating SOS button with one-tap access to emergency numbers (Police 100, Ambulance 108, Fire 101, Women Help 1091, Emergency 112)
- **Content Moderation** — Automated profanity filtering and manual admin review
- **Report System** — Flag vendors, users, or reviews for admin review (OPEN → REVIEWING → RESOLVED/DISMISSED)

### 🛡️ Vendor Verification & Trust
- **Three-tier System** — Unverified → ID Verified → Top Rated
- **ID Document Upload** — Vendors upload identity documents via S3-compatible storage (MinIO)
- **Admin Verification** — Admins verify vendor identities through the admin panel

### 📊 Admin Panel
- **Vendor Management** — Approve/reject vendors, update verification tiers
- **Content Moderation** — Review and resolve flagged content
- **Audit Logs** — Full trail of admin actions with actor, action, target, and metadata

### 🎨 User Experience
- **Dark/Light Theme** — Toggle via `next-themes` with system preference detection
- **Responsive Design** — Desktop sidebar + mobile bottom navigation
- **Command Palette** — Keyboard-driven quick search (`Ctrl+K` / `Cmd+K`)
- **Onboarding Modal** — Welcome flow for new users
- **Scroll-to-Top** — Floating button for long pages
- **Quick Actions FAB** — Mobile floating action button for common tasks
- **Interactive Map** — Leaflet-powered map with vendor and service pins
- **Smooth Animations** — Framer Motion + GSAP powered transitions and micro-interactions

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) with React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + custom CSS variables |
| **Fonts** | Inter (body) + Outfit (headings) via `next/font` |
| **API Layer** | [tRPC v11](https://trpc.io) with React Query |
| **Authentication** | [NextAuth.js v5](https://authjs.dev) (phone + OTP credentials) |
| **Database** | MySQL via [Sequelize v6](https://sequelize.org) ORM |
| **Search** | [Meilisearch](https://www.meilisearch.com) |
| **Caching / Queues** | Redis (ioredis) + [BullMQ](https://bullmq.io) |
| **Object Storage** | S3-compatible (MinIO for dev) via AWS SDK v3 |
| **Maps** | [Leaflet](https://leafletjs.com) + React Leaflet |
| **Animations** | Framer Motion + GSAP |
| **Icons** | Lucide React |
| **Validation** | Zod v4 |
| **UI Utilities** | clsx, tailwind-merge, class-variance-authority |
| **React Compiler** | Enabled via `babel-plugin-react-compiler` |

---

## 📁 Project Structure

```
neighbourlink/
├── public/                     # Static assets (SVGs, favicon)
├── src/
│   ├── auth.ts                 # NextAuth configuration (phone OTP flow)
│   ├── app/
│   │   ├── layout.tsx          # Root layout (providers, navbar, sidebar, footer)
│   │   ├── page.tsx            # Landing page (hero, categories, stats)
│   │   ├── globals.css         # Global styles & CSS variables
│   │   ├── api/
│   │   │   ├── auth/           # NextAuth API route
│   │   │   ├── trpc/           # tRPC HTTP handler
│   │   │   └── upload/         # File upload endpoint
│   │   ├── about/              # About page
│   │   ├── admin/
│   │   │   ├── audit-logs/     # Admin audit log viewer
│   │   │   ├── moderation/     # Content moderation dashboard
│   │   │   └── vendors/        # Vendor management panel
│   │   ├── bookings/           # Booking management (resident view)
│   │   ├── chat/               # In-app messaging
│   │   ├── community/          # Bulletin board, events, civic reports
│   │   ├── compare/            # Vendor comparison tool
│   │   ├── deals/              # Vendor deals & discounts
│   │   ├── directory/          # Service directory (search, filter, map)
│   │   ├── favorites/          # Saved vendors
│   │   ├── history/            # Booking history
│   │   ├── notifications/      # Notification center
│   │   ├── privacy/            # Privacy policy
│   │   ├── profile/            # User profile management
│   │   ├── terms/              # Terms of service
│   │   └── vendor/
│   │       ├── [id]/           # Public vendor profile page
│   │       ├── dashboard/      # Vendor dashboard (manage bookings, reviews)
│   │       └── register/       # Vendor registration form
│   ├── components/
│   │   ├── auth/               # AuthModal (phone OTP login/signup)
│   │   ├── layout/             # Navbar, Sidebar, Footer, MobileBottomNav,
│   │   │                       #   CommandPalette, QuickActions, ScrollToTop
│   │   ├── location/           # LocationModal (address picker)
│   │   ├── map/                # LeafletMap, Map (dynamic import wrapper)
│   │   ├── onboarding/         # WelcomeModal
│   │   ├── providers/          # AuthProvider, TRPCProvider, ThemeProvider,
│   │   │                       #   ToastProvider
│   │   └── sos/                # SosButton (emergency floating action)
│   ├── lib/
│   │   ├── constants.ts        # Category metadata, badges, radius options,
│   │   │                       #   emergency numbers, app config
│   │   ├── db.ts               # Sequelize connection + auto-sync
│   │   ├── geocoding.ts        # Reverse geocoding utilities
│   │   ├── meilisearch.ts      # Meilisearch client + index management
│   │   ├── models.ts           # All Sequelize models & associations
│   │   ├── moderation.ts       # Content moderation / profanity filter
│   │   ├── otp.ts              # OTP generation & verification (Redis-backed)
│   │   ├── queue.ts            # BullMQ queue (rating recompute, badge tier)
│   │   ├── rate-limit.ts       # Redis-based API rate limiting
│   │   ├── redis.ts            # Redis (ioredis) client singleton
│   │   ├── seed.ts             # Sample data seeder for development
│   │   ├── storage-client.ts   # S3 (MinIO) client setup
│   │   ├── storage.ts          # File upload/download helpers
│   │   ├── trpc.ts             # tRPC client-side hook
│   │   └── utils.ts            # Shared utilities (cn, formatters, etc.)
│   └── server/
│       ├── trpc.ts             # tRPC server-side router + context + middleware
│       └── routers/
│           ├── _app.ts         # Root router (merges all sub-routers)
│           ├── admin.ts        # Admin operations
│           ├── auth.ts         # Auth procedures
│           ├── booking.ts      # Booking CRUD
│           ├── bulletin.ts     # Bulletin board CRUD
│           ├── carpool.ts      # Carpool CRUD
│           ├── chat.ts         # Messaging procedures
│           ├── civic.ts        # Civic reports CRUD
│           ├── deals.ts        # Deals & discounts
│           ├── directory.ts    # Directory search & listing
│           ├── events.ts       # Local events CRUD
│           ├── favorites.ts    # Favorite vendors
│           ├── jobs.ts         # Job posts CRUD
│           ├── location.ts     # Location & address management
│           ├── notifications.ts# Notification queries
│           ├── report.ts       # Report/flag system
│           ├── review.ts       # Review CRUD + rating recompute
│           ├── sos.ts          # SOS alert creation
│           └── vendor.ts       # Vendor registration, profile, dashboard
├── docker-compose.yml          # Dev services (Redis, MinIO, Meilisearch)
├── next.config.ts              # Next.js config (React Compiler, external packages)
├── tsconfig.json               # TypeScript config
├── eslint.config.mjs           # ESLint flat config
├── postcss.config.mjs          # PostCSS config (Tailwind)
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MySQL** 8+ running locally (default: `localhost:3306`)
- **Docker** (for auxiliary services)

### 1. Clone the Repository

```bash
git clone https://github.com/hariprakash0804/neighbourlink.git
cd neighbourlink
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Auxiliary Services

Redis, MinIO (S3-compatible storage), and Meilisearch are provided via Docker Compose:

```bash
docker-compose up -d
```

This starts:
| Service | Port | Purpose |
|---|---|---|
| Redis | 6379 | OTP storage, rate limiting, BullMQ job queue |
| MinIO | 9000 (API), 9001 (Console) | S3-compatible file storage for vendor documents |
| Meilisearch | 7700 | Full-text search engine |

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Database (MySQL)
DB_NAME=neighborlink
DB_USER=root
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=3306

# Redis
REDIS_URL=redis://localhost:6379

# MinIO / S3
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=neighborlink

# Meilisearch
MEILI_HOST=http://localhost:7700
MEILI_API_KEY=

# NextAuth
AUTH_SECRET=your-secret-key-here
AUTH_URL=http://localhost:3000

# App
NODE_ENV=development
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

> **Note:** The database tables are automatically created/synced on first request. Sample essential services (hospitals, police stations, etc.) are seeded automatically in development.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## 🗄️ Database Models

The app uses **17 Sequelize models** with full associations:

| Model | Purpose |
|---|---|
| `User` | Residents, vendors, and admins (roles: RESIDENT, VENDOR, ADMIN) |
| `Address` | User-saved locations with lat/lng and configurable radius |
| `Vendor` | Vendor profiles with category, location, pricing, working hours, ratings |
| `EssentialService` | Hospitals, pharmacies, police, fire, ATMs, banks, schools, entertainment |
| `Booking` | Service bookings (PENDING → ACCEPTED → COMPLETED) |
| `Review` | Vendor reviews with 1-5 star rating |
| `Report` | Flagged content reports (OPEN → REVIEWING → RESOLVED/DISMISSED) |
| `CivicReport` | Civic issue reports with photos and geo-tags |
| `AuditLog` | Admin action audit trail |
| `ChatMessage` | Direct messages between users |
| `BulletinPost` | Community bulletin board posts (announcements, lost & found, garage sales) |
| `LocalEvent` | Neighborhood events (festivals, meetings, notices) |
| `SosAlert` | Emergency SOS alerts with location |
| `Favorite` | Saved/bookmarked vendors |
| `Notification` | In-app notifications |
| `Deal` | Vendor discount offers with expiry |
| `Carpool` | Ride-sharing posts |
| `JobPost` | Local gig/job posts |

---

## 🔐 Authentication

Authentication uses **NextAuth.js v5** with a phone + OTP credential provider:

1. User enters their phone number
2. An OTP is generated and stored in Redis (with expiry)
3. User submits the OTP for verification
4. On success, a JWT session is created (30-day expiry)
5. New users are auto-registered as `RESIDENT` role

---

## 🏗️ Architecture

```
Client (React 19)
  ↕ tRPC (React Query)
Server (Next.js API Routes)
  ↕ tRPC Routers (18 routers)
  ↕ Sequelize ORM
MySQL Database
  + Redis (cache/queue/OTP)
  + Meilisearch (search)
  + MinIO (file storage)
```

- **Type-safe API** — tRPC ensures end-to-end type safety from client to server
- **Background Jobs** — BullMQ workers process rating recomputation and badge tier promotions asynchronously
- **Graceful Degradation** — Redis/BullMQ failures fall back to synchronous processing; the app works without auxiliary services for core features

---

## 📄 License

This project is private and not licensed for public distribution.

---

## 👤 Author

**Hariprakash** — [@hariprakash0804](https://github.com/hariprakash0804)
