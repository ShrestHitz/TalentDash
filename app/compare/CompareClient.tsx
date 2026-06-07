"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { formatCurrency } from "@/lib/currency";
import type { LevelEnum } from "@/types";

interface SalaryOption {
  id: string;
  label: string;
  company_name: string;
  role: string;
  level: string;
  location: string;
  currency: string;
  base_salary: number;
  bonus: number;
  stock: number;
  total_compensation: number;
  experience_years: number;
}

interface CompareRecord {
  id: string;
  role: string;
  level: string;
  location: string;
  currency: string;
  base_salary: number;
  bonus: number;
  stock: number;
  total_compensation: number;
  experience_years: number;
  company: { name: string; slug: string; industry: string };
}

const ROWS = [
  { label: "Company", key: "company_name", isMonetary: false, isSummary: false },
  { label: "Title", key: "role", isMonetary: false, isSummary: false },
  { label: "Level", key: "level", isMonetary: false, isSummary: false },
  { label: "Location", key: "location", isMonetary: false, isSummary: false },
  { label: "Experience", key: "experience_years", isMonetary: false, isSummary: false, deltaKey: "experience_delta" },
  { label: "Base", key: "base_salary", isMonetary: true, isSummary: false, deltaKey: "base_delta" },
  { label: "Bonus", key: "bonus", isMonetary: true, isSummary: false, deltaKey: "bonus_delta" },
  { label: "Stock", key: "stock", isMonetary: true, isSummary: false, deltaKey: "stock_delta" },
  { label: "Total compensation", key: "total_compensation", isMonetary: true, isSummary: true, deltaKey: "tc_delta" },
];

function Delta({ value, currency }: { value: number; currency: string }) {
  if (value === 0) return <span className="text-[var(--muted)] text-xs">No difference</span>;
  const formatted = formatCurrency(Math.abs(value), currency, currency);
  return (
    <span className={`text-xs font-black tabular-nums ${value > 0 ? "text-[var(--green)]" : "text-[var(--danger)]"}`}>
      {value > 0 ? "+" : "-"}{formatted}
    </span>
  );
}

