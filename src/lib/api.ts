const API_URL = process.env.REACT_APP_API_URL;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError('API is not configured (REACT_APP_API_URL is blank)', 0);
  }

  // FormData bodies (file uploads) need the browser to set its own
  // multipart Content-Type, boundary included.
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || `Request failed with status ${res.status}`, res.status);
  }
  return data;
}

export function withAuth(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export { request };
