import requests
from bs4 import BeautifulSoup
import re

def test_scrape_images(url="https://frag.gg/club/233"):
    print(f"Scraping URL: {url}\n")
    res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
    soup = BeautifulSoup(res.text, 'html.parser')

    print("--- 1. All Image Tags ---")
    imgs = soup.find_all("img")
    for idx, img in enumerate(imgs):
        print(f"[{idx+1}] Class: {img.get('class')}, SRC: {img.get('src')}")

    print("\n--- 2. All Style Backgrounds (divs) ---")
    divs = soup.find_all("div", style=True)
    for idx, div in enumerate(divs):
        if "background" in div["style"]:
            print(f"[{idx+1}] Class: {div.get('class')}, Style: {div['style']}")

    print("\n--- 3. OpenGraph Meta Tags ---")
    for meta in soup.find_all("meta"):
        if meta.get("property") == "og:image":
            print(f"og:image: {meta.get('content')}")

if __name__ == "__main__":
    test_scrape_images()
