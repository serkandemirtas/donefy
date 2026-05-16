/**
 * services/api.js
 * ---------------
 * Central API client — all HTTP calls to the Python backend go through here.
 * Change API_BASE if the backend port changes.
 *
 * Functions return parsed JSON or throw an Error with a human-readable message.
 */

const API_BASE = "http://localhost:5000/api";

/**
 * req(method, path, body?)
 * Generic fetch wrapper. Throws on non-2xx responses.
 */
async function req(method, path, body = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Server error");
  return data;
}

export const api = {
  // ── Tasks ──────────────────────────────────────────────────────────────────
  getTasks:   ()          => req("GET",    "/tasks"),
  createTask: (body)      => req("POST",   "/tasks", body),
  updateTask: (id, body)  => req("PUT",    `/tasks/${id}`, body),
  deleteTask: (id)        => req("DELETE", `/tasks/${id}`),
  deleteDone: ()          => req("DELETE", "/tasks/done"),

  // ── Settings ───────────────────────────────────────────────────────────────
  getSettings:  ()    => req("GET", "/settings"),
  saveSettings: (s)   => req("PUT", "/settings", s),
  testEmail:    (to)  => req("POST", "/settings/test-email", { to }),

  // ── AI ─────────────────────────────────────────────────────────────────────
  // lang: "en" or "tr" — controls the language of AI responses
  aiRoughToTasks: (text, lang) => req("POST", "/ai/rough-to-tasks", { text, lang }),
  aiSuggest:      (goal, lang) => req("POST", "/ai/suggest",        { goal, lang }),
  aiPrioritise:   (lang)       => req("POST", "/ai/prioritise",     { lang }),
  aiChat:         (msg,  lang) => req("POST", "/ai/chat",           { message: msg, lang }),

  // ── Image upload (multipart form — cannot use req() helper) ─────────────────
  uploadImage: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res  = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Upload failed");
    return data; // { image_path: "uploads/abc123.jpg" }
  },

  /** Build full URL for displaying an uploaded image in the UI. */
  imageUrl: (path) => path ? `http://localhost:5000/${path}` : null,
};
