import { useEffect, useState } from "react";
import Reveal from "../components/Reveal.jsx";

const STEPS = [["Guidelines","Set rules and standards."],["Upload","Securely upload your content."],["Extraction","AI extracts key information."],["Analysis","Evaluate against guidelines."],["Findings","Identify issues and gaps."],["Correction","Suggest fixes and improvements."],["Review","Human review for quality."],["Record","Store decisions securely."]];
const ROLES = [["Creators","Create on-brand content faster.","#22d3ee"],["Marketing managers","Drive campaigns with confidence.","#a78bfa"],["Brand managers","Protect brand integrity.","#f472b6"],["Compliance reviewers","Reduce risk with evidence-backed review.","#fbbf24"],["Agencies","Deliver more, with less effort.","#34d399"],["Admins","Keep the platform secure and running.","#60a5fa"]];
const RISKS = ["Inconsistent tone and terminology","Incorrect or outdated facts","Unsupported promotional claims","Incorrect logo and visual usage","Accessibility issues and approval gaps"];

function Typed({ lines }) {
  const [n, setN] = useState(0);
  useEffect(() => { const t = setInterval(() => setN((x) => (x < 3 ? x + 1 : x)), 900); return () => clearInterval(t); }, []);
  return (
    <div className="glass demo">
      <div className="dots"><i /><i /><i /></div>
      <p className="draft"><b>BUY NOW! <mark className={n > 0 ? "hit" : ""}>GET 70% OFF!</mark></b><br />Our cream is <mark className={n > 1 ? "hit" : ""}>guaranteed to cure every skin problem.</mark></p>
      <div className={"flag " + (n > 0 ? "show" : "")}><span>1</span><div><b>Discount exceeds limit</b><small>70% off exceeds the 20% cap · Brand Guidelines §4.2</small></div></div>
      <div className={"flag " + (n > 1 ? "show" : "")}><span>2</span><div><b>Unsubstantiated medical claim</b><small>Requires clinical evidence · Brand Guidelines §6.1</small></div></div>
      <div className={"flag ok " + (n > 2 ? "show" : "")}><span>✓</span><div><b>Fixes ready for human review</b><small>AI recommends. Evidence explains. Humans decide.</small></div></div>
    </div>
  );
}

export default function Landing({ onStart, user }) {
  return (
    <div className="landing">
      <nav className="topbar glass">
        <a className="logo" href="#top"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z" fill="url(#g)"/><path d="M8 12l3 3 5-6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#22d3ee"/><stop offset="1" stopColor="#a855f7"/></linearGradient></defs></svg>BrandShield AI</a>
        <div className="links"><a href="#problem">Problem</a><a href="#how">How it works</a><a href="#roles">Who it's for</a><a href="#trust">Trust</a></div>
        <div className="row">{!user && <button className="btn ghost" onClick={() => onStart("login")}>Sign in</button>}<button className="btn" onClick={() => onStart("signup")}>{user ? "Open workspace" : "Get started"}</button></div>
      </nav>

      <header className="hero" id="top">
        <div>
          <span className="chip">Intelligent brand governance</span>
          <h1>Create freely.<br /><span className="grad">Publish confidently.</span></h1>
          <p className="lead">BrandShield AI checks every draft against your approved guidelines, shows the evidence behind each finding, and sends it to a human reviewer before anything goes live.</p>
          <div className="row"><button className="btn big" onClick={() => onStart("signup")}>Start checking content</button><a className="btn ghost big" href="#how">See how it works</a></div>
          <ul className="trust-row"><li>Evidence-backed</li><li>Human-approved</li><li>Audit-ready</li></ul>
        </div>
        <Typed />
      </header>

      <section id="problem" className="sec">
        <Reveal><h2>Content scales faster than brand control.</h2></Reveal>
        <div className="grid risks">{RISKS.map((r, i) => <Reveal key={r} delay={i * 80}><div className="glass card"><b>{i + 1}</b><p>{r}</p></div></Reveal>)}</div>
        <Reveal><div className="glass stat"><strong>76%</strong><p>of marketers say inconsistent brand presentation is a top challenge. <small>Lucidpress, State of Brand Governance 2023</small></p></div></Reveal>
      </section>

      <section id="how" className="sec">
        <Reveal><h2>Every draft gets a clear path to approval.</h2></Reveal>
        <div className="grid steps">{STEPS.map(([t, d], i) => <Reveal key={t} delay={i * 60}><div className="glass card step"><span>{i + 1}</span><h3>{t}</h3><p>{d}</p></div></Reveal>)}</div>
      </section>

      <section id="roles" className="sec">
        <Reveal><h2>Built for the people behind every publication.</h2></Reveal>
        <div className="grid roles">{ROLES.map(([t, d, c], i) => <Reveal key={t} delay={i * 70}><div className="glass card role" style={{ "--c": c }}><i /><h3>{t}</h3><p>{d}</p></div></Reveal>)}</div>
      </section>

      <section id="trust" className="sec">
        <Reveal><h2>AI can assist. Accountability stays human.</h2></Reveal>
        <div className="grid five">{["Privacy","Access control","Evidence","Human review","Audit history"].map((t, i) => <Reveal key={t} delay={i * 70}><div className="glass card tiny"><h3>{t}</h3></div></Reveal>)}</div>
      </section>

      <Reveal><section className="cta glass"><h2>Make every publication brand-ready.</h2><p>Create freely. Validate intelligently. Publish confidently.</p><button className="btn big" onClick={() => onStart("signup")}>Create your free account</button></section></Reveal>
      <footer>© BrandShield AI · Team Tech Titans · Inkloom AI Hackathon</footer>
    </div>
  );
}
