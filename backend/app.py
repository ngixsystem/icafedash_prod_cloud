import os
import json
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date, timedelta, datetime
from functools import wraps

import requests
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from werkzeug.utils import secure_filename

# Initialize Flask with static folder pointing to frontend build
app = Flask(__name__, 
            static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "icafedash-main", "dist"),
            static_url_path="/")
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Database & Auth Config
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///icafe.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-secret-key")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=2)

# SMTP Config for email verification
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER)

db = SQLAlchemy(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# JWT Debugging
app.config["PROPAGATE_EXCEPTIONS"] = True

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"message": "The token has expired", "error": "token_expired"}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({"message": "Signature verification failed", "error": "invalid_token"}), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({"message": "Request does not contain an access token", "error": "authorization_required"}), 401

@app.before_request
def log_request_info():
    if request.path.startswith('/api/'):
        auth_header = request.headers.get('Authorization')
        print(f"DEBUG: {request.method} {request.path} | Auth Header: {auth_header[:20] if auth_header else 'None'}")

# Models
class Club(db.Model):
    __tablename__ = 'clubs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    api_key = db.Column(db.Text, nullable=False)
    cafe_id = db.Column(db.String(50), nullable=False)
    club_logo_url = db.Column(db.String(255), default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    users = db.relationship('User', backref='club', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="manager") # admin or manager
    is_verified = db.Column(db.Boolean, default=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)


class EmailVerification(db.Model):
    __tablename__ = 'email_verifications'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)


def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))


def send_verification_email(to_email, code):
    """Send a verification code via SMTP email."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"⚠️  SMTP not configured. Verification code for {to_email}: {code}")
        return True  # Return True so registration still works (code shown in logs)
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'iCafe Dashboard — Код подтверждения'
        msg['From'] = SMTP_FROM
        msg['To'] = to_email

        html = f"""
        <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px;">
            <div style="max-width: 480px; margin: 0 auto; background: #111; border-radius: 16px; padding: 40px; border: 1px solid #222;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2dd4bf; font-size: 24px; margin: 0;">iCafe Dashboard</h1>
                    <p style="color: #888; font-size: 14px; margin-top: 8px;">Подтверждение регистрации</p>
                </div>
                <div style="text-align: center; background: #1a1a2e; border-radius: 12px; padding: 24px; margin: 20px 0;">
                    <p style="color: #aaa; font-size: 14px; margin: 0 0 12px 0;">Ваш код подтверждения:</p>
                    <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2dd4bf;">{code}</div>
                </div>
                <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">Код действителен 10 минут. Если вы не регистрировались, проигнорируйте это письмо.</p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html, 'html'))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())
        
        print(f"✅ Verification email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        return False

# Handle persistent data paths for Docker
CONFIG_DIR = os.environ.get("CONFIG_DIR", os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(CONFIG_DIR, "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Create tables if they don't exist
with app.app_context():
    db.create_all()
    # Create default admin if none exists
    if not User.query.filter_by(username='admin').first():
        print("🌱 Creating default admin user...")
        admin = User(username='admin', role='admin', is_verified=True)
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("✅ Default admin user created successfully.")

# ── Config file (legacy/compatibility) ────────────────────────────────────────
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")

ICAFE_BASE = "https://api.icafecloud.com/api/v2"


def load_config() -> dict:
    defaults = {
        "api_key": "",
        "cafe_id": "",
        "club_name": "iCafe",
        "club_logo_url": ""
    }
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                # Merge with defaults to ensure keys exist and are not empty
                for k, v in defaults.items():
                    if k not in cfg or not cfg[k]:
                        cfg[k] = v
        except Exception:
            cfg = defaults.copy()
    else:
        cfg = defaults.copy()

    # Environment overrides (useful for Docker)
    env_api_key = os.environ.get("ICAFE_API_KEY")
    env_cafe_id = os.environ.get("ICAFE_CAFE_ID")
    if env_api_key:
        cfg["api_key"] = env_api_key
    if env_cafe_id:
        cfg["cafe_id"] = env_cafe_id

    return cfg


def save_config(data: dict):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


# ── iCafeCloud API helper ─────────────────────────────────────────────────────

def icafe_get(path: str, params: dict = None) -> dict | None:
    # Get current user and their club's credentials
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or not user.club:
        return {"code": 401, "message": "No club assigned to user"}
    
    headers = {
        "Authorization": f"Bearer {user.club.api_key.strip()}",
        "Accept": "application/json"
    }
    url = f"{ICAFE_BASE}/cafe/{user.club.cafe_id}{path}"
    
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=15)
        return resp.json()
    except Exception as e:
        print(f"API Error ({path}): {e}")
        return None


def icafe_post(path: str, data: dict = None) -> dict | None:
    # Get current user and their club's credentials
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or not user.club:
        return {"code": 401, "message": "No club assigned to user"}

    headers = {
        "Authorization": f"Bearer {user.club.api_key.strip()}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    url = f"{ICAFE_BASE}/cafe/{user.club.cafe_id}{path}"
    try:
        resp = requests.post(url, headers=headers, json=data or {}, timeout=10)
        return resp.json()
    except Exception as e:
        print(f"API Error ({path}): {e}")
        return None


# ── Auth Routes ───────────────────────────────────────────────────────────────

@app.post("/api/auth/register")
def register():
    """Step 1: Register a new user and send verification code to email."""
    data = request.json or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    password = data.get("password", "")

    # Validation
    if not username or not email or not password:
        return jsonify({"message": "Заполните все обязательные поля (логин, email, пароль)"}), 400
    if len(username) < 3:
        return jsonify({"message": "Логин должен быть не менее 3 символов"}), 400
    if len(password) < 6:
        return jsonify({"message": "Пароль должен быть не менее 6 символов"}), 400
    if "@" not in email:
        return jsonify({"message": "Укажите корректный email"}), 400

    # Check uniqueness
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Пользователь с таким логином уже существует"}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Пользователь с таким email уже существует"}), 409

    # Create unverified user
    user = User(username=username, email=email, phone=phone, role="manager", is_verified=False)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Generate and send verification code
    code = generate_verification_code()
    verification = EmailVerification(
        email=email,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.session.add(verification)
    db.session.commit()

    send_verification_email(email, code)

    return jsonify({
        "message": "Код подтверждения отправлен на вашу почту",
        "email": email,
        "user_id": user.id
    }), 201


@app.post("/api/auth/verify-email")
def verify_email():
    """Step 2: Verify email with the 6-digit code."""
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()

    if not email or not code:
        return jsonify({"message": "Укажите email и код подтверждения"}), 400

    # Find latest unused verification for this email
    verification = EmailVerification.query.filter_by(
        email=email, code=code, used=False
    ).order_by(EmailVerification.created_at.desc()).first()

    if not verification:
        return jsonify({"message": "Неверный код подтверждения"}), 400

    if datetime.utcnow() > verification.expires_at:
        return jsonify({"message": "Код подтверждения истёк. Запросите новый."}), 400

    # Mark code as used
    verification.used = True

    # Activate user
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "Пользователь не найден"}), 404

    user.is_verified = True
    db.session.commit()

    # Auto-login after verification
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "message": "Email успешно подтверждён!",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "email": user.email
        }
    })


