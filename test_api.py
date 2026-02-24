import requests
import json
import os
from datetime import date

# --- Configuration ---
# Your new API Key and License ID
API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNDNjMzA5MWI1NDBlYTE3MTdmY2UyYjRjYTJhNTJmNWQ1ODVkMTY2MGI5ZmE5Y2M0MDJmYmM4NWQyMzY3NjM4MGEzMmVhMDQ3MjBhNzdjOTkiLCJpYXQiOjE3NzE5MTU5MjcuMjIwOTcsIm5iZiI6MTc3MTkxNTkyNy4yMjA5NzMsImV4cCI6NDkyNzU4OTUyNy4yMTgxMzUsInN1YiI6IjE2MTI4NDU0OTY1NzA1MSIsInNjb3BlcyI6W119.oSlkFWsIph0lHRGx3Dg4I_YgtBFGGLgkW5oPKfgKrh2kfrIDYpOnLKCGfTbdXsbyBX8oUhyWMBxqnib4ZCwGvwBM8aPVmCOzeBDWbKGbMEYoSMNuwf2SewgQmvmws8CBvyNJJSHaykVS-wK_rOw0DWuygZrp9z_01HwDKgKhIDVCJjGaYkP1UDgt2r5cYkG_QjAlZ4q1UTYP1gBl38JkJk-uhIvFUab7Uhw-Cj-sFb70MkjfxjY-Q_zkmy8If8wa4vEpRMVNVzCjoWGiUkjX56usThLdgWQgqIvLuRiBGcBzVeZZnYws4QCOmwZ_K7q-GtMv67iMu32Gb3eujiHSll8aDmmpUO1iQM9vHyjXwb1mIPRW8UNSnUXqhMBaqOveYW5m036RelS5YNOfwYNZfYP_l3xwfR_ST3r6_HCHnjrh-rz4hWSTI78DHY_GFSV-QBRpjTMmkhltktbLatDyXIcGhvPA_03msKMML1SLxBVtqTPhwLKZNZMZuSxiCAQ3DD2voDQkVXuv9QCxLV-XSLOlJclHN01aUpTUNhg5zK2rZlngiOCPQ8iW8OyxPUkEDHZS0EiCfxec1KGptxzentAevFrE0FERr8t-A__Uoj8Q06WafCJlm5vGxf8jAKIW3j_QPoXCtLFMpjaOR-sjmAehvXmMEiAMyJvaprWoU1Y"
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
