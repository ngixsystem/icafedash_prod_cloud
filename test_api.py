import requests
import json
import os
from datetime import date

# --- Updated Configuration from User ---
ICAFE_BASE = "https://api.icafecloud.com/api/v2"
API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYTllZWM3MGFjZTFmYzFiYTNlZWVhMzA1NGY5NjAxNWNmYWZhOGM4NDRhZmUxNjQ4NjYzZWQ3NmExNjM5YzJiYmJiNjU1YTNmYTc2NGQ3MDciLCJpYXQiOjE3NzE5MTQxODYuNTUwNzYzLCJuYmYiOjE3NzE5MTQxODYuNTUwNzY0LCJleHAiOjQ5Mjc1ODc3ODYuNTQ0MjE0LCJzdWIiOiIxNjEyODQ1NDk2NTcwNTEiLCJzY29wZXMiOltdfQ.KKIj35W0unwdOyr_ApuzfjlCWRp85Wp2SzkOZotolxzt4UCOrNh2uwywf5GNBfRSnU106LbiAcHFkMcMHJlJSc0YnGNPVaZseq5YVmYUwXjrOoVKfvfj97E411utb89TNbGd53exXt4whqMCpjSEknSazWUHyZkxA9VZKC7qmwfCFOnRbf_s1v5DYz0k2h1FT_2sDc1syNvRCTqvnMfAlbv-02MRgTqyi4iLEaE3VsXx2B2s5CvdtJU7D5oIUKcAb2xjpESAyRXiiIhbUEvMO25hcP2SvD-5qusK8hUuxj19649N52Sbu6RJX4pCcPSbxnpQAauf8_mu6qsaXW4oE_tHcsloBfaEb61mV6Vhu2qAYyHQCuH3uLmcB37BQ2k7pUfZsxeuhdqUssKSI7exbXht8YfWNr4Jer9rNmY7aJpDBgj-VTOgbXV2yad22yiR0VAdqeg19Y3xb_O4kTV6JNRRh1hi5NB46Ql4s4FIoi8nSS_JF4x8essiG9uzXPaxokvWdamIf4AIQZZr7ubVgmOJZhG6gtq7sBfIPVz_IoF3sD8wIYFU10CFrLwNZB-HxWls2lvGX0uFasugDK6oxfJo--8ood2uA9akVnY4sx6j2TI6e5HLIWnwjC0EZW-ovpJN4ddij9eSOlZFcIwnhj-FknJwywCOvCgZQG4B7TE"

# Candidates for Cafe ID
# Added "" to test the double slash pattern seen in docs: cafe//endpoint
IDS_TO_TEST = ["57051", "", "161284549657051"]

# Endpoints derived from docs
ENDPOINTS_TO_TEST = [
    {"name": "License Info", "path": "/license/info", "method": "GET"},
    {"name": "PC List Detailed", "path": "/pcList", "method": "GET"},
    {"name": "Get PC list (action)", "path": "/pcs/action/getPcsList", "method": "GET", "query": {"pc_name": ""}},
    {"name": "Members List", "path": "/members", "method": "GET", "query": {"page": 1}},
]

def test_config(cafe_id, endpoint):
    name = endpoint["name"]
    path = endpoint["path"]
    method = endpoint["method"]
    query = endpoint.get("query", {})
    
    url = f"{ICAFE_BASE}/cafe/{cafe_id}{path}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    print(f"\n>>> [{cafe_id}] {name} ({method})")
    print(f"URL: {url}")
    
    try:
        if method == "POST":
            resp = requests.post(url, headers=headers, json=query, timeout=10)
        else:
            resp = requests.get(url, headers=headers, params=query, timeout=10)
            
        print(f"Status: {resp.status_code}")
        try:
            data = resp.json()
            # Print a clean version of success or error
            if data.get("code") == 200:
                print(f"✅ SUCCESS")
                # If it's a list, show count
                if "data" in data and isinstance(data["data"], list):
                    print(f"Items found: {len(data['data'])}")
                    if len(data['data']) > 0:
                        print("First item preview:", json.dumps(data['data'][0], indent=2, ensure_ascii=False)[:300])
                else:
                    print("Response keys:", list(data.keys()))
            else:
                print(f"❌ API Error: {data.get('code')} - {data.get('message')}")
        except:
            print("Raw body (first 200 chars):", resp.text[:200])
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    print("=== iCafeCloud API Comprehensive Tester ===")
    for cid in IDS_TO_TEST:
        print(f"\n{'='*50}")
        print(f"TESTING WITH CAFE ID: {cid}")
        print(f"{'='*50}")
        for ep in ENDPOINTS_TO_TEST:
            test_config(cid, ep)
