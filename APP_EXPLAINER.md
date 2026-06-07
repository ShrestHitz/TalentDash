# TalentDash App Explainer

This document explains the TalentDash project in simple language. It is written for someone learning the stack and trying to understand how the whole application fits together.

## 1. What This App Is

TalentDash is a compensation intelligence app for tech jobs, mainly focused on Indian tech salary data.

In plain English, the app lets users:

- See salary records from different companies.
- Filter salaries by company, role, level, and location.
- View company-specific salary pages.
- Compare two salary records side by side.
- Submit new salary data through an API.

The core data is salary information:

- company
- role
- level
- location
- currency
- base salary
- bonus
- stock
- total compensation
- experience
- source and confidence metadata

The main goal is to make compensation data easier to browse, compare, and reason about.

## 2. The Big Picture

The app is built with Next.js, React, TypeScript, Tailwind CSS, sql.js, and Prisma.

At a high level:

1. The browser requests a page, such as `/salaries`.
2. Next.js renders that page.
3. The page asks the local database for salary/company data.
4. React components display the data as tables, badges, filters, and comparison views.
5. Some interactions call API routes, such as `/api/salaries` or `/api/compare`.
6. API routes query the same database and return JSON.

Think of the project as three layers:

- UI layer: pages and components the user sees.
- API layer: endpoints that return or accept data.
- Data layer: database helpers, salary/company schema, formatting, normalization, and types.

## 3. Technologies Used

### Next.js

Next.js is the main full-stack framework. It handles:

- Routing: files inside `app/` become pages or API routes.
- Server rendering: some pages fetch data on the server before HTML is sent.
- API routes: files like `app/api/salaries/route.ts` behave like backend endpoints.
- Metadata: pages can define SEO titles and descriptions.

This project uses the App Router style. That means routes are organized by folders inside `app/`.

Example:

- `app/page.tsx` becomes `/`
- `app/salaries/page.tsx` becomes `/salaries`
- `app/companies/[slug]/page.tsx` becomes `/companies/google`
- `app/api/salaries/route.ts` becomes `/api/salaries`

Important local note: `AGENTS.md` says this Next.js version may have changed from older examples. The specific bundled docs path mentioned there was not present in this checkout, so this explanation is based on the actual code in this project.

### React

React is the UI library. It lets the app define reusable components like:

- `Navbar`
- `LevelBadge`
- `SalaryCell`
- `SalaryTableClient`
- `CompareClient`

Some components are server components by default. They can fetch data directly on the server.

Some components start with `"use client"`. Those run in the browser and can use browser-only features like:

- `useState`
- `useEffect`
- click handlers
- form input state
- URL updates with `useRouter`

### TypeScript

TypeScript adds types to JavaScript. It helps describe the shape of data.

For example, `types/index.ts` defines what a `Salary`, `Company`, and `CompareResponse` look like.

This is useful because salary data appears in many places: pages, API routes, and UI components. Types help keep those places consistent.

### Tailwind CSS

Tailwind CSS is used for styling through utility classes.

Example:

```tsx
className="bg-white border border-[#EBEBEB] rounded"
```

Instead of writing many custom CSS classes, the app uses small styling utilities directly in JSX.

The global Tailwind import lives in `app/globals.css`.

### sql.js

`sql.js` is SQLite compiled to JavaScript/WebAssembly. In this project it is used as the local development database.

The database file is `talentdash.db`, created automatically when the app first runs.

The app does not require a separate database server for local development. That makes it easier to run.

### Prisma

Prisma is included for the production database schema.

The Prisma schema is in `prisma/schema.prisma`.

Locally, the app does not use Prisma queries directly. Instead, `lib/db.ts` uses `sql.js`. The README explains that this was done to avoid Prisma engine binary download problems in the development environment.

So:

- local development uses `sql.js`
- production is intended to use Prisma with PostgreSQL, such as Neon

### ESLint

ESLint checks code quality and catches common mistakes.

The config file is `eslint.config.mjs`.

The script is:

```bash
npm run lint
```

### Turbopack

`next.config.ts` enables `turbopack: {}`. Turbopack is Next.js's newer bundler/dev build system. A bundler takes your TypeScript, React, CSS, and imports, then prepares them for the browser/server runtime.

