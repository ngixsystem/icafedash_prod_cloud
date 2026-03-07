import os
import json
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date, timedelta, datetime
from functools import wraps
from typing import Any

import requests
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from werkzeug.utils import secure_filename
from werkzeug.exceptions import HTTPException
from sqlalchemy import func, or_

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


@app.errorhandler(Exception)
def handle_unexpected_api_error(e):
    # Keep non-API behavior unchanged (HTML pages, static routes, etc.).
    if not request.path.startswith("/api/"):
        if isinstance(e, HTTPException):
            return e
        raise e

    if isinstance(e, HTTPException):
        return jsonify({"message": e.description or "HTTP error"}), int(e.code or 500)

    print(f"ERROR: Unhandled API exception on {request.method} {request.path}: {e}")
    return jsonify({"message": "Internal server error"}), 500

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
    api_key = db.Column(db.Text, nullable=True)
    cafe_id = db.Column(db.String(50), nullable=True)
    club_logo_url = db.Column(db.String(255), default="")
    club_main_photo_url = db.Column(db.String(255), default="")
    club_photos = db.Column(db.Text, nullable=True)
    address = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    telegram_username = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)
    lat = db.Column(db.Float(53), nullable=True)
    lng = db.Column(db.Float(53), nullable=True)
    instagram = db.Column(db.String(100), nullable=True)
    working_hours = db.Column(db.String(100), nullable=True)
    zones = db.Column(db.Text, nullable=True)
    tariffs = db.Column(db.Text, nullable=True)
    internet_speed = db.Column(db.String(50), nullable=True)
    cashback_enabled = db.Column(db.Boolean, nullable=False, default=False)
    cashback_percent = db.Column(db.Float, nullable=False, default=5.0)
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
    avatar_url = db.Column(db.String(255), nullable=True, default="")
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


class ClubReview(db.Model):
    __tablename__ = "club_reviews"
    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False, default=0)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    club = db.relationship("Club", backref=db.backref("reviews", lazy=True))
    user = db.relationship("User", backref=db.backref("club_reviews", lazy=True))


class BookingRequest(db.Model):
    __tablename__ = "booking_requests"
    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    client_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    zone_name = db.Column(db.String(120), nullable=False)
    duration = db.Column(db.String(50), nullable=True)
    pc_names = db.Column(db.Text, nullable=False)  # JSON array
    status = db.Column(db.String(20), nullable=False, default="pending")
    cancellation_reason = db.Column(db.Text, nullable=True)
    canceled_by = db.Column(db.String(20), nullable=True)  # client / manager / admin
    canceled_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    club = db.relationship("Club", backref=db.backref("booking_requests", lazy=True))
    user = db.relationship("User", backref=db.backref("booking_requests", lazy=True))


class CashbackTransaction(db.Model):
    __tablename__ = "cashback_transactions"
    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=False, index=True)
    manager_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    member_id = db.Column(db.Integer, nullable=True, index=True)
    member_account = db.Column(db.String(120), nullable=True, index=True)
    amount = db.Column(db.Float, nullable=False, default=0.0)
    cashback_percent = db.Column(db.Float, nullable=False, default=0.0)
    cashback_amount = db.Column(db.Float, nullable=False, default=0.0)
    qr_payload = db.Column(db.Text, nullable=True)
    note = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    club = db.relationship("Club", backref=db.backref("cashback_transactions", lazy=True))
    manager = db.relationship("User", backref=db.backref("cashback_transactions", lazy=True))


def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))


