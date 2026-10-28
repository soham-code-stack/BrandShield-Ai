const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const tok = () => localStorage.getItem("bs_token");
const H = (extra = {}) => ({ ...extra, ...(tok() ? { Authorization: "Bearer " + tok() } : {}) });
async function go(url, opt = {}) {
  const r = await fetch(BASE + url, { ...opt, headers: H(opt.headers) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || "Something went wrong. Try again.");
  return data;
}
const JSONH = { "Content-Type": "application/json" };
export const api = {
  signup: (b) => go("/api/auth/signup", { method: "POST", headers: JSONH, body: JSON.stringify(b) }),
  login: (b) => go("/api/auth/login", { method: "POST", headers: JSONH, body: JSON.stringify(b) }),
  me: () => go("/api/auth/me"),
  drafts: () => go("/api/drafts"),
  create: (fd) => go("/api/drafts", { method: "POST", body: fd }),
  revise: (id, text) => go(`/api/drafts/${id}/revise`, { method: "POST", headers: JSONH, body: JSON.stringify({ text }) }),
  decide: (id, decision, note) => go(`/api/drafts/${id}/decision`, { method: "POST", headers: JSONH, body: JSON.stringify({ decision, note }) }),
  audit: () => go("/api/audit"),
  metrics: () => go("/api/metrics"),
  guidelines: () => go("/api/guidelines"),
};
