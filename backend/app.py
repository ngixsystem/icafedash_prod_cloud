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
from sqlalchemy.exc import IntegrityError

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

# FACEIT OAuth (Authorization Code + PKCE)
FACEIT_CLIENT_ID = os.environ.get("FACEIT_CLIENT_ID", "0da47f41-e39b-4719-bebc-1d35f8065a26")
FACEIT_CLIENT_SECRET = os.environ.get("FACEIT_CLIENT_SECRET", "TZmgOodyh0qG2y48aRXSADP7qVMeySQdS0MoI9PM")
FACEIT_DATA_API_KEY = os.environ.get("FACEIT_DATA_API_KEY", "")

db = SQLAlchemy(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

def _fetch_faceit_game_stats(faceit_id: str, access_token: str, nickname: str = "") -> tuple:
    """Return (faceit_elo, faceit_level) for CS2 or CSGO. Tries multiple endpoints."""

    def _parse_games(games: dict):
        game = games.get("cs2") or games.get("csgo") or {}
        return game.get("faceit_elo"), game.get("skill_level")

    # 1. FACEIT Data API v4 by player_id — best source, requires Data API key
    if FACEIT_DATA_API_KEY:
        try:
            resp = requests.get(
                f"https://open.faceit.com/data/v4/players/{faceit_id}",
                headers={"Authorization": f"Bearer {FACEIT_DATA_API_KEY}", "User-Agent": "Mozilla/5.0"},
                timeout=8,
            )
            app.logger.info(f"FACEIT Data API v4 by id status={resp.status_code} body={resp.text[:300]}")
            if resp.ok:
                elo, lvl = _parse_games(resp.json().get("games", {}))
                if elo or lvl:
                    return elo, lvl
        except Exception as e:
            app.logger.warning(f"FACEIT Data API v4 by id failed: {e}")

    # 2. FACEIT Data API v4 by nickname — fallback if player_id lookup returns no games
    if FACEIT_DATA_API_KEY and nickname:
        try:
            resp = requests.get(
                f"https://open.faceit.com/data/v4/players?nickname={nickname}",
                headers={"Authorization": f"Bearer {FACEIT_DATA_API_KEY}", "User-Agent": "Mozilla/5.0"},
                timeout=8,
            )
            app.logger.info(f"FACEIT Data API v4 by nickname status={resp.status_code} body={resp.text[:300]}")
            if resp.ok:
                elo, lvl = _parse_games(resp.json().get("games", {}))
                if elo or lvl:
                    return elo, lvl
        except Exception as e:
            app.logger.warning(f"FACEIT Data API v4 by nickname failed: {e}")

    # 3. FACEIT core API by nickname (no special key needed, uses OAuth token)
    if nickname:
        try:
            resp2 = requests.get(
                f"https://api.faceit.com/core/v1/users?nickname={nickname}",
                headers={"Authorization": f"Bearer {access_token}", "User-Agent": "Mozilla/5.0"},
                timeout=8,
            )
            app.logger.info(f"FACEIT core/v1 nickname status={resp2.status_code} body={resp2.text[:400]}")
            if resp2.ok:
                payload = resp2.json().get("payload", {})
                elo, lvl = _parse_games(payload.get("games", {}))
                if elo or lvl:
                    return elo, lvl
        except Exception as e:
            app.logger.warning(f"FACEIT core/v1 failed: {e}")

    # 4. FACEIT core API by player_id
    try:
        resp3 = requests.get(
            f"https://api.faceit.com/core/v1/users/{faceit_id}",
            headers={"Authorization": f"Bearer {access_token}", "User-Agent": "Mozilla/5.0"},
            timeout=8,
        )
        app.logger.info(f"FACEIT core/v1 id status={resp3.status_code} body={resp3.text[:400]}")
        if resp3.ok:
            payload = resp3.json().get("payload", {})
            elo, lvl = _parse_games(payload.get("games", {}))
            if elo or lvl:
                return elo, lvl
    except Exception as e:
        app.logger.warning(f"FACEIT core/v1 id failed: {e}")

    return None, None


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
    faceit_id = db.Column(db.String(100), unique=True, nullable=True)
    faceit_elo = db.Column(db.Integer, nullable=True)
    faceit_level = db.Column(db.Integer, nullable=True)
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
    booking_start_at = db.Column(db.DateTime, nullable=True)
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


class Team(db.Model):
    __tablename__ = "teams"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True, index=True)
    tag = db.Column(db.String(12), nullable=True)
    logo_url = db.Column(db.String(500), nullable=True)
    captain_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    captain = db.relationship("User", foreign_keys=[captain_user_id], backref=db.backref("captain_teams", lazy=True))
    created_by = db.relationship("User", foreign_keys=[created_by_user_id], backref=db.backref("created_teams", lazy=True))


class TeamMember(db.Model):
    __tablename__ = "team_members"
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    role_in_team = db.Column(db.String(20), nullable=False, default="player")  # captain/player
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    team = db.relationship("Team", backref=db.backref("members", lazy=True, cascade="all, delete-orphan"))
    user = db.relationship("User", backref=db.backref("team_memberships", lazy=True))
    __table_args__ = (db.UniqueConstraint("team_id", "user_id", name="uq_team_member"),)


class Tournament(db.Model):
    __tablename__ = "tournaments"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(180), nullable=False, index=True)
    game = db.Column(db.String(60), nullable=False, default="CS2")
    description = db.Column(db.Text, nullable=True)
    team_format = db.Column(db.String(80), nullable=True, default="")
    location = db.Column(db.String(160), nullable=True)
    starts_at = db.Column(db.DateTime, nullable=True, index=True)
    check_in_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="draft")  # draft/open/live/finished/cancelled
    format = db.Column(db.String(60), nullable=False, default="single_elimination")
    max_teams = db.Column(db.Integer, nullable=False, default=16)
    prize_pool = db.Column(db.String(80), nullable=True)
    entry_fee = db.Column(db.String(80), nullable=True, default="")
    stream_url = db.Column(db.String(500), nullable=True)
    faceit_championship_id = db.Column(db.String(100), nullable=True)
    region = db.Column(db.String(100), nullable=True)
    logo_url = db.Column(db.String(500), nullable=True)
    banner_url = db.Column(db.String(500), nullable=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_by = db.relationship("User", backref=db.backref("created_tournaments", lazy=True))


class TournamentRegistration(db.Model):
    __tablename__ = "tournament_registrations"
    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey("tournaments.id"), nullable=False, index=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default="pending")  # pending/approved/rejected/cancelled
    registered_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    tournament = db.relationship("Tournament", backref=db.backref("registrations", lazy=True, cascade="all, delete-orphan"))
    team = db.relationship("Team", backref=db.backref("tournament_registrations", lazy=True))
    registered_by = db.relationship("User", backref=db.backref("tournament_registrations", lazy=True))
    __table_args__ = (db.UniqueConstraint("tournament_id", "team_id", name="uq_tournament_team_registration"),)


class TournamentMatch(db.Model):
    __tablename__ = "tournament_matches"
    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey("tournaments.id"), nullable=False, index=True)
    round_number = db.Column(db.Integer, nullable=False, default=1, index=True)
    match_order = db.Column(db.Integer, nullable=False, default=1)
    team1_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=True, index=True)
    team2_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=True, index=True)
    winner_team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=True, index=True)
    status = db.Column(db.String(20), nullable=False, default="scheduled")  # scheduled/live/finished
    score = db.Column(db.String(32), nullable=True)
    scheduled_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    tournament = db.relationship("Tournament", backref=db.backref("matches", lazy=True, cascade="all, delete-orphan"))
    team1 = db.relationship("Team", foreign_keys=[team1_id], backref=db.backref("matches_as_team1", lazy=True))
    team2 = db.relationship("Team", foreign_keys=[team2_id], backref=db.backref("matches_as_team2", lazy=True))
    winner_team = db.relationship("Team", foreign_keys=[winner_team_id], backref=db.backref("matches_won", lazy=True))


class TransferListing(db.Model):
    __tablename__ = "transfer_listings"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    # "lft" = looking for team (игрок ищет команду)
    # "lfs" = looking for squad/player (команда ищет игрока)
    listing_type = db.Column(db.String(20), nullable=False, default="lft")
    game = db.Column(db.String(60), nullable=False, default="CS2")
    roles = db.Column(db.String(255), nullable=True)        # "Rifler, AWPer, IGL"
    description = db.Column(db.Text, nullable=True)
    region = db.Column(db.String(80), nullable=True)
    min_elo = db.Column(db.Integer, nullable=True)
    max_elo = db.Column(db.Integer, nullable=True)
    contact = db.Column(db.String(255), nullable=True)      # telegram / discord
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    expires_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", backref=db.backref("transfer_listings", lazy=True))


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
        if 'faceit_id' not in existing_columns:
            _safe_migration(conn, "ALTER TABLE users ADD COLUMN faceit_id VARCHAR(100) NULL", "Added faceit_id column to users table")
        if 'faceit_elo' not in existing_columns:
            _safe_migration(conn, "ALTER TABLE users ADD COLUMN faceit_elo INT NULL", "Added faceit_elo column to users table")
        if 'faceit_level' not in existing_columns:
            _safe_migration(conn, "ALTER TABLE users ADD COLUMN faceit_level INT NULL", "Added faceit_level column to users table")
            
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
            if 'booking_start_at' not in existing_booking_columns:
                _safe_migration(conn, "ALTER TABLE booking_requests ADD COLUMN booking_start_at DATETIME")

    # Migration for tournaments
    if 'tournaments' in existing_tables:
        existing_tournament_columns = [col['name'] for col in inspector.get_columns('tournaments')]
        with db.engine.connect() as conn:
            if 'team_format' not in existing_tournament_columns:
                _safe_migration(conn, "ALTER TABLE tournaments ADD COLUMN team_format VARCHAR(80) DEFAULT ''")
            if 'entry_fee' not in existing_tournament_columns:
                _safe_migration(conn, "ALTER TABLE tournaments ADD COLUMN entry_fee VARCHAR(80) DEFAULT ''")
            if 'stream_url' not in existing_tournament_columns:
                _safe_migration(conn, "ALTER TABLE tournaments ADD COLUMN stream_url VARCHAR(500) NULL", "Added stream_url column to tournaments table")
            if 'faceit_championship_id' not in existing_tournament_columns:
                _safe_migration(conn, "ALTER TABLE tournaments ADD COLUMN faceit_championship_id VARCHAR(100) NULL", "Added faceit_championship_id column to tournaments table")
            if 'region' not in existing_tournament_columns:
                _safe_migration(conn, "ALTER TABLE tournaments ADD COLUMN region VARCHAR(100) NULL", "Added region column to tournaments table")
            if 'logo_url' not in existing_tournament_columns:
                _safe_migration(conn, "ALTER TABLE tournaments ADD COLUMN logo_url VARCHAR(500) NULL", "Added logo_url column to tournaments table")
            if 'banner_url' not in existing_tournament_columns:
                _safe_migration(conn, "ALTER TABLE tournaments ADD COLUMN banner_url VARCHAR(500) NULL", "Added banner_url column to tournaments table")

    # Migration for teams
    if 'teams' in existing_tables:
        existing_team_columns = [col['name'] for col in inspector.get_columns('teams')]
        with db.engine.connect() as conn:
            if 'logo_url' not in existing_team_columns:
                _safe_migration(conn, "ALTER TABLE teams ADD COLUMN logo_url VARCHAR(500) NULL", "Added logo_url column to teams table")

    # Migration for transfer_listings (create table if missing)
    if 'transfer_listings' not in existing_tables:
        with db.engine.connect() as conn:
            _safe_migration(conn, """
                CREATE TABLE transfer_listings (
                    id INTEGER NOT NULL AUTO_INCREMENT,
                    user_id INTEGER NOT NULL,
                    listing_type VARCHAR(20) NOT NULL DEFAULT 'lft',
                    game VARCHAR(60) NOT NULL DEFAULT 'CS2',
                    roles VARCHAR(255),
                    description TEXT,
                    region VARCHAR(80),
                    min_elo INTEGER,
                    max_elo INTEGER,
                    contact VARCHAR(255),
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME,
                    PRIMARY KEY (id),
                    INDEX ix_transfer_listings_user_id (user_id),
                    INDEX ix_transfer_listings_is_active (is_active),
                    INDEX ix_transfer_listings_created_at (created_at),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """, "Created transfer_listings table")

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


