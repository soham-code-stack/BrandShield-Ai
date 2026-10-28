"""Minimal auth: PBKDF2 password hashing + signed expiring tokens (swap for SSO/OAuth later)."""
import base64, hashlib, hmac, json, os, time
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
SECRET = os.environ.get("BS_SECRET", "dev-secret-change-me").encode()

def hash_pw(pw: str, salt: bytes | None = None):
    salt = salt or os.urandom(16)
    return base64.b64encode(salt).decode() + "$" + base64.b64encode(hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, 120_000)).decode()

def check_pw(pw: str, stored: str) -> bool:
    s, _ = stored.split("$")
    return hmac.compare_digest(hash_pw(pw, base64.b64decode(s)), stored)

def make_token(user: dict, ttl=86400 * 7) -> str:
    body = base64.urlsafe_b64encode(json.dumps({**user, "exp": time.time() + ttl}).encode()).decode()
    return body + "." + hmac.new(SECRET, body.encode(), hashlib.sha256).hexdigest()

def read_token(tok: str | None):
    try:
        body, sig = (tok or "").replace("Bearer ", "").split(".")
        if not hmac.compare_digest(sig, hmac.new(SECRET, body.encode(), hashlib.sha256).hexdigest()): return None
        d = json.loads(base64.urlsafe_b64decode(body))
        return d if d["exp"] > time.time() else None
    except Exception:
        return None