## 4. Main App Flow

### Homepage Flow: `/`

File: `app/page.tsx`

The homepage:

1. Calls `getDb()` to access the local SQL database.
2. Runs SQL queries to count salary records, companies, and cities.
3. Fetches the top 6 compensation records.
4. Renders a hero section, stats, top salaries table, and quick links.

The homepage also has:

```ts
export const revalidate = 3600;
```

This tells Next.js that the page can be revalidated roughly every hour.

### Salaries Flow: `/salaries`

Files:

- `app/salaries/page.tsx`
- `components/features/SalaryTableClient.tsx`
- `app/api/salaries/route.ts`

The salaries page has both server-side and client-side behavior.

On first page load:

1. `app/salaries/page.tsx` reads URL query parameters like `company`, `role`, `level`, and `page`.
2. It queries the database on the server.
3. It passes the first set of salary data into `SalaryTableClient`.

After the page is open:

1. The user changes filters or pagination.
2. `SalaryTableClient` updates browser state.
3. It updates the URL using `router.replace`.
4. It fetches fresh JSON from `/api/salaries`.
5. The table updates without a full page reload.

This is a common pattern:

- server component for initial data
- client component for interactive filtering
- API route for refreshes after interaction

### Companies Flow: `/companies`

File: `app/companies/page.tsx`

The companies page:

1. Gets all companies.
2. Joins them with salary records.
3. Calculates count and average total compensation.
4. Displays a table of companies.

Each company name links to a detail page like `/companies/google`.

### Company Detail Flow: `/companies/[slug]`

Files:

- `app/companies/[slug]/page.tsx`
- `app/api/companies/[slug]/route.ts`

The page route displays a company profile.

It:

1. Reads the `slug` from the URL.
2. Looks up the company.
3. Loads all salaries for that company.
4. Calculates median total compensation.
5. Calculates level distribution.
6. Renders summary stats and salary records.

The page also defines:

```ts
generateStaticParams()
```

That function tells Next.js which company detail pages can be generated ahead of time.

The API route version, `/api/companies/[slug]`, returns the same kind of company detail data as JSON.

### Compare Flow: `/compare`

Files:

- `app/compare/page.tsx`
- `app/compare/CompareClient.tsx`
- `app/api/compare/route.ts`

The compare page is mostly interactive, so the main logic is in a client component.

Flow:

1. `CompareClient` loads up to 100 salary options from `/api/salaries`.
2. The user selects Offer A and Offer B.
3. The component calls `/api/compare?s1=...&s2=...`.
4. The API route fetches both salary records.
5. The API calculates deltas:
   - base salary difference
   - bonus difference
   - stock difference
   - total compensation difference
   - experience difference
6. The UI renders both records side by side.

The selected IDs are kept in the URL, so the comparison can be shared.

### Salary Submission Flow: `POST /api/ingest-salary`

File: `app/api/ingest-salary/route.ts`

This route is for adding salary records.

Flow:

1. The route reads JSON from the request body.
2. It checks required fields.
3. It validates level, currency, experience, salary, source, and confidence score.
4. It computes `total_compensation` on the server.
5. It normalizes the company name.
6. It finds or creates the company.
7. It checks for near-duplicate submissions in the last 48 hours.
8. It inserts the salary.
9. It saves the database file.
10. It returns the created record.

Important concept: the API does not trust the client to send the correct total compensation. It always computes:

```ts
base + bonus + stock
```

That is good backend design because important business rules should live on the server.

## 5. Database Design

The app has two main database tables:

- `companies`
- `salaries`

### Company

A company has:

- id
- name
- slug
- normalized name
- industry
- headquarters
- founded year
- headcount range
- timestamps

The `slug` is used in URLs.

Example:

```txt
Google -> google -> /companies/google
```

### Salary

A salary has:

- id
- company id
- role
- level
- location
- currency
- experience years
- base salary
- bonus
- stock
- total compensation
- source
- confidence score
- verification flag
- submitted date

The salary belongs to a company through `company_id`.

### Local Database

`lib/db.ts` creates the local SQL database.

When `getDb()` is called:

1. If an in-memory database already exists, reuse it.
2. Else, check whether `talentdash.db` exists.
3. If the file exists, load it.
4. If not, create a fresh database.
5. Create tables.
6. Seed sample company and salary data.
7. Save the database file.

