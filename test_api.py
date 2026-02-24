import requests
import json
import os
from datetime import date

# --- Configuration ---
# Getting credentials from same logic as backend
ICAFE_BASE = "https://api.icafecloud.com/api/v2"
API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiM2M5ZTk2OTJkZTNmZWViN2Q3MTY1ZTk5Mzc0N2E1NDdmNWNhNzZmNmU4ZWJkZTE4ZjdjMmFhZTMwMTZkMThjMGNjNjllZTA2ZDU4NjMwNWUiLCJpYXQiOjE3NzE5MTM2MjguNjI4MTQxLCJuYmYiOjE3NzE5MTM2MjguNjI4MTQzLCJleHAiOjQ5Mjc1ODcyMjguNjI1MTk2LCJzdWIiOiIxNjEyODQ1NDk2NTcwNTEiLCJzY29wZXMiOltdfQ.ImURcwolD5SJTYMTbdIUqYhjVhB1JpjjBaNcx_a_NovNHC-IFuFR89gIqpPbKKiBL85kcZypf_GSaBIiV9HV9NbeZpvzxKf7GLST2Qd7k_SEjSBpC8Wzpn5uzbSvy0aA9mqcHDpH52-ozQS0OqEAd1zc0YFmgczqTZOlLNEQGpKZNYoLcOzUDZxRexEN1JVNiEA8dcg73hLs6BUWlzBWhrHezYCiF3SEGy0oi09uFw5o5x5tWfwmIOYUxhkB4MCVqU3R2ZtgTodx25-mLKmeED3dC7L_1clHQ03bI0y00RejNgU9J1IVf2FPayrWUVPDt_Amc7W2bCMi5nsT-31w79wMtI1-nx19ylFU1Xbctm9ZdYj3E8bjVe8SvfQEm14AEt-iGrZ_ydv6iNFRa-bKvLjizqTxrCDVntSviuaSS4iQqwYBIymoeIGM_CCm7drpobbJAdUdtwlxMkvH2a6hTE3geAErAtMjfJrYP3mRi4MXr7g-AmoNMa1g2KNerrVam508x8AwW8zWMLtinm59XClf4nuBaEsekLZyfyoHg0yyrcAH33twht8PVkFQH7Zv1wbRJFPIF_sC0IYjvJY6iT_itXa17eX6Mw_24pz3wD5WR_OuCnWAHmDxzrXNYEed_5r_ZWXrR-PhOzwnqKZvJ2k3ZbzsRzKJAQgbMrr4DR8"
CAFE_ID = "57051"

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
    
    ids_to_test = ["57051", "161284549657051"]
    
    for test_id in ids_to_test:
        print(f"\n\n{'#'*30} TESTING WITH CAFE_ID: {test_id} {'#'*30}")
        CAFE_ID = test_id
        
        # Test basic info
        test_endpoint("PC List (GET)", "/pcs/action/getList", "GET")
        test_endpoint("PC List (POST)", "/pcs/action/getList", "POST")
        
        # Test Members
        test_endpoint("Members (GET)", "/members", "GET", {"page": 1})