export default function CompareClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [options, setOptions] = useState<SalaryOption[]>([]);
  const [s1, setS1] = useState(searchParams.get("s1") ?? "");
  const [s2, setS2] = useState(searchParams.get("s2") ?? "");
  const [result, setResult] = useState<{ record1: CompareRecord; record2: CompareRecord; delta: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/salaries?limit=100&sort=total_comp_desc")
      .then((r) => r.json())
      .then((d) => setOptions(
        d.data.map((s: any) => ({
          id: s.id,
          label: `${s.company.name} - ${s.role} - ${s.level} - ${s.location}`,
          company_name: s.company.name,
          role: s.role,
          level: s.level,
          location: s.location,
          currency: s.currency,
          base_salary: s.base_salary,
          bonus: s.bonus,
          stock: s.stock,
          total_compensation: s.total_compensation,
          experience_years: s.experience_years,
        }))
      ));
  }, []);

  const compare = useCallback(async (id1: string, id2: string) => {
    if (!id1 || !id2 || id1 === id2) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/compare?s1=${id1}&s2=${id2}`);
      if (!res.ok) {
        setError((await res.json()).message ?? "Unable to compare these records");
        setResult(null);
      } else {
        setResult(await res.json());
        router.replace(`/compare?s1=${id1}&s2=${id2}`, { scroll: false });
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (s1 && s2 && s1 !== s2) compare(s1, s2);
  }, [s1, s2, compare]);

  function getVal(rec: CompareRecord, key: string) {
    if (key === "company_name") return rec.company.name;
    return (rec as any)[key];
  }

  function fmt(rec: CompareRecord, row: typeof ROWS[0]): string {
    const v = getVal(rec, row.key);
    if (row.isMonetary) {
      if (!v || (Number(v) === 0 && row.key !== "base_salary")) return "-";
      return formatCurrency(Number(v), rec.currency, rec.currency);
    }
    if (row.key === "experience_years") return `${v} yrs`;
    return String(v ?? "-");
  }

  const winner = result
    ? result.delta.tc_delta > 0 ? 1 : result.delta.tc_delta < 0 ? 2 : 0
    : 0;

  return (
    <div className="td-container py-8">
      <section className="grid lg:grid-cols-[1fr_360px] gap-5 mb-6">
        <div className="td-card p-6">
          <p className="td-kicker mb-2">Tools</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--ink)]">Offer comparison calculator</h1>
          <p className="text-[var(--muted)] mt-2 max-w-2xl">
            Pick two salary records and compare base, bonus, stock, total compensation, level, experience, and location side by side.
          </p>
        </div>
        <div className="td-card p-5">
          <p className="text-xs font-bold text-[var(--muted)]">How to use</p>
          <ol className="mt-3 space-y-2 text-sm text-[#344054]">
            <li><span className="font-black">1.</span> Select Offer A.</li>
            <li><span className="font-black">2.</span> Select Offer B.</li>
            <li><span className="font-black">3.</span> Share the URL with selected records.</li>
          </ol>
        </div>
      </section>

      <div className="td-card p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[{ label: "Offer A", val: s1, set: setS1 }, { label: "Offer B", val: s2, set: setS2 }].map(({ label, val, set }) => (
            <label key={label} className="block">
              <span className="block text-[11px] font-black text-[var(--muted)] uppercase mb-1">{label}</span>
              <select
                value={val}
                onChange={(e) => set(e.target.value)}
                className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--brand)]"
              >
                <option value="">Select a salary record</option>
                {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
          ))}
        </div>
      </div>

      {error && <div className="td-card border-[var(--danger)] px-4 py-3 text-sm font-bold text-[var(--danger)] mb-4">{error}</div>}

      {!result && !loading && !error && (
        <div className="td-card py-16 text-center">
          <p className="text-[var(--ink)] font-black text-lg mb-1">Select two records to compare</p>
          <p className="text-sm text-[var(--muted)]">You can also start from any salary row by clicking Compare.</p>
        </div>
      )}

      {loading && <div className="td-card py-16 text-center text-sm font-bold text-[var(--muted)]">Loading comparison...</div>}

      {result && !loading && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          <div className="td-card overflow-hidden">
            <div className="grid grid-cols-4 border-b border-[var(--line)] bg-[var(--surface-soft)] min-w-[760px]">
              <div className="px-4 py-3 text-xs font-black text-[var(--muted)] uppercase">Field</div>
              {[result.record1, result.record2].map((rec, idx) => (
                <div key={idx} className={`px-4 py-3 text-center ${winner === idx + 1 ? "bg-[var(--green-soft)]" : ""}`}>
                  <div className="flex items-center justify-center gap-2">
                    <Link href={`/companies/${rec.company.slug}`} className="text-sm font-black text-[var(--ink)] hover:text-[var(--brand)]">
                      {rec.company.name}
                    </Link>
                    {winner === idx + 1 && (
                      <span className="bg-[var(--green)] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Higher TC</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="px-4 py-3 text-xs font-black text-[var(--muted)] uppercase text-center">A vs B</div>
            </div>

            <div className="overflow-x-auto">
              {ROWS.map((row) => {
                const delta = row.deltaKey ? result.delta[row.deltaKey] : null;
                return (
                  <div key={row.key} className={`grid grid-cols-4 min-w-[760px] border-b border-[#edf2f7] ${row.isSummary ? "bg-[var(--surface-soft)]" : "hover:bg-[#f9fbff]"}`}>
                    <div className="px-4 py-3 text-xs text-[var(--muted)] font-black flex items-center">{row.label}</div>
                    {[result.record1, result.record2].map((rec, idx) => (
                      <div key={idx} className={`px-4 py-3 flex items-center justify-center ${winner === idx + 1 && row.isSummary ? "bg-[var(--green-soft)]" : ""}`}>
                        {row.key === "level"
                          ? <LevelBadge level={getVal(rec, "level") as LevelEnum} size="sm" />
                          : <span className={`text-sm text-center ${row.isSummary ? "font-black text-[var(--brand)]" : "font-semibold text-[#344054]"}`}>{fmt(rec, row)}</span>
                        }
                      </div>
                    ))}
                    <div className="px-4 py-3 flex items-center justify-center">
                      {delta !== null && delta !== undefined
                        ? <Delta value={delta} currency={result.record1.currency} />
                        : <span className="text-[var(--muted)] text-xs">-</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="td-card p-5 h-fit">
            <p className="td-kicker">Decision summary</p>
            <h2 className="text-xl font-black mt-1">
              {winner === 1 ? "Offer A pays more" : winner === 2 ? "Offer B pays more" : "Offers are tied"}
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Total compensation delta is the clearest financial signal, but level, location, and experience should also be considered.
            </p>
            <div className="mt-4 rounded-md bg-[var(--brand-soft)] p-4">
              <p className="text-xs font-black text-[var(--muted)]">Total comp delta</p>
              <p className="text-2xl font-black text-[var(--brand)]">
                {formatCurrency(Math.abs(result.delta.tc_delta), result.record1.currency, result.record1.currency)}
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
