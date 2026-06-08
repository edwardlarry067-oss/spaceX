export function useCurrency() {
  function formatPrice(amount: number, currency = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatMonthly(amount: number, currency = "USD"): string {
    return `${formatPrice(amount, currency)}/mo`;
  }

  return { formatPrice, formatMonthly };
}
