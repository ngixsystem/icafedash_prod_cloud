import requests
import json
import os
from datetime import date

# --- Configuration ---
# Getting credentials from same logic as backend
ICAFE_BASE = "https://api.icafecloud.com/api/v2"
API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNmY1YzI0OTU0NDkzNmVlNDlkODM5Y2M4NWRkYzZmMTg0ODA4MzJmMjRhNDZkNTQxM2UwZjFmOTY4ODhhYjYyYzhhNWM1NmU5ZDYwODBlNWMiLCJpYXQiOjE3NzE5MTMxNTAuNDgxODUxLCJuYmYiOjE3NzE5MTMxNTAuNDgxODUzLCJleHAiOjQ5Mjc1ODY3NTAuNDc4OTk0LCJzdWIiOiIxNjEyODQ1NDk2NTcwNTEiLCJzY29wZXMiOltdfQ.KipEZgAy6MzkQh3bv59y_cr4PVXlmBE35C8dLFzaadCeRr7anQN9XZ4qkftbOsEa5J7vIw8lhb74I6Y-3V04CJMDu5-v1NQCXs-dgPiZ59i1z19h3QVgOA-2iGgBMA0vNi852RstBGOVuSMqTDYoRRztAIRVQ5FpMYhvwTNJzbYoj-yTtQs7z8Bp1cx5yZ4A6ImijYm4IN8IBCh9svKeYkfvh0Rsklw4v8UW5KVzCFlgW5JKOjgbLXPLViRMzUtHrIaBo5vvI9eW9x6iaXeUNTo2rrxgwfEemKGJt3q3XE4H3t5KwdCcHM1L66qQh1RL0XtEj8L4duQLx0i5-7olVeVP2fKXI8kK9TZkG6fRMJL0EnxlPpOtqpokDupAi41J2sDBkuFY8bPTFqtd0HEA1-uwblFYGJc9v5i9IW8m5VNbs0rzJrb50Wqpy28E8xrkkyikM01pBmgLmEx9_QRknG5l5erO6Xq0ihl_xJRw7MvNualLb768NFdsS4mqYzYt_pNWIVayd9oML4JThWzGZA1LySCVmsDJd8FQti2MUdiV3H55STSezG2RW3XFlDs_EOppdSNpaToPnn9_b_LHNgaVl1jWcaY4DifweBgGscVGHdNROXA7EsekYO19-rDUI4JJe6Ag4yEaM2I8AqOlDvr-TKqoW3E0gC44GApp2ac"
CAFE_ID = "099818821572"

def test_endpoint(name, path, method="GET", params=None):
    print(f"\n{'='*20} Testing {name} ({method}) {'='*20}")
    url = f"{ICAFE_BASE}/cafe/{CAFE_ID}{path}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    print(f"Target URL: {url}")
    
    try:
        if method == "POST":
            response = requests.post(url, headers=headers, json=params or {}, timeout=15)
        else:
            response = requests.get(url, headers=headers, params=params or {}, timeout=15)
            
        print(f"HTTP Status: {response.status_code}")
        
        try:
            data = response.json()
            print("Response JSON:", json.dumps(data, indent=2, ensure_ascii=False))
        except:
            print("Raw Response Content (not JSON):")
            print(response.text[:500])
            
    except Exception as e:
        print(f"❌ [{name}] CONNECTION ERROR: {e}")

if __name__ == "__main__":
    print(f"iCafeCloud API Tester")
    
    ids_to_test = ["099818821572"]
    
    for test_id in ids_to_test:
        print(f"\n\n{'#'*30} TESTING WITH CAFE_ID: {test_id} {'#'*30}")
        CAFE_ID = test_id
        
        # Test basic info
        test_endpoint("PC List (GET)", "/pcs/action/getList", "GET")
        test_endpoint("PC List (POST)", "/pcs/action/getList", "POST")
        
        # Test Members
        test_endpoint("Members (GET)", "/members", "GET", {"page": 1})
