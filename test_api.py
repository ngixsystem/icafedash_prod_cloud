import requests
import json
import os
from datetime import date

# --- Configuration ---
# Your new API Key and License ID
API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiMTZkOGUzZGU1NWFmZTE5ZTFmNzBjZTU0ZTg4MTExZDlkNGZlZmRkMWExY2M5NmJiMmExNmI1Y2Q0OGRkNjc4YzNkODE3NTQ4NDczNGU2NmQiLCJpYXQiOjE3NzE5MTcwNjUuOTUxOTQ5LCJuYmYiOjE3NzE5MTcwNjUuOTUxOTUyLCJleHAiOjQ5Mjc1OTA2NjUuOTQ4NjYyLCJzdWIiOiIxNjEyODQ1NDk2NTcwNTEiLCJzY29wZXMiOltdfQ.F4JKosunVhZJYIWXTe-HH0Z415vmk5N7-CO1TP76QyQ7gHymgM-KI6c3hlFnvKgiJ86KJB6k2iZt46PmzMiHwpeVyn7gC5JDlq3xgA5B6Ez2bOitONs93C7EvVeLf4YKS_EPbi7eIBWYJF3ydU9jf9wFyeYMr3x4yk0pIQJcY3UmoYHacdD4_oFTrlmXEXqfAgpADrUI_lJvhA2QdmcanVRMJx6dprlsUKp5Z2V-5_08Bo_0GBGyiE1EffO_rhIVbmLhElcDLkGPxO1E3E5_ZMHkVzXlLSMK0d4-zvKE3BjDTQrZxQ_JwYj3jVzMJbI4gdsIAqbJj9ajTH_HVL1UMXPJcumFuJQo2sOt8ncH-86dUbS6cY6SBIt6yUt37LY4ObKj9DfLyX2jQbT7nqkEzdJiHeBf_m2eytPTsMIq5oFrsPW1t3gDSxGtFi0bQjY2w5vS7QSVL6Vs0qAn_lExqlBC9GaWhk4AZuqU-1O1yZHivcjVYxZowFUa32-FzGdHgzIzIU4n110GZ-FAom-92-PEvP-HYZGXj02Fz9wP3xJsaZl3Dnl5k6Qs7oT1y0WCV_c_hPCDuIrMgIn2_QfvOl0tx97qkuoekyNlOduzfWZgj0ei_UZOQvnQpOS1OhKZzKqgKn8x2gzpuEVEoCjSo3KsiUTzRrtk_jFkQCztDNU"
CAFE_ID = "57051"
ICAFE_BASE = "https://api.icafecloud.com/api/v2"

def get_public_ip():
    try:
        return requests.get("https://api.ipify.org", timeout=5).text
    except:
        return "Unknown"

def test_api():
    ip = get_public_ip()
    print(f"=== iCafeCloud API Tester ===")
    print(f"Server Public IP: {ip}")
    print(f"Testing for Cafe ID: {CAFE_ID}")
    print(f"{'='*30}\n")

    # According to docs, PC list can be retrieved via:
    # GET https://api.icafecloud.com/api/v2/cafe/{cafeId}/pcList
    
    endpoints = [
        {"name": "PC List Detailed", "path": "/pcList", "method": "GET"},
        {"name": "License Info", "path": "/license/info", "method": "GET"},
        {"name": "Members List", "path": "/members", "method": "GET"},
    ]

    for ep in endpoints:
        print(f"--- Testing {ep['name']} ---")
        url = f"{ICAFE_BASE}/cafe/{CAFE_ID}{ep['path']}"
        headers = {
            "Authorization": f"Bearer {API_KEY.strip()}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            print(f"HTTP Status: {resp.status_code}")
            
            try:
                data = resp.json()
                print("Response JSON:", json.dumps(data, indent=2, ensure_ascii=False))
                
                if data.get("code") == 200:
                    print(f"✅ Success!")
                    if "data" in data and isinstance(data["data"], list):
                         print(f"Found {len(data['data'])} items.")
                else:
                    print(f"❌ API Error: {data.get('message')}")
            except:
                print("Response is not JSON. Raw body snippet:")
                print(resp.text[:300])
        except Exception as e:
            print(f"❌ Connection Error: {e}")
        print("-" * 30)

if __name__ == "__main__":
    test_api()
