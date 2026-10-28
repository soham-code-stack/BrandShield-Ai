import { useEffect, useState } from "react";
import { api } from "../api.js";

const SAMPLE = "BUY NOW! GET 70% OFF!\nOur cream is guaranteed to cure every skin problem.";
const isReviewer = (u) => ["reviewer", "brand_manager", "admin"].includes(u.role);

export default function Workspace({ user, onSignOut, onHome }) {
  const [tab, setTab] = useState("drafts");
  const [drafts, setDrafts] = useState([]);
  const [open, setOpen] = useState(null);
  const refresh = () => api.drafts().then(setDrafts).catch(() => {});
  useEffect(() => { refresh(); }, []);
  const cur = drafts.find((d) => d.id === open);

  return (
    <div className="work">
      <aside className="glass side">
        <a className="logo" href="#" onClick={(e) => { e.preventDefault(); onHome(); }}>BrandShield AI</a>
        {[["drafts","Drafts"],["rules","Guidelines"],["audit","Audit history"],["metrics","Metrics"]].map(([k, t]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{t}</button>)}
        <div className="me"><b>{user.name}</b><small>{user.role.replace("_", " ")}</small><button className="btn ghost" onClick={onSignOut}>Sign out</button></div>
      </aside>
      <main className="pane">
        {tab === "drafts" && (
          <div className="split">
            <section>
              <NewDraft onDone={(d) => { refresh(); setOpen(d.id); }} />
              <ul className="list">
                {drafts.length === 0 && <li className="empty">No drafts yet. Paste text or upload a file to scan it.</li>}
                {drafts.map((d) => (
                  <li key={d.id} className={"glass " + (d.id === open ? "sel" : "")} onClick={() => setOpen(d.id)}>
                    <b>{d.title}</b><span className={"pill " + d.status}>{d.status.replace("_", " ")}</span><small>{d.findings.length} finding(s)</small>
                  </li>
                ))}
              </ul>
            </section>
            <section>{cur ? <Detail key={cur.id + ":" + cur.findings.length + cur.status} d={cur} user={user} onChange={refresh} /> : <p className="empty">Select a draft to see findings and evidence.</p>}</section>
          </div>
        )}
        {tab === "rules" && <Rules />}
        {tab === "audit" && <Audit />}
        {tab === "metrics" && <Metrics />}
      </main>
    </div>
  );
}

function NewDraft({ onDone }) {
  const [title, setTitle] = useState("Spring campaign"); const [text, setText] = useState(SAMPLE);
  const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const go = async () => {
    setBusy(true); setErr("");
    try { const fd = new FormData(); fd.append("title", title); fd.append("text", text); if (file) fd.append("file", file); onDone(await api.create(fd)); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="glass panel">
      <h2>New draft</h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
      <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} aria-label="Content" />
      <input type="file" accept=".txt,.md,.pdf,.docx" onChange={(e) => setFile(e.target.files[0])} />
      {err && <p className="err">{err}</p>}
      <button className="btn" disabled={busy} onClick={go}>{busy ? <span className="spin" /> : "Scan content"}</button>
    </div>
  );
}

function Detail({ d, user, onChange }) {
  const [text, setText] = useState(d.text); const [note, setNote] = useState(""); const [err, setErr] = useState("");
  const decide = async (x) => { try { await api.decide(d.id, x, note); onChange(); } catch (e) { setErr(e.message); } };
  return (
    <div className="glass panel">
      <h2>{d.title} <span className={"pill " + d.status}>{d.status.replace("_", " ")}</span></h2>
      <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="row"><button className="btn ghost" onClick={() => setText(d.fixed)}>Apply suggested fixes</button><button className="btn" onClick={async () => { await api.revise(d.id, text); onChange(); }}>Re-scan</button></div>
      <h3>Flagged findings</h3>
      {d.findings.length === 0 && <p className="okmsg">No issues found against the guidelines.</p>}
      {d.findings.map((f, i) => (
        <article key={i} className={"finding " + f.severity} style={{ animationDelay: i * 90 + "ms" }}>
          <b>{f.message}</b>
          <p>Found: <mark>{f.excerpt}</mark></p>
          <p>Rule: {f.rule} · <i>{f.evidence.source}</i></p>
          <blockquote>{f.evidence.quote}</blockquote>
          <p>Fix: {f.suggested_fix}</p>
        </article>
      ))}
      {isReviewer(user) ? (
        <div className="review">
          <input placeholder="Reviewer note" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="row"><button className="btn" onClick={() => decide("approved")}>Approve</button><button className="btn ghost" onClick={() => decide("changes_requested")}>Request changes</button><button className="btn ghost" onClick={() => decide("rejected")}>Reject</button></div>
          {err && <p className="err">{err}</p>}
        </div>
      ) : <p className="empty">Only a human reviewer can approve content.</p>}
    </div>
  );
}

function Rules() {
  const [g, setG] = useState(null); useEffect(() => { api.guidelines().then(setG); }, []);
  if (!g) return null;
  return <div><h2 className="ph">{g.brand} guidelines</h2><div className="grid2">{g.rules.map((r) => <div className="glass panel" key={r.id}><b>{r.name}</b><p>{r.text}</p><small>{r.source}</small></div>)}</div></div>;
}
function Audit() {
  const [a, setA] = useState([]); useEffect(() => { api.audit().then(setA); }, []);
  return <div><h2 className="ph">Audit history</h2><div className="glass panel"><table><tbody>{a.map((x) => <tr key={x.id}><td>{new Date(x.ts * 1000).toLocaleString()}</td><td>{x.actor}</td><td>{x.action}</td><td>#{x.draft_id}</td><td>{x.detail}</td></tr>)}</tbody></table></div></div>;
}
function Metrics() {
  const [m, setM] = useState(null); useEffect(() => { api.metrics().then(setM); }, []);
  if (!m) return null;
  const K = [["Source-reference coverage", m.source_reference_coverage ?? "–"], ["Median review time (s)", m.median_review_seconds ?? "–"], ["Precision / Recall", m.precision_recall]];
  return <div><h2 className="ph">MVP metrics</h2><div className="grid2">{K.map(([t, v]) => <div className="glass panel" key={t}><small>{t}</small><p className="big">{v}</p></div>)}</div></div>;
}
