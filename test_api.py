import requests
import json
import os
from datetime import date, timedelta

# --- Configuration ---
# Your new API Key and License ID
API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYjE4ZDA3NDdiNjgxM2ZjZDk0OGU1OGIxN2Q1NzNhZmIwMTFhZjc0NjE2YWYyNTc3N2QzM2JhMjc1NTU4NmM0YzAwNjlhN2RiZGFmNDI5NmIiLCJpYXQiOjE3NzE5MjgxNzUuMTY1MDIzLCJuYmYiOjE3NzE5MjgxNzUuMTY1MDI1LCJleHAiOjQ5Mjc2MDE3NzUuMTYxODI1LCJzdWIiOiIxNjEyODQ1NDk2NTcwNTEiLCJzY29wZXMiOltdfQ.MMrV9L10mTXuS8c9MiBJHVeno7js36saO0qtRKWZ2VTJzgjjs9IWmyXRTsudcu7ogOgTcTkdAGYymN_u3kpk-DX6hL6WM6osLGLA9R0sLhsWNZNMu7e74waMZfqXwV0N5q2n0gEyyU25gcAQl6NNoixU86167dOSPj2OasTFz96sgG74Lv4QhdI2BQsvwSEvrac9Lgwg9qN5t753JcVCZ5alSB4F7JvZkMHpM_7Mn-2W8SRGVJ4W_dJ_GEDKnv9sYzVr7GMKhH6HBk2zEioobBD2w-HBlaPD7mk76Mr3zRCXb3woVdAh_9HSatzeEA6unYDLrnSpnP_6MDrcPTEdLzw4fNiXWwFrpDo-VF4S6uuN0d6BxxYz_kA7IBGfJzFuJFnvQkTgGl3YbVD2SHXIunMCMP-xxOK1C8lPigUxwTGx6Bi8uzluF4SndBkN1uR8QybWT0Bqj2TdCvsUIGVvEdobnM5E9XSv7EeqFnEwQYs4zLJOCtn_n3dsLcWx_LadZcjmvMq2YkmzPpwJeZL4CzA9-HYWwAYU6W7XqFhNIHLMy1VEhpFIb8cf8G0KkfMD9t3hGDqJa3qshsNSbMF67ZVz8T4M13m81em9DzeEdUQCpM_mZlrq7IA_UJfmDjLhaAHx_3moh7P-nBEFZF9HkTnnNS75vloQTwWLScGvUBA"
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
