import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { normalizeCompanyName, slugify } from "@/lib/normalize";
import { VALID_LEVELS } from "@/lib/levels";
import type { IngestPayload } from "@/types";

function randomId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export async function POST(req: NextRequest) {
  let body: Partial<IngestPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: true, field: "body", message: "Invalid JSON body" }, { status: 400 });
  }

  // --- Required field presence checks ---
  const required = ["company", "role", "level", "location", "currency", "experience_years", "base_salary"];
  for (const field of required) {
    if (body[field as keyof IngestPayload] === undefined || body[field as keyof IngestPayload] === null) {
      return NextResponse.json({ error: true, field, message: `${field} is required` }, { status: 400 });
    }
  }

  // --- Type / constraint validation ---
  if (!VALID_LEVELS.includes(body.level as never)) {
    return NextResponse.json({
      error: true,
      field: "level",
      message: `Level must be one of: ${VALID_LEVELS.join(", ")}`,
    }, { status: 400 });
  }

  const exp = Number(body.experience_years);
  if (!Number.isInteger(exp) || exp <= 0 || exp >= 51) {
    return NextResponse.json({ error: true, field: "experience_years", message: "experience_years must be an integer between 1 and 50" }, { status: 400 });
  }

  const base = Number(body.base_salary);
  if (isNaN(base) || base <= 0) {
    return NextResponse.json({ error: true, field: "base_salary", message: "base_salary must be a positive number" }, { status: 400 });
  }

  const bonus = Number(body.bonus ?? 0);
  const stock = Number(body.stock ?? 0);

  if (!["INR", "USD", "GBP", "EUR"].includes(body.currency as string)) {
    return NextResponse.json({ error: true, field: "currency", message: "currency must be INR, USD, GBP, or EUR" }, { status: 400 });
  }

  const confidence = Number(body.confidence_score ?? 0.9);
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    return NextResponse.json({ error: true, field: "confidence_score", message: "confidence_score must be between 0.0 and 1.0" }, { status: 400 });
  }

  const source = body.source ?? "CONTRIBUTOR";
  if (!["CONTRIBUTOR", "SCRAPED", "AI_INFERRED"].includes(source)) {
    return NextResponse.json({ error: true, field: "source", message: "source must be CONTRIBUTOR, SCRAPED, or AI_INFERRED" }, { status: 400 });
  }

  // --- Compute total_compensation server-side (ALWAYS, never trust client) ---
  const total_compensation = base + bonus + stock;

  // --- Company normalisation ---
  const normalized_name = normalizeCompanyName(body.company as string);
  const slug = slugify(normalized_name);
  const display_name = (body.company as string).trim();

  const db = await getDb();

  // Find or create Company
  let companyRow = db.exec(
    `SELECT id FROM companies WHERE normalized_name = ? LIMIT 1`,
    [normalized_name]
  )[0]?.values?.[0];

  let company_id: string;
  if (companyRow) {
    company_id = companyRow[0] as string;
  } else {
    company_id = randomId();
    db.run(
      `INSERT INTO companies (id, name, slug, normalized_name, industry, headquarters) VALUES (?, ?, ?, ?, '', '')`,
      [company_id, display_name, slug, normalized_name]
    );
  }

  // --- Duplicate check ---
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const existingRows = db.exec(
    `SELECT base_salary FROM salaries 
     WHERE company_id = ? AND role = ? AND level = ? AND location = ? AND submitted_at > ?`,
    [company_id, body.role, body.level, body.location, fortyEightHoursAgo]
  );

  if (existingRows.length > 0 && existingRows[0].values.length > 0) {
    for (const row of existingRows[0].values) {
      const existingBase = Number(row[0]);
      const diff = Math.abs(existingBase - base) / existingBase;
      if (diff <= 0.1) {
        return NextResponse.json({
          error: true,
          field: "duplicate",
          message: "A similar record already exists for this company/role/level/location within the last 48 hours",
        }, { status: 409 });
      }
    }
  }

  // --- Insert ---
  const id = randomId();
  db.run(
    `INSERT INTO salaries 
     (id, company_id, role, level, location, currency, experience_years, base_salary, bonus, stock, total_compensation, source, confidence_score, is_verified, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [id, company_id, body.role, body.level, body.location, body.currency, exp, base, bonus, stock, total_compensation, source, confidence, source === "CONTRIBUTOR" ? 1 : 0]
  );

  saveDb(db);

  // Return the created record
  const created = db.exec(
    `SELECT s.*, c.name as company_name, c.slug as company_slug FROM salaries s JOIN companies c ON c.id = s.company_id WHERE s.id = ?`,
    [id]
  );

  const cols = created[0]?.columns ?? [];
  const vals = created[0]?.values?.[0] ?? [];
  const record: Record<string, unknown> = {};
  cols.forEach((col, i) => { record[col] = vals[i]; });

  return NextResponse.json(record, { status: 201 });
}
