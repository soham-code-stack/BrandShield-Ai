# BrandShield AI — Create Freely. Publish Confidently.
Team **Tech Titans** — Inkloom AI Hackathon. Evidence-backed brand governance: AI recommends, evidence explains, humans decide.

## Structure (follows the deck)
- `backend/` Python FastAPI — API & orchestration (slide 8)
  - `app/engine.py` Governance Engine: rule checks (20% discount cap, medical-claims evidence, absolute claims, terminology, accessibility) + TF-IDF retrieval over the knowledge base for cited evidence
  - `app/extract.py` Extraction (txt, md, pdf, docx)
  - `app/db.py` Record: drafts, decisions, append-only audit trail (SQLite)
  - `data/guidelines.json` Knowledge base: brand rules, policies, templates
  - `tests/evaluate.py` MVP validation: precision / recall
- `frontend/` React (Vite): landing page → sign up / sign in → workspace (liquid-glass UI, Sora + Inter)

## Workflow (slide 6)
Guidelines → Upload → Extraction → Analysis → Findings → Correction → (feedback loop: Re-scan) → Human review → Record.

## Run
```
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
cd frontend && npm install && npm run dev      # http://localhost:5173
python -m tests.evaluate   # run inside backend/
```
Try the slide-7 example: "BUY NOW! GET 70% OFF! Our cream is guaranteed to cure every skin problem."

## MVP metrics (slide 11)
Source-reference coverage, median review time (`/api/metrics`), precision/recall (`tests/evaluate.py`).

## 3 improvements for later
1. **LLM + embedding retrieval:** replace regex rules and TF-IDF with an LLM-based checker grounded by real embeddings in a vector store (FAISS/pgvector), keeping citations mandatory, to catch paraphrased violations.
2. **Visual & multi-format checks:** logo usage, colour/contrast and image alt-text via OCR/vision on images, video and PDFs, plus a real guideline-ingestion pipeline (upload brand PDFs → auto-extract rules).
3. **Enterprise layer:** SSO and role-based access control, multi-brand workspaces, versioned guidelines, and integrations (Slack, CMS, Google Drive) with reviewer analytics and a tamper-evident audit log.

## Auth
Sign up picks a role (creator, reviewer, brand manager, admin). Only reviewer, brand manager and admin can approve. Set `BS_SECRET` for production.

## Secrets
Copy `backend/.env.example` to `backend/.env` and set `BS_SECRET`. `.env` and `*.db` are git-ignored; never commit them.
