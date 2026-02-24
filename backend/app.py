"""
iCafeCloud Dashboard — Flask Backend
Proxies iCafeCloud REST API and exposes aggregated endpoints for the React frontend.
"""

import os
import json
from datetime import date, timedelta, datetime
from functools import wraps

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── Config file (persisted to disk so settings survive restarts) ──────────────
_config_dir = os.environ.get("CONFIG_DIR", os.path.dirname(__file__))
CONFIG_FILE = os.path.join(_config_dir, "config.json")

ICAFE_BASE = "https://api.icafecloud.com/api/v2"


def load_config() -> dict:
    defaults = {
        "api_key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNDNjMzA5MWI1NDBlYTE3MTdmY2UyYjRjYTJhNTJmNWQ1ODVkMTY2MGI5ZmE5Y2M0MDJmYmM4NWQyMzY3NjM4MGEzMmVhMDQ3MjBhNzdjOTkiLCJpYXQiOjE3NzE5MTU5MjcuMjIwOTcsIm5iZiI6MTc3MTkxNTkyNy4yMjA5NzMsImV4cCI6NDkyNzU4OTUyNy4yMTgxMzUsInN1YiI6IjE2MTI4NDU0OTY1NzA1MSIsInNjb3BlcyI6W119.oSlkFWsIph0lHRGx3Dg4I_YgtBFGGLgkW5oPKfgKrh2kfrIDYpOnLKCGfTbdXsbyBX8oUhyWMBxqnib4ZCwGvwBM8aPVmCOzeBDWbKGbMEYoSMNuwf2SewgQmvmws8CBvyNJJSHaykVS-wK_rOw0DWuygZrp9z_01HwDKgKhIDVCJjGaYkP1UDgt2r5cYkG_QjAlZ4q1UTYP1gBl38JkJk-uhIvFUab7Uhw-Cj-sFb70MkjfxjY-Q_zkmy8If8wa4vEpRMVNVzCjoWGiUkjX56usThLdgWQgqIvLuRiBGcBzVeZZnYws4QCOmwZ_K7q-GtMv67iMu32Gb3eujiHSll8aDmmpUO1iQM9vHyjXwb1mIPRW8UNSnUXqhMBaqOveYW5m036RelS5YNOfwYNZfYP_l3xwfR_ST3r6_HCHnjrh-rz4hWSTI78DHY_GFSV-QBRpjTMmkhltktbLatDyXIcGhvPA_03msKMML1SLxBVtqTPhwLKZNZMZuSxiCAQ3DD2voDQkVXuv9QCxLV-XSLOlJclHN01aUpTUNhg5zK2rZlngiOCPQ8iW8OyxPUkEDHZS0EiCfxec1KGptxzentAevFrE0FERr8t-A__Uoj8Q06WafCJlm5vGxf8jAKIW3j_QPoXCtLFMpjaOR-sjmAehvXmMEiAMyJvaprWoU1Y",
        "api_key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNDNjMzA5MWI1NDBlYTE3MTdmY2UyYjRjYTJhNTJmNWQ1ODVkMTY2MGI5ZmE5Y2M0MDJmYmM4NWQyMzY3NjM4MGEzMmVhMDQ3MjBhNzdjOTkiLCJpYXQiOjE3NzE5MTU5MjcuMjIwOTcsIm5iZiI6MTc3MTkxNTkyNy4yMjA5NzMsImV4cCI6NDkyNzU4OTUyNy4yMTgxMzUsInN1YiI6IjE2MTI4NDU0OTY1NzA1MSIsInNjb3BlcyI6W119.oSlkFWsIph0lHRGx3Dg4I_YgtBFGGLgkW5oPKfgKrh2kfrIDYpOnLKCGfTbdXsbyBX8oUhyWMBxqnib4ZCwGvwBM8aPVmCOzeBDWbKGbMEYoSMNuwf2SewgQmvmws8CBvyNJJSHaykVS-wK_rOw0DWuygZrp9z_01HwDKgKhIDVCJjGaYkP1UDgt2r5cYkG_QjAlZ4q1UTYP1gBl38JkJk-uhIvFUab7Uhw-Cj-sFb70MkjfxjY-Q_zkmy8If8wa4vEpRMVNVzCjoWGiUkjX56usThLdgWQgqIvLuRiBGcBzVeZZnYws4QCOmwZ_K7q-GtMv67iMu32Gb3eujiHSll8aDmmpUO1iQM9vHyjXwb1mIPRW8UNSnUXqhMBaqOveYW5m036RelS5YNOfwYNZfYP_l3xwfR_ST3r6_HCHnjrh-rz4hWSTI78DHY_GFSV-QBRpjTMnkhltktbLatDyXIcGhvPA_03msKMML1SLxBVtqTPhwLKZNZMZuSxiCAQ3DD2voDQkVXuv9QCxLV-XSLOlJclHN01aUpTUNhg5zK2rJlngiOCPQ8iW8OyxPUkEDHZS0EiCfxec1KGptxzentAevFrE0FERr8t-A__Uoj8Q06WafCJlm5vGxf8jAKIW3j_QPoXCtLFMpjaOR-sjmAehvXmMEiAMyJvaprWoU1Y",
        "cafe_id": "57051"
    }
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                # Merge with defaults to ensure keys exist and are not empty
                for k, v in defaults.items():
                    if k not in cfg or not cfg[k]:
                        cfg[k] = v
                return cfg
        except Exception:
            pass
    return defaults


