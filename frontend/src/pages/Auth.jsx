import { useState } from "react";
import { api } from "../api.js";

const ROLES = [["creator","Creator"],["reviewer","Human reviewer"],["brand_manager","Brand manager"],["admin","Admin"]];

export default function Auth({ mode, setMode, onDone, onBack }) {
  const [f, setF] = useState({ name: "", email: "", password: "", role: "creator" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const signup = mode === "signup";
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { onDone(signup ? await api.signup(f) : await api.login(f)); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <main className="auth">
      <button className="btn ghost back" onClick={onBack}>← Back to home</button>
      <section className="glass authcard">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={signup} className={signup ? "on" : ""} onClick={() => setMode("signup")}>Sign up</button>
          <button role="tab" aria-selected={!signup} className={!signup ? "on" : ""} onClick={() => setMode("login")}>Sign in</button>
        </div>
        <h2>{signup ? "Create your account" : "Welcome back"}</h2>
        <p className="sub">{signup ? "Start checking content against your brand guidelines." : "Sign in to open your workspace."}</p>
        <form onSubmit={submit}>
          {signup && <label>Full name<input required value={f.name} onChange={up("name")} autoComplete="name" /></label>}
          <label>Work email<input required type="email" value={f.email} onChange={up("email")} autoComplete="email" /></label>
          <label>Password<input required type="password" minLength={8} value={f.password} onChange={up("password")} autoComplete={signup ? "new-password" : "current-password"} /></label>
          {signup && <label>Your role<select value={f.role} onChange={up("role")}>{ROLES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>}
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn big wide" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</button>
        </form>
        <p className="sub">{signup ? "Already registered?" : "New to BrandShield?"} <a href="#" onClick={(e) => { e.preventDefault(); setMode(signup ? "login" : "signup"); }}>{signup ? "Sign in" : "Create an account"}</a></p>
      </section>
    </main>
  );
}
