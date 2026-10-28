"""SQLite store: drafts, findings, decisions and an append-only audit trail."""
import json, sqlite3, time
from pathlib import Path
DB = Path(__file__).resolve().parent.parent / "brandshield.db"

def conn():
    c = sqlite3.connect(DB); c.row_factory = sqlite3.Row
    c.executescript("""
    CREATE TABLE IF NOT EXISTS drafts(id INTEGER PRIMARY KEY, title TEXT, text TEXT, fixed TEXT,
        findings TEXT, status TEXT, created REAL, decided REAL, reviewer TEXT, note TEXT);
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, pw TEXT, role TEXT);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, ts REAL, actor TEXT, action TEXT, draft_id INTEGER, detail TEXT);
    """); return c

def log(c, actor, action, draft_id, detail=""):
    c.execute("INSERT INTO audit(ts,actor,action,draft_id,detail) VALUES(?,?,?,?,?)", (time.time(), actor, action, draft_id, detail))

def row(r):
    d = dict(r)
    if d.get("findings"): d["findings"] = json.loads(d["findings"])
    return d
