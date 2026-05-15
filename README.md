# napirest

A Bun-powered REST API backend with a Preact web frontend, backed by [`dbobj-napi`](https://npmjs.com/package/dbobj-napi) — a high-performance, NAPI-native embedded database.

---

## Overview

napirest is a full-stack starter that combines:

- **Backend** — TypeScript + [Hono](https://hono.dev) REST API running on [Bun](https://bun.sh)
- **Frontend** — [Preact](https://preactjs.com) + [Vite](https://vite.dev) + [TailwindCSS](https://tailwindcss.com)
- **Database** — [`dbobj-napi`](https://npmjs.com/package/dbobj-napi), a C-backed NAPI embedded database (file or in-memory)

The backend auto-initialises all tables on first run, provides full CRUD, JWT authentication, and exposes a Reels endpoint. The bundled frontend (`web/`) is a Reels Creator UI served from the same server.

---

## Architecture

```
napirest/
├── src/
│   ├── server.ts              # App entrypoint & Hono routes
│   ├── db/
│   │   ├── index.ts           # Database initialisation (app.dbobj)
│   │   ├── schema.ts          # Top-level schema list + initSchema()
│   │   └── schemas/           # Per-table schema definitions
│   ├── routes/
│   │   ├── index.ts           # Route barrel exports
│   │   ├── v1.ts              # /api/v1 router (v1 entry point)
│   │   ├── tables.ts          # /api/v1/tables — table metadata
│   │   ├── crud.ts            # /api/v1/{table} — generic CRUD
│   │   ├── auth.ts            # /api/v1/auth — register / login / me
│   │   └── reels.ts           # /api/v1/reels — JWT-protected Reels CRUD
│   ├── utils/
│   │   └── db.ts              # SQL helpers (quoteValue, getNextId, …)
│   └── __tests__/             # Bun test suite
├── web/                       # Preact + Vite + Tailwind frontend
│   ├── src/
│   │   ├── app.tsx            # Preact app root
│   │   ├── main.tsx           # Entry point
│   │   ├── components/        # Navbar, Router
│   │   ├── pages/             # Login, Register, Reels, CreateReel
│   │   └── hooks/useAuth.tsx  # Auth state + token management
│   └── dist/                  # Production build (served by backend)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Runtime   | [Bun](https://bun.sh) v1.3+ |
| API        | [Hono](https://hono.dev) 4.x |
| Database  | [dbobj-napi](https://npmjs.com/package/dbobj-napi) 0.2.x |
| JWT       | [webtoken-rs](https://npmjs.com/package/webtoken-rs) |
| Frontend  | Preact 10 + Vite 6 + TailwindCSS 3 |
| Testing   | [Bun Test](https://bun.sh/docs/api#testing) |

---

## Prerequisites

- **Bun** ≥ 1.3.13 — install from https://bun.sh
- **Node.js** is *not* required; Bun is a self-contained runtime.

---

## Getting Started

### Install dependencies

```bash
bun install
```

### Run the backend server

```bash
bun run dev
# or
bun start
```

Server starts at **http://localhost:3000** by default.

### Development (watch mode)

```bash
bun run dev
```

The `dev` script watches `src/server.ts` and restarts on change.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AUTH_SECRET` | `your-32-character-secret-key-1234` | JWT signing secret. **Change this in production.** |
| `DB_PATH` | `app.dbobj` | Path to the dbobj database file |

Create a `.env` file at the project root to override defaults:

```bash
AUTH_SECRET=your-super-secret-key-at-least-32-chars
DB_PATH=./data/app.dbobj
```

> ⚠️ The database file (`*.dbobj`) is not checked into version control (see `.gitignore`).

---

## Database Schema

Tables are auto-created on server start by [`initSchema()`](src/db/schema.ts:39).

| Table | Key Columns |
|---|---|
| `users` | `id`, `name`, `email`, `password`, `age`, `active`, `created_at` |
| `categories` | `id`, `name`, `description`, `parent_id`, `created_at` |
| `products` | `id`, `name`, `description`, `price`, `category_id`, `stock`, `created_at` |
| `orders` | `id`, `user_id`, `total`, `status`, `address`, `created_at` |
| `order_items` | `id`, `order_id`, `product_id`, `quantity`, `price`, `created_at` |
| `posts` | `id`, `user_id`, `title`, `slug`, `content`, `published`, `created_at` |
| `comments` | `id`, `post_id`, `user_id`, `content`, `created_at` |
| `tags` | `id`, `name` |
| `post_tags` | `id`, `post_id`, `tag_id` |
| `sessions` | `id`, `user_id`, `token`, `expires_at`, `created_at` |
| `reels` | `id`, `user_id`, `title`, `description`, `video_url`, `thumbnail_url`, `views`, `created_at` |

Non-`id` columns receive a default index; `email`, `slug`, and `token` columns receive a **unique** index automatically.

---

## API Reference

### Root

```
GET /
```

Returns API info and the list of current tables.

---

### Tables (`/api/v1/tables`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/tables` | List all tables and their metadata |
| `GET` | `/api/v1/tables/:name` | Get metadata + columns for a specific table |

---

### Generic CRUD (`/api/v1/{table}`)

All table names match the schema list above. IDs are 1-indexed integers.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/{table}?limit=100&offset=0` | List rows (paginated) |
| `GET` | `/api/v1/{table}/{id}` | Get a single row by ID |
| `POST` | `/api/v1/{table}` | Create a new row (omit `id` to auto-assign) |
| `PUT` | `/api/v1/{table}/{id}` | Update a row by ID |
| `DELETE` | `/api/v1/{table}/{id}` | Delete a row by ID |

---

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Register a new user |
| `POST` | `/api/v1/auth/login` | No | Log in; returns `{ user, token }` |
| `GET` | `/api/v1/auth/me` | Yes | Get current authenticated user |

#### Register

```json
POST /api/v1/auth/register
{ "email": "user@example.com", "password": "secret", "name": "Jane" }
```

#### Login

```json
POST /api/v1/auth/login
{ "email": "user@example.com", "password": "secret" }
```

Returns a JWT. Pass it as `Authorization: Bearer <token>` for protected routes.

---

### Reels (`/api/v1/reels`) — Protected

All endpoints require a valid JWT in the `Authorization` header. Users may only read, update, and delete their own reels.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/reels` | List current user's reels |
| `GET` | `/api/v1/reels/:id` | Get a specific reel |
| `POST` | `/api/v1/reels` | Create a new reel |
| `PUT` | `/api/v1/reels/:id` | Update a reel (owner only) |
| `DELETE` | `/api/v1/reels/:id` | Delete a reel (owner only) |

#### Create Reel

```json
POST /api/v1/reels
Headers: Authorization: Bearer <token>

{ "title": "My Reel", "video_url": "https://example.com/video.mp4", "description": "A great reel", "thumbnail_url": "https://example.com/thumb.jpg" }
```

---

## Frontend

The `web/` directory contains a **Preact** single-page app — a "Reels Creator" interface.

### Install frontend dependencies

```bash
cd web && bun install
```

### Frontend scripts

```bash
cd web
bun run dev       # Start Vite dev server
bun run build     # Production build → web/dist/
bun run preview   # Preview production build
```

The production build is served at the root by the backend server:

```typescript
// src/server.ts:19-20
app.use("/assets/*", serveStatic({ root: "./web/dist" }));
app.get("/*", serveStatic({ path: "./web/dist/index.html" }));
```

---

## Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `bun run src/server.ts` | Start the API server (watch mode) |
| `start` | `bun run src/server.ts` | Start the API server |
| `test` | `bun test` | Run the test suite |
| `test:watch` | `bun test --watch` | Run tests in watch mode |
| `bench` | `bun run src/benchmark.ts` | Run database benchmark |
| `typecheck` | `tsc --noEmit` | Type-check without emitting |

---

## Testing

Tests run with **Bun's built-in test runner** — no extra setup required.

```bash
bun test
```

The suite covers:

- Root endpoint response
- Tables API (list, detail, missing table)
- CRUD operations (list, read, create, update, delete, invalid table)
- Invalid route handling

Test file: `src/__tests__/api.test.ts`

---

## Security Notes

- The default `AUTH_SECRET` is **not secure for production**. Override it with a long, random value.
- Passwords are hashed with **scrypt** via `webtoken-rs`.
- JWT expiry is set to **3600 seconds (1 hour)** — adjust `TOKEN_EXPIRY` in `src/routes/auth.ts` and `src/routes/reels.ts` as needed.
- The Reels router protects data ownership: only the reel's owner can update or delete it (`src/routes/reels.ts:68`, `src/routes/reels.ts:92`).

---

## License

Private.
