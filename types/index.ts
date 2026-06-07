export type LevelEnum =
  | "L3" | "L4" | "L5" | "L6"
  | "SDE_I" | "SDE_II" | "SDE_III"
  | "STAFF" | "PRINCIPAL" | "IC4" | "IC5";

export type CurrencyEnum = "INR" | "USD" | "GBP" | "EUR";
export type SourceEnum = "CONTRIBUTOR" | "SCRAPED" | "AI_INFERRED";

export interface Company {
  id: string;
  name: string;
  slug: string;
  normalized_name: string;
  industry: string;
  headquarters: string;
  founded_year: number | null;
  headcount_range: string | null;
  created_at: string;
  updated_at: string;
}

export interface Salary {
  id: string;
  company_id: string;
  company?: Company;
  role: string;
  level: LevelEnum;
  location: string;
  currency: CurrencyEnum;
  experience_years: number;
  base_salary: number;
  bonus: number;
  stock: number;
  total_compensation: number;
  source: SourceEnum;
  confidence_score: number;
  is_verified: boolean;
  submitted_at: string;
}

export interface SalaryWithCompany extends Salary {
  company: Company;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SalariesResponse {
  data: SalaryWithCompany[];
  meta: PaginationMeta;
}

export interface CompanyWithStats extends Company {
  salaries: SalaryWithCompany[];
  median_total_compensation: number;
  level_distribution: Record<string, number>;
}

export interface CompareDelta {
  base_delta: number;
  bonus_delta: number;
  stock_delta: number;
  tc_delta: number;
  experience_delta: number;
}

export interface CompareResponse {
  record1: SalaryWithCompany;
  record2: SalaryWithCompany;
  delta: CompareDelta;
}

export interface IngestPayload {
  company: string;
  role: string;
  level: LevelEnum;
  location: string;
  currency: CurrencyEnum;
  experience_years: number;
  base_salary: number;
  bonus?: number;
  stock?: number;
  source?: SourceEnum;
  confidence_score?: number;
}