def save_config(data: dict):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


# ── iCafeCloud API helper ─────────────────────────────────────────────────────

def icafe_get(path: str, params: dict = None) -> dict | None:
    cfg = load_config()
    if not cfg.get("api_key") or not cfg.get("cafe_id"):
        return None
    headers = {
        "Authorization": f"Bearer {cfg['api_key']}",
        "Accept": "application/json",
    }
    url = f"{ICAFE_BASE}/cafe/{cfg['cafe_id']}{path}"
    try:
        resp = requests.get(url, headers=headers, params=params or {}, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        app.logger.error("iCafeCloud request error: %s", e)
        return None


def icafe_post(path: str, data: dict = None) -> dict | None:
    cfg = load_config()
    if not cfg.get("api_key") or not cfg.get("cafe_id"):
        return None
    headers = {
        "Authorization": f"Bearer {cfg['api_key']}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    url = f"{ICAFE_BASE}/cafe/{cfg['cafe_id']}{path}"
    try:
        resp = requests.post(url, headers=headers, json=data or {}, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        app.logger.error("iCafeCloud POST error: %s", e)
        return None


# ── Config endpoints ──────────────────────────────────────────────────────────

@app.get("/api/config")
def get_config():
    cfg = load_config()
    # Never expose the full key — return masked version
    key = cfg.get("api_key", "")
    masked = (key[:6] + "…" + key[-4:]) if len(key) > 10 else ("*" * len(key))
    return jsonify({
        "cafe_id": cfg.get("cafe_id", ""),
        "api_key_masked": masked,
        "configured": bool(key and cfg.get("cafe_id")),
    })


@app.post("/api/config")
def set_config():
    body = request.get_json(force=True) or {}
    cfg = load_config()
    if "api_key" in body:
        cfg["api_key"] = body["api_key"].strip()
    if "cafe_id" in body:
        cfg["cafe_id"] = str(body["cafe_id"]).strip()
    save_config(cfg)
    return jsonify({"ok": True})


# ── Overview / Stats ──────────────────────────────────────────────────────────

@app.get("/api/overview")
def overview():
    today = date.today()
    week_ago = today - timedelta(days=6)

    # Today's report
    today_data = icafe_get("/reports/reportData", {
        "date_start": today.isoformat(),
        "date_end": today.isoformat(),
        "time_start": "00:00",
        "time_end": "24:00",
        "data_source": "recent",
    })

    # Weekly report
    week_data = icafe_get("/reports/reportData", {
        "date_start": week_ago.isoformat(),
        "date_end": today.isoformat(),
        "time_start": "00:00",
        "time_end": "24:00",
        "data_source": "recent",
    })

    # PC list for active count
    pc_data = icafe_get("/pcList")

    # Member count
    member_data = icafe_get("/members", {"page": 1})

    # --- Parse ---
    today_revenue = 0
    week_revenue = 0
    payment_methods = []

    if today_data and today_data.get("code") == 200:
        d = today_data.get("data", {})
        today_revenue = float(d.get("total_amount", d.get("amount", 0)) or 0)
        # Payment method breakdown
        pay_types = d.get("pay_type_list") or d.get("payment_type_list", [])
        payment_methods = [
            {"name": pt.get("name", pt.get("type", "Unknown")),
             "amount": float(pt.get("amount", 0))}
            for pt in pay_types
        ]

    if week_data and week_data.get("code") == 200:
        d = week_data.get("data", {})
        week_revenue = float(d.get("total_amount", d.get("amount", 0)) or 0)

    # Active vs total PCs
    active_pcs = 0
    total_pcs = 0
    if pc_data and pc_data.get("code") == 200:
        pcs = pc_data.get("data", {}).get("pcs", [])
        total_pcs = len(pcs)
        active_pcs = sum(1 for pc in pcs if pc.get("pc_status") not in ("free", "offline", None))

    # Member count
    total_members = 0
    if member_data and member_data.get("code") == 200:
        total_members = member_data.get("data", {}).get("paging_info", {}).get("total_records", 0)

    return jsonify({
        "today_revenue": today_revenue,
        "week_revenue": week_revenue,
        "total_members": total_members,
        "active_pcs": active_pcs,
        "total_pcs": total_pcs,
        "pc_load_percent": round(active_pcs / total_pcs * 100) if total_pcs else 0,
        "payment_methods": payment_methods,
        "api_connected": bool(load_config().get("api_key")),
    })


# ── Daily income chart (last 7 days) ─────────────────────────────────────────

@app.get("/api/charts/daily")
def daily_chart():
    today = date.today()
    days = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        result = icafe_get("/reports/reportData", {
            "date_start": d.isoformat(),
            "date_end": d.isoformat(),
            "time_start": "00:00",
            "time_end": "24:00",
            "data_source": "recent",
        })
        amount = 0
        if result and result.get("code") == 200:
            amount = float(result.get("data", {}).get("total_amount", 0) or 0)

        # Russian weekday names
        ru_days = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"]
        days.append({
            "day": ru_days[d.weekday()],
            "date": d.isoformat(),
            "value": amount,
        })

    month_total = sum(item["value"] for item in days)
    return jsonify({"days": days, "total": month_total})


# ── 30-day income chart (cash vs balance) ────────────────────────────────────

@app.get("/api/charts/monthly")
def monthly_chart():
    result = icafe_get("/reports/reportChart", {
        "date_start": (date.today() - timedelta(days=29)).isoformat(),
        "date_end": date.today().isoformat(),
        "time_start": "00:00",
        "time_end": "24:00",
        "data_source": "recent",
    })

    points = []
    total_cash = 0
    total_balance = 0

    if result and result.get("code") == 200:
        chart = result.get("data", {})
        # The API returns arrays like: {dates:[...], cash:[...], balance:[...]}
        dates = chart.get("dates", chart.get("date_list", []))
        cash_list = chart.get("cash", chart.get("cash_list", []))
        balance_list = chart.get("balance", chart.get("balance_list", []))

        for i, d in enumerate(dates):
            c = float(cash_list[i]) if i < len(cash_list) else 0
            b = float(balance_list[i]) if i < len(balance_list) else 0
            total_cash += c
            total_balance += b
            points.append({"date": d, "cash": c, "balance": b})

    return jsonify({
        "points": points,
        "total_cash": total_cash,
        "total_balance": total_balance,
    })


# ── Payment methods breakdown (last 7 days) ───────────────────────────────────

@app.get("/api/charts/payments")
def payment_methods():
    today = date.today()
    result = icafe_get("/reports/reportData", {
        "date_start": (today - timedelta(days=6)).isoformat(),
        "date_end": today.isoformat(),
        "time_start": "00:00",
        "time_end": "24:00",
        "data_source": "recent",
    })

    methods = []
    if result and result.get("code") == 200:
        data = result.get("data", {})
        pay_types = data.get("pay_type_list") or data.get("payment_type_list", [])
        total = sum(float(pt.get("amount", 0)) for pt in pay_types) or 1
        for pt in pay_types:
            amount = float(pt.get("amount", 0))
            methods.append({
                "name": pt.get("name", pt.get("type", "Unknown")),
                "amount": amount,
                "percent": round(amount / total * 100),
            })

    return jsonify({"methods": methods})


# ── PCs monitoring ────────────────────────────────────────────────────────────

@app.get("/api/pcs")
def get_pcs():
    result = icafe_get("/pcList")
    pcs = []
    if result and result.get("code") == 200:
        raw = result.get("data", {}).get("pcs", [])
        for pc in raw:
            pcs.append({
                "id": pc.get("pc_id"),
                "name": pc.get("pc_name", ""),
                "status": pc.get("pc_status", "free"),   # free | busy | offline
                "member": pc.get("member_account", ""),
                "time_left": pc.get("left_time", ""),
                "room": pc.get("room_name", ""),
            })
    return jsonify({"pcs": pcs, "total": len(pcs)})


# ── Members ───────────────────────────────────────────────────────────────────

@app.get("/api/members")
def get_members():
    page = request.args.get("page", 1, type=int)
    search = request.args.get("search", "")
    sort_field = request.args.get("sort_field", "member_create")
    sort_dir = request.args.get("sort_dir", "desc")

    params = {
        "page": page,
        "sort_field": sort_field,
        "sort_dir": sort_dir,
    }
    if search:
        params["search_text"] = search

    result = icafe_get("/members", params)
    members = []
    paging = {}

    if result and result.get("code") == 200:
        data = result.get("data", {})
        paging = data.get("paging_info", {})
        for m in data.get("members", []):
            members.append({
                "id": m.get("member_icafe_id"),
                "account": m.get("member_account", ""),
                "name": f"{m.get('member_first_name', '')} {m.get('member_last_name', '')}".strip(),
                "balance": float(m.get("member_balance", 0)),
                "balance_bonus": float(m.get("member_balance_bonus", 0)),
                "points": float(m.get("member_points", 0)),
                "group": m.get("member_group_name", ""),
                "is_active": bool(m.get("member_is_active")),
                "is_logined": bool(m.get("member_is_logined")),
                "expire": m.get("member_expire_time_local", ""),
                "created": m.get("member_create_local", m.get("member_create", "")),
            })

    return jsonify({"members": members, "paging": paging})


# ── Billing logs ──────────────────────────────────────────────────────────────

@app.get("/api/billing-logs")
def billing_logs():
    today = date.today()
    result = icafe_get("/billingLogs", {
        "date_start": (today - timedelta(days=6)).isoformat(),
        "date_end": today.isoformat(),
        "page": request.args.get("page", 1, type=int),
    })

    logs = []
    paging = {}
    if result and result.get("code") == 200:
        data = result.get("data", {})
        paging = data.get("paging_info", {})
        for log in data.get("billing_logs", data.get("logs", [])):
            logs.append({
                "id": log.get("billing_log_id") or log.get("id"),
                "member": log.get("member_account", log.get("member", "")),
                "amount": float(log.get("billing_log_amount", log.get("amount", 0))),
                "type": log.get("billing_log_type", log.get("type", "")),
                "time": log.get("billing_log_create_local", log.get("created_at", "")),
                "note": log.get("billing_log_note", log.get("note", "")),
            })

    return jsonify({"logs": logs, "paging": paging})


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    cfg = load_config()
    return jsonify({
        "status": "ok",
        "configured": bool(cfg.get("api_key") and cfg.get("cafe_id")),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })


if __name__ == "__main__":
    print("🚀 iCafe Dashboard backend running at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
