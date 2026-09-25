const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function getToken() {
  return null;
}

export async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

export const authApi = {
  login: (email, password) =>
    api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name, email, password) =>
    api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  me: () => api("/api/auth/me"),
  logout: () => api("/api/auth/logout", { method: "POST" }),
};

export const projectApi = {
  list: () => api("/api/projects"),
  create: (project) =>
    api("/api/projects", { method: "POST", body: JSON.stringify(project) }),
  update: (id, project) =>
    api(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(project),
    }),
  remove: (id) => api(`/api/projects/${id}`, { method: "DELETE" }),
  history: () => api("/api/history"),
};

export const aiApi = {
  chat: (messages, maxTokens = 1000, responseFormat) =>
    api("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages, maxTokens, responseFormat }),
    }),
};

export { API_URL };