@app.post("/api/auth/resend-code")
def resend_code():
    """Resend verification code to email."""
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"message": "Укажите email"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "Пользователь с таким email не найден"}), 404
    if user.is_verified:
        return jsonify({"message": "Email уже подтверждён"}), 400

    # Rate limiting: check if a code was sent in the last 60 seconds
    recent = EmailVerification.query.filter_by(email=email, used=False).order_by(
        EmailVerification.created_at.desc()
    ).first()
    if recent and (datetime.utcnow() - recent.created_at).total_seconds() < 60:
        return jsonify({"message": "Подождите минуту перед повторной отправкой"}), 429

    code = generate_verification_code()
    verification = EmailVerification(
        email=email,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.session.add(verification)
    db.session.commit()

    send_verification_email(email, code)

    return jsonify({"message": "Новый код отправлен на вашу почту"})


@app.post("/api/auth/login")
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        if not user.is_verified:
            return jsonify({"message": "Email не подтверждён. Проверьте почту.", "needs_verification": True, "email": user.email}), 403
        # Convert ID to string for best compatibility with JWT serialization
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "email": user.email,
                "club_name": user.club.name if user.club else None
            }
        })
    return jsonify({"message": "Неверный логин или пароль"}), 401

# ── Admin Routes (Clubs Management) ───────────────────────────────────────────

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if user.role != 'admin':
            return jsonify({"message": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper

@app.get("/api/admin/clubs")
@admin_required
def get_clubs():
    clubs = Club.query.all()
    return jsonify([{
        "id": c.id,
        "name": c.name,
        "cafe_id": c.cafe_id,
        "logo_url": c.club_logo_url
    } for c in clubs])

@app.post("/api/admin/clubs")
@admin_required
def add_club():
    data = request.json
    new_club = Club(
        name=data.get("name"),
        api_key=data.get("api_key"),
        cafe_id=data.get("cafe_id")
    )
    db.session.add(new_club)
    db.session.commit()
    return jsonify({"message": "Club added successfully", "id": new_club.id})

@app.get("/api/admin/users")
@admin_required
def get_all_users():
    """List all registered users for admin panel."""
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([{
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "phone": u.phone,
        "role": u.role,
        "is_verified": u.is_verified,
        "club_id": u.club_id,
        "club_name": u.club.name if u.club else None,
        "created_at": u.created_at.isoformat() if u.created_at else None
    } for u in users])

@app.post("/api/admin/assign-user")
@admin_required
def assign_user():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    club_id = data.get("club_id")
    
    user = User.query.filter_by(username=username).first()
    if not user:
        user = User(username=username, club_id=club_id, is_verified=True)
        user.set_password(password)
        db.session.add(user)
    else:
        user.club_id = club_id
        if password:
            user.set_password(password)
            
    db.session.commit()
    return jsonify({"message": "User assigned/updated successfully"})

# ── Config endpoints ──────────────────────────────────────────────────────────

@app.get("/api/config")
@jwt_required()
def get_config():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or not user.club:
        return jsonify({"message": "No club assigned"}), 404
        
    return jsonify({
        "club_name": user.club.name,
        "club_logo_url": user.club.club_logo_url,
        "api_key_masked": "***HIDDEN***",
        "cafe_id": user.club.cafe_id,
        "configured": True
    })


@app.post("/api/config")
@jwt_required()
def set_config():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or not user.club:
        return jsonify({"message": "No club assigned"}), 404
        
    body = request.get_json(force=True) or {}
    if "club_name" in body:
        user.club.name = body["club_name"].strip()
    if "club_logo_url" in body:
        user.club.club_logo_url = body["club_logo_url"].strip()
    
    db.session.commit()
    return jsonify({"ok": True})


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.post("/api/upload-logo")
def upload_logo():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    if file and allowed_file(file.filename):
        filename = "logo_" + secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        # Return the URL to access this file
        return jsonify({"url": f"/api/uploads/{filename}"})
    return jsonify({"error": "File type not allowed"}), 400


@app.get("/api/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# ── Overview / Stats ──────────────────────────────────────────────────────────

@app.get("/api/overview")
@jwt_required()
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
@jwt_required()
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
@jwt_required()
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
@jwt_required()
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


# ── Monthly aggregated income (last 7 months) ─────────────────────────────────

@app.get("/api/charts/income-monthly")
@jwt_required()
def income_monthly_chart():
    today = date.today()
    # Go back roughly 7 months (approx 210 days to be safe and cover full months)
    start_date = (today - timedelta(days=210))
    result = icafe_get("/reports/reportChart", {
        "date_start": start_date.isoformat(),
        "date_end": today.isoformat(),
        "data_source": "recent"
    })

    months_data = {}
    ru_months = {
        1: "Янв", 2: "Фев", 3: "Мар", 4: "Апр", 5: "Май", 6: "Июн",
        7: "Июл", 8: "Авг", 9: "Сен", 10: "Окт", 11: "Ноя", 12: "Дек"
    }

    if result and result.get("code") == 200:
        data = result.get("data", {})
        categories = data.get("categories", [])
        series = data.get("series", [])
        
        # Aggregate daily data into monthly buckets
        for s in series:
            s_data = s.get("data", [])
            for i, val in enumerate(s_data):
                if i >= len(categories): break
                try:
                    dt = datetime.fromisoformat(categories[i])
                    month_key = dt.strftime("%Y-%m")
                    months_data[month_key] = months_data.get(month_key, 0) + float(val or 0)
                except:
                    continue

    # Convert to sorted list and format for UI
    sorted_keys = sorted(months_data.keys(), reverse=True)[:7] # Take last 7 months
    sorted_keys.reverse() # Show in chronological order

    output = []
    for key in sorted_keys:
        y, m = map(int, key.split("-"))
        output.append({
            "month": f"{ru_months[m]} {y}",
            "amount": round(months_data[key], 2)
        })

    return jsonify({"data": output})


# ── PCs monitoring ────────────────────────────────────────────────────────────

@app.get("/api/pcs")
@jwt_required()
def get_pcs():
    result = icafe_get("/pcList")
    pcs = []
    if result and result.get("code") == 200:
        raw_pcs = []
        data_field = result.get("data", {})
        if isinstance(data_field, list):
            raw_pcs = data_field
        elif isinstance(data_field, dict):
            raw_pcs = data_field.get("pcs", [])

        for pc in raw_pcs:
            # Re-use status logic from overview
            status = "free"
            if pc.get("member_id") or pc.get("status_connect_time_local") or pc.get("member_account"):
                status = "busy"
            else:
                s_str = str(pc.get("pc_status", "")).lower()
                if s_str in ("busy", "locked", "ordered", "using"):
                    status = "busy"
                elif s_str in ("offline", "off"):
                    status = "offline"

            pcs.append({
                "id": pc.get("pc_icafe_id") or pc.get("pc_mac"),
                "name": pc.get("pc_name", "Unknown"),
                "status": status,
                "member": pc.get("member_account", ""),
                "time_left": pc.get("status_connect_time_left", ""),
                "room": pc.get("pc_area_name", "OpenSpace"),
                "top": pc.get("pc_box_top", 0),
                "left": pc.get("pc_box_left", 0),
            })

    return jsonify({"pcs": pcs, "total": len(pcs)})


# ── Members ───────────────────────────────────────────────────────────────────

@app.get("/api/members")
@jwt_required()
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
@jwt_required()
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
@jwt_required()
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