def send_verification_email(to_email, code):
    """Send a verification code via SMTP email."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"INFO: SMTP not configured. Verification code for {to_email}: {code}")
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

        print(f"INFO: Verification email sent to {to_email}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to send email to {to_email}: {e}")
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

    # Migration: add new columns to existing tables if they don't exist
    from sqlalchemy import inspect, text
    inspector = inspect(db.engine)
    dialect_name = str(db.engine.dialect.name or "").lower()

    def _safe_migration(conn, sql: str, success_message: str | None = None):
        try:
            conn.execute(text(sql))
            conn.commit()
            if success_message:
                print(success_message)
            return True
        except Exception as e:
            # Do not block application startup because of dialect-specific DDL.
            print(f"WARN: migration skipped: {sql} | error: {e}")
            return False

    existing_columns = [col['name'] for col in inspector.get_columns('users')]

    with db.engine.connect() as conn:
        if 'email' not in existing_columns:
            _safe_migration(conn, "ALTER TABLE users ADD COLUMN email VARCHAR(120)", "Added email column to users table")
        if 'phone' not in existing_columns:
            _safe_migration(conn, "ALTER TABLE users ADD COLUMN phone VARCHAR(20)", "Added phone column to users table")
        if 'is_verified' not in existing_columns:
            _safe_migration(conn, "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 1", "Added is_verified column to users table")
        if 'avatar_url' not in existing_columns:
            _safe_migration(conn, "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT ''", "Added avatar_url column to users table")
            
    # Migration for clubs
    existing_club_columns_info = {col['name']: col for col in inspector.get_columns('clubs')}
    existing_club_columns = list(existing_club_columns_info.keys())
    with db.engine.connect() as conn:
        if 'address' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN address VARCHAR(255)")
        if 'phone' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN phone VARCHAR(50)")
        if 'telegram_username' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN telegram_username VARCHAR(100)")
        if 'description' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN description TEXT")
        if 'lat' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN lat DOUBLE")
        if 'lng' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN lng DOUBLE")
        # Upgrade existing FLOAT columns to DOUBLE to keep geolocation precision.
        if 'lat' in existing_club_columns and dialect_name in ("mysql", "mariadb"):
            lat_type = str(existing_club_columns_info['lat'].get('type', '')).upper()
            if 'DOUBLE' not in lat_type:
                _safe_migration(conn, "ALTER TABLE clubs MODIFY COLUMN lat DOUBLE NULL")
        if 'lng' in existing_club_columns and dialect_name in ("mysql", "mariadb"):
            lng_type = str(existing_club_columns_info['lng'].get('type', '')).upper()
            if 'DOUBLE' not in lng_type:
                _safe_migration(conn, "ALTER TABLE clubs MODIFY COLUMN lng DOUBLE NULL")
        if 'instagram' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN instagram VARCHAR(100)")
        if 'working_hours' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN working_hours VARCHAR(100)")
        if 'zones' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN zones TEXT")
        if 'tariffs' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN tariffs TEXT")
        if 'internet_speed' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN internet_speed VARCHAR(50)")
        if 'cashback_enabled' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN cashback_enabled BOOLEAN DEFAULT 0")
        if 'cashback_percent' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN cashback_percent FLOAT DEFAULT 5")
        if 'club_main_photo_url' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN club_main_photo_url VARCHAR(255) DEFAULT ''")
        if 'club_photos' not in existing_club_columns:
            _safe_migration(conn, "ALTER TABLE clubs ADD COLUMN club_photos TEXT")

    # Migration for booking_requests
    existing_tables = inspector.get_table_names()
    if 'booking_requests' in existing_tables:
        existing_booking_columns = [col['name'] for col in inspector.get_columns('booking_requests')]
        with db.engine.connect() as conn:
            if 'cancellation_reason' not in existing_booking_columns:
                _safe_migration(conn, "ALTER TABLE booking_requests ADD COLUMN cancellation_reason TEXT")
            if 'canceled_by' not in existing_booking_columns:
                _safe_migration(conn, "ALTER TABLE booking_requests ADD COLUMN canceled_by VARCHAR(20)")
            if 'canceled_at' not in existing_booking_columns:
                _safe_migration(conn, "ALTER TABLE booking_requests ADD COLUMN canceled_at DATETIME")
            
    # Create or update default admin user
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        print("INFO: Creating default admin user...")
        admin = User(username='admin', role='admin', is_verified=True)
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("INFO: Default admin user created successfully.")
    else:
        # Ensure admin is always verified
        if not admin.is_verified:
            admin.is_verified = True
            db.session.commit()
            print("INFO: Admin user marked as verified.")

# Config file (legacy/compatibility)
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


def get_club_rating_stats(club_id: int) -> tuple[float, int]:
    avg_rating, total_reviews = db.session.query(
        func.avg(ClubReview.rating),
        func.count(ClubReview.id)
    ).filter(ClubReview.club_id == club_id).first()

    avg = float(avg_rating or 0.0)
    count = int(total_reviews or 0)
    return avg, count


def parse_icafe_pcs(raw_result: dict | None) -> list:
    if not raw_result or raw_result.get("code") != 200:
        return []
    data_field = raw_result.get("data", {})
    if isinstance(data_field, list):
        return data_field
    if isinstance(data_field, dict):
        return data_field.get("pcs", [])
    return []

def parse_icafe_datetime(value: str | None):
    if not value:
        return None
    raw = str(value).strip()
    if not raw:
        return None

    normalized = raw.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(normalized)
        if dt.tzinfo is not None:
            dt = dt.astimezone().replace(tzinfo=None)
        return dt
    except Exception:
        pass

    patterns = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%d.%m.%Y %H:%M:%S",
        "%d.%m.%Y %H:%M",
        "%d.%m.%Y",
    ]
    for fmt in patterns:
        try:
            return datetime.strptime(raw, fmt)
        except Exception:
            continue
    return None


def detect_pc_status(pc: dict) -> str:
    # iCafe may keep session fields empty for disabled/out-of-order PCs.
    if _pc_enabled_is_zero(pc.get("pc_enabled")):
        return "offline"

    if pc.get("member_id") or pc.get("status_connect_time_local") or pc.get("member_account"):
        return "busy"

    status_raw = str(pc.get("pc_status", "")).lower()
    if status_raw in ("busy", "locked", "ordered", "using"):
        return "busy"
    if status_raw in ("offline", "off", "shutdown"):
        return "offline"
    return "free"


def icafe_get_for_club(club: Club, path: str, params: dict = None, timeout: int = 15) -> dict | None:
    if not club or not club.api_key or not club.cafe_id:
        return None
    headers = {
        "Authorization": f"Bearer {club.api_key.strip()}",
        "Accept": "application/json",
    }
    url = f"{ICAFE_BASE}/cafe/{club.cafe_id}{path}"
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=timeout)
        return resp.json()
    except Exception as e:
        print(f"Public API Error ({path}): {e}")
        return None


def normalize_booking_status(raw_status: str | None) -> str:
    status = (raw_status or "").strip().lower()
    if status in ("new", "", "pending"):
        return "pending"
    if status in ("approved", "rejected", "cancelled", "completed"):
        return status
    return "pending"


def to_wa_link(phone_value: str | None) -> str | None:
    digits = "".join(ch for ch in str(phone_value or "") if ch.isdigit())
    if len(digits) < 9:
        return None
    return f"https://wa.me/{digits}"


def to_tg_link(username_value: str | None) -> str | None:
    username = str(username_value or "").strip().lstrip("@")
    if not username:
        return None
    safe = "".join(ch for ch in username if ch.isalnum() or ch == "_")
    if len(safe) < 5:
        return None
    return f"https://t.me/{safe}"


def to_manager_chat_link(club: Club | None) -> str | None:
    if not club:
        return None
    tg = to_tg_link(club.telegram_username)
    if tg:
        return tg
    return to_wa_link(club.phone)


def parse_cashback_qr_payload(raw_value: str | None) -> dict:
    raw = str(raw_value or "").strip()
    if not raw:
        return {"member_id": None, "member_account": None}

    member_id = None
    member_account = None

    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            if parsed.get("member_id") is not None:
                try:
                    member_id = int(parsed.get("member_id"))
                except Exception:
                    member_id = None
            acc = parsed.get("member_account") or parsed.get("account") or parsed.get("username")
            if acc:
                member_account = str(acc).strip()
    except Exception:
        pass

    if raw.upper().startswith("ICAFE_MEMBER:"):
        value = raw.split(":", 1)[1].strip()
        try:
            member_id = int(value)
        except Exception:
            member_account = value or member_account
    elif raw.upper().startswith("ICAFE_ACCOUNT:"):
        member_account = raw.split(":", 1)[1].strip()
    elif raw.isdigit():
        try:
            member_id = int(raw)
        except Exception:
            pass
    elif member_account is None:
        member_account = raw

    if member_account:
        member_account = member_account[:120]
    return {"member_id": member_id, "member_account": member_account}


def parse_booking_pc_entries(raw_value: str | None) -> list[dict]:
    if not raw_value:
        return []
    try:
        parsed = json.loads(raw_value)
    except Exception:
        return []

    entries = []
    if isinstance(parsed, list):
        for item in parsed:
            if isinstance(item, dict):
                zone_name = str(item.get("zone_name") or "").strip()
                pc_name = str(item.get("pc_name") or "").strip()
                if zone_name and pc_name:
                    entries.append({"zone_name": zone_name, "pc_name": pc_name})
            elif isinstance(item, str):
                value = item.strip()
                if not value:
                    continue
                if ":" in value:
                    zone_name, pc_name = value.split(":", 1)
                    zone_name = zone_name.strip()
                    pc_name = pc_name.strip()
                    if zone_name and pc_name:
                        entries.append({"zone_name": zone_name, "pc_name": pc_name})
                else:
                    entries.append({"zone_name": "", "pc_name": value})
    return entries


def booking_display_pc_names(entries: list[dict]) -> list[str]:
    result = []
    for entry in entries:
        zone_name = str(entry.get("zone_name") or "").strip()
        pc_name = str(entry.get("pc_name") or "").strip()
        if not pc_name:
            continue
        result.append(f"{zone_name}/{pc_name}" if zone_name else pc_name)
    return result


def get_approved_booking_pc_keys(club_id: int | None) -> set[tuple[str, str]]:
    keys: set[tuple[str, str]] = set()
    if not club_id:
        return keys

    bookings = BookingRequest.query.filter(BookingRequest.club_id == club_id).all()
    for booking in bookings:
        if normalize_booking_status(booking.status) != "approved":
            continue
        fallback_zone = str(booking.zone_name or "").strip()
        entries = parse_booking_pc_entries(booking.pc_names)
        for entry in entries:
            zone_name = str(entry.get("zone_name") or fallback_zone).strip()
            pc_name_raw = str(entry.get("pc_name") or "").strip()
            pc_name = pc_name_raw.split("/")[-1].strip() if "/" in pc_name_raw else pc_name_raw
            if zone_name and pc_name:
                keys.add((zone_name.casefold(), pc_name.casefold()))
    return keys


# iCafeCloud API helper

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


def icafe_post_for_club(club: Club, path: str, data: dict = None, timeout: int = 12) -> dict | None:
    if not club or not club.api_key or not club.cafe_id:
        return None

    headers = {
        "Authorization": f"Bearer {club.api_key.strip()}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    url = f"{ICAFE_BASE}/cafe/{club.cafe_id}{path}"
    try:
        resp = requests.post(url, headers=headers, json=data or {}, timeout=timeout)
        return resp.json()
    except Exception as e:
        print(f"Club API Error ({path}): {e}")
        return None


def icafe_put_for_club(club: Club, path: str, data: dict = None, timeout: int = 12) -> dict | None:
    if not club or not club.api_key or not club.cafe_id:
        return None

    headers = {
        "Authorization": f"Bearer {club.api_key.strip()}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    url = f"{ICAFE_BASE}/cafe/{club.cafe_id}{path}"
    try:
        resp = requests.put(url, headers=headers, json=data or {}, timeout=timeout)
        return resp.json()
    except Exception as e:
        print(f"Club API PUT Error ({path}): {e}")
        return None


def _icafe_result_ok(result: dict | None) -> bool:
    if not result:
        return False
    try:
        if int(result.get("code")) == 200:
            return True
    except Exception:
        pass
    success_value = result.get("success")
    if isinstance(success_value, bool):
        return success_value
    if isinstance(success_value, (int, float)):
        return success_value == 1
    if isinstance(success_value, str):
        normalized = success_value.strip().lower()
        if normalized in ("true", "1", "ok", "success", "yes"):
            return True
        if normalized in ("false", "0", "fail", "error", "no"):
            return False
    return False


def _get_club_pcs_for_actions(club: Club | None) -> list[dict]:
    if not club:
        return []
    # Prefer /pcs (new API), fallback to /pcList (legacy API)
    raw = icafe_get_for_club(club, "/pcs", timeout=10)
    pcs = parse_icafe_pcs(raw)
    if pcs:
        return pcs
    raw = icafe_get_for_club(club, "/pcList", timeout=10)
    return parse_icafe_pcs(raw)


def _get_club_pcs_for_public_status(club: Club | None) -> list[dict]:
    if not club:
        return []
    # For live booking UI we prefer /pcList because occupancy fields are
    # typically more complete there; /pcs is fallback only.
    raw = icafe_get_for_club(club, "/pcList", timeout=10)
    pcs = parse_icafe_pcs(raw)
    if pcs:
        return pcs
    raw = icafe_get_for_club(club, "/pcs", timeout=10)
    return parse_icafe_pcs(raw)


def _pc_enabled_is_zero(value: Any) -> bool:
    if isinstance(value, bool):
        return value is False
    if isinstance(value, (int, float)):
        return int(value) == 0
    if isinstance(value, str):
        s = value.strip().lower()
        return s in ("0", "false", "off", "disabled")
    return False


def _verify_pcs_in_maintenance(club: Club | None, target_names: list[str]) -> bool:
    if not club or not target_names:
        return False
    pcs = _get_club_pcs_for_actions(club)
    if not pcs:
        return False

    by_name = {}
    for pc in pcs:
        name = str(pc.get("pc_name") or "").strip()
        if name:
            by_name[name.casefold()] = pc

    for raw_name in target_names:
        name = str(raw_name or "").strip()
        if not name:
            continue
        pc = by_name.get(name.casefold())
        if not pc:
            return False
        if not _pc_enabled_is_zero(pc.get("pc_enabled")):
            return False
    return True


def set_booking_pcs_out_of_order(club: Club | None, pc_entries: list[dict]) -> dict:
    pc_names = []
    pc_full_names = []
    for entry in pc_entries:
        zone_name = str(entry.get("zone_name") or "").strip()
        pc_name_raw = str(entry.get("pc_name") or "").strip()
        pc_name = pc_name_raw.split("/")[-1].strip() if "/" in pc_name_raw else pc_name_raw
        if pc_name and pc_name not in pc_names:
            pc_names.append(pc_name)
        if zone_name and pc_name:
            full_name = f"{zone_name}/{pc_name}"
            if full_name not in pc_full_names:
                pc_full_names.append(full_name)

    if not pc_names:
        return {"requested": False, "success": False, "message": "No PCs found in booking"}
    if not club or not club.api_key or not club.cafe_id:
        return {"requested": True, "success": False, "message": "Club iCafe credentials are not configured"}

    # Resolve exact names/ids from iCafe to avoid casing/format mismatches.
    available_pcs = _get_club_pcs_for_actions(club)
    by_name = {}
    by_zone_and_name = {}
    for pc in available_pcs:
        name = str(pc.get("pc_name") or "").strip()
        zone = str(pc.get("pc_area_name") or pc.get("pc_group_name") or "").strip()
        if name:
            by_name[name.casefold()] = pc
        if name and zone:
            by_zone_and_name[(zone.casefold(), name.casefold())] = pc

    exact_names = []
    id_list_int = []
    for entry in pc_entries:
        zone_name = str(entry.get("zone_name") or "").strip()
        pc_name_raw = str(entry.get("pc_name") or "").strip()
        pc_name = pc_name_raw.split("/")[-1].strip() if "/" in pc_name_raw else pc_name_raw
        if not pc_name:
            continue
        found = None
        if zone_name:
            found = by_zone_and_name.get((zone_name.casefold(), pc_name.casefold()))
        if not found:
            found = by_name.get(pc_name.casefold())
        if found:
            exact_name = str(found.get("pc_name") or "").strip()
            if exact_name and exact_name not in exact_names:
                exact_names.append(exact_name)
            pc_id = found.get("pc_icafe_id")
            if pc_id is not None and pc_id not in id_list_int:
                id_list_int.append(pc_id)

    # If couldn't resolve from API, use normalized names from booking as fallback.
    if not exact_names:
        exact_names = list(pc_names)
    id_list_str = [str(x) for x in id_list_int]

    # First attempt (priority for your iCafe setup): objects with pc_enabled=0.
    pcs_with_enabled_flag = []
    for entry in pc_entries:
        zone_name = str(entry.get("zone_name") or "").strip()
        pc_name_raw = str(entry.get("pc_name") or "").strip()
        pc_name = pc_name_raw.split("/")[-1].strip() if "/" in pc_name_raw else pc_name_raw
        if not pc_name:
            continue
        item = {"pc_name": pc_name, "pc_enabled": 0}
        if zone_name:
            item["pc_area_name"] = zone_name
        pcs_with_enabled_flag.append(item)

    result_by_enabled_objects = None
    if pcs_with_enabled_flag:
        result_by_enabled_objects = icafe_post_for_club(
            club,
            "/pcs/action/setOutOfOrder",
            {"pcs": pcs_with_enabled_flag},
            timeout=12,
        )
        if _icafe_result_ok(result_by_enabled_objects):
            # Confirm state actually changed in iCafe.
            if _verify_pcs_in_maintenance(club, exact_names):
                return {"requested": True, "success": True, "mode": "enabled_objects", "result": result_by_enabled_objects}
            # API returned success but state didn't change yet; continue fallbacks.

    # Second attempt: send raw PC names directly (batch).
    result_by_names = icafe_post_for_club(club, "/pcs/action/setOutOfOrder", {"pcs": exact_names}, timeout=12)
    if _icafe_result_ok(result_by_names) and _verify_pcs_in_maintenance(club, exact_names):
        return {"requested": True, "success": True, "mode": "names", "result": result_by_names}

    # Third attempt: API may expect objects instead of primitive strings.
    pcs_as_name_objects = [{"pc_name": name} for name in exact_names]
    result_by_name_objects = icafe_post_for_club(club, "/pcs/action/setOutOfOrder", {"pcs": pcs_as_name_objects}, timeout=12)
    if _icafe_result_ok(result_by_name_objects) and _verify_pcs_in_maintenance(club, exact_names):
        return {"requested": True, "success": True, "mode": "name_objects", "result": result_by_name_objects}

    pcs_as_rich_objects = []
    for entry in pc_entries:
        zone_name = str(entry.get("zone_name") or "").strip()
        pc_name_raw = str(entry.get("pc_name") or "").strip()
        pc_name = pc_name_raw.split("/")[-1].strip() if "/" in pc_name_raw else pc_name_raw
        if pc_name:
            item = {"pc_name": pc_name}
            if zone_name:
                item["pc_area_name"] = zone_name
            pcs_as_rich_objects.append(item)

    result_by_rich_objects = None
    if pcs_as_rich_objects:
        result_by_rich_objects = icafe_post_for_club(club, "/pcs/action/setOutOfOrder", {"pcs": pcs_as_rich_objects}, timeout=12)
        if _icafe_result_ok(result_by_rich_objects) and _verify_pcs_in_maintenance(club, exact_names):
            return {"requested": True, "success": True, "mode": "rich_objects", "result": result_by_rich_objects}

    # Fourth attempt: one-by-one by PC name (some environments fail on batch payload).
    single_results = []
    single_all_ok = True
    for name in exact_names:
        r = icafe_post_for_club(club, "/pcs/action/setOutOfOrder", {"pcs": [name]}, timeout=12)
        ok = _icafe_result_ok(r)
        single_results.append({"pc": name, "ok": ok, "result": r})
        if not ok:
            single_all_ok = False
    if single_results and single_all_ok and _verify_pcs_in_maintenance(club, exact_names):
        return {"requested": True, "success": True, "mode": "single_names", "result": single_results}

    # Second attempt: send "zone/pc" names for environments where names are stored with area prefix.
    if pc_full_names:
        result_by_full_names = icafe_post_for_club(club, "/pcs/action/setOutOfOrder", {"pcs": pc_full_names}, timeout=12)
        if _icafe_result_ok(result_by_full_names) and _verify_pcs_in_maintenance(club, exact_names):
            return {"requested": True, "success": True, "mode": "full_names", "result": result_by_full_names}
    else:
        result_by_full_names = None

    if id_list_str:
        result_by_ids_str = icafe_post_for_club(club, "/pcs/action/setOutOfOrder", {"pcs": id_list_str}, timeout=12)
        if _icafe_result_ok(result_by_ids_str) and _verify_pcs_in_maintenance(club, exact_names):
            return {"requested": True, "success": True, "mode": "ids_str", "result": result_by_ids_str}

    if id_list_int:
        result_by_ids = icafe_post_for_club(club, "/pcs/action/setOutOfOrder", {"pcs": id_list_int}, timeout=12)
        if _icafe_result_ok(result_by_ids) and _verify_pcs_in_maintenance(club, exact_names):
            return {"requested": True, "success": True, "mode": "ids", "result": result_by_ids}

    # Last fallback for installations where setOutOfOrder is unavailable:
    # try generic PCs update endpoint with enabled flags.
    result_put_pc_enabled = icafe_put_for_club(club, "/pcs", {"pcs": exact_names, "pc_enabled": 0}, timeout=12)
    if _icafe_result_ok(result_put_pc_enabled):
        return {"requested": True, "success": True, "mode": "put_pc_enabled", "result": result_put_pc_enabled}

    result_put_edit_pc_enabled = icafe_put_for_club(club, "/pcs", {"pcs": exact_names, "edit_pc_enabled": 0}, timeout=12)
    if _icafe_result_ok(result_put_edit_pc_enabled):
        return {"requested": True, "success": True, "mode": "put_edit_pc_enabled", "result": result_put_edit_pc_enabled}

    return {
        "requested": True,
        "success": _verify_pcs_in_maintenance(club, exact_names),
        "mode": "ids",
        "result": result_by_ids if id_list_int else result_by_names,
        "fallback_from_names_result": result_by_names,
        "fallback_from_name_objects_result": result_by_name_objects,
        "fallback_from_rich_objects_result": result_by_rich_objects,
        "fallback_from_enabled_objects_result": result_by_enabled_objects,
        "fallback_from_single_names_result": single_results,
        "fallback_from_full_names_result": result_by_full_names,
        "fallback_from_ids_str_result": result_by_ids_str if id_list_str else None,
        "fallback_from_put_pc_enabled_result": result_put_pc_enabled,
        "fallback_from_put_edit_pc_enabled_result": result_put_edit_pc_enabled,
    }


# Auth Routes

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
            "email": user.email,
            "avatar_url": user.avatar_url or ""
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
                "club_name": user.club.name if user.club else None,
                "avatar_url": user.avatar_url or ""
            }
        })
    return jsonify({"message": "Неверный логин или пароль"}), 401

# Client / Public API (Club-Finder)

@app.put("/api/auth/change-password")
@jwt_required()
def auth_change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role not in ("manager", "admin"):
        return jsonify({"message": "Only manager or admin can change password here"}), 403

    body = request.get_json(force=True) or {}
    current_password = str(body.get("current_password") or "")
    new_password = str(body.get("new_password") or "")

    if not current_password or not new_password:
        return jsonify({"message": "current_password and new_password are required"}), 400
    if len(new_password) < 6:
        return jsonify({"message": "New password must be at least 6 characters"}), 400
    if not user.check_password(current_password):
        return jsonify({"message": "Current password is invalid"}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password changed successfully"})


@app.post("/api/clients/register")
def client_register():
    data = request.json or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"message": "Заполните все поля"}), 400
        
    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({"message": "Пользователь уже существует"}), 409

    # Create unverified user with 'member' role
    user = User(username=username, email=email, role="member", is_verified=False)
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

    return jsonify({"message": "Код подтверждения отправлен на вашу почту"}), 201


@app.post("/api/clients/login")
def client_login():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")
    
    # Allow both legacy 'client' and new 'member' roles
    user = User.query.filter(User.username == username, User.role.in_(["client", "member"])).first()
    if user and user.check_password(password):
        if not user.is_verified:
            return jsonify({"message": "Email не подтверждён. Проверьте почту."}), 403
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "avatar_url": user.avatar_url or ""
            }
        })
    return jsonify({"message": "Неверный логин или пароль"}), 401


@app.get("/api/public/clubs")
def public_clubs():
    """Return an aggregated list of clubs with some basic stats based on iCafeCloud API"""
    clubs = Club.query.all()
    result = []
    
    for c in clubs:
        avg_rating, rating_count = get_club_rating_stats(c.id)
        try:
            # We fetch simple public stats if API key is valid
            headers = {"Authorization": f"Bearer {c.api_key.strip()}", "Accept": "application/json"}
            
            # Count PCs
            pc_raw = requests.get(f"{ICAFE_BASE}/cafe/{c.cafe_id}/pcList", headers=headers, timeout=5).json()
            total_pcs = 0
            free_pcs = 0
            if pc_raw.get("code") == 200:
                data_field = pc_raw.get("data", {})
                pcs = data_field if isinstance(data_field, list) else data_field.get("pcs", [])
                total_pcs = len(pcs)
                for pc in pcs:
                    if not (pc.get("member_id") or pc.get("status_connect_time_local") or pc.get("member_account")):
                        s_str = str(pc.get("pc_status", "")).lower()
                        if s_str not in ("busy", "locked", "ordered", "using", "offline", "off"):
                            free_pcs += 1
            
            result.append({
                "id": c.id,
                "name": c.name,
                "logo": c.club_main_photo_url or c.club_logo_url,
                "profile_logo": c.club_logo_url,
                "pcsTotal": total_pcs,
                "pcsFree": free_pcs,
                "rating": round(avg_rating, 1),
                "rating_count": rating_count,
                "address": c.address or "Адрес не указан",
                "phone": c.phone or "",
                "telegram_username": c.telegram_username or "",
                "description": c.description or "",
                "lat": c.lat or 0.0,
                "lng": c.lng or 0.0,
                "instagram": c.instagram or "",
                "working_hours": c.working_hours or "Круглосуточно",
                "isOpen": True,
                "pricePerHour": 100
            })
        except:
            # Add anyway as offline/unknown
            result.append({
                "id": c.id,
                "name": c.name,
                "logo": c.club_main_photo_url or c.club_logo_url,
                "profile_logo": c.club_logo_url,
                "pcsTotal": 0,
                "pcsFree": 0,
                "rating": round(avg_rating, 1),
                "rating_count": rating_count,
                "address": c.address or "Адрес не указан",
                "phone": c.phone or "",
                "telegram_username": c.telegram_username or "",
                "description": c.description or "",
                "lat": c.lat or 0.0,
                "lng": c.lng or 0.0,
                "instagram": c.instagram or "",
                "working_hours": c.working_hours or "Круглосуточно",
                "isOpen": False,
                "pricePerHour": 0
            })
            
    return jsonify(result)


# Admin Routes (Clubs Management)

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
        "api_key": c.api_key,
        "logo_url": c.club_logo_url,
        "address": c.address or "",
        "phone": c.phone or "",
        "telegram_username": c.telegram_username or "",
        "instagram": c.instagram or "",
        "working_hours": c.working_hours or "",
        "lat": c.lat or 0.0,
        "lng": c.lng or 0.0,
        "description": c.description or ""
    } for c in clubs])

@app.put("/api/admin/clubs/<int:club_id>")
@admin_required
def update_club(club_id):
    club = Club.query.get_or_404(club_id)
    data = request.json or {}

    if "name" in data: club.name = data["name"]
    if "api_key" in data: club.api_key = data["api_key"]
    if "cafe_id" in data: club.cafe_id = data["cafe_id"]
    if "logo_url" in data: club.club_logo_url = data["logo_url"]
    if "address" in data: club.address = data["address"]
    if "phone" in data: club.phone = data["phone"]
    if "telegram_username" in data: club.telegram_username = (data["telegram_username"] or "").strip().lstrip("@")
    if "instagram" in data: club.instagram = data["instagram"]
    if "working_hours" in data: club.working_hours = data["working_hours"]
    if "description" in data: club.description = data["description"]
    
    try:
        if "lat" in data: club.lat = float(data["lat"])
        if "lng" in data: club.lng = float(data["lng"])
    except:
        pass

    db.session.commit()
    return jsonify({"message": "Club updated successfully"})

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

@app.put("/api/admin/users/<int:user_id>")
@admin_required
def update_user(user_id):
    """Update user role, club assignment, or verification status."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Пользователь не найден"}), 404
    
    data = request.json or {}
    if "role" in data:
        user.role = data["role"]
    if "club_id" in data:
        user.club_id = data["club_id"] if data["club_id"] else None
    if "is_verified" in data:
        user.is_verified = data["is_verified"]
    
    db.session.commit()
    return jsonify({"message": "Пользователь обновлён"})

