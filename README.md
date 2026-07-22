# Expert Decision Replay Platform (EDRP)

A full-stack platform for recording organizational decisions — the problem, the alternatives
considered, who reviewed and approved it, and the final outcome — so teams can learn from past
decisions instead of repeating mistakes.

Built as a personal deep-dive project for Infosys Springboard Virtual Internship 7.0.

---

## Features

**Authentication & Access**
- JWT-based login/registration with bcrypt password hashing
- Role-Based Access Control: Employee, Reviewer, Manager, Administrator
- Centralized frontend error handling with automatic session-expiry redirect

**Team Management**
- Admins create teams and assign managers
- Managers can add/remove members for their own team only
- Admins can manage every team system-wide

**Decision Management**
- Create, edit, search, and filter decisions
- Automatic version history — every edit is snapshotted before it's applied
- Alternative analysis (pros/cons/cost/feasibility/risk) per decision
- File attachments (upload/download/delete)
- Threaded comments with soft-delete (preserved for audit, hidden from view)

**Multi-Level Approval Workflow**
- Decisions route through Reviewer → Manager → Administrator, in strict order
- Rejection at any level immediately finalizes the decision
- Full approval history with reviewer names, outcomes, and comments

**Dashboards & Reporting**
- Role-specific dashboards (Employee / Manager / Administrator)
- Admin system-wide statistics (users, teams, decisions by status)
- Audit log of all significant actions (Admin-only)
- In-app notifications with unread count and mark-as-read
- PDF export (single decision) and Excel export (all decisions)

**Design**
- A custom "case file" visual identity — dark desk background, cream paper cards,
  tilted rubber-stamp badges for roles/statuses, serif + monospace typography

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM / Migrations | SQLAlchemy, Alembic |
| Auth | JWT (python-jose), bcrypt |
| Reports | ReportLab (PDF), OpenPyXL (Excel) |
| Frontend | React, Vite, React Router, Axios |
| Styling | Custom CSS (no UI framework) |

---

## Project Structure

```
edrp-backend/
├── main.py              # App entrypoint, registers all routers
├── database.py          # DB engine/session setup
├── models.py             # SQLAlchemy table definitions
├── schemas.py            # Pydantic request/response models
├── auth.py                # Password hashing, JWT, auth dependencies
├── helpers.py              # Shared logic: audit logging, notifications, versioning
├── alembic/                 # Database migrations
└── routers/
    ├── auth_routes.py        # Register, login
    ├── users.py                # Profile, admin user list, role/team assignment
    ├── teams.py                  # Team CRUD, my team, team detail
    ├── decisions.py                # Decision CRUD, search, versions, export
    ├── alternatives.py               # Alternatives nested under decisions
    ├── attachments.py                  # File upload/download/delete
    ├── comments.py                      # Discussion threads (soft-delete)
    ├── approvals.py                       # Multi-level approval workflow
    ├── notifications.py                     # In-app notifications
    └── admin.py                               # System-wide statistics

edrp-frontend/
└── src/
    ├── pages/                # Landing, Login, Register, Dashboard,
    │                          # DecisionList, DecisionDetail, CreateDecision,
    │                          # TeamManagement, UserManagement, AuditLog
    ├── components/            # AppHeader, RoleStamp, StatusStamp,
    │                          # NotificationBell, MyTeamCard, AuthCard
    └── services/api.js        # Centralized Axios client + all API calls
```

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js + npm
- PostgreSQL (local or hosted, e.g. Supabase)

### Backend

```bash
cd edrp-backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt

# copy .env.example to .env and fill in your own values
alembic upgrade head
uvicorn main:app --reload
```

Backend runs at `http://127.0.0.1:8000`
Interactive API docs: `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd edrp-frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### Environment Variables (`.env`)

```
DB_PASSWORD=your_postgres_password
JWT_SECRET_KEY=any_long_random_string
```

`database.py` builds the connection URL safely using `URL.create()`, which handles special
characters in the password automatically.

---

## Documentation

- **EDRP_Workflow_Documentation.pdf** — step-by-step explanation of every module's workflow
- **EDRP_Full_Documentation.pdf** — complete technical reference (architecture, database, API, design decisions)
- **EDRP_ER_Diagram.png** — entity-relationship diagram of the database

---

## Roles Reference

| Role | Can Do |
|---|---|
| Employee | Create/view decisions, comment, add alternatives, upload attachments |
| Reviewer | Everything above, plus first-level approval review |
| Manager | Everything above, plus second-level review, manage own team |
| Administrator | Everything, plus manage all teams, change roles, view audit log & system stats |

---

## Known Limitations

- No automated test suite yet
- Not yet containerized


---

## Author

Vedansh Mudgal — Infosys Springboard Virtual Internship 7.0
