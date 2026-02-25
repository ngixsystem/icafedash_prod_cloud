import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Google Workspace SMTP
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "support@icafedash.com"
SMTP_PASSWORD = "T@shkent"
SMTP_FROM = "support@icafedash.com"
TO_EMAIL = "ngix@inbox.ru"

msg = MIMEMultipart("alternative")
msg["Subject"] = "iCafe Dashboard - Test"
msg["From"] = SMTP_FROM
msg["To"] = TO_EMAIL

html = "<html><body><h1 style='color:#2dd4bf;'>SMTP Works!</h1><p>Test from iCafe Dashboard</p></body></html>"
msg.attach(MIMEText(html, "html"))

try:
    print(f"Connecting to {SMTP_HOST}:{SMTP_PORT}...")
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
    server.ehlo()
    server.starttls()
    server.ehlo()
    print("TLS OK")
    server.login(SMTP_USER, SMTP_PASSWORD)
    print("Login OK!")
    server.sendmail(SMTP_FROM, TO_EMAIL, msg.as_string())
    print(f"Email sent to {TO_EMAIL}!")
    server.quit()
except smtplib.SMTPAuthenticationError as e:
    print(f"Auth failed: {e}")
    print("\nGoogle Workspace requires App Password if 2FA is enabled.")
    print("Go to: https://myaccount.google.com/apppasswords")
    print("Or enable 'Less secure apps' in Google Admin Console.")
except Exception as e:
    print(f"Error: {e}")