@app.delete("/api/admin/users/<int:user_id>")
@admin_required
def delete_user(user_id):
    """Delete a user (cannot delete yourself)."""
    current_user_id = int(get_jwt_identity())
    if current_user_id == user_id:
        return jsonify({"message": "Нельзя удалить самого себя"}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Пользователь не найден"}), 404
    
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Пользователь удалён"})


@app.get("/api/reviews")
@jwt_required()
def get_reviews_for_dashboard():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.role == "manager":
        if not user.club_id:
            return jsonify({"reviews": [], "summary": {"count": 0, "average_rating": 0.0}}), 200
        reviews_query = ClubReview.query.filter_by(club_id=user.club_id)
    elif user.role == "admin":
        club_id = request.args.get("club_id", type=int)
        reviews_query = ClubReview.query.filter_by(club_id=club_id) if club_id else ClubReview.query
    else:
        return jsonify({"message": "Access denied"}), 403

    reviews = reviews_query.order_by(ClubReview.created_at.desc()).limit(300).all()
    avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else 0.0

    return jsonify({
        "reviews": [{
            "id": r.id,
            "club_id": r.club_id,
            "club_name": r.club.name if r.club else "",
            "user_id": r.user_id,
            "username": r.user.username if r.user else "unknown",
            "rating": r.rating,
            "text": r.text,
            "created_at": r.created_at.isoformat() + "Z" if r.created_at else None,
        } for r in reviews],
        "summary": {
            "count": len(reviews),
            "average_rating": avg_rating
        }
    })

# Config endpoints

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
        "club_main_photo_url": user.club.club_main_photo_url or "",
        "club_photos": user.club.club_photos or "[]",
        "api_key_masked": "***HIDDEN***",
        "cafe_id": user.club.cafe_id,
        "address": user.club.address or "",
        "telegram_username": user.club.telegram_username or "",
        "lat": user.club.lat,
        "lng": user.club.lng,
        "working_hours": user.club.working_hours or "",
        "zones": user.club.zones or "",
        "tariffs": user.club.tariffs or "",
        "internet_speed": user.club.internet_speed or "",
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
    if "club_main_photo_url" in body:
        user.club.club_main_photo_url = (body["club_main_photo_url"] or "").strip()
    if "club_photos" in body:
        user.club.club_photos = (body["club_photos"] or "[]").strip()
    if "address" in body:
        user.club.address = body["address"].strip()
    if "telegram_username" in body:
        user.club.telegram_username = (body["telegram_username"] or "").strip().lstrip("@")
    if "working_hours" in body:
        user.club.working_hours = body["working_hours"].strip()
    if "zones" in body:
        user.club.zones = body["zones"].strip()
    if "tariffs" in body:
        user.club.tariffs = body["tariffs"].strip()
    if "internet_speed" in body:
        user.club.internet_speed = body["internet_speed"].strip()
    if "lat" in body:
        raw_lat = body.get("lat")
        if raw_lat is None or raw_lat == "":
            user.club.lat = None
        else:
            try:
                user.club.lat = float(raw_lat)
            except (TypeError, ValueError):
                return jsonify({"message": "Invalid latitude value"}), 400
    if "lng" in body:
        raw_lng = body.get("lng")
        if raw_lng is None or raw_lng == "":
            user.club.lng = None
        else:
            try:
                user.club.lng = float(raw_lng)
            except (TypeError, ValueError):
                return jsonify({"message": "Invalid longitude value"}), 400
    
    db.session.commit()
    return jsonify({"ok": True})


@app.get("/api/config/icafe-data")
@jwt_required()
def get_icafe_data():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or not user.club:
        return jsonify({"message": "No club assigned"}), 404

    zones_list = []
    tariffs_list = []

    # 1. Fetch PCs to extract unique Zones / Area names
    pc_raw = icafe_get("/pcList")
    try:
        if pc_raw and pc_raw.get("code") == 200:
            data_field = pc_raw.get("data", {})
            pcs = data_field if isinstance(data_field, list) else data_field.get("pcs", [])
            
            zone_counts = {}
            price_names = set()
            for pc in pcs:
                area = pc.get("pc_area_name") or pc.get("pc_group_name")
                if area:
                    area_str = str(area)
                    zone_counts[area_str] = zone_counts.get(area_str, 0) + 1
                # Sometime price names are assigned per PC
                pr = pc.get("price_name")
                if pr and pr != "Default":
                    price_names.add(str(pr))
                    
            if zone_counts:
                zones_list = [{"name": z, "specs": "", "price": "", "capacity": str(count)} for z, count in sorted(zone_counts.items())]
            
            if price_names:
                tariffs_list = [{"duration": t, "price": ""} for t in sorted(price_names)]
    except Exception as e:
        print(f"Error parsing zones: {e}")

    # 2. Fetch Member groups (often used as Tariffs/Packages in iCafe)
    mg_raw = icafe_get("/member/group")
    try:
        if mg_raw and mg_raw.get("code") == 200:
            groups = mg_raw.get("data", [])
            if groups:
                names = [str(g.get("member_group_name")) for g in groups if g.get("member_group_name")]
                if names:
                    # Append new tariffs if not already added from PC list
                    existing_tariffs = set(t["duration"] for t in tariffs_list)
                    for n in names:
                        if n not in existing_tariffs:
                            tariffs_list.append({"duration": n, "price": ""})
    except Exception as e:
        print(f"Error parsing member groups: {e}")

    # Return lists as JSON encoded strings so frontend can just store them directly
    return jsonify({
        "zones": json.dumps(zones_list, ensure_ascii=False) if zones_list else "[]",
        "tariffs": json.dumps(tariffs_list, ensure_ascii=False) if tariffs_list else "[]"
    })

@app.get("/api/public/clubs/<int:club_id>")
def public_club_detail(club_id):
    """Return specific club details including parsed zones and tariffs"""
    c = Club.query.get(club_id)
    if not c:
        return jsonify({"message": "Club not found"}), 404
        
    # Safely parse JSON arrays for zones and tariffs
    zones = []
    tariffs = []
    photos = []
    try:
        if c.zones:
            zones = json.loads(c.zones)
    except Exception as e:
        print(f"Error parsing zones for club {c.id}: {e}")
        
    try:
        if c.tariffs:
            tariffs = json.loads(c.tariffs)
    except Exception as e:
        print(f"Error parsing tariffs for club {c.id}: {e}")

    try:
        if c.club_photos:
            photos = json.loads(c.club_photos)
            if not isinstance(photos, list):
                photos = []
    except Exception as e:
        print(f"Error parsing photos for club {c.id}: {e}")
        
    # Try fetching real-time pc counts if API key exists
    total_pcs = 0
    free_pcs = 0
    zone_stats = {} # {"ZoneName": {"total": 0, "free": 0}}
    
    try:
        if c.api_key and c.cafe_id:
            approved_pc_keys = get_approved_booking_pc_keys(c.id)
            pcs = _get_club_pcs_for_public_status(c)
            total_pcs = len(pcs)
            for pc in pcs:
                z_name = str(pc.get("pc_area_name") or pc.get("pc_group_name") or "Unknown").strip()
                p_name = str(pc.get("pc_name") or "").strip()
                if z_name not in zone_stats:
                    zone_stats[z_name] = {"total": 0, "free": 0}

                zone_stats[z_name]["total"] += 1
                if detect_pc_status(pc) == "free" and (z_name.casefold(), p_name.casefold()) not in approved_pc_keys:
                    free_pcs += 1
                    zone_stats[z_name]["free"] += 1
    except:
        pass
        
    # Inject real stats into the parsed zones array using name matching
    for z in zones:
        z_name = z.get("name", "")
        # Try to find exactly, or loosely matching the name
        stats = zone_stats.get(z_name, {"total": int(z.get("capacity") or 0), "free": 0})
        z["capacity"] = str(stats["total"])
        z["pcsFree"] = stats["free"]

    avg_rating, rating_count = get_club_rating_stats(c.id)

    return jsonify({
        "id": c.id,
        "name": c.name,
        "logo": c.club_main_photo_url or c.club_logo_url,
        "profile_logo": c.club_logo_url,
        "main_photo_url": c.club_main_photo_url or "",
        "photos": photos,
        "address": c.address or "Адрес не указан",
        "description": c.description or "",
        "telegram_username": c.telegram_username or "",
        "working_hours": c.working_hours or "Круглосуточно",
        "rating": round(avg_rating, 1),
        "rating_count": rating_count,
        "lat": c.lat or 0.0,
        "lng": c.lng or 0.0,
        "isOpen": True,
        "pcsTotal": total_pcs,
        "pcsFree": free_pcs,
        "zones": zones,
        "tariffs": tariffs
    })


@app.get("/api/public/clubs/<int:club_id>/zone-pcs")
def public_zone_pcs(club_id):
    club = Club.query.get(club_id)
    if not club:
        return jsonify({"message": "Club not found"}), 404

    zone_name = (request.args.get("zone_name") or "").strip()
    if not zone_name:
        return jsonify({"message": "zone_name is required"}), 400

    pcs = _get_club_pcs_for_public_status(club)
    approved_pc_keys = get_approved_booking_pc_keys(club.id)

    zone_name_folded = zone_name.casefold()
    zone_pcs = []
    for pc in pcs:
        pc_zone = str(pc.get("pc_area_name") or pc.get("pc_group_name") or "").strip()
        if pc_zone.casefold() != zone_name_folded:
            continue
        status = detect_pc_status(pc)
        if status == "free" and (pc_zone.casefold(), str(pc.get("pc_name") or "").strip().casefold()) in approved_pc_keys:
            status = "busy"

        zone_pcs.append({
            "id": pc.get("pc_icafe_id") or pc.get("pc_mac") or pc.get("pc_name"),
            "name": pc.get("pc_name", "Unknown"),
            "status": status,
            "member": pc.get("member_account", ""),
            "time_left": pc.get("status_connect_time_left", ""),
            "zone": pc_zone or zone_name,
        })

    zone_pcs.sort(key=lambda x: str(x.get("name") or ""))
    free_count = sum(1 for pc in zone_pcs if pc["status"] == "free")
    return jsonify({
        "club_id": club.id,
        "zone_name": zone_name,
        "pcs": zone_pcs,
        "total": len(zone_pcs),
        "free": free_count,
    })


@app.post("/api/public/clubs/<int:club_id>/bookings")
@jwt_required()
def create_public_booking(club_id):
    club = Club.query.get(club_id)
    if not club:
        return jsonify({"message": "Club not found"}), 404

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role not in ("client", "member"):
        return jsonify({"message": "Only authorized clients can create bookings"}), 403

    data = request.json or {}
    client_name = (data.get("client_name") or "").strip()
    phone = (data.get("phone") or "").strip()
    zone_name = (data.get("zone_name") or "").strip()
    duration = (data.get("duration") or "").strip()
    pc_names = data.get("pc_names") or []
    selected_pcs = data.get("selected_pcs") or []

    if not client_name:
        return jsonify({"message": "Client name is required"}), 400
    if not phone:
        return jsonify({"message": "Phone is required"}), 400
    normalized_entries = []
    if isinstance(selected_pcs, list) and len(selected_pcs) > 0:
        for item in selected_pcs:
            if not isinstance(item, dict):
                continue
            z = str(item.get("zone_name") or "").strip()
            p = str(item.get("pc_name") or "").strip()
            if z and p:
                normalized_entries.append({"zone_name": z, "pc_name": p})
    else:
        if not zone_name:
            return jsonify({"message": "Zone is required"}), 400
        if not isinstance(pc_names, list):
            return jsonify({"message": "pc_names must be an array"}), 400
        for name in pc_names:
            p = str(name).strip()
            if p:
                normalized_entries.append({"zone_name": zone_name, "pc_name": p})

    unique_entries = list({
        (entry["zone_name"], entry["pc_name"]): entry
        for entry in normalized_entries
    }.values())

    if len(unique_entries) < 1:
        return jsonify({"message": "Select at least one PC"}), 400
    if len(unique_entries) > 10:
        return jsonify({"message": "Maximum 10 PCs per booking"}), 400

    active_booking = BookingRequest.query.filter(
        BookingRequest.user_id == user.id,
        BookingRequest.status.in_(["pending", "approved", "new"])
    ).order_by(BookingRequest.created_at.desc()).first()
    if active_booking:
        return jsonify({
            "message": "You already have an active booking. Cancel it before creating a new one.",
            "active_booking": {
                "id": active_booking.id,
                "status": normalize_booking_status(active_booking.status),
                "zone_name": active_booking.zone_name,
            }
        }), 409

    pc_raw = icafe_get_for_club(club, "/pcList", timeout=8)
    all_pcs = parse_icafe_pcs(pc_raw)
    pc_map = {}
    for pc in all_pcs:
        z = str(pc.get("pc_area_name") or pc.get("pc_group_name") or "").strip()
        p = str(pc.get("pc_name") or "").strip()
        if z and p:
            pc_map[(z.casefold(), p.casefold())] = pc

    missing = []
    unavailable = []
    approved_pc_keys = get_approved_booking_pc_keys(club.id)
    for entry in unique_entries:
        z = entry["zone_name"]
        p = entry["pc_name"]
        found = pc_map.get((z.casefold(), p.casefold()))
        if not found:
            missing.append(f"{z}/{p}")
            continue
        if detect_pc_status(found) != "free" or (z.casefold(), p.casefold()) in approved_pc_keys:
            unavailable.append(f"{z}/{p}")

    if missing:
        return jsonify({"message": "Some PCs are invalid for selected zones", "invalid_pcs": missing}), 400

    if unavailable:
        return jsonify({"message": "Some selected PCs are busy or offline", "unavailable_pcs": unavailable}), 409

    selected_zones = sorted(list({entry["zone_name"] for entry in unique_entries}))
    zone_label = selected_zones[0] if len(selected_zones) == 1 else ", ".join(selected_zones[:3]) + ("..." if len(selected_zones) > 3 else "")

    booking = BookingRequest(
        club_id=club.id,
        user_id=user.id,
        client_name=client_name,
        phone=phone,
        zone_name=zone_label,
        duration=duration or None,
        pc_names=json.dumps(unique_entries, ensure_ascii=False),
        status="pending",
    )
    db.session.add(booking)
    db.session.commit()

    return jsonify({
        "message": "Booking created",
        "booking": {
            "id": booking.id,
            "club_id": booking.club_id,
            "user_id": booking.user_id,
            "client_name": booking.client_name,
            "phone": booking.phone,
            "zone_name": booking.zone_name,
            "duration": booking.duration,
            "pc_names": booking_display_pc_names(unique_entries),
            "pc_entries": unique_entries,
            "status": normalize_booking_status(booking.status),
            "cancellation_reason": booking.cancellation_reason,
            "canceled_by": booking.canceled_by,
            "canceled_at": booking.canceled_at.isoformat() + "Z" if booking.canceled_at else None,
            "chat_url": to_manager_chat_link(club),
            "created_at": booking.created_at.isoformat() + "Z" if booking.created_at else None,
        }
    }), 201


@app.get("/api/public/bookings/my")
@jwt_required()
def get_my_public_bookings():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role not in ("client", "member"):
        return jsonify({"message": "Only authorized clients can view bookings"}), 403

    rows = BookingRequest.query.filter_by(user_id=user.id).order_by(BookingRequest.created_at.desc()).limit(300).all()
    payload = []
    for b in rows:
        pc_entries = parse_booking_pc_entries(b.pc_names)
        pc_names = booking_display_pc_names(pc_entries)
        payload.append({
            "id": b.id,
            "club_id": b.club_id,
            "club_name": b.club.name if b.club else "",
            "client_name": b.client_name,
            "phone": b.phone,
            "zone_name": b.zone_name,
            "duration": b.duration,
            "pc_names": pc_names,
            "pc_entries": pc_entries,
            "status": normalize_booking_status(b.status),
            "cancellation_reason": b.cancellation_reason,
            "canceled_by": b.canceled_by,
            "canceled_at": b.canceled_at.isoformat() + "Z" if b.canceled_at else None,
            "club_phone": b.club.phone if b.club else "",
            "chat_url": to_manager_chat_link(b.club),
            "created_at": b.created_at.isoformat() + "Z" if b.created_at else None,
        })

    return jsonify({
        "bookings": payload,
        "summary": {
            "count": len(payload),
            "pending_count": sum(1 for b in payload if b["status"] == "pending"),
        }
    })


@app.get("/api/public/cashback/me")
@jwt_required()
def get_my_public_cashback():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role not in ("client", "member"):
        return jsonify({"message": "Only authorized clients can view cashback"}), 403

    member_id = user.id
    member_account = (user.username or "").strip() or None
    qr_payload = json.dumps({
        "v": 1,
        "member_id": member_id,
        "member_account": member_account,
    }, ensure_ascii=False)

    filters = [CashbackTransaction.member_id == member_id]
    if member_account:
        filters.append(CashbackTransaction.member_account == member_account)

    query = CashbackTransaction.query.filter(or_(*filters))
    rows = query.order_by(CashbackTransaction.created_at.desc()).limit(200).all()
    total_cashback = round(sum(float(r.cashback_amount or 0.0) for r in rows), 2)

    return jsonify({
        "cashback_enabled": True,
        "member_id": member_id,
        "member_account": member_account,
        "qr_payload": qr_payload,
        "total_cashback": total_cashback,
        "transactions": [{
            "id": r.id,
            "club_id": r.club_id,
            "club_name": r.club.name if r.club else "",
            "amount": float(r.amount or 0.0),
            "cashback_percent": float(r.cashback_percent or 0.0),
            "cashback_amount": float(r.cashback_amount or 0.0),
            "note": r.note or "",
            "created_at": r.created_at.isoformat() + "Z" if r.created_at else None,
        } for r in rows]
    })


@app.get("/api/public/profile/me")
@jwt_required()
def public_profile_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role not in ("client", "member"):
        return jsonify({"message": "Only authorized clients can view profile"}), 403

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "avatar_url": user.avatar_url or "",
    })