def parse_client_booking_datetime(value: str | None):
    raw = str(value or "").strip()
    if not raw:
        return None
    normalized = raw.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(normalized)
        if dt.tzinfo is not None:
            dt = dt.astimezone().replace(tzinfo=None)
        return dt
    except Exception:
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
    
    # Allow player-facing roles to use client auth
    user = User.query.filter(User.username == username, User.role.in_(["client", "member", "captain"])).first()
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
                "avatar_url": user.avatar_url or "",
                "faceit_id": user.faceit_id,
                "faceit_elo": user.faceit_elo,
                "faceit_level": user.faceit_level,
            }
        })
    return jsonify({"message": "Неверный логин или пароль"}), 401


@app.post("/api/auth/faceit/callback")
def faceit_oauth_callback():
    data = request.json or {}
    code = data.get("code")
    redirect_uri = data.get("redirect_uri", "https://cloud.icafedash.com/auth/faceit/callback")
    if not code:
        return jsonify({"message": "Missing authorization code"}), 400

    code_verifier = data.get("code_verifier")

    # Exchange code for access token (PKCE flow)
    import base64
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": FACEIT_CLIENT_ID,
    }
    if code_verifier:
        token_data["code_verifier"] = code_verifier

    credentials = base64.b64encode(f"{FACEIT_CLIENT_ID}:{FACEIT_CLIENT_SECRET}".encode()).decode()
    try:
        token_resp = requests.post(
            "https://api.faceit.com/auth/v1/oauth/token",
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data=token_data,
            timeout=10,
        )
    except Exception as e:
        return jsonify({"message": f"Ошибка соединения с FACEIT: {e}"}), 502

    if not token_resp.ok:
        err = token_resp.text[:200]
        return jsonify({"message": f"Ошибка обмена кода FACEIT: {err}"}), 400

    access_token = token_resp.json().get("access_token")
    if not access_token:
        return jsonify({"message": "Не удалось получить токен FACEIT"}), 400

    # Get user profile from FACEIT
    try:
        userinfo_resp = requests.get(
            "https://api.faceit.com/auth/v1/resources/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
    except Exception as e:
        return jsonify({"message": f"Ошибка получения профиля FACEIT: {e}"}), 502

    if not userinfo_resp.ok:
        return jsonify({"message": "Не удалось получить профиль FACEIT"}), 400

    faceit_user = userinfo_resp.json()
    faceit_id = faceit_user.get("sub") or faceit_user.get("guid")
    nickname = (faceit_user.get("nickname") or faceit_user.get("preferred_username") or "").strip()
    email = (faceit_user.get("email") or "").strip().lower() or None
    avatar = faceit_user.get("picture") or faceit_user.get("avatar") or ""

    if not faceit_id:
        return jsonify({"message": "Не удалось получить FACEIT ID"}), 400

    # Find or create local user (match by faceit_id, then email, then username)
    user = User.query.filter_by(faceit_id=faceit_id).first()
    if not user and email:
        user = User.query.filter_by(email=email).first()
    if not user and nickname:
        user = User.query.filter_by(username=nickname).first()
    if not user:
        # Generate unique username based on FACEIT nickname
        base_username = nickname or f"faceit_{faceit_id[:8]}"
        username = base_username
        counter = 1
        while User.query.filter_by(username=username).first():
            username = f"{base_username}_{counter}"
            counter += 1

        user = User(
            username=username,
            email=email,
            role="member",
            is_verified=True,
            faceit_id=faceit_id,
            avatar_url=avatar,
        )
        # Set a random unusable password (FACEIT users don't log in with password)
        user.password_hash = bcrypt.generate_password_hash(os.urandom(32).hex()).decode("utf-8")
        db.session.add(user)
        db.session.commit()
    else:
        # Link FACEIT and update fields on existing user
        changed = False
        if user.faceit_id != faceit_id:
            user.faceit_id = faceit_id
            changed = True
        if avatar and user.avatar_url != avatar:
            user.avatar_url = avatar
            changed = True
        if changed:
            db.session.commit()

    jwt_token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token": jwt_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email or "",
            "role": user.role,
            "avatar_url": user.avatar_url or "",
        },
    })


@app.post("/api/auth/faceit/oauth-callback-json")
def faceit_oauth_callback_json():
    """JSON endpoint for popup flow — receives code from frontend, returns JWT."""
    data = request.json or {}
    code = data.get("code")
    redirect_uri = data.get("redirect_uri", "https://cloud.icafedash.com/api/auth/faceit/oauth-callback")
    code_verifier = data.get("code_verifier")
    if not code:
        return jsonify({"message": "Missing code"}), 400

    import base64 as _b64, json as _json
    credentials = _b64.b64encode(f"{FACEIT_CLIENT_ID}:{FACEIT_CLIENT_SECRET}".encode()).decode()
    token_data = {"grant_type": "authorization_code", "code": code, "redirect_uri": redirect_uri, "client_id": FACEIT_CLIENT_ID}
    if code_verifier:
        token_data["code_verifier"] = code_verifier

    try:
        token_resp = requests.post(
            "https://api.faceit.com/auth/v1/oauth/token",
            headers={"Authorization": f"Basic {credentials}", "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0"},
            data=token_data, timeout=10,
        )
        app.logger.error(f"FACEIT token json resp {token_resp.status_code}: {token_resp.text[:300]}")
    except Exception as e:
        return jsonify({"message": f"Connection error: {e}"}), 502

    if not token_resp.ok:
        return jsonify({"message": f"Token exchange failed: {token_resp.text[:200]}"}), 400

    faceit_access_token = token_resp.json().get("access_token")
    if not faceit_access_token:
        return jsonify({"message": "No access token in response"}), 400

    try:
        userinfo_resp = requests.get(
            "https://api.faceit.com/auth/v1/resources/userinfo",
            headers={"Authorization": f"Bearer {faceit_access_token}"}, timeout=10,
        )
    except Exception as e:
        return jsonify({"message": f"Userinfo error: {e}"}), 502

    if not userinfo_resp.ok:
        return jsonify({"message": "Failed to get FACEIT profile"}), 400

    faceit_user = userinfo_resp.json()
    faceit_id = faceit_user.get("sub") or faceit_user.get("guid")
    nickname = (faceit_user.get("nickname") or faceit_user.get("preferred_username") or "").strip()
    email = (faceit_user.get("email") or "").strip().lower() or None
    avatar = faceit_user.get("picture") or faceit_user.get("avatar") or ""

    if not faceit_id:
        return jsonify({"message": "No FACEIT ID"}), 400

    # Fetch CS2/CSGO ELO and skill level from FACEIT Data API
    faceit_elo, faceit_level = _fetch_faceit_game_stats(faceit_id, faceit_access_token, nickname)

    # Find existing user by faceit_id, then email, then username
    user = User.query.filter_by(faceit_id=faceit_id).first()
    if not user and email:
        user = User.query.filter_by(email=email).first()
    if not user and nickname:
        user = User.query.filter_by(username=nickname).first()
    if not user:
        base_username = nickname or f"faceit_{faceit_id[:8]}"
        username = base_username
        counter = 1
        while User.query.filter_by(username=username).first():
            username = f"{base_username}_{counter}"
            counter += 1
        user = User(username=username, email=email, role="member", is_verified=True,
                    faceit_id=faceit_id, avatar_url=avatar,
                    faceit_elo=faceit_elo, faceit_level=faceit_level)
        user.password_hash = bcrypt.generate_password_hash(os.urandom(32).hex()).decode("utf-8")
        db.session.add(user)
        db.session.commit()
    else:
        changed = False
        if user.faceit_id != faceit_id:
            user.faceit_id = faceit_id
            changed = True
        if avatar and user.avatar_url != avatar:
            user.avatar_url = avatar
            changed = True
        if faceit_elo is not None and user.faceit_elo != faceit_elo:
            user.faceit_elo = faceit_elo
            changed = True
        if faceit_level is not None and user.faceit_level != faceit_level:
            user.faceit_level = faceit_level
            changed = True
        if changed:
            db.session.commit()

    jwt_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": jwt_token, "user": {
        "id": user.id, "username": user.username, "email": user.email or "",
        "role": user.role, "avatar_url": user.avatar_url or "",
        "faceit_elo": user.faceit_elo, "faceit_level": user.faceit_level,
    }})


