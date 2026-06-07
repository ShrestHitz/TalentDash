import Link from "next/link";
import { getDb } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { LevelBadge } from "@/components/ui/LevelBadge";
import type { LevelEnum } from "@/types";

export const revalidate = 3600;

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
      className="company-avatar"
      style={{ background: color + "15", color }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default async function HomePage() {
  const db = await getDb();

  const statsResult = db.exec(`
    SELECT
      (SELECT COUNT(*) FROM salaries) as total_salaries,
      (SELECT COUNT(*) FROM companies) as total_companies,
      (SELECT COUNT(DISTINCT location) FROM salaries) as total_cities,
      (SELECT COUNT(DISTINCT role) FROM salaries) as total_roles
  `);
  const stats = statsResult[0]?.values?.[0] ?? [0, 0, 0, 0];

  const topSalaries = rowObjects(db.exec(`
    SELECT s.id, s.role, s.level, s.location, s.total_compensation, s.currency,
           c.name as company_name, c.slug, c.industry
    FROM salaries s JOIN companies c ON c.id = s.company_id
    ORDER BY s.total_compensation DESC LIMIT 6
  `));

  const companies = rowObjects(db.exec(`
    SELECT c.name, c.slug, c.industry, COUNT(s.id) as salary_count,
           AVG(s.total_compensation) as avg_tc
    FROM companies c JOIN salaries s ON s.company_id = c.id
    GROUP BY c.id
    ORDER BY c.name ASC
  `));

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[var(--line)] bg-white py-16 lg:py-24">
        <div className="td-container">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--ink)] leading-tight mb-6">
              Make career decisions{" "}
              <span className="text-[var(--brand)]"> with real data</span>
            </h1>
            <p className="text-lg text-[var(--muted)] mb-8 max-w-xl mx-auto">
              Structured salary data for Indian tech professionals. Filter by level, company, and location. Compare offers side-by-side.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/salaries" className="td-btn-primary px-6 py-3 text-sm font-semibold">
                Explore Salaries →
              </Link>
              <Link href="/companies" className="td-btn-secondary px-6 py-3 text-sm font-semibold">
                Browse Companies
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-16 mt-12 flex-wrap">
            {[
              [String(Number(stats[0])) + "+", "Salary Records"],
              [String(Number(stats[1])) + "+", "Companies"],
              [String(Number(stats[2])) + "+", "Cities"],
            ].map(([value, label]) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-[var(--ink)]">{value}</p>
                <p className="text-sm text-[var(--muted)] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Companies */}
      <section className="py-12 border-b border-[var(--line)]">
        <div className="td-container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--ink)]">Popular Companies</h2>
            <Link href="/companies" className="text-sm font-semibold text-[var(--brand)] hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {companies.map((c) => (
              <Link
                key={c.slug as string}
                href={`/companies/${c.slug}`}
                className="td-panel p-4 flex flex-col items-center gap-2 text-center hover:border-[var(--brand)] hover:shadow-md transition-all group"
              >
                <CompanyAvatar slug={c.slug as string} name={c.name as string} />
                <div>
                  <p className="font-semibold text-[var(--ink)] text-xs leading-tight group-hover:text-[var(--brand)] transition-colors line-clamp-1">{c.name as string}</p>
                  <p className="text-[var(--brand)] font-bold text-xs mt-1">{formatCurrency(Number(c.avg_tc), "INR", "INR")}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Highest Paying Roles */}
      <section className="py-12 border-b border-[var(--line)]">
        <div className="td-container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--ink)]">Highest Paying Roles</h2>
            <Link href="/salaries" className="text-sm font-semibold text-[var(--brand)] hover:underline">
              View all →
            </Link>
          </div>
          <div className="td-card overflow-hidden">
            {topSalaries.map((s, index) => (
              <Link
                key={s.id as string}
                href={`/companies/${s.slug}`}
                className="flex items-center gap-4 px-5 py-4 border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition-colors"
              >
                <span className="h-8 w-8 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] font-bold text-sm grid place-items-center flex-shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--ink)] truncate">{s.company_name as string} · {s.role as string}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5 flex items-center gap-2">
                    <LevelBadge level={s.level as LevelEnum} size="sm" />
                    <span>· {s.location as string}</span>
                  </p>
                </div>
                <span className="font-bold text-[var(--brand)] text-sm flex-shrink-0">
                  {formatCurrency(Number(s.total_compensation), s.currency as string, "INR")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Compare CTA */}
      <section className="py-12 border-b border-[var(--line)] bg-[#f8fafc]">
        <div className="td-container text-center">
          <h2 className="text-2xl font-bold text-[var(--ink)] mb-3">Compare offers. Make smarter decisions.</h2>
          <p className="text-[var(--muted)] mb-8 max-w-md mx-auto">Compare any two salary records side-by-side with exact delta calculations.</p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Link href="/compare" className="h-24 w-36 td-card flex items-center justify-center text-3xl font-bold text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all">+</Link>
            <span className="font-bold text-[var(--muted)]">vs</span>
            <Link href="/compare" className="h-24 w-36 td-card flex items-center justify-center text-3xl font-bold text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all">+</Link>
          </div>
          <Link href="/compare" className="td-btn-primary px-6 py-3 text-sm font-semibold">
            Start comparing →
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-12">
        <div className="td-container">
          <h2 className="text-xl font-bold text-[var(--ink)] mb-6 text-center">Everything you need to make the right career move</h2>
          <p className="text-center text-[var(--muted)] mb-8 text-sm">Structured data across key product areas, all connected.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "💰", label: "Salaries", desc: "Level-aware compensation data by company, role, and location.", href: "/salaries" },
              { icon: "🏢", label: "Companies", desc: "Research employers: ratings, salary ranges, and headcount.", href: "/companies" },
              { icon: "⚖️", label: "Compare", desc: "Side-by-side salary comparison with delta calculations.", href: "/compare" },
              { icon: "🛠️", label: "Tools", desc: "Tax calculator, hike calculator, and more career tools.", href: "/compare" },
            ].map((f) => (
              <Link
                key={f.label}
                href={f.href}
                className="td-panel p-5 hover:border-[var(--brand)] hover:shadow-md transition-all group"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <p className="font-semibold text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors mb-1">{f.label}</p>
                <p className="text-xs text-[var(--muted)]">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
