const VITE_API_URL = import.meta.env.VITE_API_URL as string | undefined;
const BASE = VITE_API_URL
  ? VITE_API_URL.replace(/\/$/, "")
  : import.meta.env.BASE_URL.replace(/\/$/, "");

export function getApiUrl(path: string): string {
  return `${BASE}/api/${path}`;
}