@app.route("/api/auth/faceit/oauth-callback", methods=["GET", "POST"])
def faceit_oauth_redirect_callback():
    """Server-side FACEIT OAuth2 callback — handles both GET and POST redirects from FACEIT."""
    import base64 as _b64, json as _json
    from flask import redirect as _redirect

    FRONTEND = "https://cloud.icafedash.com"
    REDIRECT_URI = f"{FRONTEND}/api/auth/faceit/oauth-callback"

    code  = request.args.get("code")  or request.form.get("code")
    state = request.args.get("state") or request.form.get("state")
    error = request.args.get("error") or request.form.get("error")

    if error or not code:
        return _redirect(f"{FRONTEND}/auth?faceit_error={error or 'missing_code'}")

    # Decode code_verifier and optional link_token from state
    code_verifier = None
    link_token = None
    if state:
        try:
            padding = (4 - len(state) % 4) % 4
            state_data = _json.loads(_b64.urlsafe_b64decode(state + "=" * padding).decode())
            code_verifier = state_data.get("v")
            link_token = state_data.get("link_token")
        except Exception:
            pass

    # Exchange code for FACEIT access token
    credentials = _b64.b64encode(f"{FACEIT_CLIENT_ID}:{FACEIT_CLIENT_SECRET}".encode()).decode()
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": FACEIT_CLIENT_ID,
    }
    if code_verifier:
        token_data["code_verifier"] = code_verifier

    try:
        token_resp = requests.post(
            "https://api.faceit.com/auth/v1/oauth/token",
            headers={"Authorization": f"Basic {credentials}", "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0"},
            data=token_data, timeout=10,
        )
        app.logger.error(f"FACEIT token resp {token_resp.status_code}: {token_resp.text[:500]}")
    except Exception as e:
        return _redirect(f"{FRONTEND}/auth?faceit_error=connection_error")

    if not token_resp.ok:
        import urllib.parse
        err_msg = urllib.parse.quote(token_resp.text[:200])
        return _redirect(f"{FRONTEND}/auth/faceit/callback?faceit_error={err_msg}")

    faceit_access_token = token_resp.json().get("access_token")
    if not faceit_access_token:
        return _redirect(f"{FRONTEND}/auth?faceit_error=no_token")

    # Get user profile
    try:
        userinfo_resp = requests.get(
            "https://api.faceit.com/auth/v1/resources/userinfo",
            headers={"Authorization": f"Bearer {faceit_access_token}"}, timeout=10,
        )
    except Exception:
        return _redirect(f"{FRONTEND}/auth?faceit_error=userinfo_failed")

    if not userinfo_resp.ok:
        return _redirect(f"{FRONTEND}/auth?faceit_error=userinfo_failed")

    faceit_user = userinfo_resp.json()
    faceit_id = faceit_user.get("sub") or faceit_user.get("guid")
    nickname = (faceit_user.get("nickname") or faceit_user.get("preferred_username") or "").strip()
    email = (faceit_user.get("email") or "").strip().lower() or None
    avatar = faceit_user.get("picture") or faceit_user.get("avatar") or ""

    if not faceit_id:
        return _redirect(f"{FRONTEND}/auth?faceit_error=no_faceit_id")

    # Fetch CS2/CSGO ELO and skill level (used by both link and login flows)
    faceit_elo, faceit_level = _fetch_faceit_game_stats(faceit_id, faceit_access_token, nickname)

    # If link_token is present — link FACEIT to existing user instead of login
    if link_token:
        import urllib.parse as _urlparse
        try:
            from flask_jwt_extended import decode_token as _decode_token
            decoded_jwt = _decode_token(link_token)
            link_user_id = int(decoded_jwt["sub"])
            link_user = User.query.get(link_user_id)
            if link_user:
                existing = User.query.filter(User.faceit_id == faceit_id, User.id != link_user_id).first()
                if existing:
                    return _redirect(f"{FRONTEND}/auth/faceit/callback?faceit_error=already_linked_to_another_account")
                link_user.faceit_id = faceit_id
                link_user.faceit_elo = faceit_elo
                link_user.faceit_level = faceit_level
                if avatar and not link_user.avatar_url:
                    link_user.avatar_url = avatar
                db.session.commit()
                qs = f"linked=true&faceit_id={_urlparse.quote(faceit_id)}"
                if faceit_elo is not None:
                    qs += f"&faceit_elo={faceit_elo}"
                if faceit_level is not None:
                    qs += f"&faceit_level={faceit_level}"
                if link_user.avatar_url:
                    qs += f"&avatar_url={_urlparse.quote(link_user.avatar_url)}"
                return _redirect(f"{FRONTEND}/auth/faceit/callback?{qs}")
        except Exception:
            pass
        return _redirect(f"{FRONTEND}/auth/faceit/callback?faceit_error=link_failed")

    # Find existing user by faceit_id, then email, then username
    user = User.query.filter_by(faceit_id=faceit_id).first()
    if not user and email:
        user = User.query.filter_by(email=email).first()
    if not user and nickname:
        user = User.query.filter_by(username=nickname).first()
    if not user:
        base_username = nickname or f"faceit_{faceit_id[:8]}"
        username = base_username
        counter = 1
        while User.query.filter_by(username=username).first():
            username = f"{base_username}_{counter}"
            counter += 1
        user = User(
            username=username, email=email, role="member",
            is_verified=True, faceit_id=faceit_id, avatar_url=avatar,
            faceit_elo=faceit_elo, faceit_level=faceit_level,
        )
        user.password_hash = bcrypt.generate_password_hash(os.urandom(32).hex()).decode("utf-8")
        db.session.add(user)
        db.session.commit()
    else:
        changed = False
        if user.faceit_id != faceit_id:
            user.faceit_id = faceit_id
            changed = True
        if avatar and user.avatar_url != avatar:
            user.avatar_url = avatar
            changed = True
        if faceit_elo is not None and user.faceit_elo != faceit_elo:
            user.faceit_elo = faceit_elo
            changed = True
        if faceit_level is not None and user.faceit_level != faceit_level:
            user.faceit_level = faceit_level
            changed = True
        if changed:
            db.session.commit()

    jwt_token = create_access_token(identity=str(user.id))
    user_encoded = _b64.urlsafe_b64encode(_json.dumps({
        "id": user.id, "username": user.username,
        "email": user.email or "", "role": user.role, "avatar_url": user.avatar_url or "",
        "faceit_id": user.faceit_id, "faceit_elo": user.faceit_elo, "faceit_level": user.faceit_level,
    }).encode()).decode().rstrip("=")

    return _redirect(f"{FRONTEND}/auth/faceit/callback?at={jwt_token}&u={user_encoded}")


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


def get_current_user_from_jwt() -> User | None:
    try:
        user_id = int(get_jwt_identity())
    except Exception:
        return None
    return User.query.get(user_id)


