import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = await getDb();

  const companyResult = db.exec(
    `SELECT * FROM companies WHERE slug = ? LIMIT 1`,
    [slug]
  );

  if (!companyResult[0]?.values?.length) {
    return NextResponse.json({ error: true, message: "Company not found" }, { status: 404 });
  }

  const companyCols = companyResult[0].columns;
  const companyVals = companyResult[0].values[0];
  const company: Record<string, unknown> = {};
  companyCols.forEach((col, i) => { company[col] = companyVals[i]; });

  // All salaries for this company sorted by TC desc
  const salariesResult = db.exec(
    `SELECT * FROM salaries WHERE company_id = ? ORDER BY total_compensation DESC`,
    [company.id as string]
  );

  const salCols = salariesResult[0]?.columns ?? [];
  const salaries: Record<string, unknown>[] = (salariesResult[0]?.values ?? []).map((vals) => {
    const s: Record<string, unknown> = {};
    salCols.forEach((col: string, i: number) => { s[col] = vals[i]; });
    s.company = company;
    s.is_verified = Boolean(s.is_verified);
    return s;
  });

  // Median total_compensation
  const tcValues = salaries
    .map((s) => Number(s.total_compensation))
    .sort((a, b) => a - b);

  let median_total_compensation = 0;
  if (tcValues.length > 0) {
    const mid = Math.floor(tcValues.length / 2);
    median_total_compensation =
      tcValues.length % 2 === 0
        ? (tcValues[mid - 1] + tcValues[mid]) / 2
        : tcValues[mid];
  }

  // Level distribution
  const level_distribution: Record<string, number> = {};
  for (const s of salaries) {
    const level = s.level as string;
    level_distribution[level] = (level_distribution[level] ?? 0) + 1;
  }

  const res = NextResponse.json({
    ...company,
    salaries,
    median_total_compensation,
    level_distribution,
  });

  res.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  return res;
}