This means the app can start with useful sample data automatically.

## 6. File-by-File Guide

### Root Files

#### `package.json`

Defines project metadata, dependencies, and scripts.

Important scripts:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Important dependencies:

- `next`: full-stack React framework
- `react` and `react-dom`: UI rendering
- `typescript`: typed JavaScript
- `tailwindcss`: utility-first CSS
- `sql.js`: local SQLite-like database
- `prisma` and `@prisma/client`: production database tooling

#### `package-lock.json`

Locks exact dependency versions. This helps installs be repeatable.

#### `next.config.ts`

Next.js configuration.

This project:

- enables Turbopack
- marks `sql.js` as a server external package

#### `tsconfig.json`

TypeScript configuration.

Important detail:

```json
"paths": {
  "@/*": ["./*"]
}
```

This allows imports like:

```ts
import { getDb } from "@/lib/db";
```

instead of long relative imports.

#### `eslint.config.mjs`

ESLint configuration for Next.js and TypeScript.

#### `postcss.config.mjs`

PostCSS config. Tailwind uses PostCSS to process CSS.

#### `README.md`

Existing project overview and submission notes.

#### `AGENTS.md`

Instructions for coding agents working on this repo.

#### `CLAUDE.md`

A small agent-related note file. It does not affect the app runtime.

### `app/` Folder

The `app/` folder controls pages, layouts, API routes, and global styles.

#### `app/layout.tsx`

The root layout wraps every page.

It adds:

- HTML shell
- global metadata
- Google font preconnect/font link
- navbar
- footer
- global background styling

Every page is rendered inside:

```tsx
<main>{children}</main>
```

#### `app/globals.css`

Global CSS.

It imports Tailwind:

```css
@import "tailwindcss";
```

It also sets default body styles like font, background color, text color, and line height.

#### `app/page.tsx`

Homepage.

It fetches summary stats and top salary records directly from the database.

It renders:

- hero section
- stats row
- highest compensation table
- quick navigation cards

#### `app/salaries/page.tsx`

Server-rendered salaries page.

It:

- reads search parameters
- builds SQL filters
- queries salary records
- calculates pagination
- passes data into `SalaryTableClient`
- adds SEO metadata and JSON-LD structured data

#### `app/companies/page.tsx`

Companies listing page.

It queries companies and salary averages, then displays them in a table.

#### `app/companies/[slug]/page.tsx`

Company detail page.

The `[slug]` means this is a dynamic route.

Examples:

- `/companies/google`
- `/companies/amazon`
- `/companies/tcs`

It renders company metadata, compensation stats, level distribution, and salary rows.

#### `app/compare/page.tsx`

Small wrapper page for comparison.

It renders `CompareClient` inside React `Suspense`.

#### `app/compare/CompareClient.tsx`

Client-side comparison UI.

It:

- fetches salary options
- stores selected records in state
- reads and writes URL query parameters
- calls the compare API
- displays side-by-side comparison results

Because it uses browser state and effects, it starts with:

```tsx
"use client";
```

#### `app/not-found.tsx`

Custom 404 page shown when a route is not found.

### `app/api/` Folder

This folder contains backend API routes.

#### `app/api/salaries/route.ts`

Handles:

```txt
GET /api/salaries
```

It supports query parameters like:

- `company`
- `role`
- `level`
- `location`
- `currency`
- `sort`
- `page`
- `limit`

It returns JSON:

```ts
{
  data: [...],
  meta: {
    total,
    page,
    limit,
    totalPages
  }
}
```

#### `app/api/ingest-salary/route.ts`

Handles:

```txt
POST /api/ingest-salary
```

It validates and inserts new salary records.

This is the most backend-heavy route in the app.

#### `app/api/compare/route.ts`

Handles:

```txt
GET /api/compare?s1=id1&s2=id2
```

It loads two salary records and returns both records plus a delta object.

#### `app/api/companies/[slug]/route.ts`

Handles:

```txt
GET /api/companies/google
```

It returns one company, its salaries, median compensation, and level distribution.

### `components/` Folder

Reusable UI lives here.

#### `components/ui/Navbar.tsx`

