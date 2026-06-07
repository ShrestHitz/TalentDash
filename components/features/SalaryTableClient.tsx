"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { SalaryCell } from "@/components/ui/SalaryCell";
import { VALID_LEVELS, LEVEL_DISPLAY } from "@/lib/levels";
import type { SalaryWithCompany, PaginationMeta, LevelEnum } from "@/types";

interface Props {
  initialData: SalaryWithCompany[];
  initialMeta: PaginationMeta;
  initialParams: {
    company: string; role: string; level: string;
    location: string; currency: string; sort: string; page: number;
  };
}

const CURRENCIES = ["INR", "USD", "GBP", "EUR"];

const COMPANY_COLORS: Record<string, string> = {
  google: "#4285F4", amazon: "#FF9900", microsoft: "#00A1F1", meta: "#0866FF",
  flipkart: "#2874F0", nvidia: "#76B900", razorpay: "#3395FF", meesho: "#9F2089",
  tcs: "#1A1A6E", wipro: "#491685", infosys: "#007CC3", zepto: "#FD4F00",
};

function CompanyAvatar({ slug, name }: { slug: string; name: string }) {
  const color = COMPANY_COLORS[slug] ?? "#e11d48";
  return (
    <div style={{
      height: 30, width: 30, borderRadius: 8,
      background: color + "18", color,
      display: "grid", placeItems: "center",
      fontSize: 10, fontWeight: 700,
      border: "1px solid " + color + "30",
      flexShrink: 0,
    }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function SalaryTableClient({ initialData, initialMeta, initialParams }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [data, setData] = useState<SalaryWithCompany[]>(initialData);
  const [meta, setMeta] = useState<PaginationMeta>(initialMeta);
  const [loading, setLoading] = useState(false);

  const [company, setCompany] = useState(initialParams.company);
  const [role, setRole] = useState(initialParams.role);
  const [levels, setLevels] = useState<string[]>(initialParams.level ? initialParams.level.split(",").filter(Boolean) : []);
  const [location, setLocation] = useState(initialParams.location);
  const [currency, setCurrency] = useState(initialParams.currency || "INR");
  const [sort, setSort] = useState(initialParams.sort || "total_comp_desc");
  const [page, setPage] = useState(initialParams.page || 1);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const buildQS = useCallback((overrides: Record<string, string | number> = {}) => {
    const p = new URLSearchParams();
    const merged = { company, role, level: levels.join(","), location, sort, page: String(page), ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
    return p.toString();
  }, [company, role, levels, location, sort, page]);

  const fetchRows = useCallback(async (qs: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/salaries?${qs}`);
      const json = await res.json();
      setData(json.data);
      setMeta(json.meta);
    } finally {
      setLoading(false);
    }
  }, []);

  const apply = useCallback((overrides: Record<string, string | number> = {}) => {
    const qs = buildQS({ page: "1", ...overrides });
    startTransition(() => router.replace(`/salaries?${qs}`, { scroll: false }));
    fetchRows(qs);
  }, [buildQS, router, fetchRows]);

  const handleTextFilter = (key: "company" | "role" | "location", value: string) => {
    if (key === "company") setCompany(value);
    if (key === "role") setRole(value);
    if (key === "location") setLocation(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(setTimeout(() => apply({ [key]: value, page: "1" }), 280));
  };

  const toggleLevel = (lv: string) => {
    const next = levels.includes(lv) ? levels.filter((l) => l !== lv) : [...levels, lv];
    setLevels(next);
    apply({ level: next.join(","), page: "1" });
  };

  const handleCurrency = (c: string) => {
    setCurrency(c);
    const qs = buildQS({ page: "1", currency: c });
    startTransition(() => router.replace(`/salaries?${qs}`, { scroll: false }));
  };

  const handleSort = (next: string) => {
    setSort(next);
    apply({ sort: next, page: "1" });
  };

  const changePage = (pg: number) => {
    setPage(pg);
    const qs = buildQS({ page: String(pg) });
    startTransition(() => router.replace(`/salaries?${qs}`, { scroll: false }));
    fetchRows(qs);
  };

  const clearAll = () => {
    setCompany(""); setRole(""); setLevels([]); setLocation("");
    setCurrency("INR"); setSort("total_comp_desc"); setPage(1);
    router.replace("/salaries");
    fetchRows("");
  };

  const hasFilters = company || role || levels.length > 0 || location;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="td-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="block">
            <span className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">Company</span>
            <input
              value={company}
              onChange={(e) => handleTextFilter("company", e.target.value)}
              placeholder="Google, Amazon, TCS"
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)] transition-all"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">Title</span>
            <input
              value={role}
              onChange={(e) => handleTextFilter("role", e.target.value)}
              placeholder="Software Engineer"
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)] transition-all"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">Location</span>
            <input
              value={location}
              onChange={(e) => handleTextFilter("location", e.target.value)}
              placeholder="Bengaluru"
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)] transition-all"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">Display currency</span>
            <select
              value={currency}
              onChange={(e) => handleCurrency(e.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand)] transition-all"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">Level</span>
            {VALID_LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => toggleLevel(lv)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                  levels.includes(lv)
                    ? "bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm"
                    : "bg-white border-[var(--line)] text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                }`}
              >
                {LEVEL_DISPLAY[lv]}
              </button>
            ))}
            {hasFilters && (
              <button onClick={clearAll} className="text-xs font-semibold text-[var(--brand)] hover:underline">
                Clear filters
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="w-full sm:w-56 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[var(--brand)] transition-all"
          >
            <option value="total_comp_desc">Total comp: high to low</option>
            <option value="total_comp_asc">Total comp: low to high</option>
            <option value="date_desc">Newest first</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="td-card overflow-hidden">
        {loading && <div className="h-0.5 bg-[var(--brand)] animate-pulse" />}
        <div className="overflow-x-auto">
          <table className="td-table min-w-[900px]">
            <thead>
              <tr>
                <th className="text-left">Company</th>
                <th className="text-left">Title</th>
                <th className="text-left">Level</th>
                <th className="text-left">Location</th>
                <th className="text-left">Exp</th>
                <th className="text-right">Base</th>
                <th className="text-right">Bonus</th>
                <th className="text-right">Stock</th>
                <th className="text-right">Total Comp</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <p className="font-semibold text-[var(--ink)] mb-2">No records match these filters.</p>
                    <button onClick={clearAll} className="text-xs font-semibold text-[var(--brand)] hover:underline">
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : data.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <CompanyAvatar slug={row.company.slug} name={row.company.name} />
                      <div>
                        <Link href={`/companies/${row.company.slug}`} className="font-semibold text-[var(--ink)] hover:text-[var(--brand)] transition-colors">
                          {row.company.name}
                        </Link>
                        <div className="text-xs text-[var(--muted)]">{row.company.industry}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-medium max-w-[170px] truncate text-[var(--ink)]">{row.role}</td>
                  <td><LevelBadge level={row.level as LevelEnum} /></td>
                  <td className="text-[var(--muted)]">{row.location}</td>
                  <td className="text-[var(--muted)]">{row.experience_years}y</td>
                  <td className="text-right"><SalaryCell amount={row.base_salary} currency={row.currency} displayCurrency={currency} /></td>
                  <td className="text-right"><SalaryCell amount={row.bonus} currency={row.currency} displayCurrency={currency} /></td>
                  <td className="text-right"><SalaryCell amount={row.stock} currency={row.currency} displayCurrency={currency} /></td>
                  <td className="text-right"><SalaryCell amount={row.total_compensation} currency={row.currency} displayCurrency={currency} bold /></td>
                  <td className="text-right">
                    <Link href={`/compare?s1=${row.id}`} className="text-xs font-semibold text-[var(--brand)] hover:underline whitespace-nowrap">
                      Compare
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta.total > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between px-4 py-3 border-t border-[var(--line)] bg-[#f8fafc]">
            <span className="text-xs text-[var(--muted)]">
              Showing {Math.min((meta.page - 1) * meta.limit + 1, meta.total)}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total.toLocaleString()} records
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changePage(meta.page - 1)}
                disabled={meta.page <= 1}
                className="td-btn-secondary px-3 py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <span className="text-xs font-medium text-[var(--muted)]">Page {meta.page} of {meta.totalPages}</span>
              <button
                onClick={() => changePage(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="td-btn-secondary px-3 py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
