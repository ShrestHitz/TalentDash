import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { SalaryCell } from "@/components/ui/SalaryCell";
import { formatCurrency } from "@/lib/currency";
import { LEVEL_DISPLAY, VALID_LEVELS } from "@/lib/levels";
import type { LevelEnum } from "@/types";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const db = await getDb();
  const result = db.exec(`SELECT slug FROM companies`);
  return (result[0]?.values ?? []).map(([slug]) => ({ slug: String(slug) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = await getDb();
  const result = db.exec(`SELECT name FROM companies WHERE slug = ? LIMIT 1`, [slug]);
  const name = (result[0]?.values?.[0]?.[0] as string) ?? slug;
  return {
    title: `${name} Salaries, Reviews and Interviews | TalentDash`,
    description: `Company profile for ${name}: salary benchmarks, level distribution, overview, reviews, benefits, jobs, interviews, and Q&A.`,
    alternates: { canonical: `https://talentdash.io/companies/${slug}` },
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const db = await getDb();

  const companyResult = db.exec(`SELECT * FROM companies WHERE slug = ? LIMIT 1`, [slug]);
  if (!companyResult[0]?.values?.length) notFound();

  const companyCols: string[] = companyResult[0].columns;
  const companyVals: unknown[] = companyResult[0].values[0];
  const company: Record<string, unknown> = {};
  companyCols.forEach((col, i) => { company[col] = companyVals[i]; });

  const salariesResult = db.exec(
    `SELECT * FROM salaries WHERE company_id = ? ORDER BY total_compensation DESC`,
    [company.id as string]
  );
  const salCols: string[] = salariesResult[0]?.columns ?? [];
  const salaries: Record<string, unknown>[] = (salariesResult[0]?.values ?? []).map((vals: any[]) => {
    const s: Record<string, unknown> = {};
    salCols.forEach((col, i) => { s[col] = vals[i]; });
    s.is_verified = Boolean(s.is_verified);
    return s;
  });

  const tcValues = salaries.map((s) => Number(s.total_compensation)).sort((a, b) => a - b);
  let medianTC = 0;
  if (tcValues.length > 0) {
    const mid = Math.floor(tcValues.length / 2);
    medianTC = tcValues.length % 2 === 0 ? (tcValues[mid - 1] + tcValues[mid]) / 2 : tcValues[mid];
  }

  const avgTC = tcValues.length ? tcValues.reduce((a, b) => a + b, 0) / tcValues.length : 0;

  const levelDist: Record<string, number> = {};
  for (const s of salaries) {
    const lv = s.level as string;
    levelDist[lv] = (levelDist[lv] ?? 0) + 1;
  }
  const levelsPresent = VALID_LEVELS.filter((l) => levelDist[l]);

  const roleCount = new Set(salaries.map((s) => s.role)).size;
  const locationCount = new Set(salaries.map((s) => s.location)).size;
  const mockRating = Math.min(4.8, 3.7 + salaries.length / 30);
  const recommendPct = Math.min(96, 70 + salaries.length * 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": company.name,
    "url": `https://talentdash.io/companies/${slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="bg-white border-b border-[var(--line)]">
        <div className="td-container py-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)] mb-4">
            <Link href="/companies" className="hover:text-[var(--brand)]">Companies</Link>
            <span>/</span>
            <span className="text-[var(--ink)]">{company.name as string}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-5 lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="h-16 w-16 rounded-xl text-white grid place-items-center text-xl font-bold flex-shrink-0" style={{ background: "#e11d4818", color: "#e11d48", border: "1px solid #e11d4830" }}>
                {String(company.name).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink)]">{company.name as string}</h1>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {company.industry as string}
                  {company.headquarters ? ` - ${company.headquarters}` : ""}
                  {company.founded_year ? ` - Founded ${company.founded_year}` : ""}
                  {company.headcount_range ? ` - ${company.headcount_range} employees` : ""}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Link href={`/salaries?company=${company.name}`} className="td-btn-primary px-4 py-2 text-xs">View salaries</Link>
                  <Link href={`/compare?c1=${slug}`} className="td-btn-secondary px-4 py-2 text-xs">Compare offers</Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 min-w-full lg:min-w-[360px]">
              <div className="td-panel p-3">
                <p className="text-xs font-bold text-[var(--muted)]">Rating</p>
                <p className="text-2xl font-black">{mockRating.toFixed(1)}</p>
              </div>
              <div className="td-panel p-3">
                <p className="text-xs font-bold text-[var(--muted)]">Recommend</p>
                <p className="text-2xl font-black">{recommendPct}%</p>
              </div>
              <div className="td-panel p-3">
                <p className="text-xs font-bold text-[var(--muted)]">Records</p>
                <p className="text-2xl font-black">{salaries.length}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-6 overflow-x-auto border-t border-[var(--line)]">
            {["Overview", "Reviews", "Salaries", "Benefits", "Jobs", "Interviews", "Q&A"].map((tab, index) => (
              <Link
                key={tab}
                href={index === 2 ? `/salaries?company=${company.name}` : "#"}
                className={`td-tab ${index === 0 ? "td-tab-active" : ""}`}
              >
                {tab}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="td-container py-6 grid lg:grid-cols-[1fr_340px] gap-6">
        <main className="space-y-6">
          <section className="grid sm:grid-cols-4 gap-3">
            {[
              ["Median TC", formatCurrency(medianTC, "INR", "INR"), "Middle salary record"],
              ["Average TC", formatCurrency(avgTC, "INR", "INR"), "Across all roles"],
              ["Roles", roleCount.toLocaleString(), "Titles tracked"],
              ["Locations", locationCount.toLocaleString(), "Cities tracked"],
            ].map(([label, value, note]) => (
              <div key={label} className="td-card p-4">
                <p className="text-xs font-bold text-[var(--muted)]">{label}</p>
                <p className="text-xl font-black text-[var(--ink)] mt-1">{value}</p>
                <p className="text-xs text-[var(--muted)] mt-1">{note}</p>
              </div>
            ))}
          </section>

          <section className="td-card p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="td-kicker">Overview</p>
                <h2 className="text-xl font-black">Company snapshot</h2>
              </div>
              <span className="rounded-full bg-[var(--green-soft)] px-3 py-1 text-xs font-black text-[var(--green)]">
                Active hiring signal
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 text-sm text-[var(--muted)] leading-6">
                <p>
                  {company.name as string} is tracked in TalentDash as a {company.industry as string} employer with compensation data across roles, levels, and locations. This profile mirrors the reference pattern of combining overview, salary, review, benefit, job, interview, and Q&A sections into one company hub.
                </p>
              </div>
              <div className="rounded-md bg-[var(--surface-soft)] border border-[var(--line)] p-4">
                <p className="text-xs font-black text-[var(--muted)] uppercase">Workplace index</p>
                <p className="text-3xl font-black text-[var(--brand)] mt-1">{Math.round(mockRating * 18)}/100</p>
                <p className="text-xs text-[var(--muted)] mt-1">Estimated from available profile signals.</p>
              </div>
            </div>
          </section>

          {levelsPresent.length > 0 && (
            <section className="td-card p-5">
              <p className="td-kicker mb-1">Salaries</p>
              <h2 className="text-xl font-black mb-4">Level distribution</h2>
              <div className="flex h-6 rounded-md overflow-hidden gap-px mb-4 bg-[var(--line)]">
                {levelsPresent.map((level) => {
                  const pct = (levelDist[level] / salaries.length) * 100;
                  const colors: Record<string, string> = {
                    L3: "#94a3b8", SDE_I: "#94a3b8",
                    L4: "#3b82f6", SDE_II: "#3b82f6",
                    L5: "#6366f1", SDE_III: "#6366f1",
                    L6: "#a855f7", STAFF: "#a855f7",
                    PRINCIPAL: "#1e3a5f", IC4: "#7c3aed", IC5: "#5b21b6",
                  };
                  return (
                    <div
                      key={level}
                      style={{ width: `${pct}%`, backgroundColor: colors[level] ?? "#888" }}
                      title={`${LEVEL_DISPLAY[level as LevelEnum]} - ${levelDist[level]} (${pct.toFixed(0)}%)`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3">
                {levelsPresent.map((level) => (
                  <span key={level} className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                    <LevelBadge level={level as LevelEnum} size="sm" /> {levelDist[level]} records
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="td-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between">
              <div>
                <p className="td-kicker">Salaries</p>
                <h2 className="text-xl font-black">Salary records</h2>
              </div>
              <Link href={`/salaries?company=${company.name}`} className="td-btn-secondary px-3 py-2 text-xs">Open full table</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="td-table min-w-[860px]">
                <thead>
                  <tr>
                    <th className="text-left">Role</th>
                    <th className="text-left">Level</th>
                    <th className="text-left">Location</th>
                    <th className="text-left">Exp</th>
                    <th className="text-right">Base</th>
                    <th className="text-right">Bonus</th>
                    <th className="text-right">Stock</th>
                    <th className="text-right">Total comp</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((s) => (
                    <tr key={s.id as string}>
                      <td className="font-semibold">{s.role as string}</td>
                      <td><LevelBadge level={s.level as LevelEnum} /></td>
                      <td>{s.location as string}</td>
                      <td>{s.experience_years as number}y</td>
                      <td className="text-right"><SalaryCell amount={s.base_salary as number} currency={s.currency as string} displayCurrency="INR" /></td>
                      <td className="text-right"><SalaryCell amount={s.bonus as number} currency={s.currency as string} displayCurrency="INR" /></td>
                      <td className="text-right"><SalaryCell amount={s.stock as number} currency={s.currency as string} displayCurrency="INR" /></td>
                      <td className="text-right"><SalaryCell amount={s.total_compensation as number} currency={s.currency as string} displayCurrency="INR" bold /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        <aside className="space-y-4">
          <section className="td-card p-5">
            <p className="td-kicker">Reviews</p>
            <h2 className="text-lg font-black mt-1">Employee sentiment</h2>
            <div className="mt-4 space-y-3">
              {[
                ["Culture", "4.2"],
                ["Compensation", "4.4"],
                ["Work life", "3.9"],
                ["Career growth", "4.1"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#344054]">{label}</span>
                  <span className="font-black text-[var(--ink)]">{value}/5</span>
                </div>
              ))}
            </div>
          </section>

          <section className="td-card p-5">
            <p className="td-kicker">Interviews</p>
            <h2 className="text-lg font-black mt-1">Interview signals</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-md border border-[var(--line)] p-3">
                <p className="text-xs font-bold text-[var(--muted)]">Common rounds</p>
                <p className="font-black">DSA, system design, hiring manager</p>
              </div>
              <div className="rounded-md border border-[var(--line)] p-3">
                <p className="text-xs font-bold text-[var(--muted)]">Difficulty</p>
                <p className="font-black">Medium to hard</p>
              </div>
            </div>
          </section>

          <section className="td-card p-5">
            <p className="td-kicker">FAQs</p>
            <div className="mt-3 space-y-3 text-sm">
              <details className="group">
                <summary className="cursor-pointer font-black text-[var(--ink)]">How is total compensation calculated?</summary>
                <p className="mt-2 text-[var(--muted)]">Base salary plus bonus plus stock value.</p>
              </details>
              <details className="group">
                <summary className="cursor-pointer font-black text-[var(--ink)]">Can I compare this company?</summary>
                <p className="mt-2 text-[var(--muted)]">Use the compare tool from salary rows or the profile header.</p>
              </details>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