def roles_required(*allowed_roles: str):
    allowed = set(allowed_roles)

    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = get_current_user_from_jwt()
            if not user:
                return jsonify({"message": "User not found"}), 404
            if user.role not in allowed:
                return jsonify({"message": "Permission denied"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def serialize_tournament(item: Tournament) -> dict:
    return {
        "id": item.id,
        "title": item.title,
        "game": item.game,
        "description": item.description or "",
        "team_format": item.team_format or "",
        "location": item.location or "",
        "starts_at": item.starts_at.isoformat() if item.starts_at else None,
        "check_in_at": item.check_in_at.isoformat() if item.check_in_at else None,
        "status": item.status,
        "format": item.format,
        "max_teams": item.max_teams,
        "prize_pool": item.prize_pool or "",
        "entry_fee": item.entry_fee or "",
        "stream_url": item.stream_url or "",
        "faceit_championship_id": item.faceit_championship_id or "",
        "region": item.region or "",
        "logo_url": item.logo_url or "",
        "banner_url": item.banner_url or "",
        "created_by_user_id": item.created_by_user_id,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "updated_at": item.updated_at.isoformat() if item.updated_at else None,
        "registered_teams": len(item.registrations),
    }


def serialize_team(item: Team) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "tag": item.tag or "",
        "logo_url": item.logo_url or "",
        "captain_user_id": item.captain_user_id,
        "captain_username": item.captain.username if item.captain else None,
        "created_by_user_id": item.created_by_user_id,
        "is_active": bool(item.is_active),
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "members_count": len(item.members),
    }


def parse_iso_datetime(value: str | None):
    if not value:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None


@app.get("/api/public/tournaments")
def public_tournaments():
    rows = Tournament.query.order_by(Tournament.created_at.desc()).all()
    return jsonify([serialize_tournament(item) for item in rows])


@app.get("/api/public/tournaments/<int:tournament_id>")
def public_tournament_details(tournament_id):
    item = Tournament.query.get_or_404(tournament_id)
    data = serialize_tournament(item)
    data["registrations"] = []
    for reg in item.registrations:
        team = reg.team
        members = []
        if team:
            for m in team.members:
                u = m.user
                members.append({
                    "id": u.id,
                    "username": u.username,
                    "avatar_url": u.avatar_url or "",
                    "role_in_team": m.role_in_team,
                    "faceit_id": u.faceit_id,
                    "faceit_elo": u.faceit_elo,
                    "faceit_level": u.faceit_level,
                })
            # Also add captain if not already in members
            if team.captain and not any(m.user_id == team.captain_user_id for m in team.members):
                cap = team.captain
                members.insert(0, {
                    "id": cap.id,
                    "username": cap.username,
                    "avatar_url": cap.avatar_url or "",
                    "role_in_team": "captain",
                    "faceit_id": cap.faceit_id,
                    "faceit_elo": cap.faceit_elo,
                    "faceit_level": cap.faceit_level,
                })
        data["registrations"].append({
            "id": reg.id,
            "team_id": reg.team_id,
            "team_name": team.name if team else "Unknown",
            "team_tag": team.tag if team else None,
            "team_logo_url": (team.logo_url or "") if team else "",
            "status": reg.status,
            "created_at": reg.created_at.isoformat() if reg.created_at else None,
            "members": members,
        })
    return jsonify(data)


@app.get("/api/public/tournaments/<int:tournament_id>/bracket")
def public_tournament_bracket(tournament_id):
    item = Tournament.query.get_or_404(tournament_id)
    matches = TournamentMatch.query.filter_by(tournament_id=item.id).order_by(TournamentMatch.round_number.asc(), TournamentMatch.match_order.asc()).all()
    return jsonify(
        {
            "tournament": serialize_tournament(item),
            "matches": [
                {
                    "id": match.id,
                    "round_number": match.round_number,
                    "match_order": match.match_order,
                    "team1_id": match.team1_id,
                    "team1_name": match.team1.name if match.team1 else None,
                    "team2_id": match.team2_id,
                    "team2_name": match.team2.name if match.team2 else None,
                    "winner_team_id": match.winner_team_id,
                    "winner_team_name": match.winner_team.name if match.winner_team else None,
                    "status": match.status,
                    "score": match.score,
                    "scheduled_at": match.scheduled_at.isoformat() if match.scheduled_at else None,
                }
                for match in matches
            ],
        }
    )


@app.get("/api/admin/tournaments")
@admin_required
def admin_tournaments_list():
    rows = Tournament.query.order_by(Tournament.created_at.desc()).all()
    return jsonify([serialize_tournament(item) for item in rows])


@app.post("/api/admin/tournaments")
@admin_required
def admin_create_tournament():
    data = request.get_json(force=True) or {}
    title = str(data.get("title") or "").strip()
    game = str(data.get("game") or "").strip()
    location = str(data.get("location") or "").strip()
    team_format = str(data.get("team_format") or "").strip()
    entry_fee = str(data.get("entry_fee") or "").strip()
    bracket = str(data.get("format") or "").strip()
    starts_at = parse_iso_datetime(data.get("starts_at"))
    check_in_at = parse_iso_datetime(data.get("check_in_at"))

    missing = []
    if not title:
        missing.append("title")
    if not game:
        missing.append("game")
    if not location:
        missing.append("location")
    if not team_format:
        missing.append("team_format")
    if not entry_fee:
        missing.append("entry_fee")
    if not bracket:
        missing.append("format")
    if not starts_at:
        missing.append("starts_at")
    if not check_in_at:
        missing.append("check_in_at")

    if missing:
        return jsonify({"message": f"Missing required fields: {', '.join(missing)}"}), 400

    user = get_current_user_from_jwt()
    tournament = Tournament(
        title=title,
        game=game,
        description=str(data.get("description") or "").strip(),
        team_format=team_format,
        location=location,
        starts_at=starts_at,
        check_in_at=check_in_at,
        status=str(data.get("status") or "draft").strip() or "draft",
        format=bracket,
        max_teams=max(int(data.get("max_teams") or 16), 2),
        prize_pool=str(data.get("prize_pool") or "").strip(),
        entry_fee=entry_fee,
        stream_url=str(data.get("stream_url") or "").strip() or None,
        faceit_championship_id=str(data.get("faceit_championship_id") or "").strip() or None,
        region=str(data.get("region") or "").strip() or None,
        created_by_user_id=user.id if user else 1,
    )
    db.session.add(tournament)
    db.session.commit()
    return jsonify({"message": "Tournament created", "tournament": serialize_tournament(tournament)}), 201


@app.put("/api/admin/tournaments/<int:tournament_id>")
@admin_required
def admin_update_tournament(tournament_id):
    item = Tournament.query.get_or_404(tournament_id)
    data = request.get_json(force=True) or {}

    if "title" in data:
        value = str(data.get("title") or "").strip()
        if not value:
            return jsonify({"message": "title cannot be empty"}), 400
        item.title = value
    if "game" in data:
        item.game = str(data.get("game") or "").strip() or item.game
    if "description" in data:
        item.description = str(data.get("description") or "").strip()
    if "team_format" in data:
        item.team_format = str(data.get("team_format") or "").strip()
    if "location" in data:
        item.location = str(data.get("location") or "").strip()
    if "starts_at" in data:
        item.starts_at = parse_iso_datetime(data.get("starts_at"))
    if "check_in_at" in data:
        item.check_in_at = parse_iso_datetime(data.get("check_in_at"))
    if "status" in data:
        item.status = str(data.get("status") or "").strip() or item.status
    if "format" in data:
        item.format = str(data.get("format") or "").strip() or item.format
    if "max_teams" in data:
        item.max_teams = max(int(data.get("max_teams") or item.max_teams), 2)
    if "prize_pool" in data:
        item.prize_pool = str(data.get("prize_pool") or "").strip()
    if "entry_fee" in data:
        item.entry_fee = str(data.get("entry_fee") or "").strip()
    if "stream_url" in data:
        item.stream_url = str(data.get("stream_url") or "").strip() or None
    if "faceit_championship_id" in data:
        item.faceit_championship_id = str(data.get("faceit_championship_id") or "").strip() or None
    if "region" in data:
        item.region = str(data.get("region") or "").strip() or None

    db.session.commit()
    return jsonify({"message": "Tournament updated", "tournament": serialize_tournament(item)})


@app.delete("/api/admin/tournaments/<int:tournament_id>")
@admin_required
def admin_delete_tournament(tournament_id):
    item = Tournament.query.get_or_404(tournament_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Tournament deleted"})


@app.get("/api/admin/teams")
@admin_required
def admin_teams_list():
    rows = Team.query.order_by(Team.created_at.desc()).all()
    return jsonify([serialize_team(item) for item in rows])


@app.post("/api/admin/teams")
@admin_required
def admin_create_team():
    data = request.get_json(force=True) or {}
    team_name = str(data.get("name") or "").strip()
    if not team_name:
        return jsonify({"message": "name is required"}), 400

    creator = get_current_user_from_jwt()
    team = Team(
        name=team_name,
        tag=str(data.get("tag") or "").strip().upper()[:12] or None,
        created_by_user_id=creator.id if creator else 1,
    )
    db.session.add(team)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Team with this name already exists"}), 409

    return jsonify({"message": "Team created", "team": serialize_team(team)}), 201


@app.post("/api/admin/teams/<int:team_id>/assign-captain")
@admin_required
def admin_assign_team_captain(team_id):
    team = Team.query.get_or_404(team_id)
    data = request.get_json(force=True) or {}
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"message": "user_id is required"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    team.captain_user_id = user.id
    if user.role != "admin":
        user.role = "captain"

    membership = TeamMember.query.filter_by(team_id=team.id, user_id=user.id).first()
    if not membership:
        membership = TeamMember(team_id=team.id, user_id=user.id, role_in_team="captain")
        db.session.add(membership)
    else:
        membership.role_in_team = "captain"

    db.session.commit()
    return jsonify({"message": "Captain assigned", "team": serialize_team(team)})


@app.put("/api/admin/teams/<int:team_id>")
@admin_required
def admin_update_team(team_id):
    team = Team.query.get_or_404(team_id)
    data = request.get_json(force=True) or {}
    if "name" in data and data["name"].strip():
        team.name = data["name"].strip()
    if "tag" in data:
        team.tag = str(data["tag"]).strip().upper()[:12] or None
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Команда с таким именем уже существует"}), 409
    return jsonify({"message": "Команда обновлена", "team": serialize_team(team)})


@app.delete("/api/admin/teams/<int:team_id>")
@admin_required
def admin_delete_team(team_id):
    team = Team.query.get_or_404(team_id)
    db.session.delete(team)
    db.session.commit()
    return jsonify({"message": "Команда удалена"})


@app.get("/api/admin/teams/<int:team_id>/members")
@admin_required
def admin_team_members(team_id):
    team = Team.query.get_or_404(team_id)
    members = []
    for m in TeamMember.query.filter_by(team_id=team.id).all():
        if not m.user:
            continue
        members.append({
            "user_id": m.user_id,
            "username": m.user.username,
            "avatar_url": m.user.avatar_url or "",
            "email": m.user.email or "",
            "role_in_team": m.role_in_team,
            "faceit_elo": m.user.faceit_elo,
            "faceit_level": m.user.faceit_level,
        })
    return jsonify({"team": serialize_team(team), "members": members})


@app.post("/api/admin/teams/<int:team_id>/members")
@admin_required
def admin_add_team_member(team_id):
    team = Team.query.get_or_404(team_id)
    data = request.get_json(force=True) or {}
    username = str(data.get("username") or "").strip()
    if not username:
        return jsonify({"message": "username обязателен"}), 400
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"message": "Пользователь не найден"}), 404
    existing = TeamMember.query.filter_by(team_id=team.id, user_id=user.id).first()
    if existing:
        return jsonify({"message": "Пользователь уже в команде"}), 409
    db.session.add(TeamMember(team_id=team.id, user_id=user.id, role_in_team="player"))
    db.session.commit()
    return jsonify({"message": "Участник добавлен"})


@app.delete("/api/admin/teams/<int:team_id>/members/<int:user_id>")
@admin_required
def admin_remove_team_member(team_id, user_id):
    member = TeamMember.query.filter_by(team_id=team_id, user_id=user_id).first()
    if not member:
        return jsonify({"message": "Участник не найден"}), 404
    db.session.delete(member)
    db.session.commit()
    return jsonify({"message": "Участник удалён"})


@app.post("/api/admin/teams/<int:team_id>/logo")
@admin_required
def admin_upload_team_logo(team_id):
    team = Team.query.get_or_404(team_id)
    if "file" not in request.files:
        return jsonify({"message": "Файл не найден"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"message": "Пустое имя файла"}), 400
    ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
    if ext not in ("png", "jpg", "jpeg", "webp", "gif", "svg"):
        return jsonify({"message": "Неверный формат изображения"}), 400
    filename = f"team_{team.id}_logo.{ext}"
    f.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
    team.logo_url = f"/api/uploads/{filename}"
    db.session.commit()
    return jsonify({"message": "Логотип загружен", "logo_url": team.logo_url})


@app.post("/api/admin/tournaments/<int:tournament_id>/logo")
@admin_required
def admin_upload_tournament_logo(tournament_id):
    tournament = Tournament.query.get_or_404(tournament_id)
    if "file" not in request.files:
        return jsonify({"message": "Файл не найден"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"message": "Пустое имя файла"}), 400
    ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
    if ext not in ("png", "jpg", "jpeg", "webp", "gif", "svg"):
        return jsonify({"message": "Неверный формат изображения"}), 400
    filename = f"tournament_{tournament.id}_logo.{ext}"
    f.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
    tournament.logo_url = f"/api/uploads/{filename}"
    db.session.commit()
    return jsonify({"message": "Логотип загружен", "logo_url": tournament.logo_url})


@app.post("/api/admin/tournaments/<int:tournament_id>/banner")
@admin_required
def admin_upload_tournament_banner(tournament_id):
    tournament = Tournament.query.get_or_404(tournament_id)
    if "file" not in request.files:
        return jsonify({"message": "Файл не найден"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"message": "Пустое имя файла"}), 400
    ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
    if ext not in ("png", "jpg", "jpeg", "webp", "gif"):
        return jsonify({"message": "Неверный формат изображения"}), 400
    filename = f"tournament_{tournament.id}_banner.{ext}"
    f.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
    tournament.banner_url = f"/api/uploads/{filename}"
    db.session.commit()
    return jsonify({"message": "Баннер загружен", "banner_url": tournament.banner_url})


@app.get("/api/captain/team/me")
@roles_required("captain", "admin")
def captain_team_me():
    user = get_current_user_from_jwt()
    team = Team.query.filter_by(captain_user_id=user.id).first()
    if not team and user.role == "admin":
        team_id = request.args.get("team_id", type=int)
        if team_id:
            team = Team.query.get(team_id)
    if not team:
        return jsonify({"message": "Captain team not found"}), 404

    members = []
    for member in TeamMember.query.filter_by(team_id=team.id).all():
        if not member.user:
            continue
        members.append(
            {
                "user_id": member.user_id,
                "username": member.user.username,
                "email": member.user.email,
                "role_in_team": member.role_in_team,
            }
        )
    return jsonify({"team": serialize_team(team), "members": members})


