type LocalPrices = Record<string, { monthly: number; hardware?: number }>;

const LOCALE_TO_CURRENCY: Record<string, string> = {
  "en-NG": "NGN", "en-GH": "GHS", "en-ZA": "ZAR", "af-ZA": "ZAR",
  "en-KE": "KES", "sw-KE": "KES", "en-UG": "UGX", "en-TZ": "TZS",
  "en-GB": "GBP", "en-AU": "AUD", "en-NZ": "NZD", "en-CA": "CAD",
  "en-IN": "INR", "en-PH": "PHP", "en-SG": "SGD", "en-MY": "MYR",
  "pt-BR": "BRL", "pt-PT": "EUR",
  "es-MX": "MXN", "es-CL": "CLP", "es-CO": "COP", "es-AR": "ARS",
  "es-PE": "PEN", "es-UY": "UYU",
  "ja-JP": "JPY", "ko-KR": "KRW", "zh-CN": "CNY", "zh-TW": "TWD",
  "id-ID": "IDR", "ms-MY": "MYR", "th-TH": "THB", "vi-VN": "VND",
  "fil-PH": "PHP", "hi-IN": "INR",
  "ar-AE": "AED", "ar-SA": "SAR", "ar-EG": "EGP", "ar-MA": "MAD",
  "pl-PL": "PLN", "sv-SE": "SEK", "nb-NO": "NOK", "no-NO": "NOK",
  "da-DK": "DKK", "ro-RO": "RON", "cs-CZ": "CZK", "hu-HU": "HUF",
  "de-CH": "CHF", "fr-CH": "CHF", "it-CH": "CHF",
  "tr-TR": "TRY", "ru-RU": "RUB", "uk-UA": "UAH",
};

const EUR_COUNTRIES = new Set([
  "DE","FR","IT","ES","NL","BE","AT","IE","FI","GR","LU","SK","SI",
  "EE","LV","LT","MT","CY","HR","PT",
]);

function detectCurrency(): string {
  if (typeof window === "undefined") return "USD";
  const locale = navigator.language || "en-US";
  if (LOCALE_TO_CURRENCY[locale]) return LOCALE_TO_CURRENCY[locale];
  const [lang, country] = locale.split("-");
  if (country && EUR_COUNTRIES.has(country)) return "EUR";
  const langOnly: Record<string, string> = {
    ja: "JPY", ko: "KRW", id: "IDR", ms: "MYR", th: "THB",
    vi: "VND", hi: "INR", pl: "PLN", sv: "SEK", nb: "NOK",
    no: "NOK", da: "DKK", ro: "RON", cs: "CZK", hu: "HUF",
    tr: "TRY", ru: "RUB", uk: "UAH",
  };
  return langOnly[lang] ?? "USD";
}

const _currency = detectCurrency();

export function useCurrency() {
  const currency = _currency;

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

  return { formatPrice, formatMonthly, currency };
}