@app.post("/api/public/profile/avatar")
@jwt_required()
def public_profile_avatar_upload():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role not in ("client", "member"):
        return jsonify({"message": "Only authorized clients can update avatar"}), 403

    if "file" not in request.files:
        return jsonify({"message": "No file uploaded"}), 400
    file = request.files["file"]
    if not file or file.filename == "":
        return jsonify({"message": "No selected file"}), 400
    if not allowed_file(file.filename):
        return jsonify({"message": "File type not allowed"}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"avatar_{user.id}_{int(datetime.utcnow().timestamp())}_{random.randint(1000, 9999)}.{ext}"
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    user.avatar_url = f"/api/uploads/{filename}"
    db.session.commit()

    return jsonify({
        "message": "Avatar updated",
        "avatar_url": user.avatar_url,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "avatar_url": user.avatar_url,
        }
    })


@app.put("/api/public/profile/password")
@jwt_required()
def public_profile_change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role not in ("client", "member"):
        return jsonify({"message": "Only authorized clients can change password"}), 403

    body = request.get_json(force=True) or {}
    current_password = str(body.get("current_password") or "")
    new_password = str(body.get("new_password") or "")

    if not current_password or not new_password:
        return jsonify({"message": "current_password and new_password are required"}), 400
    if len(new_password) < 6:
        return jsonify({"message": "New password must be at least 6 characters"}), 400
    if not user.check_password(current_password):
        return jsonify({"message": "Current password is invalid"}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password changed successfully"})


@app.put("/api/public/bookings/<int:booking_id>/cancel")
@jwt_required()
def cancel_public_booking(booking_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role not in ("client", "member"):
        return jsonify({"message": "Only authorized clients can cancel bookings"}), 403

    booking = BookingRequest.query.get(booking_id)
    if not booking or booking.user_id != user.id:
        return jsonify({"message": "Booking not found"}), 404

    current_status = normalize_booking_status(booking.status)
    if current_status in ("rejected", "cancelled", "completed"):
        return jsonify({"message": "This booking is already closed"}), 409

    body = request.json or {}
    reason = (body.get("reason") or "").strip()
    if not reason:
        return jsonify({"message": "Cancellation reason is required"}), 400

    booking.status = "cancelled"
    booking.cancellation_reason = reason
    booking.canceled_by = "client"
    booking.canceled_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "message": "Booking cancelled",
        "booking": {
            "id": booking.id,
            "status": normalize_booking_status(booking.status),
            "cancellation_reason": booking.cancellation_reason,
            "canceled_by": booking.canceled_by,
            "canceled_at": booking.canceled_at.isoformat() + "Z" if booking.canceled_at else None,
        }
    })


