# 🏘️ NeighbourLink

**Your Neighborhood, Connected**

NeighbourLink is a hyperlocal directory and community platform that connects residents to verified local service vendors, essential emergency services, and their neighbors — all within a configurable radius from their location.

The project is structured as a **modern, deployment-friendly monorepo** separating the Next.js UI frontend and the Fastify + tRPC backend.

---

## 🏛️ Monorepo Architecture

```
neighbourlink/
├── frontend/                   # Standalone Next.js 16 (React 19) UI application
│   ├── src/
│   │   ├── app/                # Next.js App Router (pages & layouts)
│   │   ├── components/         # Reusable UI, map, auth & layout components
│   │   └── lib/                # Client utilities, auth context & tRPC client
│   ├── Dockerfile              # Multi-stage production container
│   ├── next.config.ts          # Standalone output & security headers
│   └── package.json
│
├── backend/                    # Standalone Fastify + tRPC + Sequelize server
│   ├── src/
│   │   ├── config/             # Sequelize CLI dynamic database config
│   │   ├── lib/                # Database models, Redis, BullMQ, Meilisearch, storage
│   │   ├── migrations/         # Database migrations
│   │   ├── routers/            # 19 tRPC routers (vendors, bookings, reviews, etc.)
│   │   ├── routes/             # REST routes (auth JWT login/register, upload, health)
│   │   ├── index.ts            # Fastify server bootstrap & CORS setup
│   │   └── trpc.ts             # tRPC initialization & JWT context middleware
│   ├── Dockerfile              # Multi-stage production container with health checks
│   └── package.json
│
├── docker-compose.yml          # Full deployment stack (frontend, backend, mysql, redis, meilisearch, minio)
├── .env.example                # Root environment template
└── package.json                # Root workspace configuration
```

---

## 🛠️ Tech Stack

| Layer | Frontend (`frontend/`) | Backend (`backend/`) |
|---|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 | Fastify 5 |
| **Language** | TypeScript 5 | TypeScript 5 (ESM) |
| **API Protocol** | tRPC v11 Client + TanStack Query | tRPC v11 Server + Fastify Adapter |
| **Authentication** | Client JWT session context & tokens | JWT verification & crypto password hashing |
| **Database** | — | MySQL 8 via Sequelize 6 ORM |
| **Search Engine** | — | Meilisearch |
| **Queues / Cache** | — | Redis + BullMQ (asynchronous rating compute) |
| **File Storage** | MinIO / S3 Client resolver | AWS SDK v3 / MinIO S3-compatible storage |
| **Styling & UI** | Tailwind CSS 4, Framer Motion, Lucide | — |
| **Maps** | Leaflet + React Leaflet | Haversine distance computations |

---

## 🚀 Quick Start (Development)

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 9
- **Docker** (optional, for running auxiliary databases and cache services)

### 1. Install Monorepo Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
# Backend environment configuration
cp backend/.env.example backend/.env

# Frontend environment configuration
cp frontend/.env.example frontend/.env.local
```

### 3. Start Auxiliary Services (Docker)

To run MySQL, Redis, Meilisearch, and MinIO:

```bash
docker compose up -d mysql redis meilisearch minio
```

### 4. Run Development Servers

Run backend and frontend concurrently or independently:

```bash
# Start backend (http://localhost:4000)
npm run dev:backend

# Start frontend (http://localhost:3000)
npm run dev:frontend
```

---

## 📦 Production Builds & Verification

```bash
# Build both packages sequentially
npm run build

# Or build individually
npm run build:backend
npm run build:frontend
```

---

## 🐳 Docker Deployment

The entire stack is configured in [docker-compose.yml](file:///c:/Users/Hariprakash%20A/Desktop/New/neighbourlink/docker-compose.yml):

```bash
# Build and run all services in production mode
docker compose up --build -d
```

### Exposed Endpoints

| Service | Port | Description |
|---|---|---|
| **Frontend** | `http://localhost:3000` | Next.js Web UI |
| **Backend** | `http://localhost:4000` | Fastify API & tRPC server |
| **Backend Health** | `http://localhost:4000/health` | Automated health check endpoint |
| **MySQL** | `localhost:3306` | Primary database |
| **Redis** | `localhost:6379` | Cache & BullMQ job queue |
| **Meilisearch** | `http://localhost:7700` | Full-text search engine |
| **MinIO Console** | `http://localhost:9001` | Object storage management console |

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev:backend` | Start the backend with live reload (`tsx watch`) |
| `npm run dev:frontend` | Start Next.js development server with Turbopack |
| `npm run build` | Build both backend (`tsup`) and frontend (`next build`) |
| `npm run build:backend` | Build the backend into `dist/` |
| `npm run build:frontend` | Build the Next.js standalone frontend into `.next/` |
| `npm run start:backend` | Run the compiled production backend (`node dist/index.js`) |
| `npm run start:frontend` | Run the compiled production frontend (`next start`) |

---

## 👤 Author

**Hariprakash** — [@hariprakash0804](https://github.com/hariprakash0804)
