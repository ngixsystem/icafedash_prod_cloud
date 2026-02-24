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
    print(f"=== iCafeCloud API Tester ===")
    print(f"Server Public IP: {ip}")
    print(f"Testing for Cafe ID: {CAFE_ID}")
    print(f"{'='*30}\n")

    # According to docs, PC list can be retrieved via:
    # GET https://api.icafecloud.com/api/v2/cafe/{cafeId}/pcList
    
    endpoints = [
        {"name": "PC List Detailed", "path": "/pcList", "method": "GET"},
    ]

    all_results = {}
    for ep in endpoints:
        print(f"--- Testing {ep['name']} ---")
        url = f"{ICAFE_BASE}/cafe/{CAFE_ID}{ep['path']}"
        headers = {
            "Authorization": f"Bearer {API_KEY.strip()}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        try:
            resp = requests.get(url, headers=headers, params=ep.get("params"), timeout=10)
            data = resp.json()
            all_results[ep['name']] = data
            if data.get("code") == 200:
                print(f"✅ {ep['name']} Success!")
            else:
                print(f"❌ {ep['name']} Error: {data.get('message')}")
        except Exception as e:
            print(f"❌ {ep['name']} Error: {e}")
            
    with open("api_structure.json", "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    print("Full structure saved to api_structure.json")

if __name__ == "__main__":
    test_api()
