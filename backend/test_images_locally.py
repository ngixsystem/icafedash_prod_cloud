import requests
from bs4 import BeautifulSoup
import re

def test_club(club_id):
    base_url = "https://frag.gg"
    url = f"{base_url}/club/{club_id}"
    print(f"\nChecking Club ID {club_id}: {url}")
    
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        
        # Name
        h2 = soup.find("h2")
        name = h2.text.strip() if h2 else "N/A"
        print(f"Name: {name}")
        
        # Photo logic
        logo = ""
        top_img_div = soup.find("div", class_="clubDetailTopImage")
        if top_img_div and top_img_div.get("style") and "url(" in top_img_div["style"]:
            style = top_img_div["style"]
            match = re.search(r"url\((.*?)\)", style)
            if match:
                logo = match.group(1).strip("'\"")
                print(f"Found via background-image: {logo}")
        
        if not logo or "frag-og.png" in logo:
            og_img = soup.find("meta", property="og:image")
            if og_img and og_img.get("content") and "frag-og.png" not in og_img["content"]:
                logo = og_img["content"]
                print(f"Found via og:image: {logo}")
            else:
                for img in soup.find_all("img"):
                    src = img.get("src", "")
                    if "/uploads/club/" in src:
                        logo = src
                        print(f"Found via uploads/club/ path: {logo}")
                        break
        
        # Contacts
        phone = ""
        inst = ""
        for a in soup.find_all("a", href=True):
            h = a["href"]
            if "instagram.com" in h and "fragportal" not in h:
                inst = h
            if h.startswith("tel:"):
                phone = h
        
        print(f"Phone: {phone}")
        print(f"Instagram: {inst}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Test a few known IDs
    for cid in [233, 1, 2]:
        test_club(cid)
