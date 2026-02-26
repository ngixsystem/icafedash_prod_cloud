import requests
from bs4 import BeautifulSoup

url = "https://frag.gg/club/233"
res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(res.text, "html.parser")

print("Images:")
for img in soup.find_all("img"):
    print(img.get("class"), img.get("src"))

print("Backgrounds:")
for div in soup.find_all("div", style=True):
    if "background" in div["style"]:
        print(div.get("class"), div["style"])
