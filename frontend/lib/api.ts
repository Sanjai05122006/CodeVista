export type BufferedExecution = {
  code: string;
  language: string;
  output: string;
  error: string;
  runtime: number;
  memory: number;
  ai: {
    pseudocode: string[];
    explanation: string;
    complexity: {
      time: {
        best: string;
        average: string;
        worst: string;
      };
      space: string;
    };
    trace: unknown[];
    algorithmSteps: string[];
  };
};

export type SaveSessionPayload = {
  sessionId?: string;
  title?: string;
  startedAt: string;
  executions: BufferedExecution[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const normalizeApiBaseUrl = (rawBaseUrl: string) =>
  rawBaseUrl.replace(/\/+$/, "");

export const buildApiUrl = (path: string) => {
  const baseUrl = normalizeApiBaseUrl(API_BASE_URL);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (baseUrl.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${baseUrl}${normalizedPath.slice(4)}`;
  }

  return `${baseUrl}${normalizedPath}`;
};

async function authorizedJsonFetch<T>(
  path: string,
  accessToken: string,
  init: RequestInit,
  retries = 2
): Promise<T> {
  let lastError: Error | null = null;
  const requestUrl = buildApiUrl(path);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      console.log("[api] request", {
        url: requestUrl,
        method: init.method ?? "GET",
        attempt: attempt + 1,
      });

      const response = await fetch(requestUrl, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...(init.headers ?? {}),
        },
      });

      console.log("[api] response", {
        url: requestUrl,
        status: response.status,
        ok: response.ok,
      });

      const data = (await response.json().catch(() => null)) as
        | T
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        const message =
          (data as { message?: string; error?: string } | null)?.message ||
          (data as { error?: string } | null)?.error ||
          `Request failed with status ${response.status}`;

        throw new Error(message);
      }

      return data as T;
    } catch (error) {
      const isNetworkError = error instanceof TypeError;
      const message = isNetworkError
        ? `Network error while calling ${requestUrl}. Check backend availability and CORS configuration.`
        : error instanceof Error
        ? error.message
        : "Request failed";

      console.error("[api] fetch error", {
        url: requestUrl,
        attempt: attempt + 1,
        message,
        originalError: error,
      });

      lastError = new Error(message);

      if (attempt === retries) {
        break;
      }

      await new Promise((resolve) =>
        window.setTimeout(resolve, 500 * (attempt + 1))
      );
    }
  }

  throw lastError ?? new Error("Request failed");
}

export async function saveSessionSnapshot(
  payload: SaveSessionPayload,
  accessToken: string
) {
  return authorizedJsonFetch<{ session_id: string }>("/session/save", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchSessionHistory(
  accessToken: string,
  params: { limit?: number; offset?: number } = {}
) {
  const search = new URLSearchParams();

  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }

  if (params.offset !== undefined) {
    search.set("offset", String(params.offset));
  }

  const query = search.toString();

  return authorizedJsonFetch<{
    sessions: Array<{
      id: string;
      title: string | null;
      created_at: string;
    }>;
  }>(`/session/history${query ? `?${query}` : ""}`, accessToken, {
    method: "GET",
  });
}

export async function fetchSessionDetail(sessionId: string, accessToken: string) {
  return authorizedJsonFetch(`/session/${sessionId}`, accessToken, {
    method: "GET",
  });
}
