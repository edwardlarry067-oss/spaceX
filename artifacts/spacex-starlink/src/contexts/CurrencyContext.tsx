import React, { createContext, useContext, useState } from "react";

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

export const SUPPORTED_CURRENCIES: { code: string; label: string; flag: string }[] = [
  { code: "USD", label: "US Dollar",            flag: "🇺🇸" },
  { code: "EUR", label: "Euro",                 flag: "🇪🇺" },
  { code: "GBP", label: "British Pound",        flag: "🇬🇧" },
  { code: "NGN", label: "Nigerian Naira",       flag: "🇳🇬" },
  { code: "GHS", label: "Ghanaian Cedi",        flag: "🇬🇭" },
  { code: "ZAR", label: "South African Rand",   flag: "🇿🇦" },
  { code: "KES", label: "Kenyan Shilling",      flag: "🇰🇪" },
  { code: "UGX", label: "Ugandan Shilling",     flag: "🇺🇬" },
  { code: "TZS", label: "Tanzanian Shilling",   flag: "🇹🇿" },
  { code: "EGP", label: "Egyptian Pound",       flag: "🇪🇬" },
  { code: "MAD", label: "Moroccan Dirham",      flag: "🇲🇦" },
  { code: "AED", label: "UAE Dirham",           flag: "🇦🇪" },
  { code: "SAR", label: "Saudi Riyal",          flag: "🇸🇦" },
  { code: "INR", label: "Indian Rupee",         flag: "🇮🇳" },
  { code: "CAD", label: "Canadian Dollar",      flag: "🇨🇦" },
  { code: "AUD", label: "Australian Dollar",    flag: "🇦🇺" },
  { code: "NZD", label: "New Zealand Dollar",   flag: "🇳🇿" },
  { code: "SGD", label: "Singapore Dollar",     flag: "🇸🇬" },
  { code: "MYR", label: "Malaysian Ringgit",    flag: "🇲🇾" },
  { code: "PHP", label: "Philippine Peso",      flag: "🇵🇭" },
  { code: "IDR", label: "Indonesian Rupiah",    flag: "🇮🇩" },
  { code: "THB", label: "Thai Baht",            flag: "🇹🇭" },
  { code: "VND", label: "Vietnamese Dong",      flag: "🇻🇳" },
  { code: "JPY", label: "Japanese Yen",         flag: "🇯🇵" },
  { code: "KRW", label: "South Korean Won",     flag: "🇰🇷" },
  { code: "CNY", label: "Chinese Yuan",         flag: "🇨🇳" },
  { code: "TWD", label: "Taiwan Dollar",        flag: "🇹🇼" },
  { code: "BRL", label: "Brazilian Real",       flag: "🇧🇷" },
  { code: "MXN", label: "Mexican Peso",         flag: "🇲🇽" },
  { code: "COP", label: "Colombian Peso",       flag: "🇨🇴" },
  { code: "CLP", label: "Chilean Peso",         flag: "🇨🇱" },
  { code: "ARS", label: "Argentine Peso",       flag: "🇦🇷" },
  { code: "PEN", label: "Peruvian Sol",         flag: "🇵🇪" },
  { code: "UYU", label: "Uruguayan Peso",       flag: "🇺🇾" },
  { code: "PLN", label: "Polish Zloty",         flag: "🇵🇱" },
  { code: "SEK", label: "Swedish Krona",        flag: "🇸🇪" },
  { code: "NOK", label: "Norwegian Krone",      flag: "🇳🇴" },
  { code: "DKK", label: "Danish Krone",         flag: "🇩🇰" },
  { code: "CHF", label: "Swiss Franc",          flag: "🇨🇭" },
  { code: "RON", label: "Romanian Leu",         flag: "🇷🇴" },
  { code: "CZK", label: "Czech Koruna",         flag: "🇨🇿" },
  { code: "HUF", label: "Hungarian Forint",     flag: "🇭🇺" },
  { code: "TRY", label: "Turkish Lira",         flag: "🇹🇷" },
  { code: "RUB", label: "Russian Ruble",        flag: "🇷🇺" },
  { code: "UAH", label: "Ukrainian Hryvnia",    flag: "🇺🇦" },
];

interface CurrencyContextValue {
  currency: string;
  setCurrency: (c: string) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<string>(() => {
    try {
      return localStorage.getItem("orbit_currency") || detectCurrency();
    } catch {
      return detectCurrency();
    }
  });

  function handleSetCurrency(c: string) {
    setCurrency(c);
    try { localStorage.setItem("orbit_currency", c); } catch {}
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrencyContext() {
  return useContext(CurrencyContext);
}