@app.post("/api/captain/team/me/members")
@roles_required("captain", "admin")
def captain_add_team_member():
    user = get_current_user_from_jwt()
    team = Team.query.filter_by(captain_user_id=user.id).first()
    if not team and user.role != "admin":
        return jsonify({"message": "Captain team not found"}), 404
    if not team:
        team_id = request.json.get("team_id") if isinstance(request.json, dict) else None
        team = Team.query.get(team_id) if team_id else None
    if not team:
        return jsonify({"message": "Team not found"}), 404

    data = request.get_json(force=True) or {}
    username = str(data.get("username") or "").strip()
    if not username:
        return jsonify({"message": "username is required"}), 400
    member_user = User.query.filter_by(username=username).first()
    if not member_user:
        return jsonify({"message": "User not found"}), 404

    existing = TeamMember.query.filter_by(team_id=team.id, user_id=member_user.id).first()
    if existing:
        return jsonify({"message": "User already in team"}), 409

    db.session.add(TeamMember(team_id=team.id, user_id=member_user.id, role_in_team="player"))
    db.session.commit()
    return jsonify({"message": "Team member added"})


@app.delete("/api/captain/team/me/members/<int:user_id>")
@roles_required("captain", "admin")
def captain_remove_team_member(user_id):
    current = get_current_user_from_jwt()
    team = Team.query.filter_by(captain_user_id=current.id).first()
    if not team and current.role != "admin":
        return jsonify({"message": "Captain team not found"}), 404

    if not team:
        team_id = request.args.get("team_id", type=int)
        team = Team.query.get(team_id) if team_id else None
    if not team:
        return jsonify({"message": "Team not found"}), 404

    if team.captain_user_id == user_id:
        return jsonify({"message": "Captain cannot be removed from own team"}), 400

    member = TeamMember.query.filter_by(team_id=team.id, user_id=user_id).first()
    if not member:
        return jsonify({"message": "Member not found in this team"}), 404

    db.session.delete(member)
    db.session.commit()
    return jsonify({"message": "Team member removed"})


@app.post("/api/captain/tournaments/<int:tournament_id>/register")
@roles_required("captain", "admin")
def captain_register_team_to_tournament(tournament_id):
    user = get_current_user_from_jwt()
    tournament = Tournament.query.get_or_404(tournament_id)
    if tournament.status not in ("draft", "open"):
        return jsonify({"message": "Tournament registration is closed"}), 400

    team = Team.query.filter_by(captain_user_id=user.id).first()
    if not team and user.role == "admin":
        body = request.get_json(silent=True) or {}
        team_id = body.get("team_id")
        team = Team.query.get(team_id) if team_id else None
    if not team:
        return jsonify({"message": "Captain team not found"}), 404

    current_count = TournamentRegistration.query.filter_by(tournament_id=tournament.id).count()
    if current_count >= tournament.max_teams:
        return jsonify({"message": "No slots left in tournament"}), 409

    exists = TournamentRegistration.query.filter_by(tournament_id=tournament.id, team_id=team.id).first()
    if exists:
        return jsonify({"message": "Team already registered"}), 409

    reg = TournamentRegistration(
        tournament_id=tournament.id,
        team_id=team.id,
        status="pending",
        registered_by_user_id=user.id,
    )
    db.session.add(reg)
    db.session.commit()
    return jsonify({"message": "Registration created", "registration_id": reg.id}), 201


@app.post("/api/admin/tournaments/<int:tournament_id>/registrations/<int:registration_id>/approve")
@admin_required
def admin_approve_tournament_registration(tournament_id, registration_id):
    reg = TournamentRegistration.query.filter_by(id=registration_id, tournament_id=tournament_id).first()
    if not reg:
        return jsonify({"message": "Registration not found"}), 404
    reg.status = "approved"
    db.session.commit()
    return jsonify({"message": "Registration approved"})


@app.post("/api/admin/tournaments/<int:tournament_id>/registrations")
@admin_required
def admin_add_tournament_registration(tournament_id):
    tournament = Tournament.query.get_or_404(tournament_id)
    data = request.get_json(force=True) or {}
    team_id = data.get("team_id")
    if not team_id:
        return jsonify({"message": "team_id is required"}), 400
    team = Team.query.get(team_id)
    if not team:
        return jsonify({"message": "Команда не найдена"}), 404
    existing = TournamentRegistration.query.filter_by(tournament_id=tournament.id, team_id=team.id).first()
    if existing:
        return jsonify({"message": "Команда уже зарегистрирована"}), 409
    user = get_current_user_from_jwt()
    reg = TournamentRegistration(
        tournament_id=tournament.id,
        team_id=team.id,
        status="approved",
        registered_by_user_id=user.id if user else 1,
    )
    db.session.add(reg)
    db.session.commit()
    return jsonify({"message": "Команда добавлена в турнир"}), 201


@app.delete("/api/admin/tournaments/<int:tournament_id>/registrations/<int:registration_id>")
@admin_required
def admin_remove_tournament_registration(tournament_id, registration_id):
    reg = TournamentRegistration.query.filter_by(id=registration_id, tournament_id=tournament_id).first()
    if not reg:
        return jsonify({"message": "Регистрация не найдена"}), 404
    db.session.delete(reg)
    db.session.commit()
    return jsonify({"message": "Команда удалена из турнира"})


@app.post("/api/admin/tournaments/<int:tournament_id>/generate-bracket")
@admin_required
def admin_generate_bracket(tournament_id):
    tournament = Tournament.query.get_or_404(tournament_id)
    approved = (
        TournamentRegistration.query.filter_by(tournament_id=tournament.id, status="approved")
        .order_by(TournamentRegistration.created_at.asc())
        .all()
    )
    if len(approved) < 2:
        return jsonify({"message": "At least 2 approved teams required"}), 400

    TournamentMatch.query.filter_by(tournament_id=tournament.id).delete()
    db.session.flush()

    teams = [reg.team for reg in approved if reg.team]
    pairs = []
    for i in range(0, len(teams), 2):
        team1 = teams[i]
        team2 = teams[i + 1] if i + 1 < len(teams) else None
        pairs.append((team1, team2))

    for idx, pair in enumerate(pairs, start=1):
        match = TournamentMatch(
            tournament_id=tournament.id,
            round_number=1,
            match_order=idx,
            team1_id=pair[0].id if pair[0] else None,
            team2_id=pair[1].id if pair[1] else None,
            status="scheduled",
        )
        db.session.add(match)

    tournament.status = "live"
    db.session.commit()
    return jsonify({"message": "Bracket generated", "matches_count": len(pairs)})


# ── FACEIT Championship Integration ──────────────────────────────────────────

def _faceit_api_get(path: str) -> dict | None:
    """Helper to call FACEIT Data API v4."""
    if not FACEIT_DATA_API_KEY:
        return None
    try:
        resp = requests.get(
            f"https://open.faceit.com/data/v4{path}",
            headers={"Authorization": f"Bearer {FACEIT_DATA_API_KEY}", "User-Agent": "Mozilla/5.0"},
            timeout=12,
        )
        if resp.ok:
            return resp.json()
        app.logger.warning(f"FACEIT API {path} returned {resp.status_code}: {resp.text[:300]}")
    except Exception as e:
        app.logger.warning(f"FACEIT API {path} failed: {e}")
    return None


@app.post("/api/admin/tournaments/<int:tournament_id>/faceit-sync")
@admin_required
def admin_faceit_sync_tournament(tournament_id):
    """Sync tournament data from FACEIT Championship API."""
    tournament = Tournament.query.get_or_404(tournament_id)
    champ_id = tournament.faceit_championship_id
    if not champ_id:
        return jsonify({"message": "FACEIT Championship ID не указан"}), 400
    if not FACEIT_DATA_API_KEY:
        return jsonify({"message": "FACEIT Data API Key не настроен на сервере"}), 500

    # Fetch championship info
    champ = _faceit_api_get(f"/championships/{champ_id}")
    if not champ:
        return jsonify({"message": "Не удалось получить данные чемпионата FACEIT"}), 502

    # Update tournament fields from FACEIT
    if champ.get("name"):
        tournament.title = champ["name"]
    if champ.get("description"):
        tournament.description = champ["description"]
    if champ.get("prize_type") and champ.get("total_prize"):
        tournament.prize_pool = f"{champ['total_prize']} {champ.get('prize_type', '')}"
    if champ.get("slots"):
        tournament.max_teams = champ["slots"]
    faceit_status = champ.get("status", "").lower()
    status_map = {"created": "draft", "join": "open", "check_in": "open", "ongoing": "live", "finished": "finished", "cancelled": "cancelled"}
    if faceit_status in status_map:
        tournament.status = status_map[faceit_status]
    if champ.get("championship_start"):
        try:
            tournament.starts_at = datetime.fromtimestamp(champ["championship_start"])
        except Exception:
            pass
    if champ.get("checkin_start"):
        try:
            tournament.check_in_at = datetime.fromtimestamp(champ["checkin_start"])
        except Exception:
            pass
    if champ.get("stream") and champ["stream"].get("url"):
        tournament.stream_url = champ["stream"]["url"]

    db.session.commit()

    # Sync matches/bracket
    matches_data = _faceit_api_get(f"/championships/{champ_id}/matches?type=all&offset=0&limit=100")
    faceit_matches = matches_data.get("items", []) if matches_data else []

    synced_count = 0
    if faceit_matches:
        # Clear existing matches and rebuild from FACEIT
        TournamentMatch.query.filter_by(tournament_id=tournament.id).delete()
        db.session.flush()

        for fm in faceit_matches:
            round_num = fm.get("round", 1)
            match_order = fm.get("match_id", "")
            teams_data = fm.get("teams", {})
            faction1 = teams_data.get("faction1", {})
            faction2 = teams_data.get("faction2", {})
            results = fm.get("results", {})
            winner_id = results.get("winner")
            score_data = results.get("score", {})
            score_str = f"{score_data.get('faction1', 0)}:{score_data.get('faction2', 0)}" if score_data else None

            fm_status = fm.get("status", "").lower()
            match_status = "finished" if fm_status in ("finished", "cancelled") else "live" if fm_status == "ongoing" else "scheduled"

            # Try to find matching local teams by FACEIT team names
            t1_name = faction1.get("name")
            t2_name = faction2.get("name")
            t1 = Team.query.filter_by(name=t1_name).first() if t1_name else None
            t2 = Team.query.filter_by(name=t2_name).first() if t2_name else None
            winner_team = None
            if winner_id == "faction1" and t1:
                winner_team = t1
            elif winner_id == "faction2" and t2:
                winner_team = t2

            match = TournamentMatch(
                tournament_id=tournament.id,
                round_number=round_num,
                match_order=synced_count + 1,
                team1_id=t1.id if t1 else None,
                team2_id=t2.id if t2 else None,
                winner_team_id=winner_team.id if winner_team else None,
                status=match_status,
                score=score_str,
            )
            db.session.add(match)
            synced_count += 1

        db.session.commit()

    return jsonify({
        "message": f"Синхронизировано: инфо + {synced_count} матчей",
        "tournament": serialize_tournament(tournament),
        "matches_synced": synced_count,
    })