Top navigation bar.

Contains links to:

- home
- salaries
- companies
- compare

#### `components/ui/LevelBadge.tsx`

Small colored label for a level like `L4`, `SDE-II`, or `Principal`.

It uses level display names and colors from `lib/levels.ts`.

#### `components/ui/SalaryCell.tsx`

Displays salary numbers consistently.

It:

- returns a dash when the amount is missing or zero
- formats currency through `formatCurrency`
- optionally bolds important salary values

#### `components/features/SalaryTableClient.tsx`

Interactive salary table.

It handles:

- filters
- level toggles
- currency display selection
- sorting
- pagination
- loading state
- API fetches
- URL updates

This is one of the most important frontend files in the project.

### `lib/` Folder

The `lib/` folder contains reusable business logic and helpers.

#### `lib/db.ts`

Local database setup.

It:

- initializes `sql.js`
- creates tables
- loads or saves `talentdash.db`
- seeds sample data
- exposes `getDb()` and `saveDb()`

This is the main data access file for local development.

#### `lib/currency.ts`

Currency conversion and formatting.

It defines exchange rates:

```ts
INR: 1
USD: 83.5
GBP: 105.2
EUR: 90.3
```

It can:

- convert an amount to INR
- convert INR to another currency
- format INR as rupees, LPA, or Cr
- format USD/GBP/EUR as K or M
- compute total compensation

#### `lib/levels.ts`

Defines valid career levels, display labels, badge colors, and a helper to check if a value is a valid level.

This keeps level-related logic centralized.

#### `lib/normalize.ts`

Normalizes company names.

Example goal:

```txt
"Google India Pvt Ltd" -> "google"
```

It:

- lowercases names
- removes domain endings like `.com`
- removes legal suffixes like `pvt ltd`, `inc`, and `limited`
- checks known aliases
- creates URL-safe slugs

#### `lib/aliases.json`

Known company name aliases.

This helps map different names for the same company to one normalized value.

### `types/` Folder

#### `types/index.ts`

Shared TypeScript types.

Includes:

- `LevelEnum`
- `CurrencyEnum`
- `SourceEnum`
- `Company`
- `Salary`
- `SalaryWithCompany`
- `SalariesResponse`
- `CompanyWithStats`
- `CompareResponse`
- `IngestPayload`

These types describe the data contracts used across the app.

### `prisma/` Folder

#### `prisma/schema.prisma`

Production database schema.

It defines:

- `Company` model
- `Salary` model
- `Level` enum
- `Currency` enum
- `Source` enum

This schema targets PostgreSQL.

### `public/` Folder

Contains static assets served directly by Next.js.

Current files include default SVGs such as:

- `next.svg`
- `vercel.svg`
- `globe.svg`
- `file.svg`
- `window.svg`

Static files in `public/` can be referenced from the root URL.

Example:

```txt
public/next.svg -> /next.svg
```

## 7. Server Components vs Client Components

This is an important Next.js concept.

### Server Components

Most files in `app/` are server components by default.

They can:

- query the database directly
- access server-only modules
- render HTML before sending it to the browser

Examples:

- `app/page.tsx`
- `app/salaries/page.tsx`
- `app/companies/page.tsx`
- `app/companies/[slug]/page.tsx`

### Client Components

Client components start with:

```tsx
"use client";
```

They can:

- use React state
- respond to clicks
- use effects
- read browser URL state
- call APIs after the page loads

Examples:

- `components/features/SalaryTableClient.tsx`
- `app/compare/CompareClient.tsx`

Simple rule:

- If a component mostly fetches and renders data, it can probably be a server component.
- If a component needs interaction, state, effects, or browser APIs, it needs to be a client component.

## 8. API Routes Explained Simply

An API route is backend code inside the Next.js app.

For example:

```ts
export async function GET(req: NextRequest) {
  return NextResponse.json(...)
}
```

That function runs on the server when someone requests that API URL.

In this app:

- Pages use direct database queries for first render.
- Interactive components use API routes to refresh data.
- External clients could also call these API routes.

## 9. Query Parameters and URL State

The app uses query parameters to represent filters and comparisons.

Example salary URL:

```txt
/salaries?company=google&level=L4&page=2
```

Example compare URL:

