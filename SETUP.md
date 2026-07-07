# EDRP — Full Project Setup (Backend + Frontend)

This project has two separate parts, each with its own dependency system.
You need to set up both to run the full application locally.

---

## Backend (Python / FastAPI)

Dependencies are listed in `edrp-backend/requirements.txt`.

```bash
cd edrp-backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt

# copy .env.example to .env and fill in your own local values
alembic upgrade head
uvicorn main:app --reload
```

Backend runs at: http://127.0.0.1:8000
Interactive API docs: http://127.0.0.1:8000/docs

---

## Frontend (React / Vite)

Dependencies are listed in `edrp-frontend/package.json` (Node's equivalent
of requirements.txt — npm reads this automatically, no separate file needed).

```bash
cd edrp-frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Why two different files?

Python and Node.js use separate package managers that don't share a format:

| | Python (backend) | Node.js (frontend) |
|---|---|---|
| Package manager | pip | npm |
| Dependency list | requirements.txt | package.json |
| Install command | pip install -r requirements.txt | npm install |
| Isolated environment | venv/ folder | node_modules/ folder |

Both files are already tracked in Git — `venv/` and `node_modules/` are NOT
(they're regenerated locally by the install commands above, and are already
covered in .gitignore).

---

## Running both together

You need **two terminals open at once** — one running the backend
(`uvicorn main:app --reload`), one running the frontend (`npm run dev`).
The frontend calls the backend at `http://127.0.0.1:8000`, so the backend
must be running for login/register/dashboard to work.
