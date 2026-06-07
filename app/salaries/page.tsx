import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import SalaryTableClient from "@/components/features/SalaryTableClient";
import { getDb } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import type { SalaryWithCompany } from "@/types";

export const metadata: Metadata = {
  title: "Salary Data — India Tech Salaries by Company & Level | TalentDash",
  description: "Browse structured salary data for Software Engineers, Product Managers, and Data Scientists at Google, Amazon, Meta, Flipkart, TCS, and more. Filter by level (L3–L6, SDE-I to III), location, and company.",
  alternates: { canonical: "https://talentdash.in/salaries" },
  openGraph: {
    title: "Salary Data — India Tech Salaries | TalentDash",
    description: "Structured, level-aware salary data for Indian tech professionals. Filter by company, role, level, and location.",
    url: "https://talentdash.in/salaries",
  },
  twitter: {
    card: "summary",
    title: "Salary Data — India Tech Salaries | TalentDash",
    description: "Structured, level-aware salary data for Indian tech professionals. Filter by company, role, level, and location.",
  },
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

function rowObjects(result: any) {
  const cols = result[0]?.columns ?? [];
  return (result[0]?.values ?? []).map((vals: any[]) => {
    const r: Record<string, unknown> = {};
    cols.forEach((col: string, i: number) => { r[col] = vals[i]; });
    return r;
  });
}

const COMPANY_COLORS: Record<string, string> = {
  google: "#4285F4", amazon: "#FF9900", microsoft: "#00A1F1", meta: "#0866FF",
  flipkart: "#2874F0", nvidia: "#76B900", razorpay: "#3395FF", meesho: "#9F2089",
  tcs: "#1A1A6E", wipro: "#491685", infosys: "#007CC3", zepto: "#FD4F00",
};

function CompanyAvatar({ slug, name }: { slug: string; name: string }) {
  const color = COMPANY_COLORS[slug] ?? "#e11d48";
  return (
    <div
      style={{
        height: 32, width: 32, borderRadius: 8,
        background: color + "18", color,
        display: "grid", placeItems: "center",
        fontSize: 11, fontWeight: 700,
        border: "1px solid " + color + "30",
        flexShrink: 0,
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

const LOCATIONS = ["India", "San Francisco", "Bengaluru", "Mumbai", "Hyderabad", "Pune", "Delhi"];
const EXPERIENCE = ["All Experience", "0–2 years", "2–5 years", "5–8 years", "8+ years"];

export default async function SalariesPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const company = sp.company ?? "";
  const role = sp.role ?? "";
  const level = sp.level ?? "";
  const location = sp.location ?? "";
  const currency = sp.currency ?? "";
  const sort = sp.sort ?? "total_comp_desc";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const limit = 25;

  const db = await getDb();

  const conditions: string[] = ["1=1"];
  const params: (string | number)[] = [];

  if (company) { conditions.push("LOWER(c.name) LIKE ?"); params.push(`%${company.toLowerCase()}%`); }
  if (role) { conditions.push("LOWER(s.role) LIKE ?"); params.push(`%${role.toLowerCase()}%`); }
  if (level) {
    const levels = level.split(",").filter(Boolean);
    if (levels.length === 1) {
      conditions.push("s.level = ?");
      params.push(levels[0]);
    } else if (levels.length > 1) {
      conditions.push(`s.level IN (${levels.map(() => "?").join(",")})`);
      params.push(...levels);
    }
  }
  if (location) { conditions.push("LOWER(s.location) LIKE ?"); params.push(`%${location.toLowerCase()}%`); }

  const where = conditions.join(" AND ");
  const orderMap: Record<string, string> = {
    total_comp_desc: "s.total_compensation DESC",
    total_comp_asc: "s.total_compensation ASC",
    date_desc: "s.submitted_at DESC",
  };
  const orderBy = orderMap[sort] ?? "s.total_compensation DESC";

  const countRes = db.exec(
    `SELECT COUNT(*) FROM salaries s JOIN companies c ON c.id = s.company_id WHERE ${where}`, params
  );
  const total = Number(countRes[0]?.values?.[0]?.[0] ?? 0);

  const dataRes = db.exec(
    `SELECT s.id, s.role, s.level, s.location, s.currency, s.experience_years,
            s.base_salary, s.bonus, s.stock, s.total_compensation,
            s.source, s.confidence_score, s.is_verified, s.submitted_at,
            c.id as company_id, c.name as company_name, c.slug as company_slug,
            c.industry, c.headquarters, c.founded_year, c.headcount_range
     FROM salaries s JOIN companies c ON c.id = s.company_id
     WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  const cols = dataRes[0]?.columns ?? [];
  const initialData: SalaryWithCompany[] = (dataRes[0]?.values ?? []).map((vals) => {
    const r: Record<string, unknown> = {};
    cols.forEach((col, i) => { r[col] = vals[i]; });
    return {
      id: r.id as string, role: r.role as string, level: r.level as never,
      location: r.location as string, currency: r.currency as never,
      experience_years: r.experience_years as number, base_salary: r.base_salary as number,
      bonus: r.bonus as number, stock: r.stock as number,
      total_compensation: r.total_compensation as number, source: r.source as never,
      confidence_score: r.confidence_score as number, is_verified: Boolean(r.is_verified),
      submitted_at: r.submitted_at as string, company_id: r.company_id as string,
      company: {
        id: r.company_id as string, name: r.company_name as string,
        slug: r.company_slug as string, normalized_name: "",
        industry: r.industry as string, headquarters: r.headquarters as string,
        founded_year: r.founded_year as number | null,
        headcount_range: r.headcount_range as string | null,
        created_at: "", updated_at: "",
      },
    };
  });

  const totalPages = Math.ceil(total / limit);

  // Summary stats
  const summaryRes = db.exec(`
    SELECT AVG(total_compensation) as avg_tc, MIN(total_compensation) as min_tc,
           MAX(total_compensation) as max_tc, COUNT(*) as count,
           AVG(base_salary) as avg_base, AVG(bonus) as avg_bonus, AVG(stock) as avg_stock
    FROM salaries
  `);
  const summary = summaryRes[0]?.values?.[0] ?? [0, 0, 0, 0, 0, 0, 0];
  const avgTC = Number(summary[0]);
  const minTC = Number(summary[1]);
  const maxTC = Number(summary[2]);
  const totalCount = Number(summary[3]);
  const avgBase = Number(summary[4]);
  const avgBonus = Number(summary[5]);
  const avgStock = Number(summary[6]);

  // Top location
  const locationRes = db.exec(`
    SELECT location, COUNT(*) as cnt FROM salaries GROUP BY location ORDER BY cnt DESC LIMIT 1
  `);
  const topLocation = (locationRes[0]?.values?.[0]?.[0] as string) ?? "Bengaluru";

  // Companies for avatar bar
  const companiesRes = db.exec(`
    SELECT DISTINCT c.name, c.slug FROM salaries s JOIN companies c ON c.id = s.company_id LIMIT 8
  `);
  const companyList = rowObjects(companiesRes);

  // Roles grouped
  const rolesRes = db.exec(`
    SELECT s.role, COUNT(*) as cnt, AVG(s.total_compensation) as avg_tc,
           MIN(s.total_compensation) as min_tc, MAX(s.total_compensation) as max_tc
    FROM salaries s
    GROUP BY s.role ORDER BY cnt DESC
  `);
  const roles = rowObjects(rolesRes);

  // Top role details (first role = Software Engineer typically)
  const topRole = roles[0];
  const topRoleCompRes = db.exec(`
    SELECT AVG(base_salary) as avg_base, AVG(bonus) as avg_bonus, AVG(stock) as avg_stock
    FROM salaries WHERE role = ?
  `, [topRole?.role as string ?? "Software Engineer"]);
  const topRoleComp = topRoleCompRes[0]?.values?.[0] ?? [0, 0, 0];
  const trBase = Number(topRoleComp[0]);
  const trBonus = Number(topRoleComp[1]);
  const trStock = Number(topRoleComp[2]);
  const trTotal = trBase + trBonus + trStock;
  const trBaseP = trTotal > 0 ? Math.round((trBase / trTotal) * 100) : 0;
  const trBonusP = trTotal > 0 ? Math.round((trBonus / trTotal) * 100) : 0;
  const trStockP = trTotal > 0 ? Math.round((trStock / trTotal) * 100) : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "TalentDash India Salary Data",
    "description": "Structured salary data for tech and IT roles across India's top companies",
    "url": "https://talentdash.in/salaries",
    "creator": { "@type": "Organization", "name": "TalentDash" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <div className="border-b border-[var(--line)] bg-white">
        <div className="td-container py-2 flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Link href="/companies" className="hover:text-[var(--brand)] transition-colors">Companies</Link>
          <span>›</span>
          <span className="text-[var(--ink)] font-medium">Salaries</span>
        </div>
      </div>

      <div className="td-container py-8">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink)] mb-2">
            India Tech Salaries
          </h1>
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span className="verified-badge">✓ Verified</span>
            <span>Based on {totalCount} verified salary submissions in India · Updated June 2026</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <div className="stat-label"><span>💰</span> Average Total Pay</div>
            <div className="stat-value text-[var(--brand)]">{formatCurrency(avgTC, "INR", "INR")}</div>
            <div className="stat-sub">/ year</div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><span>📊</span> Salary Range (Annual)</div>
            <div className="stat-value" style={{ fontSize: 18 }}>
              {formatCurrency(minTC, "INR", "INR")} – {formatCurrency(maxTC, "INR", "INR")}
            </div>
            <div className="stat-sub">Min — Max</div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><span>📍</span> Top Paying Location</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{topLocation}</div>
            <div className="stat-sub">Most submitted city</div>
          </div>
        </div>

        {/* Company avatars */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {companyList.map((c) => (
            <Link key={c.slug as string} href={`/companies/${c.slug}`} title={c.name as string}>
              <CompanyAvatar slug={c.slug as string} name={c.name as string} />
            </Link>
          ))}
        </div>

        {/* Location / Experience pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {LOCATIONS.map((loc, i) => (
              <Link
                key={loc}
                href={i === 0 ? "/salaries" : `/salaries?location=${encodeURIComponent(loc)}`}
                className={`filter-pill ${i === 0 ? "active" : ""}`}
              >
                📍 {loc}
              </Link>
            ))}
          </div>
          <div className="w-px bg-[var(--line)] hidden sm:block" />
          {EXPERIENCE.map((exp, i) => (
            <span key={exp} className={`filter-pill ${i === 0 ? "active" : ""} cursor-pointer`}>
              {exp}
            </span>
          ))}
          <button className="filter-pill">More filters</button>
        </div>

        {/* Tab bar */}
        <div className="border-b border-[var(--line)] mb-6">
          <div className="flex gap-6 overflow-x-auto">
            {["Salaries", "Insights", "Benefits", "Photos", "Reviews", "Jobs"].map((tab, i) => (
              <button key={tab} className={`td-tab ${i === 0 ? "td-tab-active" : ""}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Roles sidebar + main content layout */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">

          {/* Left: Roles list */}
          <aside>
            <div className="td-card overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--line)] flex items-center justify-between">
                <span className="font-semibold text-sm">All Roles</span>
                <span className="text-xs text-[var(--muted)]">{roles.length} roles</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--line)]">
                <span className="text-xs text-[var(--muted)]">Sort by</span>
                <span className="text-xs font-semibold text-[var(--brand)] cursor-pointer">Popular</span>
                <span className="text-xs text-[var(--muted)]">·</span>
                <span className="text-xs font-semibold text-[var(--muted)] cursor-pointer">Sort by TC</span>
              </div>
              <div className="divide-y divide-[#f1f5f9]">
                {roles.map((r, i) => (
                  <Link
                    key={r.role as string}
                    href={`/salaries?role=${encodeURIComponent(r.role as string)}`}
                    className={`block px-4 py-3 hover:bg-[#f8fafc] transition-colors ${i === 0 ? "bg-[var(--brand-soft)]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${i === 0 ? "text-[var(--brand)]" : "text-[var(--ink)]"}`}>
                          {r.role as string}{i === 0 ? " ✏️" : ""}
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          {formatCurrency(Number(r.min_tc), "INR", "INR")} – {formatCurrency(Number(r.max_tc), "INR", "INR")}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[var(--ink)]">{formatCurrency(Number(r.avg_tc), "INR", "INR")}</p>
                        <p className="text-xs text-[var(--muted)]">{Number(r.cnt)} records</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-[var(--line)]">
                <a href="#all-records" className="text-xs font-semibold text-[var(--brand)] hover:underline">
                  View all {roles.length} roles →
                </a>
              </div>
            </div>
          </aside>

          {/* Right: Role detail + table */}
          <div className="space-y-6">

            {/* Top role detail card */}
            {topRole && (
              <div className="td-card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--ink)]">{topRole.role as string}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="verified-badge">✓ Verified</span>
                      <span className="text-xs text-[var(--muted)]">{Number(topRole.cnt)} salaries submitted</span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-[var(--muted)] mb-1">Total Pay (Annual)</p>
                    <p className="text-2xl font-extrabold text-[var(--ink)]">
                      {formatCurrency(Number(topRole.avg_tc), "INR", "INR")} <span className="text-base font-medium text-[var(--muted)]">/ year</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted)]">
                      <span>{formatCurrency(Number(topRole.min_tc), "INR", "INR")}</span>
                      <div className="flex-1 range-bar">
                        <div className="range-bar-fill" style={{ left: "5%", right: "5%" }} />
                      </div>
                      <span>{formatCurrency(Number(topRole.max_tc), "INR", "INR")}</span>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-1">Most reports</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--muted)] mb-2">Compensation Breakdown</p>
                    <div className="space-y-2">
                      {[
                        { label: "Base Pay", value: trBase, pct: trBaseP },
                        { label: "Bonus", value: trBonus, pct: trBonusP },
                        { label: "Equity", value: trStock, pct: trStockP },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className="w-24 text-xs text-[var(--muted)]">{formatCurrency(item.value, "INR", "INR")}</div>
                          <div className="flex-1 range-bar">
                            <div className="range-bar-fill" style={{ width: `${item.pct}%` }} />
                          </div>
                          <div className="w-16 text-xs text-right font-medium text-[var(--muted)]">
                            {item.label} {item.pct}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button className="td-btn-secondary px-4 py-2 text-xs opacity-50 cursor-not-allowed">
                    + Add a Salary (Coming soon)
                  </button>
                  <Link href="/compare" className="td-btn-primary px-4 py-2 text-xs">
                    📈 Compare your salary →
                  </Link>
                </div>

                {/* People also viewed */}
                <div className="mt-5 pt-5 border-t border-[var(--line)]">
                  <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">People also viewed</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {roles.slice(1, 5).map((r) => (
                      <Link
                        key={r.role as string}
                        href={`/salaries?role=${encodeURIComponent(r.role as string)}`}
                        className="td-panel p-3 hover:border-[var(--brand)] transition-all group"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-base">💼</span>
                          <div>
                            <p className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors">{r.role as string}</p>
                            <p className="text-xs font-bold text-[var(--brand)] mt-0.5">{formatCurrency(Number(r.avg_tc), "INR", "INR")} /yr</p>
                            <p className="text-xs text-[var(--muted)]">{formatCurrency(Number(r.min_tc), "INR", "INR")} – {formatCurrency(Number(r.max_tc), "INR", "INR")}</p>
                            <span className="text-xs font-semibold text-[var(--brand)] hover:underline">View insights →</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* All Salary Records */}
            <div id="all-records">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[var(--ink)]">All Salary Records</h2>
                  <p className="text-xs text-[var(--muted)]">{total} records · Filter and search below</p>
                </div>
              </div>

              {/* Submit CTA banner */}
              <div className="td-panel p-4 mb-4 flex items-center justify-between gap-4 bg-[#f8fafc]">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">Didn't find your role?</p>
                    <p className="text-xs text-[var(--muted)]">Submit your salary and help others make informed decisions.</p>
                  </div>
                </div>
                <Link href="/salaries/submit" className="td-btn-primary px-4 py-2 text-xs flex-shrink-0">
                  Submit your salary →
                </Link>
              </div>

              <Suspense fallback={<div className="h-96 td-card animate-pulse" />}>
                <SalaryTableClient
                  initialData={initialData}
                  initialMeta={{ total, page, limit, totalPages }}
                  initialParams={{ company, role, level, location, currency, sort, page }}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
