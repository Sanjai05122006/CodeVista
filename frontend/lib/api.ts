export type BufferedExecution = {
  code: string;
  language: string;
  output: string;
  error: string;
  runtime: number;
  memory: number;
  ai: {
    algorithmName?: string;
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

export type AnalysisProviderSource = "cache" | "gemini" | "groq";

export type WorkspaceRunPayload = {
  code: string;
  language: string;
  stdin?: string;
};

export type WorkspaceExecutionResult = {
  stdout?: string;
  stderr?: string;
  runtime_ms?: number;
  memory_kb?: number;
  status?: string;
  source?: string;
  error?: {
    code?: string;
    message?: string;
  };
};

export type WorkspaceAnalysisResult = {
  algorithm_name: string;
  pseudocode: string[];
  algorithm_steps: string[];
  time_complexity: {
    best: string;
    average: string;
    worst: string;
  };
  space_complexity: string;
  explanation: string;
  execution_trace: unknown[];
  source?: AnalysisProviderSource;
};

export type WorkspaceResponse = {
  execution: WorkspaceExecutionResult;
  analysis: WorkspaceAnalysisResult;
  trace: unknown[];
};

export type SaveSessionPayload = {
  sessionId?: string;
  title?: string;
  startedAt: string;
  executions: BufferedExecution[];
};

export type SessionExecutionDetail = {
  id: string;
  session_id: string;
  code: string;
  language: string;
  created_at: string | null;
  updated_at: string | null;
  output: {
    stdout: string;
    stderr: string;
    runtime_ms: number;
    memory_kb: number;
  };
  analysis: {
    algorithm_name: string;
    pseudocode: string[];
    algorithm_steps: string[];
    time_complexity: {
      best?: string;
      average?: string;
      worst?: string;
    };
    space_complexity: string;
    explanation: string;
    execution_trace: unknown[];
  } | null;
};

export type SessionChatMessageDetail = {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  sequence: number;
  provider?: string | null;
  model?: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionDetail = {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  executions: SessionExecutionDetail[];
  chat: {
    thread_id: string;
    title: string | null;
    session_id: string;
    updated_at: string | null;
    messages: SessionChatMessageDetail[];
  } | null;
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
      const response = await fetch(requestUrl, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...(init.headers ?? {}),
        },
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
      updated_at: string;
      language: string | null;
      execution_count: number;
    }>;
  }>(`/session/history${query ? `?${query}` : ""}`, accessToken, {
    method: "GET",
  });
}

export async function fetchSessionDetail(sessionId: string, accessToken: string) {
  return authorizedJsonFetch<SessionDetail>(`/session/${sessionId}`, accessToken, {
    method: "GET",
  });
}

export async function requestPasswordReset(email: string) {
  const response = await fetch(buildApiUrl("/auth/password/reset/request"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; message?: string; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || "Unable to request password reset."
    );
  }

  return data ?? { ok: true };
}

export async function runWorkspace(payload: WorkspaceRunPayload) {
  const response = await fetch(buildApiUrl("/workspace"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | WorkspaceResponse
    | { error?: string; message?: string }
    | null;

  if (!response.ok) {
    const failure = data as { error?: string; message?: string } | null;
    throw new Error(
      failure?.message ||
        failure?.error ||
        "Unable to run the workspace request."
    );
  }

  return data as WorkspaceResponse;
}
