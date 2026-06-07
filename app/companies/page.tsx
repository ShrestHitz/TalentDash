import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Browse Companies — Salaries, Reviews & Culture | TalentDash",
  description: "Discover and research top employers in India. View salary ranges, employee reviews, level distributions, and compensation data for Google, Amazon, TCS, Flipkart, and more.",
  alternates: { canonical: "https://talentdash.in/companies" },
  openGraph: {
    title: "Browse Companies — Salaries, Reviews & Culture | TalentDash",
    description: "Discover and research top employers in India. View salary ranges, employee reviews, level distributions, and compensation data for Google, Amazon, TCS, Flipkart, and more.",
    url: "https://talentdash.in/companies",
    type: "website",
    siteName: "TalentDash",
  },
};

const COMPANY_COLORS: Record<string, string> = {
  google: "#4285F4", amazon: "#FF9900", microsoft: "#00A1F1", meta: "#0866FF",
  flipkart: "#2874F0", nvidia: "#76B900", razorpay: "#3395FF", meesho: "#9F2089",
  tcs: "#1A1A6E", wipro: "#491685", infosys: "#007CC3", zepto: "#FD4F00",
};

function CompanyLogo({ slug, name, size = 40 }: { slug: string; name: string; size?: number }) {
  const color = COMPANY_COLORS[slug] ?? "#e11d48";
  return (
    <div style={{
      height: size, width: size, borderRadius: 10,
      background: color + "18", color,
      display: "grid", placeItems: "center",
      fontSize: size * 0.3, fontWeight: 700,
      border: "1px solid " + color + "30",
      flexShrink: 0,
    }}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

const FUNDING_STAGES = [
  { emoji: "🛡️", label: "Pre-Seed" },
  { emoji: "🌱", label: "Seed" },
  { emoji: "🚀", label: "Series A" },
  { emoji: "📈", label: "Series B" },
  { emoji: "💎", label: "Series C" },
  { emoji: "🏆", label: "Series D" },
  { emoji: "⚡", label: "Series E+" },
  { emoji: "📊", label: "Post IPO" },
];

const EXPLORE_WAYS = [
  { icon: "👤", label: "By experience", sub: "Internship to Leadership" },
  { icon: "📍", label: "By location", sub: "Top cities & remote" },
  { icon: "📊", label: "By company size", sub: "Startups to Enterprises" },
  { icon: "🏭", label: "By industry", sub: "Tech, Finance, Healthcare & more" },
  { icon: "⭐", label: "By rating", sub: "4★ & above companies" },
  { icon: "🚀", label: "By funding stage", sub: "Pre-seed to Unicorns" },
  { icon: "🏅", label: "By known for", sub: "Benefits, Culture & more" },
  { icon: "🛡️", label: "By badges", sub: "Verified & featured companies" },
];

const POPULAR_COMPARISONS = [
  { c1: { slug: "google", name: "Google" }, c2: { slug: "meta", name: "Meta" }, label: "Compensation & Benefits" },
  { c1: { slug: "amazon", name: "Amazon" }, c2: { slug: "microsoft", name: "Microsoft" }, label: "Career Growth" },
  { c1: { slug: "nvidia", name: "NVIDIA" }, c2: { slug: "google", name: "Google" }, label: "Culture & Work-Life" },
  { c1: { slug: "tcs", name: "TCS" }, c2: { slug: "infosys", name: "Infosys" }, label: "Salaries & Benefits" },
];

export default async function CompaniesPage() {
  const db = await getDb();

  const result = db.exec(`
    SELECT c.id, c.name, c.slug, c.industry, c.headquarters, c.headcount_range,
           COUNT(s.id) as salary_count,
           AVG(s.total_compensation) as avg_tc,
           MIN(s.total_compensation) as min_tc,
           MAX(s.total_compensation) as max_tc
    FROM companies c
    LEFT JOIN salaries s ON s.company_id = c.id
    GROUP BY c.id
    ORDER BY salary_count DESC, avg_tc DESC
  `);

  const cols = result[0]?.columns ?? [];
  const companies = (result[0]?.values ?? []).map((vals: any[]) => {
    const r: Record<string, unknown> = {};
    cols.forEach((col: string, i: number) => { r[col] = vals[i]; });
    return r;
  });

  const popularCompanies = companies.filter(c => Number(c.salary_count) > 0).slice(0, 7);
  const aiCompanies = companies.filter(c => ["google", "nvidia"].includes(c.slug as string));
  const indianCompanies = companies.filter(c => ["flipkart", "infosys", "meesho", "razorpay", "tcs", "wipro", "zepto"].includes(c.slug as string));

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-[var(--line)] bg-white">
        <div className="td-container py-2 text-xs text-[var(--muted)]">
          Companies
        </div>
      </div>

      <div className="td-container py-8 space-y-10">

        {/* Search section */}
        <section>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--ink)] mb-2">Search for Company</h1>
          <p className="text-[var(--muted)] mb-6">Search companies to explore salaries, benefits, and more.</p>
          <form action="/companies" className="td-card p-2 flex gap-2 max-w-xl shadow-[var(--shadow-lg)]">
            <input
              name="q"
              placeholder="Search companies..."
              className="flex-1 px-4 py-2.5 text-sm outline-none rounded-lg bg-white"
            />
            <button className="td-btn-primary px-5 py-2.5 text-sm">Search</button>
          </form>
        </section>

        {/* Popular Companies */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--ink)]">Popular Companies</h2>
            <Link href="/companies" className="text-sm font-semibold text-[var(--brand)] hover:underline">View all companies →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {popularCompanies.map((c) => (
              <Link
                key={c.slug as string}
                href={`/companies/${c.slug}`}
                className="td-panel p-4 flex flex-col items-center gap-2 text-center hover:border-[var(--brand)] hover:shadow-md transition-all group"
              >
                <CompanyLogo slug={c.slug as string} name={c.name as string} />
                <span className="text-xs font-semibold text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors line-clamp-1">{c.name as string}</span>
                <span className="text-xs text-[var(--brand)] font-semibold">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Funding stages */}
        <section>
          <h2 className="text-lg font-bold text-[var(--ink)] mb-4">Startups by Funding Stage</h2>
          <div className="flex flex-wrap gap-2">
            {FUNDING_STAGES.map((stage) => (
              <button key={stage.label} className="filter-pill hover:active">
                {stage.emoji}{stage.label}
              </button>
            ))}
          </div>
        </section>

        {/* AI + Indian companies side by side */}
        <div className="grid sm:grid-cols-2 gap-6">
          <section>
            <h2 className="text-lg font-bold text-[var(--ink)] mb-4">Top AI Companies</h2>
            <div className="space-y-2">
              {aiCompanies.map((c) => (
                <Link
                  key={c.slug as string}
                  href={`/companies/${c.slug}`}
                  className="td-panel p-3 flex items-center gap-3 hover:border-[var(--brand)] transition-all group"
                >
                  <CompanyLogo slug={c.slug as string} name={c.name as string} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors">{c.name as string}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{c.industry as string}</p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--brand)]">→</span>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-lg font-bold text-[var(--ink)] mb-4">Top Indian Companies</h2>
            <div className="space-y-2">
              {indianCompanies.map((c) => (
                <Link
                  key={c.slug as string}
                  href={`/companies/${c.slug}`}
                  className="td-panel p-3 flex items-center gap-3 hover:border-[var(--brand)] transition-all group"
                >
                  <CompanyLogo slug={c.slug as string} name={c.name as string} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors">{c.name as string}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{c.industry as string}</p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--brand)]">→</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Not sure CTA */}
        <div className="td-panel p-4 bg-[var(--brand-soft)] border-[var(--brand)] border-opacity-20 flex items-center gap-3">
          <span className="text-xl">✨</span>
          <p className="text-sm text-[var(--ink)]">
            Not sure where to start?{" "}
            <Link href="/salaries" className="font-semibold text-[var(--brand)] hover:underline">
              Check out our top paying companies in India. →
            </Link>
          </p>
        </div>

        {/* Compare section */}
        <section className="td-card p-6 text-center">
          <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Compare companies. Make better career moves.</h2>
          <p className="text-sm text-[var(--muted)] mb-6">Compare salaries, benefits, culture, growth and more to find the right workplace for you.</p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Link href="/compare" className="h-20 w-32 border-2 border-dashed border-[var(--line)] rounded-xl flex items-center justify-center text-2xl font-bold text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all">+</Link>
            <span className="font-bold text-[var(--muted)] text-lg">vs</span>
            <Link href="/compare" className="h-20 w-32 border-2 border-dashed border-[var(--line)] rounded-xl flex items-center justify-center text-2xl font-bold text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all">+</Link>
          </div>
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--muted)] mb-3">Popular comparisons</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--muted)]" />
              <Link href="/compare" className="text-xs font-semibold text-[var(--brand)] hover:underline">View all comparisons →</Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {POPULAR_COMPARISONS.map((cmp) => (
                <Link
                  key={`${cmp.c1.slug}-${cmp.c2.slug}`}
                  href="/compare"
                  className="td-panel p-3 flex items-center gap-2 hover:border-[var(--brand)] transition-all text-left group"
                >
                  <CompanyLogo slug={cmp.c1.slug} name={cmp.c1.name} size={28} />
                  <span className="text-xs text-[var(--muted)]">vs</span>
                  <CompanyLogo slug={cmp.c2.slug} name={cmp.c2.name} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors truncate">
                      {cmp.c1.name} vs {cmp.c2.name}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{cmp.label}</p>
                  </div>
                  <span className="text-xs text-[var(--brand)]">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Explore companies */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✨</span>
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Discover companies</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Explore companies your way</h2>
          <p className="text-sm text-[var(--muted)] mb-4">Find the right companies based on what matters to you.</p>
          <div className="flex items-center justify-end mb-4">
            <Link href="/companies" className="text-sm font-semibold text-[var(--brand)] hover:underline">View all companies →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {[
              { label: "Top paying companies", sub: `${companies.length} companies`, href: "/companies" },
              { label: "Remote friendly companies", sub: "Remote & hybrid", href: "/companies" },
              { label: "Highly rated companies", sub: "Top rated", href: "/companies" },
              { label: "Fast growing companies", sub: "High growth", href: "/companies" },
              { label: "Product based companies", sub: "Product roles", href: "/companies" },
              { label: "AI & tech companies", sub: "Cutting edge", href: "/companies" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="td-panel p-4 hover:border-[var(--brand)] hover:shadow-md transition-all group">
                <p className="font-semibold text-sm text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors">{item.label}</p>
                <p className="text-xs text-[var(--muted)] mt-1">{item.sub} →</p>
              </Link>
            ))}
          </div>
          <h3 className="text-base font-bold text-[var(--ink)] mb-3">Quick ways to explore</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EXPLORE_WAYS.map((w) => (
              <Link key={w.label} href="/companies" className="td-panel p-3 hover:border-[var(--brand)] transition-all group flex items-start gap-2">
                <span className="text-lg">{w.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors">{w.label}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{w.sub} →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* All Companies grid */}
        <section>
          <h2 className="text-xl font-bold text-[var(--ink)] mb-4">All Companies ({companies.length})</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c) => (
              <Link
                key={c.id as string}
                href={`/companies/${c.slug}`}
                className="td-card p-5 hover:border-[var(--brand)] hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: (COMPANY_COLORS[c.slug as string] ?? "#e11d48") + "18", color: COMPANY_COLORS[c.slug as string] ?? "#e11d48", border: "1px solid " + (COMPANY_COLORS[c.slug as string] ?? "#e11d48") + "30" }}
                  >
                    {(c.name as string).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors truncate">{c.name as string}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{c.industry as string}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[var(--muted)]">Median TC</p>
                    <p className="font-bold text-[var(--brand)] text-sm">{Number(c.avg_tc) > 0 ? formatCurrency(Number(c.avg_tc), "INR", "INR") : "–"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted)]">Records</p>
                    <p className="font-bold text-[var(--ink)] text-sm">{Number(c.salary_count).toLocaleString()}</p>
                  </div>
                </div>
                {c.headquarters && (
                  <p className="text-xs text-[var(--muted)] mt-3">📍 {c.headquarters as string}</p>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="td-panel p-4 bg-[var(--brand-soft)] border-[var(--brand)] border-opacity-20 flex items-center gap-3">
          <span className="text-xl">✨</span>
          <p className="text-sm text-[var(--ink)]">
            Not sure where to start?{" "}
            <Link href="/salaries" className="font-semibold text-[var(--brand)] hover:underline">
              Check out our top paying companies in India. →
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
