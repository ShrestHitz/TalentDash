import initSqlJs, { Database } from "sql.js";
import path from "path";
import fs from "fs";

let db: Database | null = null;

const DB_PATH = path.join(process.cwd(), "talentdash.db");

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing DB if present, else create fresh
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    initSchema(db);
    await seedData(db);
    saveDb(db);
  }
  return db;
}

export function saveDb(database: Database) {
  const data = database.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function initSchema(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      normalized_name TEXT NOT NULL,
      industry TEXT NOT NULL DEFAULT '',
      headquarters TEXT NOT NULL DEFAULT '',
      founded_year INTEGER,
      headcount_range TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
    CREATE INDEX IF NOT EXISTS idx_companies_normalized ON companies(normalized_name);

    CREATE TABLE IF NOT EXISTS salaries (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id),
      role TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('L3','L4','L5','L6','SDE_I','SDE_II','SDE_III','STAFF','PRINCIPAL','IC4','IC5')),
      location TEXT NOT NULL,
      currency TEXT NOT NULL CHECK(currency IN ('INR','USD','GBP','EUR')),
      experience_years INTEGER NOT NULL CHECK(experience_years > 0 AND experience_years < 51),
      base_salary INTEGER NOT NULL CHECK(base_salary > 0),
      bonus INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      total_compensation INTEGER NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('CONTRIBUTOR','SCRAPED','AI_INFERRED')) DEFAULT 'CONTRIBUTOR',
      confidence_score REAL NOT NULL CHECK(confidence_score >= 0.0 AND confidence_score <= 1.0) DEFAULT 0.9,
      is_verified INTEGER NOT NULL DEFAULT 0,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_salaries_company_level_loc ON salaries(company_id, level, location);
    CREATE INDEX IF NOT EXISTS idx_salaries_tc ON salaries(total_compensation);
    CREATE INDEX IF NOT EXISTS idx_salaries_submitted ON salaries(submitted_at);
    CREATE INDEX IF NOT EXISTS idx_salaries_loc_level ON salaries(location, level);
  `);
}

function randomId(): string {
  return Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
}

async function seedData(database: Database) {
  const companies = [
    { id: randomId(), name: "Google", slug: "google", normalized_name: "google", industry: "Technology", headquarters: "Bengaluru", founded_year: 1998, headcount_range: "100K+" },
    { id: randomId(), name: "Amazon", slug: "amazon", normalized_name: "amazon", industry: "E-Commerce / Cloud", headquarters: "Bengaluru", founded_year: 1994, headcount_range: "100K+" },
    { id: randomId(), name: "Meta", slug: "meta", normalized_name: "meta", industry: "Social Media / AI", headquarters: "Hyderabad", founded_year: 2004, headcount_range: "50K-100K" },
    { id: randomId(), name: "Microsoft", slug: "microsoft", normalized_name: "microsoft", industry: "Technology", headquarters: "Hyderabad", founded_year: 1975, headcount_range: "100K+" },
    { id: randomId(), name: "Flipkart", slug: "flipkart", normalized_name: "flipkart", industry: "E-Commerce", headquarters: "Bengaluru", founded_year: 2007, headcount_range: "10K-50K" },
    { id: randomId(), name: "Meesho", slug: "meesho", normalized_name: "meesho", industry: "E-Commerce", headquarters: "Bengaluru", founded_year: 2015, headcount_range: "5K-10K" },
    { id: randomId(), name: "NVIDIA", slug: "nvidia", normalized_name: "nvidia", industry: "Semiconductor / AI", headquarters: "Pune", founded_year: 1993, headcount_range: "10K-50K" },
    { id: randomId(), name: "TCS", slug: "tcs", normalized_name: "tcs", industry: "IT Services", headquarters: "Mumbai", founded_year: 1968, headcount_range: "100K+" },
    { id: randomId(), name: "Infosys", slug: "infosys", normalized_name: "infosys", industry: "IT Services", headquarters: "Bengaluru", founded_year: 1981, headcount_range: "100K+" },
    { id: randomId(), name: "Wipro", slug: "wipro", normalized_name: "wipro", industry: "IT Services", headquarters: "Bengaluru", founded_year: 1945, headcount_range: "100K+" },
    { id: randomId(), name: "Razorpay", slug: "razorpay", normalized_name: "razorpay", industry: "Fintech", headquarters: "Bengaluru", founded_year: 2014, headcount_range: "1K-5K" },
    { id: randomId(), name: "Zepto", slug: "zepto", normalized_name: "zepto", industry: "Quick Commerce", headquarters: "Mumbai", founded_year: 2021, headcount_range: "1K-5K" },
  ];

  const companyMap: Record<string, string> = {};
  for (const c of companies) {
    companyMap[c.slug] = c.id;
    database.run(
      `INSERT INTO companies (id, name, slug, normalized_name, industry, headquarters, founded_year, headcount_range) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.slug, c.normalized_name, c.industry, c.headquarters, c.founded_year, c.headcount_range]
    );
  }

  const salaryRows: Array<{
    company: string; role: string; level: string; location: string;
    currency: string; exp: number; base: number; bonus: number; stock: number; source: string; confidence: number;
  }> = [
    // Google
    { company: "google", role: "Software Engineer", level: "L3", location: "Bengaluru", currency: "INR", exp: 1, base: 2000000, bonus: 200000, stock: 400000, source: "CONTRIBUTOR", confidence: 0.95 },
    { company: "google", role: "Software Engineer", level: "L4", location: "Bengaluru", currency: "INR", exp: 3, base: 3500000, bonus: 500000, stock: 1000000, source: "CONTRIBUTOR", confidence: 0.95 },
    { company: "google", role: "Software Engineer", level: "L5", location: "Bengaluru", currency: "INR", exp: 6, base: 5500000, bonus: 800000, stock: 2000000, source: "CONTRIBUTOR", confidence: 0.92 },
    { company: "google", role: "Software Engineer", level: "L6", location: "Bengaluru", currency: "INR", exp: 10, base: 8000000, bonus: 1500000, stock: 4000000, source: "CONTRIBUTOR", confidence: 0.90 },
    { company: "google", role: "Software Engineer", level: "L4", location: "Hyderabad", currency: "INR", exp: 4, base: 3200000, bonus: 450000, stock: 900000, source: "SCRAPED", confidence: 0.75 },
    { company: "google", role: "Product Manager", level: "L5", location: "Bengaluru", currency: "INR", exp: 7, base: 6000000, bonus: 1000000, stock: 2500000, source: "CONTRIBUTOR", confidence: 0.93 },
    { company: "google", role: "Data Scientist", level: "L4", location: "Bengaluru", currency: "INR", exp: 3, base: 4000000, bonus: 600000, stock: 1200000, source: "CONTRIBUTOR", confidence: 0.88 },
    { company: "google", role: "Staff Engineer", level: "STAFF", location: "Bengaluru", currency: "INR", exp: 12, base: 12000000, bonus: 2000000, stock: 6000000, source: "CONTRIBUTOR", confidence: 0.95 },

    // Amazon
    { company: "amazon", role: "Software Development Engineer", level: "SDE_I", location: "Bengaluru", currency: "INR", exp: 1, base: 1800000, bonus: 150000, stock: 300000, source: "CONTRIBUTOR", confidence: 0.95 },
    { company: "amazon", role: "Software Development Engineer", level: "SDE_II", location: "Bengaluru", currency: "INR", exp: 4, base: 3000000, bonus: 400000, stock: 1200000, source: "CONTRIBUTOR", confidence: 0.93 },
    { company: "amazon", role: "Software Development Engineer", level: "SDE_III", location: "Bengaluru", currency: "INR", exp: 8, base: 4500000, bonus: 700000, stock: 2000000, source: "CONTRIBUTOR", confidence: 0.90 },
    { company: "amazon", role: "Software Development Engineer", level: "SDE_II", location: "Hyderabad", currency: "INR", exp: 5, base: 2800000, bonus: 350000, stock: 1000000, source: "SCRAPED", confidence: 0.72 },
    { company: "amazon", role: "Principal Engineer", level: "PRINCIPAL", location: "Bengaluru", currency: "INR", exp: 15, base: 10000000, bonus: 2000000, stock: 8000000, source: "CONTRIBUTOR", confidence: 0.95 },
    { company: "amazon", role: "Product Manager", level: "L5", location: "Bengaluru", currency: "INR", exp: 6, base: 4200000, bonus: 700000, stock: 1800000, source: "CONTRIBUTOR", confidence: 0.88 },
    { company: "amazon", role: "Data Engineer", level: "SDE_I", location: "Chennai", currency: "INR", exp: 2, base: 1600000, bonus: 0, stock: 200000, source: "SCRAPED", confidence: 0.65 },

    // Meta
    { company: "meta", role: "Software Engineer", level: "L4", location: "Hyderabad", currency: "INR", exp: 3, base: 4500000, bonus: 600000, stock: 2000000, source: "CONTRIBUTOR", confidence: 0.95 },
    { company: "meta", role: "Software Engineer", level: "L5", location: "Hyderabad", currency: "INR", exp: 6, base: 7000000, bonus: 1200000, stock: 4000000, source: "CONTRIBUTOR", confidence: 0.93 },
    { company: "meta", role: "Software Engineer", level: "L6", location: "Hyderabad", currency: "INR", exp: 10, base: 10000000, bonus: 2000000, stock: 7000000, source: "CONTRIBUTOR", confidence: 0.90 },
    { company: "meta", role: "Research Scientist", level: "IC4", location: "Hyderabad", currency: "INR", exp: 5, base: 6000000, bonus: 900000, stock: 3000000, source: "CONTRIBUTOR", confidence: 0.88 },
    { company: "meta", role: "Data Scientist", level: "L5", location: "Hyderabad", currency: "INR", exp: 7, base: 6500000, bonus: 1100000, stock: 3500000, source: "SCRAPED", confidence: 0.78 },

    // Microsoft
    { company: "microsoft", role: "Software Engineer", level: "SDE_I", location: "Hyderabad", currency: "INR", exp: 2, base: 2200000, bonus: 250000, stock: 500000, source: "CONTRIBUTOR", confidence: 0.95 },
    { company: "microsoft", role: "Software Engineer", level: "SDE_II", location: "Hyderabad", currency: "INR", exp: 5, base: 3500000, bonus: 500000, stock: 1200000, source: "CONTRIBUTOR", confidence: 0.93 },
    { company: "microsoft", role: "Senior Software Engineer", level: "L5", location: "Hyderabad", currency: "INR", exp: 8, base: 5000000, bonus: 800000, stock: 2500000, source: "CONTRIBUTOR", confidence: 0.90 },
    { company: "microsoft", role: "Principal SDE", level: "PRINCIPAL", location: "Hyderabad", currency: "INR", exp: 14, base: 9000000, bonus: 1800000, stock: 6000000, source: "CONTRIBUTOR", confidence: 0.88 },
    { company: "microsoft", role: "Product Manager", level: "L4", location: "Hyderabad", currency: "INR", exp: 4, base: 3000000, bonus: 400000, stock: 1000000, source: "SCRAPED", confidence: 0.72 },
    { company: "microsoft", role: "Software Engineer", level: "SDE_I", location: "Bengaluru", currency: "INR", exp: 1, base: 2000000, bonus: 200000, stock: 400000, source: "CONTRIBUTOR", confidence: 0.92 },

    // Flipkart
    { company: "flipkart", role: "Software Engineer", level: "SDE_I", location: "Bengaluru", currency: "INR", exp: 1, base: 1600000, bonus: 150000, stock: 200000, source: "CONTRIBUTOR", confidence: 0.92 },
    { company: "flipkart", role: "Software Engineer", level: "SDE_II", location: "Bengaluru", currency: "INR", exp: 4, base: 2500000, bonus: 350000, stock: 600000, source: "CONTRIBUTOR", confidence: 0.90 },
    { company: "flipkart", role: "Senior SDE", level: "SDE_III", location: "Bengaluru", currency: "INR", exp: 8, base: 3800000, bonus: 600000, stock: 1200000, source: "CONTRIBUTOR", confidence: 0.88 },
    { company: "flipkart", role: "Product Manager", level: "L4", location: "Bengaluru", currency: "INR", exp: 5, base: 2800000, bonus: 400000, stock: 800000, source: "SCRAPED", confidence: 0.75 },
    { company: "flipkart", role: "Data Scientist", level: "SDE_II", location: "Bengaluru", currency: "INR", exp: 3, base: 2200000, bonus: 300000, stock: 500000, source: "CONTRIBUTOR", confidence: 0.85 },

    // Meesho
    { company: "meesho", role: "Software Engineer", level: "SDE_I", location: "Bengaluru", currency: "INR", exp: 2, base: 1400000, bonus: 100000, stock: 0, source: "CONTRIBUTOR", confidence: 0.88 },
    { company: "meesho", role: "Software Engineer", level: "SDE_II", location: "Bengaluru", currency: "INR", exp: 4, base: 2200000, bonus: 300000, stock: 400000, source: "CONTRIBUTOR", confidence: 0.87 },
    { company: "meesho", role: "Senior SDE", level: "SDE_III", location: "Bengaluru", currency: "INR", exp: 7, base: 3200000, bonus: 500000, stock: 800000, source: "SCRAPED", confidence: 0.72 },
    { company: "meesho", role: "Data Analyst", level: "L3", location: "Bengaluru", currency: "INR", exp: 2, base: 1200000, bonus: 80000, stock: 0, source: "CONTRIBUTOR", confidence: 0.85 },

    // NVIDIA
    { company: "nvidia", role: "Software Engineer", level: "L4", location: "Pune", currency: "INR", exp: 3, base: 4000000, bonus: 600000, stock: 2000000, source: "CONTRIBUTOR", confidence: 0.92 },
    { company: "nvidia", role: "CUDA Engineer", level: "L5", location: "Pune", currency: "INR", exp: 7, base: 7000000, bonus: 1200000, stock: 5000000, source: "CONTRIBUTOR", confidence: 0.93 },
    { company: "nvidia", role: "ML Engineer", level: "L5", location: "Pune", currency: "INR", exp: 6, base: 6500000, bonus: 1000000, stock: 4500000, source: "CONTRIBUTOR", confidence: 0.90 },
    { company: "nvidia", role: "Software Engineer", level: "STAFF", location: "Pune", currency: "INR", exp: 12, base: 13000000, bonus: 2500000, stock: 10000000, source: "CONTRIBUTOR", confidence: 0.95 },

    // TCS
    { company: "tcs", role: "Software Engineer", level: "L3", location: "Mumbai", currency: "INR", exp: 1, base: 700000, bonus: 50000, stock: 0, source: "CONTRIBUTOR", confidence: 0.90 },
    { company: "tcs", role: "Software Engineer", level: "L4", location: "Chennai", currency: "INR", exp: 4, base: 1000000, bonus: 80000, stock: 0, source: "CONTRIBUTOR", confidence: 0.88 },
    { company: "tcs", role: "Senior Software Engineer", level: "L5", location: "Hyderabad", currency: "INR", exp: 8, base: 1500000, bonus: 150000, stock: 0, source: "SCRAPED", confidence: 0.70 },
    { company: "tcs", role: "Technical Lead", level: "L6", location: "Bengaluru", currency: "INR", exp: 12, base: 2200000, bonus: 250000, stock: 0, source: "CONTRIBUTOR", confidence: 0.85 },
    { company: "tcs", role: "Data Analyst", level: "L3", location: "Pune", currency: "INR", exp: 2, base: 600000, bonus: 40000, stock: 0, source: "CONTRIBUTOR", confidence: 0.88 },

    // Infosys
    { company: "infosys", role: "Systems Engineer", level: "L3", location: "Bengaluru", currency: "INR", exp: 1, base: 650000, bonus: 40000, stock: 0, source: "CONTRIBUTOR", confidence: 0.88 },
    { company: "infosys", role: "Senior Systems Engineer", level: "L4", location: "Pune", currency: "INR", exp: 4, base: 950000, bonus: 70000, stock: 0, source: "CONTRIBUTOR", confidence: 0.86 },
    { company: "infosys", role: "Technical Lead", level: "L5", location: "Hyderabad", currency: "INR", exp: 9, base: 1400000, bonus: 120000, stock: 0, source: "SCRAPED", confidence: 0.68 },
    { company: "infosys", role: "Delivery Manager", level: "PRINCIPAL", location: "Mumbai", currency: "INR", exp: 18, base: 4000000, bonus: 600000, stock: 0, source: "CONTRIBUTOR", confidence: 0.82 },

    // Wipro
    { company: "wipro", role: "Software Engineer", level: "L3", location: "Bengaluru", currency: "INR", exp: 1, base: 680000, bonus: 45000, stock: 0, source: "CONTRIBUTOR", confidence: 0.88 },
    { company: "wipro", role: "Senior Software Engineer", level: "L4", location: "Chennai", currency: "INR", exp: 5, base: 980000, bonus: 75000, stock: 0, source: "CONTRIBUTOR", confidence: 0.85 },
    { company: "wipro", role: "Technical Architect", level: "STAFF", location: "Bengaluru", currency: "INR", exp: 14, base: 2500000, bonus: 350000, stock: 0, source: "SCRAPED", confidence: 0.65 },

    // Razorpay
    { company: "razorpay", role: "Software Engineer", level: "SDE_I", location: "Bengaluru", currency: "INR", exp: 2, base: 1800000, bonus: 200000, stock: 400000, source: "CONTRIBUTOR", confidence: 0.93 },
    { company: "razorpay", role: "Software Engineer", level: "SDE_II", location: "Bengaluru", currency: "INR", exp: 4, base: 2800000, bonus: 400000, stock: 800000, source: "CONTRIBUTOR", confidence: 0.92 },
    { company: "razorpay", role: "Senior SDE", level: "SDE_III", location: "Bengaluru", currency: "INR", exp: 7, base: 4000000, bonus: 650000, stock: 1500000, source: "CONTRIBUTOR", confidence: 0.90 },
    { company: "razorpay", role: "Staff Engineer", level: "STAFF", location: "Bengaluru", currency: "INR", exp: 12, base: 7000000, bonus: 1200000, stock: 3500000, source: "CONTRIBUTOR", confidence: 0.93 },
    { company: "razorpay", role: "Product Manager", level: "L4", location: "Bengaluru", currency: "INR", exp: 5, base: 2500000, bonus: 350000, stock: 700000, source: "SCRAPED", confidence: 0.70 },

    // Zepto
    { company: "zepto", role: "Software Engineer", level: "SDE_I", location: "Mumbai", currency: "INR", exp: 1, base: 1400000, bonus: 120000, stock: 300000, source: "CONTRIBUTOR", confidence: 0.88 },
    { company: "zepto", role: "Software Engineer", level: "SDE_II", location: "Mumbai", currency: "INR", exp: 3, base: 2200000, bonus: 300000, stock: 600000, source: "CONTRIBUTOR", confidence: 0.87 },
    { company: "zepto", role: "Data Engineer", level: "SDE_II", location: "Mumbai", currency: "INR", exp: 4, base: 2400000, bonus: 350000, stock: 700000, source: "CONTRIBUTOR", confidence: 0.85 },
    { company: "zepto", role: "Senior SDE", level: "SDE_III", location: "Mumbai", currency: "INR", exp: 7, base: 3500000, bonus: 550000, stock: 1200000, source: "SCRAPED", confidence: 0.72 },

    // US roles (USD)
    { company: "google", role: "Software Engineer", level: "L4", location: "San Francisco", currency: "USD", exp: 4, base: 180000, bonus: 30000, stock: 80000, source: "CONTRIBUTOR", confidence: 0.95 },
    { company: "meta", role: "Software Engineer", level: "L5", location: "San Francisco", currency: "USD", exp: 7, base: 230000, bonus: 50000, stock: 120000, source: "CONTRIBUTOR", confidence: 0.93 },
    { company: "amazon", role: "SDE-II", level: "SDE_II", location: "San Francisco", currency: "USD", exp: 5, base: 170000, bonus: 20000, stock: 60000, source: "SCRAPED", confidence: 0.75 },
    { company: "nvidia", role: "ML Engineer", level: "L5", location: "San Francisco", currency: "USD", exp: 6, base: 250000, bonus: 60000, stock: 200000, source: "CONTRIBUTOR", confidence: 0.92 },

    // Edge cases
    { company: "amazon", role: "Data Engineer", level: "SDE_I", location: "Delhi", currency: "INR", exp: 2, base: 1500000, bonus: 0, stock: 0, source: "CONTRIBUTOR", confidence: 0.88 }, // zero bonus, zero stock
    { company: "nvidia", role: "Principal Architect", level: "PRINCIPAL", location: "Pune", currency: "INR", exp: 20, base: 20000000, bonus: 4000000, stock: 40000000, source: "CONTRIBUTOR", confidence: 0.95 }, // very high equity
  ];

  for (const row of salaryRows) {
    const cid = companyMap[row.company];
    if (!cid) continue;
    const tc = row.base + row.bonus + row.stock;
    database.run(
      `INSERT INTO salaries (id, company_id, role, level, location, currency, experience_years, base_salary, bonus, stock, total_compensation, source, confidence_score, is_verified, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [randomId(), cid, row.role, row.level, row.location, row.currency, row.exp, row.base, row.bonus, row.stock, tc, row.source, row.confidence, row.source === "CONTRIBUTOR" ? 1 : 0]
    );
  }
}
