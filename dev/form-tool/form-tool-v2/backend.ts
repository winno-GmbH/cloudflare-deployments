export const BACKEND_BASE_URLS = [
  "https://gecko-form-tool-be-new.vercel.app/api",
  "https://app.winno.ch/api/public",
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
  const urls = BACKEND_BASE_URLS.map((baseUrl) => joinUrl(baseUrl, path));

  // We intentionally try *all* backends (even if the first succeeds), but we
  // still prefer returning the first successful response in base URL order.
  const results = await Promise.allSettled(urls.map((url) => fetch(url, init)));

  let chosenResponse: Response | null = null;
  let lastError: unknown = null;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const url = urls[i];

    if (result.status === "fulfilled") {
      const response = result.value;
      if (!chosenResponse && response.ok) {
        chosenResponse = response;
      } else if (!response.ok) {
        lastError = new Error(`Request failed (${response.status}) for ${url}`);
      }
    } else {
      lastError = result.reason;
    }
  }

  if (chosenResponse) return chosenResponse;

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
