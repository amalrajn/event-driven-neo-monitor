const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export type ApiFailure = "missing-endpoint" | "not-found" | "offline" | "error";

export class ApiError extends Error {
    constructor(
        readonly kind: ApiFailure,
        message: string,
        readonly status?: number,
        readonly endpoint?: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// Express wraps "Cannot GET /api/stats" in an HTML 404, hence unanchored.
// A registered route answers 404 with JSON, so this tells the two apart.
const UNREGISTERED_ROUTE = /Cannot\s+(GET|POST|PUT|PATCH|DELETE)\s+\//i;

export async function request<T>(path: string): Promise<T> {
    const endpoint = `${API_URL}${path}`;
    let response: Response;
    try {
        response = await fetch(endpoint);
    } catch {
        throw new ApiError("offline", "Cannot reach the API", undefined, endpoint);
    }

    const raw = await response.text();
    let body: unknown;
    try {
        body = raw ? JSON.parse(raw) : null;
    } catch {
        body = null;
    }

    if (response.ok) return body as T;

    if (response.status === 404 && (body === null || UNREGISTERED_ROUTE.test(raw))) {
        throw new ApiError("missing-endpoint", "Endpoint not implemented", 404, endpoint);
    }

    const message = messageOf(body) ?? `Request failed (${response.status})`;
    throw new ApiError(response.status === 404 ? "not-found" : "error", message, response.status, endpoint);
}

function messageOf(body: unknown): string | null {
    if (body && typeof body === "object" && "message" in body) {
        const { message } = body as { message: unknown };
        if (typeof message === "string") return message;
    }
    return null;
}

export const apiUrlFor = (path: string) => `${API_URL}${path}`;
