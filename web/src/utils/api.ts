const API = "/api/v1";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...opts.headers,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (opts.body && !(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body instanceof FormData ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: Record<string, unknown>; token: string }>("/auth/login", {
        method: "POST",
        body: { email, password },
      }),
    register: (data: { email: string; password: string; name?: string; age?: number }) =>
      request<{ user: Record<string, unknown>; token: string }>("/auth/register", {
        method: "POST",
        body: data,
      }),
    me: () => request<{ user: Record<string, unknown> }>("/auth/me"),
  },
  reels: {
    list: () => request<{ data: Record<string, unknown>[] }>("/reels"),
    get: (id: number) => request<{ data: Record<string, unknown> }>(`/reels/${id}`),
    create: (data: Record<string, unknown>) =>
      request<{ data: Record<string, unknown> }>("/reels", {
        method: "POST",
        body: data,
      }),
    update: (id: number, data: Record<string, unknown>) =>
      request<{ data: Record<string, unknown> }>(`/reels/${id}`, {
        method: "PUT",
        body: data,
      }),
    delete: (id: number) => request<{ ok: boolean }>(`/reels/${id}`, { method: "DELETE" }),
  },
  feed: {
    list: (limit = 20, offset = 0) =>
      request<{ data: Record<string, unknown>[]; hasMore: boolean }>(`/feed?limit=${limit}&offset=${offset}`),
    trending: (limit = 20) =>
      request<{ data: Record<string, unknown>[] }>(`/feed/trending?limit=${limit}`),
    userReels: (userId: number, limit = 20, offset = 0) =>
      request<{ user: Record<string, unknown>; data: Record<string, unknown>[]; hasMore: boolean }>(
        `/feed/user/${userId}?limit=${limit}&offset=${offset}`
      ),
    search: (q: string, limit = 20) =>
      request<{ data: Record<string, unknown>[] }>(`/feed/search?q=${encodeURIComponent(q)}&limit=${limit}`),
    view: (reelId: number) =>
      request<{ ok: boolean }>(`/feed/view/${reelId}`, { method: "POST" }),
  },
  social: {
    like: (reelId: number) =>
      request<{ liked: boolean; likes_count: number }>(`/social/reels/${reelId}/like`, { method: "POST" }),
    unlike: (reelId: number) =>
      request<{ liked: boolean; likes_count: number }>(`/social/reels/${reelId}/like`, { method: "DELETE" }),
    getComments: (reelId: number, limit = 50, offset = 0) =>
      request<{ data: Record<string, unknown>[]; hasMore: boolean }>(
        `/social/reels/${reelId}/comments?limit=${limit}&offset=${offset}`
      ),
    addComment: (reelId: number, content: string) =>
      request<{ data: Record<string, unknown> }>(`/social/reels/${reelId}/comments`, {
        method: "POST",
        body: { content },
      }),
    deleteComment: (commentId: number) =>
      request<{ ok: boolean }>(`/social/comments/${commentId}`, { method: "DELETE" }),
    follow: (userId: number) =>
      request<{ following: boolean }>(`/social/users/${userId}/follow`, { method: "POST" }),
    unfollow: (userId: number) =>
      request<{ following: boolean }>(`/social/users/${userId}/follow`, { method: "DELETE" }),
    share: (reelId: number) =>
      request<{ shares_count: number }>(`/social/reels/${reelId}/share`, { method: "POST" }),
  },
  upload: {
    video: (formData: FormData) =>
      request<{ data: Record<string, unknown> }>("/upload/video", {
        method: "POST",
        body: formData,
      }),
  },
  crud: {
    list: <T>(table: string) => request<{ data: T[] }>(`/${table}`),
    get: <T>(table: string, id: number) => request<{ data: T }>(`/${table}/${id}`),
    create: <T>(table: string, data: Record<string, unknown>) =>
      request<{ data: T }>(`/${table}`, { method: "POST", body: data }),
    update: <T>(table: string, id: number, data: Record<string, unknown>) =>
      request<{ data: T }>(`/${table}/${id}`, { method: "PUT", body: data }),
    delete: (table: string, id: number) =>
      request<{ ok: boolean }>(`/${table}/${id}`, { method: "DELETE" }),
  },
};
