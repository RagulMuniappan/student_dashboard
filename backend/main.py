from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import json
from typing import Optional

app = FastAPI(title="Student Performance API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Generate synthetic data once at startup ──────────────────────────────────
np.random.seed(42)
N = 520
SUBJECTS = ["Mathematics", "Physics", "Chemistry", "English", "Computer Science", "Tamil"]
DEPARTMENTS = ["CSE", "IT", "ECE", "EEE", "MECH"]
PASS_MARK = 40

def generate_data():
    dept = np.random.choice(DEPARTMENTS, N)
    attendance = np.clip(np.random.normal(75, 15, N), 30, 100).round(1)

    records = []
    for i in range(N):
        att = attendance[i]
        base = 40 + att * 0.4 + np.random.normal(0, 10)
        marks = {}
        for sub in SUBJECTS:
            noise = np.random.normal(0, 8)
            m = np.clip(base + noise, 0, 100).round(1)
            marks[sub] = float(m)

        total = sum(marks.values())
        avg   = total / len(SUBJECTS)
        passed_all = all(m >= PASS_MARK for m in marks.values())

        records.append({
            "id": f"ST{1000+i}",
            "name": f"Student {i+1}",
            "department": dept[i],
            "semester": int(np.random.choice([1,2,3,4,5,6,7,8])),
            "attendance": float(att),
            "total_marks": round(total, 1),
            "average_marks": round(avg, 1),
            "status": "Pass" if passed_all else "Fail",
            **marks
        })
    return pd.DataFrame(records)

df = generate_data()

# ── Helper ────────────────────────────────────────────────────────────────────
def filter_df(department: Optional[str], semester: Optional[int]):
    d = df.copy()
    if department and department != "All":
        d = d[d["department"] == department]
    if semester and semester != 0:
        d = d[d["semester"] == semester]
    return d

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/overview")
def overview(department: Optional[str] = None, semester: Optional[int] = None):
    d = filter_df(department, semester)
    return {
        "total_students": len(d),
        "pass_count": int((d["status"] == "Pass").sum()),
        "fail_count": int((d["status"] == "Fail").sum()),
        "pass_rate": round((d["status"] == "Pass").mean() * 100, 1),
        "avg_attendance": round(d["attendance"].mean(), 1),
        "avg_marks": round(d["average_marks"].mean(), 1),
    }

@app.get("/api/subject-performance")
def subject_performance(department: Optional[str] = None, semester: Optional[int] = None):
    d = filter_df(department, semester)
    result = []
    for sub in SUBJECTS:
        col = d[sub]
        result.append({
            "subject": sub,
            "average": round(col.mean(), 1),
            "pass_rate": round((col >= PASS_MARK).mean() * 100, 1),
            "highest": round(col.max(), 1),
            "lowest": round(col.min(), 1),
        })
    return result

@app.get("/api/pass-fail-trend")
def pass_fail_trend(department: Optional[str] = None):
    d = filter_df(department, None)
    result = []
    for sem in sorted(d["semester"].unique()):
        sem_df = d[d["semester"] == sem]
        result.append({
            "semester": f"Sem {sem}",
            "pass": int((sem_df["status"] == "Pass").sum()),
            "fail": int((sem_df["status"] == "Fail").sum()),
            "total": len(sem_df),
        })
    return result

@app.get("/api/attendance-correlation")
def attendance_correlation(department: Optional[str] = None, semester: Optional[int] = None):
    d = filter_df(department, semester)
    buckets = [
        (30, 50, "30–50%"),
        (50, 60, "50–60%"),
        (60, 75, "60–75%"),
        (75, 85, "75–85%"),
        (85, 101, "85–100%"),
    ]
    result = []
    for lo, hi, label in buckets:
        bucket = d[(d["attendance"] >= lo) & (d["attendance"] < hi)]
        if len(bucket) == 0:
            continue
        result.append({
            "range": label,
            "avg_marks": round(bucket["average_marks"].mean(), 1),
            "pass_rate": round((bucket["status"] == "Pass").mean() * 100, 1),
            "count": len(bucket),
        })
    return result

@app.get("/api/department-stats")
def department_stats():
    result = []
    for dept in DEPARTMENTS:
        d = df[df["department"] == dept]
        result.append({
            "department": dept,
            "students": len(d),
            "avg_marks": round(d["average_marks"].mean(), 1),
            "pass_rate": round((d["status"] == "Pass").mean() * 100, 1),
            "avg_attendance": round(d["attendance"].mean(), 1),
        })
    return result

@app.get("/api/filters")
def filters():
    return {
        "departments": ["All"] + DEPARTMENTS,
        "semesters": [0] + sorted(df["semester"].unique().tolist()),
    }
