let csrf: { token: string; headerName: string } | null = null;
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method || "GET";
  const headers = new Headers(options.headers);
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    if (!csrf) {
      const r = await fetch("/api/v1/auth/csrf", {
        credentials: "same-origin",
      });
      if (!r.ok)
        throw new ApiError("Unable to initialize a secure session.", r.status);
      csrf = await r.json();
    }
    headers.set(csrf!.headerName, csrf!.token);
  }
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const res = await fetch("/api/v1" + path, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  if (!res.ok) {
    if (res.status === 403) csrf = null;
    const data = await res
      .json()
      .catch(() => ({
        message: "The service could not complete this request.",
      }));
    throw new ApiError(data.message || "Request failed.", res.status);
  }
  if (
    path === "/auth/login" ||
    path === "/auth/logout" ||
    path === "/users/me/password"
  )
    csrf = null;
  return res.status === 204 ? (undefined as T) : res.json();
}
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
export const json = (method: string, value: unknown): RequestInit => ({
  method,
  body: JSON.stringify(value),
});