@app.post("/api/bookings")
@jwt_required()
def create_booking_by_manager():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role not in ("manager", "admin"):
        return jsonify({"message": "Access denied"}), 403

    target_club = None
    if user.role == "manager":
        if not user.club_id:
            return jsonify({"message": "Manager is not assigned to a club"}), 400
        target_club = user.club
    else:
        body_for_admin = request.json or {}
        club_id = body_for_admin.get("club_id")
        if club_id is not None:
            try:
                club_id = int(club_id)
            except Exception:
                return jsonify({"message": "club_id must be a number"}), 400
            target_club = Club.query.get(club_id)
        if not target_club:
            target_club = user.club
        if not target_club:
            return jsonify({"message": "Admin must specify club_id or be assigned to a club"}), 400

    data = request.json or {}
    client_name = (data.get("client_name") or "").strip()
    phone = (data.get("phone") or "").strip()
    duration = (data.get("duration") or "").strip() or None
    selected_pcs = data.get("selected_pcs") or []

    if not client_name:
        return jsonify({"message": "client_name is required"}), 400
    if not phone:
        return jsonify({"message": "phone is required"}), 400
    if not isinstance(selected_pcs, list) or len(selected_pcs) == 0:
        return jsonify({"message": "selected_pcs is required"}), 400

    normalized_entries = []
    for item in selected_pcs:
        if not isinstance(item, dict):
            continue
        z = str(item.get("zone_name") or "").strip()
        p = str(item.get("pc_name") or "").strip()
        if z and p:
            normalized_entries.append({"zone_name": z, "pc_name": p})

    unique_entries = list({(entry["zone_name"], entry["pc_name"]): entry for entry in normalized_entries}.values())
    if not unique_entries:
        return jsonify({"message": "No valid PCs selected"}), 400
    if len(unique_entries) > 10:
        return jsonify({"message": "Maximum 10 PCs per booking"}), 400

    if user.role == "manager":
        pc_raw = icafe_get("/pcList")
    else:
        pc_raw = icafe_get_for_club(target_club, "/pcList", timeout=8)

    all_pcs = parse_icafe_pcs(pc_raw)
    pc_map = {}
    for pc in all_pcs:
        z = str(pc.get("pc_area_name") or pc.get("pc_group_name") or "").strip()
        p = str(pc.get("pc_name") or "").strip()
        if z and p:
            pc_map[(z.casefold(), p.casefold())] = pc

    missing = []
    unavailable = []
    approved_pc_keys = get_approved_booking_pc_keys(target_club.id)
    for entry in unique_entries:
        z = entry["zone_name"]
        p = entry["pc_name"]
        found = pc_map.get((z.casefold(), p.casefold()))
        if not found:
            missing.append(entry)
            continue
        if detect_pc_status(found) != "free" or (z.casefold(), p.casefold()) in approved_pc_keys:
            unavailable.append(entry)

    if missing:
        return jsonify({"message": "Some PCs are invalid for selected zones", "invalid_pcs": missing}), 400
    if unavailable:
        return jsonify({"message": "Some selected PCs are busy or offline", "unavailable_pcs": unavailable}), 409

    selected_zones = sorted(list({entry["zone_name"] for entry in unique_entries}))
    zone_label = selected_zones[0] if len(selected_zones) == 1 else ", ".join(selected_zones[:3]) + ("..." if len(selected_zones) > 3 else "")

    booking = BookingRequest(
        club_id=target_club.id,
        user_id=user.id,
        client_name=client_name,
        phone=phone,
        zone_name=zone_label,
        duration=duration,
        pc_names=json.dumps(unique_entries, ensure_ascii=False),
        status="pending",
    )
    db.session.add(booking)
    db.session.commit()

    return jsonify({
        "message": "Booking created",
        "booking": {
            "id": booking.id,
            "club_id": booking.club_id,
            "club_name": booking.club.name if booking.club else "",
            "user_id": booking.user_id,
            "username": booking.user.username if booking.user else "",
            "client_name": booking.client_name,
            "phone": booking.phone,
            "zone_name": booking.zone_name,
            "duration": booking.duration,
            "pc_names": booking_display_pc_names(unique_entries),
            "pc_entries": unique_entries,
            "status": normalize_booking_status(booking.status),
            "cancellation_reason": booking.cancellation_reason,
            "canceled_by": booking.canceled_by,
            "canceled_at": booking.canceled_at.isoformat() + "Z" if booking.canceled_at else None,
            "created_at": booking.created_at.isoformat() + "Z" if booking.created_at else None,
        },
    }), 201


