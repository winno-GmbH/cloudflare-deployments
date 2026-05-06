export const BACKEND_BASE_URLS = [
  "https://gecko-form-tool-be-new.vercel.app",
  "https://app.winno.ch",
] as const;

export type BackendBaseUrl = (typeof BACKEND_BASE_URLS)[number];

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function fetchWithBackendFallback(
  path: string,
  init?: RequestInit
): Promise<Response | null> {
  let lastError: unknown = null;

  for (const baseUrl of BACKEND_BASE_URLS) {
    try {
      const url = joinUrl(baseUrl, path);
      const response = await fetch(url, init);

      if (response.ok) {
        return response;
      }

      // Non-2xx: try next backend
      lastError = new Error(`Request failed (${response.status}) for ${url}`);
    } catch (error) {
      // Network / CORS / fetch failure: try next backend
      lastError = error;
    }
  }

  // All backends failed; callers should keep existing behavior (log + continue)
  if (lastError) {
    console.error("All backends failed for request:", path, lastError);
  }
  return null;
}

export async function fetchJsonWithBackendFallback<T>(
  path: string,
  init?: RequestInit
): Promise<T | null> {
  const response = await fetchWithBackendFallback(path, init);
  if (!response) return null;

  try {
    return (await response.json()) as T;
  } catch (error) {
    console.error("Failed to parse JSON response:", path, error);
    return null;
  }
}
