import { Suspense } from "react";
import CompareClient from "./CompareClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Salary Offers - Side-by-Side Compensation | TalentDash",
  description: "Compare two salary offers side by side across base, bonus, stock, total compensation, level, and location.",
  alternates: { canonical: "https://talentdash.io/compare" },
};

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="td-container py-16 text-center text-[var(--muted)]">Loading...</div>}>
      <CompareClient />
    </Suspense>
  );
}