@app.get("/api/bookings")
@jwt_required()
def get_bookings_for_dashboard():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.role == "manager":
        if not user.club_id:
            return jsonify({"bookings": [], "summary": {"count": 0, "pending_count": 0, "cancelled_count": 0}}), 200
        query = BookingRequest.query.filter_by(club_id=user.club_id)
    elif user.role == "admin":
        club_id = request.args.get("club_id", type=int)
        query = BookingRequest.query.filter_by(club_id=club_id) if club_id else BookingRequest.query
    else:
        return jsonify({"message": "Access denied"}), 403

    bookings = query.order_by(BookingRequest.created_at.desc()).limit(300).all()

    payload = []
    for b in bookings:
        pc_entries = parse_booking_pc_entries(b.pc_names)
        pc_names = booking_display_pc_names(pc_entries)
        payload.append({
            "id": b.id,
            "club_id": b.club_id,
            "club_name": b.club.name if b.club else "",
            "user_id": b.user_id,
            "username": b.user.username if b.user else "",
            "client_name": b.client_name,
            "phone": b.phone,
            "zone_name": b.zone_name,
            "duration": b.duration,
            "pc_names": pc_names,
            "pc_entries": pc_entries,
            "status": normalize_booking_status(b.status),
            "cancellation_reason": b.cancellation_reason,
            "canceled_by": b.canceled_by,
            "canceled_at": b.canceled_at.isoformat() + "Z" if b.canceled_at else None,
            "created_at": b.created_at.isoformat() + "Z" if b.created_at else None,
        })

    return jsonify({
        "bookings": payload,
        "summary": {
            "count": len(payload),
            "pending_count": sum(1 for b in payload if b["status"] == "pending"),
            "cancelled_count": sum(1 for b in payload if b["status"] == "cancelled"),
        }
    })


