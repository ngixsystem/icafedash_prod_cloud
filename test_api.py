import requests
import json
import os
from datetime import date, timedelta

# --- Configuration ---
# Your new API Key and License ID
API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiY2YwNTc4NjY2ZTVmNGQ2MDg4MjFmZTdjNTkzYjNkZmY3YmVjZDU5MTczOTkyZGE4NWY2ZDIzOGMwMWQzZDgyMzM2NTE1MzVkODdlYTRjMGQiLCJpYXQiOjE3NzE5MTc5MDIuMzQ3MzU5LCJuYmYiOjE3NzE5MTc5MDIuMzQ3MzYxLCJleHAiOjQ5Mjc1OTE1MDIuMzQzMzI3LCJzdWIiOiIxNjEyODQ1NDk2NTcwNTEiLCJzY29wZXMiOltdfQ.KNBpx4x2QfwtVKXEWGWLAh-Jpm0TdLHU-6QjB3wF2wtsJ0AwnT056twDOvc50c9rgspazTqNbR7IQSZ-rJC2A-WDJxRHnCyEppyDGCDHqhFRBsg7Ab-WhRefkqyz4oL5vDWwIC6O2l7-FI0KKaeOK5zPQ3jGtnTzn1sXd7AwLYvmWBD5ba2iBrgNBu_V6u6GRs5i7lFK_qG-8MC3F38MzfBegLjGXtNv6ut3N1IyCaA_gqpIFoTOaQ-nD9wIP4_J1HWQTdP2CG6WtgOmTy7QRmPWpN9yL_Ezl377vNjyLis9WaXWLmH-611jCNtylRe3bSfBpBrhcSh6FMTS8rf1UKKlPnexrJZaPSwje3Ri3L3WTb3H6FpLe1OlDxb-gfjCaedSmiFX8Sx1Gb3ME-xup6V5QHYz3ifZJkkwAgbDgxnwmj0yHoeD2kYNJDgeWgBNn5fAHitQmEag0zPD3d81htlo2bBSbhOs--d6UxH7gRn3Vhj_TMwTP-dmm6VdNqxqlQvQjdCr5OCMEvvcsxJq1iyTbTZAG2UCd4Pkf_emzFBwspReUXiYFdobxEfOGe5XkvCM79jvJ5xp6iMghtx1M2zZ5xREVoGQ3dYqn6SM0xn10XZsfi5gyiqe2EL2crXphKY47QuZJmuANNRvi1W_zd2o_fPne0FZpzzAx3ryz1E"
CAFE_ID = "57051"
ICAFE_BASE = "https://api.icafecloud.com/api/v2"

def get_public_ip():
    try:
        return requests.get("https://api.ipify.org", timeout=5).text
    except:
        return "Unknown"

def test_api():
    ip = get_public_ip()
    print(f"=== iCafeCloud API Diagnostic ===")
    print(f"Server Public IP: {ip}")
    print(f"Testing for Cafe ID: {CAFE_ID}")
    print(f"Key Length: {len(API_KEY.strip())} characters")
    print(f"Key Starts With: {API_KEY.strip()[:20]}...")
    print(f"{'='*30}\n")

    url = f"{ICAFE_BASE}/cafe/{CAFE_ID}/pcList"
    
    # Try different Authorization formats
    auth_formats = [
        f"Bearer {API_KEY.strip()}",
        API_KEY.strip() # Some APIs don't want the prefix if it's already in the key
    ]

    for i, auth in enumerate(auth_formats):
        print(f"--- Attempt {i+1} (Auth: {'Bearer' if auth.startswith('Bearer') else 'Raw'}) ---")
        headers = {
            "Authorization": auth,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            print(f"HTTP Status: {resp.status_code}")
            print(f"Response Headers: {json.dumps(dict(resp.headers), indent=2)}")
            
            try:
                data = resp.json()
                print(f"Response JSON: {json.dumps(data, indent=2, ensure_ascii=False)}")
                if data.get("code") == 200:
                    print(f"✅ SUCCESS on Attempt {i+1}!")
                    break
                else:
                    print(f"❌ API Error: {data.get('message')}")
            except:
                print(f"Raw Response Content: {resp.text[:500]}")
        except Exception as e:
            print(f"❌ Request Error: {e}")
        print("-" * 30)

if __name__ == "__main__":
    test_api()
