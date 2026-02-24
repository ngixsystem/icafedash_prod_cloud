import requests
import json
import os
from datetime import date

# --- Configuration ---
# Your new API Key and License ID
API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYTllZWM3MGFjZTFmYzFiYTNlZWVhMzA1NGY5NjAxNWNmYWZhOGM4NDRhZmUxNjQ4NjYzZWQ3NmExNjM5YzJiYmJiNjU1YTNmYTc2NGQ3MDciLCJpYXQiOjE3NzE5MTQxODYuNTUwNzYzLCJuYmYiOjE3NzE5MTQxODYuNTUwNzY0LCJleHAiOjQ5Mjc1ODc3ODYuNTQ0MjE0LCJzdWIiOiIxNjEyODQ1NDk2NTcwNTEiLCJzY29wZXMiOltdfQ.KKIj35W0unwdOyr_ApuzfjlCWRp85Wp2SzkOZotolxzt4UCOrNh2uwywf5GNBfRSnU106LbiAcHFkMcMHJlJSc0YnGNPVaZseq5YVmYUwXjrOoVKfvfj97E411utb89TNbGd53exXt4whqMCpjSEknSazWUHyZkxA9VZKC7qmwfCFOnRbf_s1v5DYz0k2h1FT_2sDc1syNvRCTqvnMfAlbv-02MRgTqyi4iLEaE3VsXx2B2s5CvdtJU7D5oIUKcAb2xjpESAyRXiiIhbUEvMO25hcP2SvD-5qusK8hUuxj19649N52Sbu6RJX4pCcPSbxnpQAauf8_mu6qsaXW4oE_tHcsloBfaEb61mV6Vhu2qAYyHQCuH3uLmcB37BQ2k7pUfZsxeuhdqUssKSI7exbXht8YfWNr4Jer9rNmY7aJpDBgj-VTOgbXV2yad22yiR0VAdqeg19Y3xb_O4kTV6JNRRh1hi5NB46Ql4s4FIoi8nSS_JF4x8essiG9uzXPaxokvWdamIf4AIQZZr7ubVgmOJZhG6gtq7sBfIPVz_IoF3sD8wIYFU10CFrLwNZB-HxWls2lvGX0uFasugDK6oxfJo--8ood2uA9akVnY4sx6j2TI6e5HLIWnwjC0EZW-ovpJN4ddij9eSOlZFcIwnhj-FknJwywCOvCgZQG4B7TE"
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
