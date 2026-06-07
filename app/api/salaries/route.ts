import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const company = searchParams.get("company") ?? "";
  const role = searchParams.get("role") ?? "";
  const level = searchParams.get("level") ?? "";
  const location = searchParams.get("location") ?? "";
  const currency = searchParams.get("currency") ?? "";
  const sort = searchParams.get("sort") ?? "total_comp_desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const rawLimit = parseInt(searchParams.get("limit") ?? "25", 10);
  const limit = Math.min(100, Math.max(1, rawLimit)); // Hard cap at 100
  const offset = (page - 1) * limit;

  const db = await getDb();

  const conditions: string[] = ["1=1"];
  const params: (string | number)[] = [];

  if (company) {
    conditions.push("LOWER(c.name) LIKE ?");
    params.push(`%${company.toLowerCase()}%`);
  }
  if (role) {
    conditions.push("LOWER(s.role) LIKE ?");
    params.push(`%${role.toLowerCase()}%`);
  }
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
  if (location) {
    conditions.push("LOWER(s.location) LIKE ?");
    params.push(`%${location.toLowerCase()}%`);
  }
  if (currency) {
    conditions.push("s.currency = ?");
    params.push(currency);
  }

  const where = conditions.join(" AND ");

  const orderMap: Record<string, string> = {
    total_comp_desc: "s.total_compensation DESC",
    total_comp_asc: "s.total_compensation ASC",
    date_desc: "s.submitted_at DESC",
  };
  const orderBy = orderMap[sort] ?? "s.total_compensation DESC";

  // Count total
  const countResult = db.exec(
    `SELECT COUNT(*) FROM salaries s JOIN companies c ON c.id = s.company_id WHERE ${where}`,
    params
  );
  const total = Number(countResult[0]?.values?.[0]?.[0] ?? 0);

  // Fetch page
  const dataResult = db.exec(
    `SELECT s.id, s.role, s.level, s.location, s.currency, s.experience_years,
            s.base_salary, s.bonus, s.stock, s.total_compensation,
            s.source, s.confidence_score, s.is_verified, s.submitted_at,
            c.id as company_id, c.name as company_name, c.slug as company_slug,
            c.industry, c.headquarters, c.founded_year, c.headcount_range
     FROM salaries s JOIN companies c ON c.id = s.company_id
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const cols = dataResult[0]?.columns ?? [];
  const rows = (dataResult[0]?.values ?? []).map((vals) => {
    const r: Record<string, unknown> = {};
    cols.forEach((col, i) => { r[col] = vals[i]; });
    return {
      id: r.id,
      role: r.role,
      level: r.level,
      location: r.location,
      currency: r.currency,
      experience_years: r.experience_years,
      base_salary: r.base_salary,
      bonus: r.bonus,
      stock: r.stock,
      total_compensation: r.total_compensation,
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
  });

  const totalPages = Math.ceil(total / limit);

  const res = NextResponse.json({
    data: rows,
    meta: { total, page, limit, totalPages },
  });

  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
  return res;
}
