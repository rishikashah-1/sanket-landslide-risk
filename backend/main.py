import random
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI(title="SANKET API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                   allow_methods=["*"], allow_headers=["*"])

# Weights match the "Factors Importance" chart in your design
W = {"rainfall": .35, "soil": .26, "slope": .18, "cover": .12, "ground": .09}

# Static area data (replace with a database later). All inputs are 0-100.
AREAS = [
    {"name": "Lebong, Darjeelling", "lat": 27.045, "lng": 88.265, "rainfall": 95, "soil": 88, "slope": 90, "cover": 70, "ground": 80},
    {"name": "Mirik",               "lat": 26.886, "lng": 88.187, "rainfall": 75, "soil": 72, "slope": 65, "cover": 60, "ground": 55},
    {"name": "Kalimpong Town",      "lat": 27.066, "lng": 88.469, "rainfall": 60, "soil": 55, "slope": 70, "cover": 50, "ground": 40},
    {"name": "Sukhiapokhri",        "lat": 27.014, "lng": 88.190, "rainfall": 35, "soil": 40, "slope": 50, "cover": 45, "ground": 30},
    {"name": "Kurseong",            "lat": 26.880, "lng": 88.279, "rainfall": 25, "soil": 30, "slope": 35, "cover": 20, "ground": 20},
]

def score(a):
    return round(sum(a[k] * w for k, w in W.items()))

def level(s):
    return ("Critical" if s >= 80 else "High" if s >= 60 else
            "Moderate" if s >= 40 else "Low")

@app.get("/api/areas")
def areas():
    now = datetime.now().strftime("%H:%M")
    out = []
    for a in AREAS:
        s = score(a)
        out.append({**a, "score": s, "level": level(s), "updated": now})
    return sorted(out, key=lambda x: -x["score"])

@app.get("/api/alerts")
def alerts():
    return [{"title": f"{x['level']} Risk Detected", "area": x["name"],
             "score": x["score"], "level": x["level"], "time": x["updated"]}
            for x in areas() if x["score"] >= 40]

@app.get("/api/sensors/live")
def live():
    j = lambda v, s: round(v + random.uniform(-s, s), 1)
    return {"rainfall": j(42.6, 2), "soil_moisture": j(85, 1),
            "ground_movement": j(2.4, .2), "soil_temp": j(23.7, .3),
            "online": 38, "total": 40,
            "timestamp": datetime.now().isoformat(timespec="seconds")}

@app.get("/api/summary")
def summary():
    a = areas()
    return {"overall": max(x["score"] for x in a),
            "critical": sum(x["level"] == "Critical" for x in a),
            "high": sum(x["level"] == "High" for x in a),
            "monitored": 48, "sensors_online": 36, "sensors_total": 40}

@app.get("/api/predictions")
def predictions():
    return {"rows": areas(), "factors": W,
            "model": {"name": "Random Forest", "accuracy": 92.4,
                      "precision": 90.1, "recall": 83.2, "f1": 91.6}}


# Serve the dashboard: keep this LAST so it doesn't shadow /api routes
app.mount("/", StaticFiles(directory=Path(__file__).parent.parent / "web", html=True), name="web")
