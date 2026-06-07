import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

async function getSalary(db: any, id: string) {
  const result = db.exec(
    `SELECT s.*, c.name as company_name, c.slug as company_slug, c.industry, c.headquarters, c.founded_year, c.headcount_range
     FROM salaries s JOIN companies c ON c.id = s.company_id WHERE s.id = ? LIMIT 1`,
    [id]
  );
  if (!result[0]?.values?.length) return null;
  const cols: string[] = result[0].columns;
  const vals: unknown[] = result[0].values[0];
  const r: Record<string, unknown> = {};
  cols.forEach((col, i) => { r[col] = vals[i]; });

  return {
    id: r.id,
    role: r.role,
    level: r.level,
    location: r.location,
    currency: r.currency,
    experience_years: Number(r.experience_years),
    base_salary: Number(r.base_salary),
    bonus: Number(r.bonus),
    stock: Number(r.stock),
    total_compensation: Number(r.total_compensation),
    source: r.source,
    confidence_score: r.confidence_score,
    is_verified: Boolean(r.is_verified),
    submitted_at: r.submitted_at,
    company: {
      id: r.company_id,
      name: r.company_name,
      slug: r.company_slug,
      industry: r.industry,
      headquarters: r.headquarters,
      founded_year: r.founded_year,
      headcount_range: r.headcount_range,
    },
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const s1 = searchParams.get("s1");
  const s2 = searchParams.get("s2");

  if (!s1 || !s2) {
    return NextResponse.json({ error: true, message: "Both s1 and s2 query parameters are required" }, { status: 400 });
  }
  if (s1 === s2) {
    return NextResponse.json({ error: true, message: "s1 and s2 must be different records" }, { status: 400 });
  }

  const db = await getDb();
  const record1 = await getSalary(db, s1);
  if (!record1) return NextResponse.json({ error: true, message: `Record s1 not found` }, { status: 404 });

  const record2 = await getSalary(db, s2);
  if (!record2) return NextResponse.json({ error: true, message: `Record s2 not found` }, { status: 404 });

  const delta = {
    base_delta: record1.base_salary - record2.base_salary,
    bonus_delta: record1.bonus - record2.bonus,
    stock_delta: record1.stock - record2.stock,
    tc_delta: record1.total_compensation - record2.total_compensation,
    experience_delta: record1.experience_years - record2.experience_years,
  };

  return NextResponse.json({ record1, record2, delta });
}
