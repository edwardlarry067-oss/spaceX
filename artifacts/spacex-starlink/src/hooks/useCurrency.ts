import { useCurrencyContext } from "@/contexts/CurrencyContext";

type LocalPrices = Record<string, { monthly: number; hardware?: number }>;

export function useCurrency() {
  const { currency, setCurrency } = useCurrencyContext();

  function formatRaw(amount: number, curr = "USD"): string {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: curr,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `$${Math.round(amount).toLocaleString()}`;
    }
  }

  function formatPrice(
    fallback: number,
    localPricesOrCurr?: LocalPrices | string,
    field?: "monthly" | "hardware"
  ): string {
    if (typeof localPricesOrCurr === "string") {
      return formatRaw(fallback, localPricesOrCurr);
    }
    if (localPricesOrCurr && field) {
      const lp = localPricesOrCurr[currency] ?? (currency !== "USD" ? undefined : localPricesOrCurr["USD"]);
      if (lp) {
        const val = field === "hardware" ? (lp.hardware ?? 0) : lp.monthly;
        return formatRaw(val, currency);
      }
    }
    return formatRaw(fallback, "USD");
  }

  function formatMonthly(
    fallback: number,
    localPricesOrCurr?: LocalPrices | string
  ): string {
    return `${formatPrice(fallback, localPricesOrCurr as LocalPrices, "monthly")}/mo`;
  }

  return { formatPrice, formatMonthly, currency, setCurrency };
}
