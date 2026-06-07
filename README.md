# TalentDash — Full-Stack Trial Submission

India's compensation intelligence platform. Structured salary data for tech professionals, filterable by level, company, and city.

**Live pages:** `/` `/salaries` `/companies` `/companies/[slug]` `/compare`  
**API routes:** `POST /api/ingest-salary` `GET /api/salaries` `GET /api/companies/[slug]` `GET /api/compare`

---

## Running Locally (< 5 minutes)

```bash
# 1. Install
npm install

# 2. Start dev server (database auto-creates and seeds on first run)
npm run dev

# 3. Open
open http://localhost:3000
```

No `.env` needed for local development. The app uses **sql.js** (pure-JS SQLite) — no binary installs, no Prisma migrations, no external database.

---

## Environment Variables

For production with Neon PostgreSQL, add to `.env.local`:

```
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
```

The production path swaps `lib/db.ts` for `@prisma/client`. The Prisma schema is at `prisma/schema.prisma` and is production-ready.

---

## Project Structure

```
app/
  page.tsx                    # Homepage (ISR 1h)
  salaries/page.tsx           # Salary table (dynamic RSC + client filters)
  companies/page.tsx          # Companies list (static)
  companies/[slug]/page.tsx   # Company detail (SSG via generateStaticParams)
  compare/page.tsx            # Compare wrapper (static shell)
  compare/CompareClient.tsx   # Compare logic (client component)
  api/
    ingest-salary/route.ts    # POST — validate, normalise, store
    salaries/route.ts         # GET — paginated, filtered
    companies/[slug]/route.ts # GET — company + stats
    compare/route.ts          # GET — two records + delta

components/
  ui/
    Navbar.tsx
    LevelBadge.tsx
    SalaryCell.tsx
  features/
    SalaryTableClient.tsx     # Filter bar + table + pagination

lib/
  db.ts                       # sql.js database + seed (auto-init)
  currency.ts                 # Formatting + conversion
  levels.ts                   # Level enum, display names, badge colors
  normalize.ts                # Company name normalisation
  aliases.json                # Known company alias table

types/index.ts                # Full TypeScript interfaces matching integration contract
prisma/schema.prisma          # Production PostgreSQL schema
```

---

## Architecture Decisions

### Static vs ISR vs Dynamic

| Page | Strategy | Reason |
|---|---|---|
| `/` | ISR 1h | Changes daily (top salaries), too dynamic for full static |
| `/companies` | Static | Company list rarely changes |
| `/companies/[slug]` | SSG | `generateStaticParams` prebuilds one page per company at build time |
| `/compare` | Static shell + client | Combination pages can't be prebuilt; URL state drives client fetches |
| `/salaries` | Dynamic (RSC) | URL search params drive server-side query on each request |

### Why sql.js for local dev

Prisma requires binary downloads from `binaries.prisma.sh` which are blocked in this environment. sql.js is pure JavaScript — zero native dependencies, identical query results. The Prisma schema (`prisma/schema.prisma`) is production-ready for Neon PostgreSQL.

### Why page-based pagination (not cursor-based)

Salary tables are sorted by total_compensation. Users jump to specific pages ("show me page 4") — page numbers are meaningful. Cursor pagination only improves performance at extremely high row counts (100K+), which is Phase 2 concern.

### `total_compensation` is always server-computed

`base + (bonus ?? 0) + (stock ?? 0)` is recomputed in `POST /api/ingest-salary` regardless of what the client sends. The client value is stripped. This is enforced at the API boundary, not just convention.

### Company normalisation: two-layer

1. Programmatic rules — lowercase, trim, strip legal suffixes (pvt ltd, inc, technologies, etc.)
2. Alias lookup table (`lib/aliases.json`) — handles known variants like "Tata Consultancy" → "tcs"

The alias table is a separate data file, not hardcoded in the function.

---

## What Was Cut (Scope Decisions)

- **Auth / login** — intentionally out of scope per brief
- **Review and Interview pages** — data model is there; pages not built in 72h
- **Workplace Index** — composite scoring needs more data
- **Community / Forum** — separate product concern
- **Typesense search** — PostgreSQL full-text is sufficient at seed scale
- **ISR revalidation via Cloudflare cache purge** — documented pattern, not wired up without prod Cloudflare account
- **Python scraper** — full-stack role; AI/Data deliverable

---

## API Reference

### POST /api/ingest-salary

```json
{
  "company": "Google India",
  "role": "Software Engineer",
  "level": "L4",
  "location": "Bengaluru",
  "currency": "INR",
  "experience_years": 4,
  "base_salary": 3500000,
  "bonus": 500000,
  "stock": 1000000
}
```

Returns `201` with the stored record. `total_compensation` is always server-computed.

Validation errors return `400` with `{ error: true, field: "...", message: "..." }`.

### GET /api/salaries

Query params: `company`, `role`, `level`, `location`, `currency`, `sort` (total_comp_desc|total_comp_asc|date_desc), `page`, `limit` (max 100)

### GET /api/companies/:slug

Returns company metadata + salary list + `median_total_compensation` + `level_distribution`.

### GET /api/compare?s1=id&s2=id

Returns both records + delta object. `tc_delta = record1.total_compensation - record2.total_compensation`. Positive = record1 pays more.

---

## Hardest Decision

Choosing sql.js over Prisma for local dev. Prisma is the production ORM and the schema is written — but Prisma needs to download engine binaries at init time, which was blocked. sql.js let the entire project run without any external dependencies while keeping all the same query patterns. The tradeoff is that the Prisma schema and the sql.js schema can drift; I mitigated this by keeping the sql.js `CREATE TABLE` statements as close to the Prisma model as possible and documenting the swap path clearly.
