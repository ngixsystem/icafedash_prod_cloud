"""
iCafeCloud Dashboard — Flask Backend
Proxies iCafeCloud REST API and exposes aggregated endpoints for the React frontend.
"""

import os
import json
from datetime import date, timedelta, datetime
from functools import wraps

import requests
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

# Initialize Flask with static folder pointing to frontend build
app = Flask(__name__, 
            static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "icafedash-main", "dist"),
            static_url_path="/")
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── Config file (persisted to disk so settings survive restarts) ──────────────
CONFIG_FILE = os.path.join(os.path.dirname(__file__), "config.json")

ICAFE_BASE = "https://api.icafecloud.com/api/v2"


def load_config() -> dict:
    defaults = {
        "api_key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiY2YwNTc4NjY2ZTVmNGQ2MDg4MjFmZTdjNTkzYjNkZmY3YmVjZDU5MTczOTkyZGE4NWY2ZDIzOGMwMWQzZDgyMzM2NTE1MzVkODdlYTRjMGQiLCJpYXQiOjE3NzE5MTc5MDIuMzQ3MzU5LCJuYmYiOjE3NzE5MTc5MDIuMzQ3MzYxLCJleHAiOjQ5Mjc1OTE1MDIuMzQzMzI3LCJzdWIiOiIxNjEyODQ1NDk2NTcwNTEiLCJzY29wZXMiOltdfQ.KNBpx4x2QfwtVKXEWGWLAh-Jpm0TdLHU-6QjB3wF2wtsJ0AwnT056twDOvc50c9rgspazTqNbR7IQSZ-rJC2A-WDJxRHnCyEppyDGCDHqhFRBsg7Ab-WhRefkqyz4oL5vDWwIC6O2l7-FI0KKaeOK5zPQ3jGtnTzn1sXd7AwLYvmWBD5ba2iBrgNBu_V6u6GRs5i7lFK_qG-8MC3F38MzfBegLjGXtNv6ut3N1IyCaA_gqpIFoTOaQ-nD9wIP4_J1HWQTdP2CG6WtgOmTy7QRmPWpN9yL_Ezl377vNjyLis9WaXWLmH-611jCNtylRe3bSfBpBrhcSh6FMTS8rf1UKKlPnexrJZaPSwje3Ri3L3WTb3H6FpLe1OlDxb-gfjCaedSmiFX8Sx1Gb3ME-xup6V5QHYz3ifZJkkwAgbDgxnwmj0yHoeD2kYNJDgeWgBNn5fAHitQmEag0zPD3d81htlo2bBSbhOs--d6UxH7gRn3Vhj_TMwTP-dmm6VdNqxqlQvQjdCr5OCMEvvcsxJq1iyTbTZAG2UCd4Pkf_emzFBwspReUXiYFdobxEfOGe5XkvCM79jvJ5xp6iMghtx1M2zZ5xREVoGQ3dYqn6SM0xn10XZsfi5gyiqe2EL2crXphKY47QuZJmuANNRvi1W_zd2o_fPne0FZpzzAx3ryz1E",
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

    # Combined report for revenue calculation
    chart_data = icafe_get("/reports/reportChart", {
        "date_start": week_ago.isoformat(),
        "date_end": today.isoformat(),
        "data_source": "recent"
    })

    today_revenue = 0
    week_revenue = 0
    payment_methods = []

    # PC list for active count
    pc_data = icafe_get("/pcList")

    # Member count
    member_data = icafe_get("/members", {"page": 1})

    if chart_data and chart_data.get("code") == 200:
        data = chart_data.get("data", {})
        series = data.get("series", [])
        categories = data.get("categories", [])
        
        # Today is the last category
        if categories:
            today_idx = len(categories) - 1
            for s in series:
                s_vals = s.get("data", [])
                if today_idx < len(s_vals):
                    today_revenue += float(s_vals[today_idx] or 0)
                
                # Week total
                week_revenue += sum(float(v or 0) for v in s_vals)
                
                # Build mock payment method list for UI breakdown
                m_name = s.get("name", "Unknown")
                m_total = sum(float(v or 0) for v in s_vals)
                if m_total > 0:
                    payment_methods.append({"name": m_name, "amount": m_total})

    # Active vs total PCs
    active_pcs = 0
    total_pcs = 0
    if pc_data and pc_data.get("code") == 200:
        data_field = pc_data.get("data", {})
        # Documentation shows /pcList can return a list or an object with a 'pcs' key
        pcs = []
        if isinstance(data_field, list):
            pcs = data_field
        elif isinstance(data_field, dict):
            pcs = data_field.get("pcs", [])
        
        total_pcs = len(pcs)
        for pc in pcs:
            # Inspection of API shows pc_status might be missing.
            # Active PCs have member_id, status_connect_time_local or member_account
            if pc.get("member_id") or pc.get("status_connect_time_local") or pc.get("member_account"):
                active_pcs += 1
            else:
                # One more check: if pc_status exists and is active
                status = str(pc.get("pc_status", "")).lower()
                if status in ("busy", "locked", "ordered", "using"):
                    active_pcs += 1

    # Member count
    total_members = 0
    if member_data and member_data.get("code") == 200:
        total_members = member_data.get("data", {}).get("paging_info", {}).get("total_records", 0)

    print(f"DEBUG: Active={active_pcs}, Total={total_pcs}, Today={today_revenue}")
    return jsonify({
        "today_revenue": today_revenue,
        "week_revenue": week_revenue,
        "total_members": total_members,
        "active_pcs": active_pcs,
        "total_pcs": total_pcs,
        "pc_load_percent": round(active_pcs / total_pcs * 100) if total_pcs else 0,
        "payment_methods": payment_methods,
        # Check if we actually got ANY data back from iCafeCloud recently
        "api_connected": any([chart_data, pc_data, member_data]),
    })


# ── Daily income chart (last 7 days) ─────────────────────────────────────────

@app.get("/api/charts/daily")
def daily_chart():
    today = date.today()
    result = icafe_get("/reports/reportChart", {
        "date_start": (today - timedelta(days=6)).isoformat(),
        "date_end": today.isoformat(),
        "data_source": "recent"
    })
    
    days = []
    total = 0
    ru_days = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"]
    
    if result and result.get("code") == 200:
        data = result.get("data", {})
        categories = data.get("categories", [])
        series = data.get("series", [])
        
        # Aggregate totals across all payment series (Cash, Credit card, etc.)
        daily_totals = [0.0] * len(categories)
        for s in series:
            s_data = s.get("data", [])
            for i in range(min(len(daily_totals), len(s_data))):
                daily_totals[i] += float(s_data[i] or 0)
        
        for i, cat in enumerate(categories):
            try:
                dt = datetime.fromisoformat(cat)
                days.append({
                    "day": ru_days[dt.weekday()],
                    "date": cat,
                    "value": daily_totals[i]
                })
                total += daily_totals[i]
            except:
                continue

    return jsonify({"days": days, "total": total})


# ── 30-day income chart (cash vs balance) ────────────────────────────────────

@app.get("/api/charts/monthly")
def monthly_chart():
    today = date.today()
    result = icafe_get("/reports/reportChart", {
        "date_start": (today - timedelta(days=29)).isoformat(),
        "date_end": today.isoformat(),
        "data_source": "recent"
    })

    points = []
    total_cash = 0
    total_balance = 0

    if result and result.get("code") == 200:
        data = result.get("data", {})
        categories = data.get("categories", [])
        series = data.get("series", [])
        
        cash_data = []
        balance_data = []
        for s in series:
            s_name = s.get("name", "").lower()
            if s_name == "cash":
                cash_data = s.get("data", [])
            elif "balance" in s_name or "coin" in s_name:
                # Merge non-cash income into balance for simplicity in this chart
                if not balance_data:
                    balance_data = [float(v or 0) for v in s.get("data", [])]
                else:
                    s_vals = s.get("data", [])
                    for i in range(min(len(balance_data), len(s_vals))):
                        balance_data[i] += float(s_vals[i] or 0)

        for i, cat in enumerate(categories):
            c = float(cash_data[i] or 0) if i < len(cash_data) else 0
            b = float(balance_data[i] or 0) if i < len(balance_data) else 0
            total_cash += c
            total_balance += b
            points.append({"date": cat, "cash": c, "balance": b})

    return jsonify({
        "points": points,
        "total_cash": total_cash,
        "total_balance": total_balance,
    })


# ── Payment methods breakdown (last 7 days) ───────────────────────────────────

@app.get("/api/charts/payments")
def payment_methods_chart():
    today = date.today()
    result = icafe_get("/reports/reportChart", {
        "date_start": (today - timedelta(days=6)).isoformat(),
        "date_end": today.isoformat(),
        "data_source": "recent"
    })

    methods = []
    if result and result.get("code") == 200:
        data = result.get("data", {})
        series = data.get("series", [])
        
        # Aggregate totals for each series
        totals = {}
        grand_total = 0
        
        for s in series:
            s_name = s.get("name", "Unknown")
            # Translate common names to RU for better UI
            label = s_name
            if s_name.lower() == "cash": label = "Наличные"
            elif "balance" in s_name.lower(): label = "Баланс"
            elif "card" in s_name.lower(): label = "Карта"
            elif "qr" in s_name.lower(): label = "QR-код"
            elif "coin" in s_name.lower(): label = "Монеты"
            
            s_sum = sum(float(v or 0) for v in s.get("data", []))
            if s_sum > 0:
                totals[label] = totals.get(label, 0) + s_sum
                grand_total += s_sum
        
        # Calculate percentages
        if grand_total > 0:
            for label, amount in totals.items():
                methods.append({
                    "name": label,
                    "amount": amount,
                    "percent": round((amount / grand_total) * 100)
                })
        
        # Sort by amount descending
        methods.sort(key=lambda x: x["amount"], reverse=True)

    return jsonify({"methods": methods})

    return jsonify({"methods": methods})


# ── PCs monitoring ────────────────────────────────────────────────────────────

@app.get("/api/pcs")
def get_pcs():
    result = icafe_get("/pcList")
    pcs = []
    if result and result.get("code") == 200:
        data_field = result.get("data", {})
        raw_list = []
        if isinstance(data_field, list):
            raw_list = data_field
        elif isinstance(data_field, dict):
            raw_list = data_field.get("pcs", [])

        for pc in raw_list:
            pcs.append({
                "id": pc.get("pc_id") or pc.get("id"),
                "name": pc.get("pc_name") or pc.get("name", ""),
                "status": str(pc.get("pc_status", "free")).lower(),
                "member": pc.get("member_account", ""),
                "time_left": str(pc.get("left_time", pc.get("pc_time_left", ""))),
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


@app.get("/api/members/<int:member_id>/billings")
def member_billings(member_id):
    today = date.today()
    result = icafe_get("/billingLogs", {
        "member_id": member_id,
        "date_start": (today - timedelta(days=30)).isoformat(),
        "date_end": today.isoformat(),
    })
    
    logs = []
    if result and result.get("code") == 200:
        data = result.get("data", {})
        for log in data.get("billing_logs", data.get("logs", [])):
            logs.append({
                "id": log.get("billing_log_id") or log.get("id"),
                "amount": float(log.get("billing_log_amount", log.get("amount", 0))),
                "type": log.get("billing_log_type", log.get("type", "")),
                "time": log.get("billing_log_create_local", log.get("created_at", "")),
                "note": log.get("billing_log_note", log.get("note", "")),
            })
    return jsonify({"logs": logs})


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    cfg = load_config()
    return jsonify({
        "status": "ok",
        "configured": bool(cfg.get("api_key") and cfg.get("cafe_id")),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })


# ── Serve Frontend (Non-Docker mode) ──────────────────────────────────────────

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    print("🚀 iCafe Dashboard running at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