@app.get("/api/public/tournaments/<int:tournament_id>/faceit-bracket")
def public_faceit_bracket(tournament_id):
    """Fetch live bracket directly from FACEIT API (no caching)."""
    tournament = Tournament.query.get_or_404(tournament_id)
    champ_id = tournament.faceit_championship_id
    if not champ_id:
        return jsonify({"message": "Турнир не привязан к FACEIT", "matches": []}), 200

    matches_data = _faceit_api_get(f"/championships/{champ_id}/matches?type=all&offset=0&limit=100")
    if not matches_data:
        return jsonify({"message": "Не удалось получить сетку FACEIT", "matches": []}), 502

    matches = []
    for fm in matches_data.get("items", []):
        teams_data = fm.get("teams", {})
        faction1 = teams_data.get("faction1", {})
        faction2 = teams_data.get("faction2", {})
        results = fm.get("results", {})
        score_data = results.get("score", {})

        fm_status = fm.get("status", "").lower()
        match_status = "finished" if fm_status in ("finished", "cancelled") else "live" if fm_status == "ongoing" else "scheduled"

        matches.append({
            "faceit_match_id": fm.get("match_id"),
            "round_number": fm.get("round", 1),
            "match_order": fm.get("best_of", 1),
            "team1_name": faction1.get("name"),
            "team1_avatar": faction1.get("avatar"),
            "team2_name": faction2.get("name"),
            "team2_avatar": faction2.get("avatar"),
            "winner": results.get("winner"),
            "score": f"{score_data.get('faction1', 0)}:{score_data.get('faction2', 0)}" if score_data else None,
            "status": match_status,
            "faceit_url": fm.get("faceit_url"),
            "started_at": fm.get("started_at"),
            "finished_at": fm.get("finished_at"),
        })

    return jsonify({"matches": matches, "championship_id": champ_id})

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
    booking_start_raw = (data.get("booking_start_at") or "").strip()
    pc_names = data.get("pc_names") or []
    selected_pcs = data.get("selected_pcs") or []
    booking_start_at = parse_client_booking_datetime(booking_start_raw)

    if not client_name:
        return jsonify({"message": "Client name is required"}), 400
    if not phone:
        return jsonify({"message": "Phone is required"}), 400
    if not booking_start_at:
        return jsonify({"message": "booking_start_at is required in ISO format"}), 400
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
        booking_start_at=booking_start_at,
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
            "booking_start_at": booking.booking_start_at.isoformat() + "Z" if booking.booking_start_at else None,
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
            "booking_start_at": b.booking_start_at.isoformat() + "Z" if b.booking_start_at else None,
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
        "faceit_id": user.faceit_id,
        "faceit_elo": user.faceit_elo,
        "faceit_level": user.faceit_level,
    })


@app.delete("/api/public/profile/faceit")
@jwt_required()
def public_profile_unlink_faceit():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    user.faceit_id = None
    user.faceit_elo = None
    user.faceit_level = None
    db.session.commit()
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "avatar_url": user.avatar_url or "",
        "faceit_id": None,
        "faceit_elo": None,
        "faceit_level": None,
    })


@app.get("/api/public/profile/faceit/stats")
@jwt_required()
def public_profile_faceit_stats():
    """Fetch lifetime CS2 stats from FACEIT Data API v4."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if not user.faceit_id:
        return jsonify({"message": "FACEIT not linked"}), 400
    if not FACEIT_DATA_API_KEY:
        return jsonify({"message": "FACEIT API key not configured"}), 500

    headers = {"Authorization": f"Bearer {FACEIT_DATA_API_KEY}", "User-Agent": "Mozilla/5.0"}
    try:
        resp = requests.get(
            f"https://open.faceit.com/data/v4/players/{user.faceit_id}/stats/cs2",
            headers=headers, timeout=10,
        )
        if resp.status_code == 404:
            resp = requests.get(
                f"https://open.faceit.com/data/v4/players/{user.faceit_id}/stats/csgo",
                headers=headers, timeout=10,
            )
        if not resp.ok:
            app.logger.warning(f"FACEIT stats API failed: {resp.status_code} {resp.text[:200]}")
            return jsonify({"message": "Failed to fetch FACEIT stats"}), 502

        data = resp.json()
        lifetime = data.get("lifetime", {})
        segments = data.get("segments", [])

        maps = []
        for seg in segments:
            if seg.get("type") == "Map":
                s = seg.get("stats", {})
                maps.append({
                    "name": seg.get("label", "Unknown"),
                    "img_regular": seg.get("img_regular", ""),
                    "matches": s.get("Matches", "0"),
                    "wins": s.get("Wins", "0"),
                    "win_rate": s.get("Win Rate %", "0"),
                    "avg_kills": s.get("Average Kills", "0"),
                    "avg_deaths": s.get("Average Deaths", "0"),
                    "avg_kd": s.get("Average K/D Ratio", "0"),
                    "avg_headshots": s.get("Average Headshots %", "0"),
                })

        return jsonify({
            "lifetime": {
                "matches": lifetime.get("Matches", "0"),
                "wins": lifetime.get("Wins", "0"),
                "win_rate": lifetime.get("Win Rate %", "0"),
                "kd_ratio": lifetime.get("Average K/D Ratio", "0"),
                "headshots": lifetime.get("Average Headshots %", "0"),
                "longest_win_streak": lifetime.get("Longest Win Streak", "0"),
                "current_win_streak": lifetime.get("Current Win Streak", "0"),
            },
            "maps": sorted(maps, key=lambda m: int(m["matches"]), reverse=True),
        })
    except requests.exceptions.RequestException as e:
        app.logger.warning(f"FACEIT stats request error: {e}")
        return jsonify({"message": "Connection error"}), 502


@app.get("/api/public/profile/faceit/history")
@jwt_required()
def public_profile_faceit_history():
    """Fetch recent match history with per-match stats from FACEIT Data API v4."""
    from concurrent.futures import ThreadPoolExecutor, as_completed

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if not user.faceit_id:
        return jsonify({"message": "FACEIT not linked"}), 400
    if not FACEIT_DATA_API_KEY:
        return jsonify({"message": "FACEIT API key not configured"}), 500

    limit = min(int(request.args.get("limit", 20)), 50)
    offset = int(request.args.get("offset", 0))
    headers = {"Authorization": f"Bearer {FACEIT_DATA_API_KEY}", "User-Agent": "Mozilla/5.0"}
    faceit_id = user.faceit_id

    try:
        resp = requests.get(
            f"https://open.faceit.com/data/v4/players/{faceit_id}/history",
            params={"game": "cs2", "offset": offset, "limit": limit},
            headers=headers, timeout=10,
        )
        if resp.status_code == 404 or (resp.ok and not resp.json().get("items")):
            resp = requests.get(
                f"https://open.faceit.com/data/v4/players/{faceit_id}/history",
                params={"game": "csgo", "offset": offset, "limit": limit},
                headers=headers, timeout=10,
            )
        if not resp.ok:
            return jsonify({"message": "Failed to fetch match history"}), 502

        items = resp.json().get("items", [])

        # Build basic match data first
        matches_by_id = {}
        for item in items:
            match_id = item.get("match_id", "")
            teams = item.get("teams", {})
            player_team = None
            for team_key, team_data in teams.items():
                if any(p.get("player_id") == faceit_id for p in team_data.get("players", [])):
                    player_team = team_key
                    break

            results = item.get("results", {})
            winner = results.get("winner")
            is_win = (player_team == winner) if player_team and winner else None

            score = results.get("score", {})
            s1, s2 = score.get("faction1", 0), score.get("faction2", 0)
            score_str = f"{s1}:{s2}" if player_team == "faction1" else f"{s2}:{s1}"

            team_name = teams.get(player_team, {}).get("nickname", "") if player_team else ""
            opp_key = "faction2" if player_team == "faction1" else "faction1"
            opp_name = teams.get(opp_key, {}).get("nickname", "") if player_team else ""

            voting = item.get("voting") or {}
            map_pick = None
            if voting.get("map", {}).get("pick"):
                picks = voting["map"]["pick"]
                map_pick = picks[0] if isinstance(picks, list) and picks else picks if isinstance(picks, str) else None

            matches_by_id[match_id] = {
                "match_id": match_id,
                "map": map_pick,
                "started_at": item.get("started_at"),
                "finished_at": item.get("finished_at"),
                "is_win": is_win,
                "score": score_str,
                "team_name": team_name,
                "opponent_name": opp_name,
                "stats": None,
            }

        # Fetch per-match stats in parallel
        def fetch_match_stats(mid):
            try:
                r = requests.get(
                    f"https://open.faceit.com/data/v4/matches/{mid}/stats",
                    headers=headers, timeout=8,
                )
                if r.ok:
                    return mid, r.json()
            except Exception:
                pass
            return mid, None

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(fetch_match_stats, mid): mid for mid in matches_by_id}
            for future in as_completed(futures):
                mid, stats_data = future.result()
                if not stats_data:
                    continue
                entry = matches_by_id[mid]
                for rd in stats_data.get("rounds", []):
                    if not entry["map"]:
                        entry["map"] = rd.get("round_stats", {}).get("Map")
                    for team in rd.get("teams", []):
                        for player in team.get("players", []):
                            if player.get("player_id") == faceit_id:
                                ps = player.get("player_stats", {})
                                entry["stats"] = {
                                    "kills": ps.get("Kills", "0"),
                                    "deaths": ps.get("Deaths", "0"),
                                    "assists": ps.get("Assists", "0"),
                                    "kd": ps.get("K/D Ratio", "0"),
                                    "headshots_pct": ps.get("Headshots %", "0"),
                                    "mvps": ps.get("MVPs", "0"),
                                }

        # Return in original order
        matches = [matches_by_id[item.get("match_id", "")] for item in items if item.get("match_id") in matches_by_id]
        return jsonify({"matches": matches})
    except requests.exceptions.RequestException as e:
        app.logger.warning(f"FACEIT history request error: {e}")
        return jsonify({"message": "Connection error"}), 502


@app.get("/api/public/players/<int:user_id>/faceit-stats")
def public_player_faceit_stats(user_id):
    """Public endpoint: fetch FACEIT lifetime stats for any player by user ID."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if not user.faceit_id:
        return jsonify({"message": "FACEIT not linked"}), 400
    if not FACEIT_DATA_API_KEY:
        return jsonify({"message": "FACEIT API key not configured"}), 500

    headers = {"Authorization": f"Bearer {FACEIT_DATA_API_KEY}", "User-Agent": "Mozilla/5.0"}
    try:
        resp = requests.get(
            f"https://open.faceit.com/data/v4/players/{user.faceit_id}/stats/cs2",
            headers=headers, timeout=10,
        )
        if resp.status_code == 404:
            resp = requests.get(
                f"https://open.faceit.com/data/v4/players/{user.faceit_id}/stats/csgo",
                headers=headers, timeout=10,
            )
        if not resp.ok:
            return jsonify({"message": "Failed to fetch FACEIT stats"}), 502

        data = resp.json()
        lifetime = data.get("lifetime", {})
        segments = data.get("segments", [])

        maps = []
        for seg in segments:
            if seg.get("type") == "Map":
                s = seg.get("stats", {})
                maps.append({
                    "name": seg.get("label", "Unknown"),
                    "img_regular": seg.get("img_regular", ""),
                    "matches": s.get("Matches", "0"),
                    "wins": s.get("Wins", "0"),
                    "win_rate": s.get("Win Rate %", "0"),
                    "avg_kills": s.get("Average Kills", "0"),
                    "avg_deaths": s.get("Average Deaths", "0"),
                    "avg_kd": s.get("Average K/D Ratio", "0"),
                    "avg_headshots": s.get("Average Headshots %", "0"),
                })

        return jsonify({
            "player": {
                "id": user.id,
                "username": user.username,
                "avatar_url": user.avatar_url or "",
                "faceit_id": user.faceit_id,
                "faceit_elo": user.faceit_elo,
                "faceit_level": user.faceit_level,
            },
            "lifetime": {
                "matches": lifetime.get("Matches", "0"),
                "wins": lifetime.get("Wins", "0"),
                "win_rate": lifetime.get("Win Rate %", "0"),
                "kd_ratio": lifetime.get("Average K/D Ratio", "0"),
                "headshots": lifetime.get("Average Headshots %", "0"),
                "longest_win_streak": lifetime.get("Longest Win Streak", "0"),
                "current_win_streak": lifetime.get("Current Win Streak", "0"),
            },
            "maps": sorted(maps, key=lambda m: int(m["matches"]), reverse=True),
        })
    except requests.exceptions.RequestException as e:
        app.logger.warning(f"FACEIT player stats error: {e}")
        return jsonify({"message": "Connection error"}), 502


