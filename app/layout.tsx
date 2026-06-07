import type { Metadata } from "next";
import { Navbar } from "@/components/ui/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentDash — Career Intelligence Platform for India",
  description: "Structured salary data, company reviews, and interview experiences for Indian tech professionals. Compare offers, discover compensation by level, and make career decisions with real data.",
  metadataBase: new URL("https://talentdash.in"),
  openGraph: {
    title: "TalentDash — Career Intelligence for India",
    description: "Real salary data. Real companies. Real decisions.",
    url: "https://talentdash.in",
  },
  twitter: { card: "summary", title: "TalentDash — Career Intelligence for India", description: "Real salary data. Real companies. Real decisions." },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white">
        <Navbar />
        <main>{children}</main>
        <footer className="border-t border-[var(--line)] bg-[#f8fafc] mt-16 py-10">
          <div className="td-container">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded-md bg-[var(--brand)] text-white grid place-items-center text-xs font-bold">T</div>
                  <span className="font-bold text-[var(--ink)]">TalentDash</span>
                </div>
                <p className="text-xs text-[var(--muted)]">Career intelligence for India's tech professionals.</p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--muted)]">
                <a href="/companies" className="hover:text-[var(--brand)] transition-colors">Companies</a>
                <a href="/salaries" className="hover:text-[var(--brand)] transition-colors">Salaries</a>
                <a href="/compare" className="hover:text-[var(--brand)] transition-colors">Compare</a>
                <a href="/salaries" className="hover:text-[var(--brand)] transition-colors">Reviews</a>
                <a href="/compare" className="hover:text-[var(--brand)] transition-colors">Tools</a>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-[var(--line)] text-xs text-[var(--muted)]">
              © 2026 TalentDash. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
