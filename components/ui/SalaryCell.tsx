import { formatCurrency } from "@/lib/currency";

export function SalaryCell({
  amount, currency, displayCurrency, bold,
}: {
  amount: number; currency: string; displayCurrency: string; bold?: boolean;
}) {
  if (!amount || amount <= 0) return <span style={{ color: "#94a3b8" }}>–</span>;
  const formatted = formatCurrency(amount, currency, displayCurrency);
  return (
    <span style={{
      fontVariantNumeric: "tabular-nums",
      fontWeight: bold ? 700 : 500,
      color: bold ? "var(--brand)" : "#334155",
    }}>
      {formatted}
    </span>
  );
}
