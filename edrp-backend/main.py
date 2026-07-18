from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import audit
from routers import notifications

from routers import (
    auth_routes,
    users,
    teams,
    decisions,
    alternatives,
    attachments,
    comments,
    approvals,
    admin,
)

app = FastAPI(title="Expert Decision Replay Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "EDRP backend is running!"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(auth_routes.router)
app.include_router(users.router)
app.include_router(teams.router)
app.include_router(decisions.router)
app.include_router(alternatives.router)
app.include_router(attachments.router)
app.include_router(comments.router)
app.include_router(comments.router1)
app.include_router(approvals.router)
app.include_router(admin.router)
app.include_router(audit.router)
app.include_router(notifications.router)
