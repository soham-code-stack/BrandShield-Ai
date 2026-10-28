import json, statistics, time
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header
import sqlite3
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from . import engine, db
from .extract import extract_text
from . import auth

app = FastAPI(title="BrandShield AI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class Decision(BaseModel):
    decision: str            # approved | rejected | changes_requested
    reviewer: str = "reviewer"
    note: str = ""

def _submit(title, text, actor):
    findings = engine.analyze(text)
    c = db.conn()
    cur = c.execute("INSERT INTO drafts(title,text,fixed,findings,status,created) VALUES(?,?,?,?,?,?)",
        (title, text, engine.autofix(text) if findings else text, json.dumps(findings), "in_review", time.time()))
    db.log(c, actor, "uploaded", cur.lastrowid, title)
    db.log(c, "brandshield-ai", "analysed", cur.lastrowid, f"{len(findings)} findings")
    c.commit()
    return db.row(c.execute("SELECT * FROM drafts WHERE id=?", (cur.lastrowid,)).fetchone())

@app.get("/api/guidelines")
def guidelines(): return engine.load()

@app.post("/api/drafts")
async def create(title: str = Form("Untitled"), text: str = Form(""), file: UploadFile | None = File(None), author: str = Form("creator")):
    if file: text = extract_text(file.filename, await file.read()); title = title if title != "Untitled" else file.filename
    if not text.strip(): raise HTTPException(400, "No content provided")
    return _submit(title, text, author)

@app.get("/api/drafts")
def list_drafts():
    return [db.row(r) for r in db.conn().execute("SELECT * FROM drafts ORDER BY id DESC")]

@app.get("/api/drafts/{i}")
def get(i: int):
    r = db.conn().execute("SELECT * FROM drafts WHERE id=?", (i,)).fetchone()
    if not r: raise HTTPException(404)
    return db.row(r)

@app.post("/api/drafts/{i}/revise")
def revise(i: int, body: dict):
    """Feedback loop: edited text goes back through analysis."""
    c = db.conn(); text = body.get("text", "")
    f = engine.analyze(text)
    c.execute("UPDATE drafts SET text=?, fixed=?, findings=?, status='in_review' WHERE id=?",
              (text, engine.autofix(text) if f else text, json.dumps(f), i))
    db.log(c, body.get("actor", "creator"), "revised", i, f"{len(f)} findings"); c.commit()
    return db.row(c.execute("SELECT * FROM drafts WHERE id=?", (i,)).fetchone())

class Signup(BaseModel):
    name: str
    email: str
    password: str
    role: str = "creator"      # creator | reviewer | brand_manager | admin

class Login(BaseModel):
    email: str
    password: str

def _session(u):
    user = {"id": u["id"], "name": u["name"], "email": u["email"], "role": u["role"]}
    return {"token": auth.make_token(user), "user": user}

@app.post("/api/auth/signup")
def signup(b: Signup):
    if len(b.password) < 8: raise HTTPException(400, "Password must be at least 8 characters")
    if "@" not in b.email: raise HTTPException(400, "Enter a valid email address")
    if b.role not in {"creator", "reviewer", "brand_manager", "admin"}: raise HTTPException(400, "Unknown role")
    c = db.conn()
    try:
        cur = c.execute("INSERT INTO users(name,email,pw,role) VALUES(?,?,?,?)", (b.name, b.email.lower(), auth.hash_pw(b.password), b.role))
    except sqlite3.IntegrityError:
        raise HTTPException(409, "An account with this email already exists")
    db.log(c, b.email, "signed_up", 0, b.role); c.commit()
    return _session(c.execute("SELECT * FROM users WHERE id=?", (cur.lastrowid,)).fetchone())

@app.post("/api/auth/login")
def login(b: Login):
    c = db.conn(); u = c.execute("SELECT * FROM users WHERE email=?", (b.email.lower(),)).fetchone()
    if not u or not auth.check_pw(b.password, u["pw"]): raise HTTPException(401, "Email or password is incorrect")
    return _session(u)

@app.get("/api/auth/me")
def me(authorization: str | None = Header(None)):
    u = auth.read_token(authorization)
    if not u: raise HTTPException(401, "Session expired. Sign in again.")
    return u

@app.post("/api/drafts/{i}/decision")
def decide(i: int, d: Decision, authorization: str | None = Header(None)):
    u = auth.read_token(authorization)
    if not u: raise HTTPException(401, "Sign in required")
    if u["role"] not in {"reviewer", "brand_manager", "admin"}: raise HTTPException(403, "Only human reviewers can approve content")
    d.reviewer = u["name"]
    if d.decision not in {"approved", "rejected", "changes_requested"}: raise HTTPException(400, "bad decision")
    c = db.conn()
    c.execute("UPDATE drafts SET status=?, decided=?, reviewer=?, note=? WHERE id=?", (d.decision, time.time(), d.reviewer, d.note, i))
    db.log(c, d.reviewer, d.decision, i, d.note); c.commit()
    return db.row(c.execute("SELECT * FROM drafts WHERE id=?", (i,)).fetchone())

@app.get("/api/audit")
def audit(): return [dict(r) for r in db.conn().execute("SELECT * FROM audit ORDER BY id DESC")]

@app.get("/api/metrics")
def metrics():
    """The three MVP measures from the deck."""
    rows = [db.row(r) for r in db.conn().execute("SELECT * FROM drafts")]
    fs = [f for r in rows for f in r["findings"]]
    cited = sum(1 for f in fs if f["evidence"]["source"])
    times = [r["decided"] - r["created"] for r in rows if r["decided"]]
    return {"drafts": len(rows), "findings": len(fs),
            "source_reference_coverage": round(cited / len(fs), 3) if fs else None,
            "median_review_seconds": round(statistics.median(times), 1) if times else None,
            "precision_recall": "run: python -m tests.evaluate"}

# Serve the built React app (frontend/dist) from the same service, so one link runs everything.
from pathlib import Path
from fastapi.staticfiles import StaticFiles
_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if _DIST.exists():
    app.mount("/", StaticFiles(directory=_DIST, html=True), name="web")