@app.put("/api/bookings/<int:booking_id>/status")
@jwt_required()
def update_booking_status(booking_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role not in ("manager", "admin"):
        return jsonify({"message": "Access denied"}), 403

    booking = BookingRequest.query.get(booking_id)
    if not booking:
        return jsonify({"message": "Booking not found"}), 404

    if user.role == "manager":
        if not user.club_id or booking.club_id != user.club_id:
            return jsonify({"message": "Access denied"}), 403

    body = request.json or {}
    next_status = (body.get("status") or "").strip().lower()
    if next_status not in ("approved", "rejected", "completed"):
        return jsonify({"message": "status must be approved, rejected or completed"}), 400

    current_status = normalize_booking_status(booking.status)
    if current_status in ("cancelled", "rejected", "completed"):
        return jsonify({"message": "Cannot change status of closed booking"}), 409

    if next_status == "completed" and current_status != "approved":
        return jsonify({"message": "Only approved booking can be completed"}), 409

    maintenance = {"requested": False, "success": None}
    if next_status == "approved" and current_status != "approved":
        maintenance = set_booking_pcs_out_of_order(booking.club, parse_booking_pc_entries(booking.pc_names))

    booking.status = next_status
    db.session.commit()

    pc_entries = parse_booking_pc_entries(booking.pc_names)
    pc_names = booking_display_pc_names(pc_entries)

    return jsonify({
        "message": "Booking status updated",
        "maintenance": maintenance,
        "booking": {
            "id": booking.id,
            "club_id": booking.club_id,
            "club_name": booking.club.name if booking.club else "",
            "client_name": booking.client_name,
            "phone": booking.phone,
            "zone_name": booking.zone_name,
            "duration": booking.duration,
            "pc_names": pc_names,
            "pc_entries": pc_entries,
            "status": normalize_booking_status(booking.status),
            "cancellation_reason": booking.cancellation_reason,
            "canceled_by": booking.canceled_by,
            "canceled_at": booking.canceled_at.isoformat() + "Z" if booking.canceled_at else None,
            "created_at": booking.created_at.isoformat() + "Z" if booking.created_at else None,
        }
    })


@app.put("/api/bookings/<int:booking_id>/cancel")
@jwt_required()
def cancel_booking_by_manager(booking_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if user.role not in ("manager", "admin"):
        return jsonify({"message": "Access denied"}), 403

    booking = BookingRequest.query.get(booking_id)
    if not booking:
        return jsonify({"message": "Booking not found"}), 404

    if user.role == "manager":
        if not user.club_id or booking.club_id != user.club_id:
            return jsonify({"message": "Access denied"}), 403

    current_status = normalize_booking_status(booking.status)
    if current_status in ("rejected", "cancelled", "completed"):
        return jsonify({"message": "This booking is already closed"}), 409

    body = request.json or {}
    reason = (body.get("reason") or "").strip()
    if not reason:
        return jsonify({"message": "Cancellation reason is required"}), 400

    booking.status = "cancelled"
    booking.cancellation_reason = reason
    booking.canceled_by = "admin" if user.role == "admin" else "manager"
    booking.canceled_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "message": "Booking cancelled",
        "booking": {
            "id": booking.id,
            "status": normalize_booking_status(booking.status),
            "cancellation_reason": booking.cancellation_reason,
            "canceled_by": booking.canceled_by,
            "canceled_at": booking.canceled_at.isoformat() + "Z" if booking.canceled_at else None,
            "pc_names": booking_display_pc_names(parse_booking_pc_entries(booking.pc_names)),
        }
    })


@app.get("/api/public/clubs/<int:club_id>/reviews")
def public_club_reviews(club_id):
    club = Club.query.get(club_id)
    if not club:
        return jsonify({"message": "Club not found"}), 404

    reviews = ClubReview.query.filter_by(club_id=club_id).order_by(ClubReview.created_at.desc()).limit(100).all()
    avg_rating, rating_count = get_club_rating_stats(club_id)

    return jsonify({
        "club_id": club_id,
        "average_rating": round(avg_rating, 1),
        "rating_count": rating_count,
        "reviews": [{
            "id": r.id,
            "user_id": r.user_id,
            "username": r.user.username if r.user else "unknown",
            "rating": r.rating,
            "text": r.text,
            "created_at": r.created_at.isoformat() + "Z" if r.created_at else None,
        } for r in reviews]
    })


