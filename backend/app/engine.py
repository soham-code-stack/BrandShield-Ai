"""Governance engine: rule checks + retrieval of cited evidence from the knowledge base."""
import json, math, re
from collections import Counter
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data" / "guidelines.json"
CLAIM_WORDS = r"(cure[sd]?|heal[s]?|treat[s]?|eliminat\w+|clinically proven|dermatologist[- ]approved|every skin problem)"

def load():
    return json.loads(DATA.read_text())

def _tok(s): return re.findall(r"[a-z0-9]+", s.lower())

class Retriever:
    """Tiny TF-IDF vector store over approved knowledge (swap for embeddings/FAISS later)."""
    def __init__(self, docs):
        self.docs = docs
        self.toks = [Counter(_tok(d["title"] + " " + d["text"])) for d in docs]
        n = len(docs)
        df = Counter(t for c in self.toks for t in c)
        self.idf = {t: math.log((n + 1) / (v + 1)) + 1 for t, v in df.items()}
    def search(self, query, k=1):
        q = Counter(_tok(query)); out = []
        for d, c in zip(self.docs, self.toks):
            s = sum(q[t] * c[t] * self.idf.get(t, 0) ** 2 for t in q)
            if s: out.append((s, d))
        return [d for _, d in sorted(out, key=lambda x: -x[0])[:k]]

def _sentence(text, pos):
    s = max(text.rfind(".", 0, pos), text.rfind("!", 0, pos), text.rfind("\n", 0, pos)) + 1
    m = re.search(r"[.!\n]", text[pos:]); e = pos + m.end() if m else len(text)
    return text[s:e].strip()

def analyze(text, alt_text_missing=0, cfg=None):
    cfg = cfg or load(); rules = {r["id"]: r for r in cfg["rules"]}
    ret = Retriever(cfg["knowledge"]); findings = []

    def add(rule, excerpt, message, fix):
        ev = ret.search(rule["text"] + " " + excerpt, 1)
        findings.append({"rule_id": rule["id"], "rule": rule["name"], "severity": rule["severity"],
            "excerpt": excerpt, "message": message, "suggested_fix": fix,
            "evidence": {"source": rule["source"], "quote": rule["text"],
                         "related": ev[0]["source"] if ev else None}})

    r = rules.get("R1")
    if r:
        for m in re.finditer(r"(\d{1,3})\s*%\s*(?:off|discount)|(?:save|get|up to)\s*(\d{1,3})\s*%", text, re.I):
            pct = int(m.group(1) or m.group(2))
            if pct > r["limit"]:
                add(r, m.group(0), f"{pct}% off exceeds the {r['limit']}% discount cap.",
                    f"Reduce the offer to {r['limit']}% off or less.")
    r = rules.get("R2")
    if r:
        for m in re.finditer(CLAIM_WORDS, text, re.I):
            add(r, _sentence(text, m.start()), f"\u201c{m.group(0)}\u201d is a medical/efficacy claim and needs clinical evidence.",
                "Remove the claim or use approved wording, e.g. 'formulated to support healthy-looking skin'.")
    r = rules.get("R3")
    if r:
        for p in r["phrases"]:
            for m in re.finditer(re.escape(p), text, re.I):
                add(r, m.group(0), f"Absolute claim '{p}' is not allowed.", r["fix"])
    r = rules.get("R4")
    if r:
        for bad, good in r["terms"].items():
            for m in re.finditer(re.escape(bad), text, re.I):
                add(r, m.group(0), f"'{bad}' is not approved terminology.", f"Use '{good}'.")
    r = rules.get("R5")
    if r:
        for m in re.finditer(r"\b[A-Z]{3,}(?:\s+[A-Z!]{2,}){2,}", text):
            add(r, m.group(0), "Long ALL-CAPS run hurts readability.", "Use sentence case.")
        if alt_text_missing:
            add(r, f"{alt_text_missing} image(s)", "Images are missing alt text.", "Add descriptive alt text.")
    seen, out = set(), []
    for f in findings:
        k = (f["rule_id"], f["excerpt"].lower())
        if k not in seen: seen.add(k); out.append(f)
    return out

def autofix(text, cfg=None):
    cfg = cfg or load(); rules = {r["id"]: r for r in cfg["rules"]}
    cap = rules["R1"]["limit"]
    text = re.sub(r"(\d{1,3})(\s*%\s*(?:off|discount))", lambda m: f"{min(int(m.group(1)), cap)}{m.group(2)}", text, flags=re.I)
    for bad, good in rules["R4"]["terms"].items():
        text = re.sub(re.escape(bad), good, text, flags=re.I)
    text = re.sub(r"[^.!\n]*" + CLAIM_WORDS + r"[^.!\n]*[.!]?\s*", "", text, flags=re.I)
    for p in rules["R3"]["phrases"]:
        text = re.sub(re.escape(p), "designed to help", text, flags=re.I)
    return text.strip()