```txt
/compare?s1=abc123&s2=xyz789
```

This is useful because:

- pages can be refreshed without losing state
- links can be shared
- the server can read filters on first load

## 10. Important Data Rules

### Total Compensation Is Server-Computed

The app always computes:

```txt
total compensation = base salary + bonus + stock
```

This is done in `app/api/ingest-salary/route.ts`.

That protects the system from wrong or manipulated client data.

### Company Names Are Normalized

Company names can be entered in many ways:

```txt
Google
Google India
Google Pvt Ltd
google.com
```

Normalization tries to map these to one canonical company name.

This helps avoid duplicate company pages.

### Duplicate Salary Submissions Are Checked

When a new salary is submitted, the app checks whether a similar record already exists for:

- same company
- same role
- same level
- same location
- submitted within last 48 hours
- base salary within 10 percent

If it finds one, it returns a conflict response.

## 11. How To Run The App

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Run linting:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

Start production build:

```bash
npm run start
```

## 12. How To Read This Codebase As A Learner

Recommended order:

1. Start with `app/layout.tsx` to see the shared page shell.
2. Read `app/page.tsx` to understand a simple server-rendered page.
3. Read `lib/db.ts` to understand where data comes from.
4. Read `app/salaries/page.tsx` to see server-side filtering.
5. Read `components/features/SalaryTableClient.tsx` to understand client-side interaction.
6. Read `app/api/salaries/route.ts` to understand JSON APIs.
7. Read `app/compare/CompareClient.tsx` and `app/api/compare/route.ts` together.
8. Read `app/api/ingest-salary/route.ts` last, because it has the most validation and business logic.

## 13. Common Patterns In This Project

### SQL Query, Then Map Rows Into Objects

`sql.js` returns data as columns and arrays of values.

The code often does this:

```ts
const cols = result[0]?.columns ?? [];
const rows = (result[0]?.values ?? []).map((vals) => {
  const r: Record<string, unknown> = {};
  cols.forEach((col, i) => {
    r[col] = vals[i];
  });
  return r;
});
```

That converts SQL result rows into JavaScript objects.

### Shared Helpers

Instead of repeating logic everywhere, common logic is placed in `lib/`.

Examples:

- currency formatting in `lib/currency.ts`
- level labels in `lib/levels.ts`
- company cleanup in `lib/normalize.ts`

### URL-Driven UI

The app stores filters and selections in the URL.

This helps server rendering and sharing.

### Server First, Client When Needed

The project uses server components for data-heavy pages and client components for interactive behavior.

That is a healthy Next.js pattern.

## 14. Things To Be Aware Of

### Encoding Looks Broken In Some Text

Some files show characters like:

```txt
â€” 
â†’
Â©
```

These are likely encoding issues where special characters were written or displayed incorrectly.

The intended characters are probably things like:

- em dash
- arrow
- copyright symbol
- rupee/euro/pound symbols

This does not explain the app architecture, but it is worth fixing later for polish.

### Local Database And Prisma Can Drift

There are two database definitions:

- SQL strings in `lib/db.ts`
- Prisma schema in `prisma/schema.prisma`

If one changes and the other does not, local and production behavior can become inconsistent.

When changing the data model, update both places.

### SQL Is Written Manually

The app builds SQL queries manually, but values are mostly passed as parameters with `?`, which is safer than string-concatenating user input.

One thing to keep watching is any place where SQL text is dynamically assembled, such as `ORDER BY` or `IN (...)`. In this code, sorting is limited through an allowlist map, which is the right idea.

### `strict` TypeScript Is Off

`tsconfig.json` has:

```json
"strict": false
```

That makes TypeScript more forgiving. It is easier for quick development, but it catches fewer bugs.

## 15. Mental Model Summary

TalentDash is a full-stack Next.js app where:

- `app/` defines pages and API routes.
- `components/` defines reusable UI.
- `lib/` contains database and business helpers.
- `types/` describes shared data shapes.
- `prisma/` describes the intended production database.
- `sql.js` powers local data storage.
- Tailwind CSS styles the UI.
- React client components handle interactivity.

If you understand the flow from:

```txt
Page -> Component -> API route -> getDb() -> SQL -> JSON/UI
```

then you understand the heart of this app.