@app.post("/api/public/clubs/<int:club_id>/reviews")
@jwt_required()
def create_public_club_review(club_id):
    club = Club.query.get(club_id)
    if not club:
        return jsonify({"message": "Club not found"}), 404

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.role not in ("client", "member"):
        return jsonify({"message": "Only authorized clients can post reviews"}), 403

    data = request.json or {}
    text = (data.get("text") or "").strip()
    try:
        rating = int(data.get("rating", 0))
    except Exception:
        return jsonify({"message": "Rating must be an integer from 0 to 5"}), 400

    if rating < 0 or rating > 5:
        return jsonify({"message": "Rating must be between 0 and 5"}), 400
    if len(text) < 3:
        return jsonify({"message": "Review text is too short"}), 400
    if len(text) > 1000:
        return jsonify({"message": "Review text is too long"}), 400

    review = ClubReview(
        club_id=club_id,
        user_id=user.id,
        rating=rating,
        text=text
    )
    db.session.add(review)
    db.session.commit()

    avg_rating, rating_count = get_club_rating_stats(club_id)
    return jsonify({
        "message": "Review submitted",
        "review": {
            "id": review.id,
            "club_id": review.club_id,
            "user_id": review.user_id,
            "username": user.username,
            "rating": review.rating,
            "text": review.text,
            "created_at": review.created_at.isoformat() + "Z" if review.created_at else None,
        },
        "average_rating": round(avg_rating, 1),
        "rating_count": rating_count,
    }), 201

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


@app.post("/api/upload-club-photo")
@jwt_required()
def upload_club_photo():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    if file and allowed_file(file.filename):
        filename = "club_photo_" + secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        return jsonify({"url": f"/api/uploads/{filename}"})
    return jsonify({"error": "File type not allowed"}), 400


@app.get("/api/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# Overview / Stats

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
    new_members_week = 0
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
    
    # New members for the last 7 days (by member creation date)
    week_start_dt = datetime.utcnow() - timedelta(days=7)
    page = 1
    max_scan_pages = 20
    while page <= max_scan_pages:
        members_page = icafe_get("/members", {
            "page": page,
            "sort_field": "member_create",
            "sort_dir": "desc",
        })
        if not members_page or members_page.get("code") != 200:
            break

        data = members_page.get("data", {})
        rows = data.get("members", []) or []
        if not rows:
            break

        reached_older_rows = False
        for m in rows:
            created_raw = m.get("member_create_local", m.get("member_create", ""))
            created_dt = parse_icafe_datetime(created_raw)
            if not created_dt:
                continue
            if created_dt >= week_start_dt:
                new_members_week += 1
            else:
                reached_older_rows = True

        paging = data.get("paging_info", {}) or {}
        total_pages = int(paging.get("total_pages", 0) or 0)
        if reached_older_rows or (total_pages and page >= total_pages):
            break
        page += 1

    print(f"DEBUG: Active={active_pcs}, Total={total_pcs}, Today={today_revenue}")
    return jsonify({
        "today_revenue": today_revenue,
        "week_revenue": week_revenue,
        "total_members": total_members,
        "new_members_week": new_members_week,
        "active_pcs": active_pcs,
        "total_pcs": total_pcs,
        "pc_load_percent": round(active_pcs / total_pcs * 100) if total_pcs else 0,
        "payment_methods": payment_methods,
        # Check if we actually got ANY data back from iCafeCloud recently
        "api_connected": any([chart_data, pc_data, member_data]),
    })


# Daily income chart (last 7 days)

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


# 30-day income chart (cash vs balance)

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


# Payment methods breakdown (last 7 days)

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


# Monthly aggregated income (last 7 months)

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


# PCs monitoring

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


# Members

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


# Billing logs

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


def resolve_cashback_club_for_user(user: User, requested_club_id: int | None) -> Club | None:
    if not user:
        return None
    if user.role == "manager":
        if not user.club_id:
            return None
        return Club.query.get(user.club_id)
    if user.role == "admin":
        if requested_club_id:
            return Club.query.get(requested_club_id)
        return None
    return None


@app.get("/api/cashback/config")
@jwt_required()
def get_cashback_config():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    requested_club_id = request.args.get("club_id", type=int)
    club = resolve_cashback_club_for_user(user, requested_club_id)
    if not club:
        return jsonify({"message": "Club not found or access denied"}), 404

    return jsonify({
        "club_id": club.id,
        "cashback_enabled": bool(club.cashback_enabled),
        "cashback_percent": float(club.cashback_percent or 0.0),
    })


@app.post("/api/cashback/config")
@jwt_required()
def set_cashback_config():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    body = request.get_json(force=True) or {}
    requested_club_id = body.get("club_id")
    try:
        requested_club_id = int(requested_club_id) if requested_club_id is not None else None
    except Exception:
        requested_club_id = None

    club = resolve_cashback_club_for_user(user, requested_club_id)
    if not club:
        return jsonify({"message": "Club not found or access denied"}), 404

    if "cashback_enabled" in body:
        club.cashback_enabled = bool(body.get("cashback_enabled"))
    if "cashback_percent" in body:
        try:
            percent = float(body.get("cashback_percent"))
        except Exception:
            return jsonify({"message": "Invalid cashback_percent"}), 400
        if percent < 0 or percent > 100:
            return jsonify({"message": "cashback_percent must be between 0 and 100"}), 400
        club.cashback_percent = percent

    db.session.commit()
    return jsonify({
        "ok": True,
        "club_id": club.id,
        "cashback_enabled": bool(club.cashback_enabled),
        "cashback_percent": float(club.cashback_percent or 0.0),
    })


@app.get("/api/cashback/transactions")
@jwt_required()
def cashback_transactions():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    requested_club_id = request.args.get("club_id", type=int)
    club = resolve_cashback_club_for_user(user, requested_club_id)
    if not club:
        return jsonify({"transactions": []})

    limit = request.args.get("limit", 50, type=int)
    limit = max(1, min(limit, 500))
    rows = CashbackTransaction.query.filter_by(club_id=club.id).order_by(CashbackTransaction.created_at.desc()).limit(limit).all()
    return jsonify({
        "transactions": [{
            "id": row.id,
            "club_id": row.club_id,
            "manager_user_id": row.manager_user_id,
            "member_id": row.member_id,
            "member_account": row.member_account,
            "amount": float(row.amount or 0.0),
            "cashback_percent": float(row.cashback_percent or 0.0),
            "cashback_amount": float(row.cashback_amount or 0.0),
            "note": row.note or "",
            "created_at": row.created_at.isoformat() + "Z" if row.created_at else None,
        } for row in rows]
    })


@app.post("/api/cashback/accrue")
@jwt_required()
def cashback_accrue():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    body = request.get_json(force=True) or {}

    requested_club_id = body.get("club_id")
    try:
        requested_club_id = int(requested_club_id) if requested_club_id is not None else None
    except Exception:
        requested_club_id = None

    club = resolve_cashback_club_for_user(user, requested_club_id)
    if not club:
        return jsonify({"message": "Club not found or access denied"}), 404
    if not club.cashback_enabled:
        return jsonify({"message": "Cashback is disabled"}), 409

    qr_payload = (body.get("qr_payload") or "").strip()
    parsed = parse_cashback_qr_payload(qr_payload)

    member_id = body.get("member_id", parsed.get("member_id"))
    member_account = body.get("member_account", parsed.get("member_account"))
    try:
        member_id = int(member_id) if member_id not in (None, "") else None
    except Exception:
        return jsonify({"message": "Invalid member_id"}), 400
    member_account = str(member_account or "").strip()[:120] or None

    if member_id is None and not member_account:
        return jsonify({"message": "QR payload must contain member_id or member_account"}), 400

    try:
        amount = float(body.get("amount", 0))
    except Exception:
        return jsonify({"message": "Invalid amount"}), 400
    if amount <= 0:
        return jsonify({"message": "Amount must be greater than 0"}), 400

    percent = float(club.cashback_percent or 0.0)
    cashback_amount = round(amount * percent / 100.0, 2)
    note = str(body.get("note") or "").strip()[:255] or None

    tx = CashbackTransaction(
        club_id=club.id,
        manager_user_id=user.id,
        member_id=member_id,
        member_account=member_account,
        amount=amount,
        cashback_percent=percent,
        cashback_amount=cashback_amount,
        qr_payload=qr_payload or None,
        note=note,
    )
    db.session.add(tx)
    db.session.commit()

    return jsonify({
        "message": "Cashback accrued",
        "transaction": {
            "id": tx.id,
            "club_id": tx.club_id,
            "manager_user_id": tx.manager_user_id,
            "member_id": tx.member_id,
            "member_account": tx.member_account,
            "amount": float(tx.amount or 0.0),
            "cashback_percent": float(tx.cashback_percent or 0.0),
            "cashback_amount": float(tx.cashback_amount or 0.0),
            "note": tx.note or "",
            "created_at": tx.created_at.isoformat() + "Z" if tx.created_at else None,
        },
    }), 201


# Health check

@app.get("/api/health")
def health():
    cfg = load_config()
    return jsonify({
        "status": "ok",
        "configured": bool(cfg.get("api_key") and cfg.get("cafe_id")),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })


# Serve Frontend (Non-Docker mode)

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    print("INFO: iCafe Dashboard running at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
