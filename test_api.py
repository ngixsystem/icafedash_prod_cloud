import requests
import json
import os
from datetime import date

# --- Configuration ---
# Getting credentials from same logic as backend
ICAFE_BASE = "https://api.icafecloud.com/api/v2"
API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNmY1YzI0OTU0NDkzNmVlNDlkODM5Y2M4NWRkYzZmMTg0ODA4MzJmMjRhNDZkNTQxM2UwZjFmOTY4ODhhYjYyYzhhNWM1NmU5ZDYwODBlNWMiLCJpYXQiOjE3NzE5MTMxNTAuNDgxODUxLCJuYmYiOjE3NzE5MTMxNTAuNDgxODUzLCJleHAiOjQ5Mjc1ODY3NTAuNDc4OTk0LCJzdWIiOiIxNjEyODQ1NDk2NTcwNTEiLCJzY29wZXMiOltdfQ.KipEZgAy6MzkQh3bv59y_cr4PVXlmBE35C8dLFzaadCeRr7anQN9XZ4qkftbOsEa5J7vIw8lhb74I6Y-3V04CJMDu5-v1NQCXs-dgPiZ59i1z19h3QVgOA-2iGgBMA0vNi852RstBGOVuSMqTDYoRRztAIRVQ5FpMYhvwTNJzbYoj-yTtQs7z8Bp1cx5yZ4A6ImijYm4IN8IBCh9svKeYkfvh0Rsklw4v8UW5KVzCFlgW5JKOjgbLXPLViRMzUtHrIaBo5vvI9eW9x6iaXeUNTo2rrxgwfEemKGJt3q3XE4H3t5KwdCcHM1L66qQh1RL0XtEj8L4duQLx0i5-7olVeVP2fKXI8kK9TZkG6fRMJL0EnxlPpOtqpokDupAi41J2sDBkuFY8bPTFqtd0HEA1-uwblFYGJc9v5i9IW8m5VNbs0rzJrb50Wqpy28E8xrkkyikM01pBmgLmEx9_QRknG5l5erO6Xq0ihl_xJRw7MvNualLb768NFdsS4mqYzYt_pNWIVayd9oML4JThWzGZA1LySCVmsDJd8FQti2MUdiV3H55STSezG2RW3XFlDs_EOppdSNpaToPnn9_b_LHNgaVl1jWcaY4DifweBgGscVGHdNROXA7EsekYO19-rDUI4JJe6Ag4yEaM2I8AqOlDvr-TKqoW3E0gC44GApp2ac"
CAFE_ID = "57051"

def test_endpoint(name, path, params=None):
    print(f"\n--- Testing {name} ---")
    url = f"{ICAFE_BASE}/cafe/{CAFE_ID}{path}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json",
    }
    
    try:
        response = requests.get(url, headers=headers, params=params or {}, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == 200:
                print("✅ Success: API returned data.")
                # Print a snippet of data
                if "data" in data:
                    print("Data keys found:", list(data["data"].keys()))
                else:
                    print("Response structure:", list(data.keys()))
            else:
                print(f"❌ API logical error: {data.get('message')}")
        else:
            print(f"❌ HTTP Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    print(f"iCafeCloud API Tester")
    print(f"Cafe ID: {CAFE_ID}")
    
    # 1. Test PC List
    test_endpoint("PC List", "/pcs/action/getList")
    
    # 2. Test Today's Report
    today = date.today().isoformat()
    test_endpoint("Today's Report", "/reports/reportData", {
        "date_start": today,
        "date_end": today,
        "time_start": "00:00",
        "time_end": "24:00",
        "data_source": "recent"
    })
    
    # 3. Test Members
    test_endpoint("Members List", "/members", {"page": 1})