@app.route("/api/public/faceit/rankings/uzbekistan", methods=["GET"])
def public_faceit_rankings_uzbekistan():
    """Топ-100 CS2 игроков из Узбекистана по данным FACEIT API."""
    if not FACEIT_DATA_API_KEY:
        return jsonify({"message": "FACEIT API key not configured"}), 503

    limit = min(int(request.args.get("limit", 100)), 100)
    offset = int(request.args.get("offset", 0))
    try:
        resp = requests.get(
            "https://open.faceit.com/data/v4/rankings/games/cs2/regions/EU",
            headers={"Authorization": f"Bearer {FACEIT_DATA_API_KEY}"},
            params={"country": "uz", "limit": limit, "offset": offset},
            timeout=10,
        )
        if not resp.ok:
            app.logger.warning(f"FACEIT rankings UZ failed: {resp.status_code} {resp.text[:200]}")
            return jsonify({"message": "Failed to fetch rankings from FACEIT"}), 502
        data = resp.json()
        items = data.get("items", [])
        if items:
            app.logger.info(f"FACEIT rankings UZ sample entry keys: {list(items[0].keys())}")
            app.logger.info(f"FACEIT rankings UZ sample entry: {items[0]}")
        result = []
        for entry in items:
            # Поля могут быть как на верхнем уровне, так и вложены в "player"
            player = entry.get("player") or {}
            result.append({
                "position": entry.get("position"),
                "faceit_points": entry.get("faceit_points") or player.get("faceit_points"),
                "nickname": entry.get("nickname") or player.get("nickname"),
                "avatar": (
                    entry.get("cover_image_url")
                    or entry.get("avatar")
                    or player.get("cover_image_url")
                    or player.get("avatar")
                    or ""
                ),
                "player_id": entry.get("player_id") or player.get("player_id"),
                "country": entry.get("country") or player.get("country"),
                "skill_level": (
                    entry.get("skill_level")
                    or player.get("skill_level")
                    or (entry.get("games") or {}).get("cs2", {}).get("skill_level")
                ),
                "faceit_elo": (
                    entry.get("faceit_elo")
                    or player.get("faceit_elo")
                    or (entry.get("games") or {}).get("cs2", {}).get("faceit_elo")
                ),
            })
        return jsonify({"total": len(result), "offset": offset, "items": result})
    except Exception as e:
        app.logger.warning(f"FACEIT rankings UZ error: {e}")
        return jsonify({"message": "Connection error"}), 502


@app.post("/api/public/profile/faceit/link")
@jwt_required()
def public_profile_link_faceit():
    """Link FACEIT account to the currently authenticated user."""
    import base64 as _b64
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.json or {}
    code = data.get("code")
    redirect_uri = data.get("redirect_uri", "https://cloud.icafedash.com/api/auth/faceit/oauth-callback")
    code_verifier = data.get("code_verifier")
    if not code:
        return jsonify({"message": "Missing code"}), 400

    credentials = _b64.b64encode(f"{FACEIT_CLIENT_ID}:{FACEIT_CLIENT_SECRET}".encode()).decode()
    token_data = {"grant_type": "authorization_code", "code": code, "redirect_uri": redirect_uri, "client_id": FACEIT_CLIENT_ID}
    if code_verifier:
        token_data["code_verifier"] = code_verifier

    try:
        token_resp = requests.post(
            "https://api.faceit.com/auth/v1/oauth/token",
            headers={"Authorization": f"Basic {credentials}", "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0"},
            data=token_data, timeout=10,
        )
    except Exception as e:
        return jsonify({"message": f"Connection error: {e}"}), 502

    if not token_resp.ok:
        return jsonify({"message": f"Token exchange failed: {token_resp.text[:200]}"}), 400

    faceit_access_token = token_resp.json().get("access_token")
    if not faceit_access_token:
        return jsonify({"message": "No access token in response"}), 400

    try:
        userinfo_resp = requests.get(
            "https://api.faceit.com/auth/v1/resources/userinfo",
            headers={"Authorization": f"Bearer {faceit_access_token}"}, timeout=10,
        )
    except Exception as e:
        return jsonify({"message": f"Userinfo error: {e}"}), 502

    if not userinfo_resp.ok:
        return jsonify({"message": "Failed to get FACEIT profile"}), 400

    faceit_user_info = userinfo_resp.json()
    faceit_id = faceit_user_info.get("sub") or faceit_user_info.get("guid")
    avatar = faceit_user_info.get("picture") or faceit_user_info.get("avatar") or ""

    if not faceit_id:
        return jsonify({"message": "No FACEIT ID"}), 400

    # Check if this FACEIT account is already linked to a different user
    existing = User.query.filter(User.faceit_id == faceit_id, User.id != user_id).first()
    if existing:
        return jsonify({"message": "Этот FACEIT аккаунт уже привязан к другому пользователю"}), 409

    # Fetch CS2/CSGO ELO and skill level
    faceit_elo, faceit_level = _fetch_faceit_game_stats(faceit_id, faceit_access_token, nickname)

    user.faceit_id = faceit_id
    user.faceit_elo = faceit_elo
    user.faceit_level = faceit_level
    if avatar and not user.avatar_url:
        user.avatar_url = avatar
    db.session.commit()

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email or "",
        "role": user.role,
        "avatar_url": user.avatar_url or "",
        "faceit_id": user.faceit_id,
        "faceit_elo": user.faceit_elo,
        "faceit_level": user.faceit_level,
    })


@app.post("/api/public/profile/avatar")
@jwt_required()
def public_profile_avatar_upload():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

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


@app.post("/api/public/profile/set-password")
@jwt_required()
def public_profile_set_password():
    """Set password for FACEIT-only users who never had a real password."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if not user.faceit_id:
        return jsonify({"message": "Эта функция доступна только для FACEIT пользователей"}), 403

    body = request.get_json(force=True) or {}
    new_password = str(body.get("new_password") or "")
    if not new_password or len(new_password) < 6:
        return jsonify({"message": "Пароль должен быть минимум 6 символов"}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Пароль установлен"})


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
    booking_start_raw = (data.get("booking_start_at") or "").strip()
    booking_start_at = parse_client_booking_datetime(booking_start_raw)
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
        booking_start_at=booking_start_at,
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
            "booking_start_at": booking.booking_start_at.isoformat() + "Z" if booking.booking_start_at else None,
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
            "booking_start_at": b.booking_start_at.isoformat() + "Z" if b.booking_start_at else None,
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


# ─────────────────────────────────────────────
# TRANSFER MARKET — публичные и авторизованные маршруты
# ─────────────────────────────────────────────

@app.route("/api/public/transfer", methods=["GET"])
def public_transfer_list():
    """Список активных объявлений трансфер-маркета с фильтрами."""
    game = request.args.get("game", "").strip()
    listing_type = request.args.get("type", "").strip()   # lft / lfs
    region = request.args.get("region", "").strip()
    min_elo = request.args.get("min_elo", type=int)
    max_elo = request.args.get("max_elo", type=int)
    limit = min(int(request.args.get("limit", 50)), 100)
    offset = int(request.args.get("offset", 0))

    q = TransferListing.query.filter(TransferListing.is_active == True)
    if game:
        q = q.filter(TransferListing.game.ilike(f"%{game}%"))
    if listing_type in ("lft", "lfs"):
        q = q.filter(TransferListing.listing_type == listing_type)
    if region:
        q = q.filter(TransferListing.region.ilike(f"%{region}%"))
    if min_elo is not None:
        q = q.join(User, User.id == TransferListing.user_id).filter(User.faceit_elo >= min_elo)
    if max_elo is not None:
        q = q.join(User, User.id == TransferListing.user_id).filter(User.faceit_elo <= max_elo)

    total = q.count()
    listings = q.order_by(TransferListing.created_at.desc()).offset(offset).limit(limit).all()

    result = []
    for lst in listings:
        u = lst.user
        # Определяем команду игрока
        membership = TeamMember.query.filter_by(user_id=u.id).first()
        team_name = None
        if membership:
            t = Team.query.get(membership.team_id)
            if t:
                team_name = t.name

        result.append({
            "id": lst.id,
            "listing_type": lst.listing_type,
            "game": lst.game,
            "roles": lst.roles,
            "description": lst.description,
            "region": lst.region,
            "min_elo": lst.min_elo,
            "max_elo": lst.max_elo,
            "contact": lst.contact,
            "created_at": lst.created_at.isoformat() if lst.created_at else None,
            "expires_at": lst.expires_at.isoformat() if lst.expires_at else None,
            "player": {
                "id": u.id,
                "username": u.username,
                "avatar_url": u.avatar_url or "",
                "faceit_elo": u.faceit_elo,
                "faceit_level": u.faceit_level,
                "team_name": team_name,
            },
        })

    return jsonify({"total": total, "items": result})


@app.get("/api/public/players/<int:user_id>")
def public_player_profile(user_id):
    """Публичный профиль игрока: базовая инфо + команда."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    membership = TeamMember.query.filter_by(user_id=user_id).first()
    team_info = None
    if membership:
        t = Team.query.get(membership.team_id)
        if t:
            team_info = {
                "id": t.id,
                "name": t.name,
                "tag": t.tag,
                "logo_url": t.logo_url or "",
                "role_in_team": membership.role_in_team,
            }

    # Последние турниры игрока (через команду)
    tournaments_played = []
    if team_info:
        regs = TournamentRegistration.query.filter_by(team_id=membership.team_id).order_by(
            TournamentRegistration.created_at.desc()
        ).limit(5).all()
        for reg in regs:
            trn = Tournament.query.get(reg.tournament_id)
            if trn:
                tournaments_played.append({
                    "id": trn.id,
                    "title": trn.title,
                    "game": trn.game,
                    "status": trn.status,
                    "starts_at": trn.starts_at.isoformat() if trn.starts_at else None,
                    "logo_url": trn.logo_url or "",
                })

    # Открытые объявления на трансфер
    transfer = TransferListing.query.filter_by(user_id=user_id, is_active=True).first()
    transfer_listing = None
    if transfer:
        transfer_listing = {
            "id": transfer.id,
            "listing_type": transfer.listing_type,
            "game": transfer.game,
            "roles": transfer.roles,
            "description": transfer.description,
            "region": transfer.region,
            "contact": transfer.contact,
        }

    return jsonify({
        "id": user.id,
        "username": user.username,
        "avatar_url": user.avatar_url or "",
        "faceit_id": user.faceit_id,
        "faceit_elo": user.faceit_elo,
        "faceit_level": user.faceit_level,
        "team": team_info,
        "tournaments": tournaments_played,
        "transfer_listing": transfer_listing,
        "member_since": user.created_at.isoformat() if user.created_at else None,
    })


@app.route("/api/public/transfer", methods=["POST"])
@jwt_required()
def public_transfer_create():
    """Создать или обновить объявление на трансфер (один пользователь — одно активное)."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.json or {}
    listing_type = data.get("listing_type", "lft")
    if listing_type not in ("lft", "lfs"):
        return jsonify({"message": "listing_type must be 'lft' or 'lfs'"}), 400

    # Деактивируем предыдущие объявления
    TransferListing.query.filter_by(user_id=user_id, is_active=True).update({"is_active": False})

    expires_days = int(data.get("expires_days", 30))
    expires_at = datetime.utcnow() + timedelta(days=expires_days)

    listing = TransferListing(
        user_id=user_id,
        listing_type=listing_type,
        game=data.get("game", "CS2"),
        roles=data.get("roles", ""),
        description=data.get("description", ""),
        region=data.get("region", ""),
        min_elo=data.get("min_elo"),
        max_elo=data.get("max_elo"),
        contact=data.get("contact", ""),
        expires_at=expires_at,
        is_active=True,
    )
    db.session.add(listing)
    db.session.commit()
    return jsonify({"message": "Listing created", "id": listing.id}), 201


@app.route("/api/public/transfer/<int:listing_id>", methods=["PUT"])
@jwt_required()
def public_transfer_update(listing_id):
    """Обновить своё объявление."""
    user_id = int(get_jwt_identity())
    listing = TransferListing.query.get(listing_id)
    if not listing:
        return jsonify({"message": "Not found"}), 404
    if listing.user_id != user_id:
        return jsonify({"message": "Forbidden"}), 403

    data = request.json or {}
    for field in ("game", "roles", "description", "region", "contact", "min_elo", "max_elo"):
        if field in data:
            setattr(listing, field, data[field])
    if "is_active" in data:
        listing.is_active = bool(data["is_active"])

    db.session.commit()
    return jsonify({"message": "Updated"})


@app.route("/api/public/transfer/<int:listing_id>", methods=["DELETE"])
@jwt_required()
def public_transfer_delete(listing_id):
    """Удалить своё объявление."""
    user_id = int(get_jwt_identity())
    listing = TransferListing.query.get(listing_id)
    if not listing:
        return jsonify({"message": "Not found"}), 404
    if listing.user_id != user_id:
        return jsonify({"message": "Forbidden"}), 403

    db.session.delete(listing)
    db.session.commit()
    return jsonify({"message": "Deleted"})


# ─────────────────────────────────────────────
# TRANSFER MARKET — admin маршруты
# ─────────────────────────────────────────────

def _transfer_listing_to_dict(lst: TransferListing) -> dict:
    u = lst.user
    membership = TeamMember.query.filter_by(user_id=u.id).first()
    team_name = None
    if membership:
        t = Team.query.get(membership.team_id)
        if t:
            team_name = t.name
    return {
        "id": lst.id,
        "listing_type": lst.listing_type,
        "game": lst.game,
        "roles": lst.roles,
        "description": lst.description,
        "region": lst.region,
        "min_elo": lst.min_elo,
        "max_elo": lst.max_elo,
        "contact": lst.contact,
        "is_active": lst.is_active,
        "created_at": lst.created_at.isoformat() if lst.created_at else None,
        "expires_at": lst.expires_at.isoformat() if lst.expires_at else None,
        "player": {
            "id": u.id,
            "username": u.username,
            "avatar_url": u.avatar_url or "",
            "faceit_elo": u.faceit_elo,
            "faceit_level": u.faceit_level,
            "team_name": team_name,
        },
    }


@app.route("/api/admin/transfer", methods=["GET"])
@jwt_required()
def admin_transfer_list():
    """Список всех объявлений трансфер-маркета для администратора."""
    user_id = int(get_jwt_identity())
    me = User.query.get(user_id)
    if not me or me.role != "admin":
        return jsonify({"message": "Forbidden"}), 403

    game = request.args.get("game", "").strip()
    listing_type = request.args.get("type", "").strip()
    is_active = request.args.get("is_active", "").strip()
    search = request.args.get("search", "").strip()
    limit = min(int(request.args.get("limit", 50)), 200)
    offset = int(request.args.get("offset", 0))

    q = TransferListing.query
    if game:
        q = q.filter(TransferListing.game.ilike(f"%{game}%"))
    if listing_type in ("lft", "lfs"):
        q = q.filter_by(listing_type=listing_type)
    if is_active == "1":
        q = q.filter_by(is_active=True)
    elif is_active == "0":
        q = q.filter_by(is_active=False)
    if search:
        q = q.join(User, User.id == TransferListing.user_id).filter(User.username.ilike(f"%{search}%"))

    total = q.count()
    listings = q.order_by(TransferListing.created_at.desc()).offset(offset).limit(limit).all()
    return jsonify({"total": total, "items": [_transfer_listing_to_dict(l) for l in listings]})


@app.route("/api/admin/transfer", methods=["POST"])
@jwt_required()
def admin_transfer_create():
    """Создать объявление от имени любого пользователя."""
    user_id = int(get_jwt_identity())
    me = User.query.get(user_id)
    if not me or me.role != "admin":
        return jsonify({"message": "Forbidden"}), 403

    data = request.json or {}
    target_user_id = data.get("user_id")
    if not target_user_id:
        return jsonify({"message": "user_id required"}), 400
    target = User.query.get(target_user_id)
    if not target:
        return jsonify({"message": "User not found"}), 404

    listing_type = data.get("listing_type", "lft")
    if listing_type not in ("lft", "lfs"):
        return jsonify({"message": "listing_type must be 'lft' or 'lfs'"}), 400

    TransferListing.query.filter_by(user_id=target_user_id, is_active=True).update({"is_active": False})

    expires_days = int(data.get("expires_days", 30))
    listing = TransferListing(
        user_id=target_user_id,
        listing_type=listing_type,
        game=data.get("game", "CS2"),
        roles=data.get("roles", ""),
        description=data.get("description", ""),
        region=data.get("region", ""),
        min_elo=data.get("min_elo"),
        max_elo=data.get("max_elo"),
        contact=data.get("contact", ""),
        expires_at=datetime.utcnow() + timedelta(days=expires_days),
        is_active=True,
    )
    db.session.add(listing)
    db.session.commit()
    return jsonify({"message": "Created", "id": listing.id}), 201


@app.route("/api/admin/transfer/<int:listing_id>", methods=["PUT"])
@jwt_required()
def admin_transfer_update(listing_id):
    """Редактировать любое объявление."""
    user_id = int(get_jwt_identity())
    me = User.query.get(user_id)
    if not me or me.role != "admin":
        return jsonify({"message": "Forbidden"}), 403

    listing = TransferListing.query.get(listing_id)
    if not listing:
        return jsonify({"message": "Not found"}), 404

    data = request.json or {}
    for field in ("game", "listing_type", "roles", "description", "region", "contact", "min_elo", "max_elo"):
        if field in data:
            setattr(listing, field, data[field])
    if "is_active" in data:
        listing.is_active = bool(data["is_active"])

    db.session.commit()
    return jsonify({"message": "Updated", "listing": _transfer_listing_to_dict(listing)})


@app.route("/api/admin/transfer/<int:listing_id>", methods=["DELETE"])
@jwt_required()
def admin_transfer_delete(listing_id):
    """Удалить любое объявление."""
    user_id = int(get_jwt_identity())
    me = User.query.get(user_id)
    if not me or me.role != "admin":
        return jsonify({"message": "Forbidden"}), 403

    listing = TransferListing.query.get(listing_id)
    if not listing:
        return jsonify({"message": "Not found"}), 404

    db.session.delete(listing)
    db.session.commit()
    return jsonify({"message": "Deleted"})


# ─────────────────────────────────────────────
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
