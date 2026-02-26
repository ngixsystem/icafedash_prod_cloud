import os
import requests
from bs4 import BeautifulSoup
import time
import re

# Настраиваем окружение, чтобы импортировать app
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db, Club

# Вы можете запустить этот скрипт прямо на VDS:
# docker-compose exec backend python scraper.py

def scrape_clubs():
    base_url = "https://frag.gg"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 MQQBrowser/10.0.0.0 Safari/537.36"
    }

    clubs_added = 0
    with app.app_context():
        # Страниц примерно 5, можно парсить до тех пор, пока есть клубы
        for page in range(1, 10):
            print(f"Парсинг страницы {page}...")
            url = f"{base_url}/club/index?page={page}"
            try:
                res = requests.get(url, headers=headers, timeout=10)
                if res.status_code != 200:
                    break
                    
                soup = BeautifulSoup(res.text, "html.parser")
                # Ищем ссылки на профили клубов
                # Обычно они выглядят как <a href="/club/123">
                club_links = set()
                for a in soup.find_all("a", href=True):
                    href = a["href"]
                    if href.startswith("/club/") and href != "/club/" and "page=" not in href:
                        club_links.add(base_url + href)
                
                if not club_links:
                    break # Если клубов нет на странице, выходим
                
                for club_url in club_links:
                    try:
                        print(f"  Проверка: {club_url}")
                        c_res = requests.get(club_url, headers=headers, timeout=10)
                        if c_res.status_code != 200:
                            continue
                            
                        c_soup = BeautifulSoup(c_res.text, "html.parser")
                        
                        # Парсим название 
                        name_tag = c_soup.find("h1") or c_soup.find("h2")
                        if not name_tag:
                            og_title = c_soup.find("meta", property="og:title")
                            name = og_title["content"] if og_title else "Unknown Club"
                        else:
                            name = name_tag.text.strip()
                        
                        existing = Club.query.filter_by(name=name).first()
                        
                        # --- Извлекаем фото ---
                        logo = ""
                        # 1. Проверяем основной баннер клуба (background-image)
                        top_img_div = c_soup.find("div", class_="clubDetailTopImage")
                        if top_img_div and top_img_div.get("style") and "url(" in top_img_div["style"]:
                            style = top_img_div["style"]
                            match = re.search(r"url\((.*?)\)", style)
                            if match:
                                logo = match.group(1).strip("'\"")
                        
                        # 2. Если нет, ищем в галерее или og:image
                        if not logo or "frag-og.png" in logo:
                            # Проверяем og:image
                            og_img = c_soup.find("meta", property="og:image")
                            if og_img and og_img.get("content") and "frag-og.png" not in og_img["content"]:
                                logo = og_img["content"]
                            else:
                                # Ищем первую картинку из загрузок клуба
                                for img in c_soup.find_all("img"):
                                    src = img.get("src", "")
                                    if "/uploads/club/" in src:
                                        logo = src
                                        break
                        
                        if logo and not logo.startswith("http"):
                            logo = base_url + logo

                        # --- Контакты и инфо ---
                        phone = ""
                        instagram = ""
                        address = "Адрес не указан"
                        
                        # Извлекаем данные из страницы
                        for a in c_soup.find_all("a", href=True):
                            href = a["href"]
                            if "instagram.com" in href and "fragportal" not in href:
                                instagram = href
                            if href.startswith("tel:"):
                                phone = href.replace("tel:", "").strip()

                        for p in c_soup.find_all(["p", "div", "span", "li"]):
                            text = p.text.strip()
                            if not phone and re.search(r"(\+?998[\s-]?\(?\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})", text):
                                m = re.search(r"(\+?998[\s-]?\(?\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})", text)
                                if m: phone = m.group(1)
                            if ("улица" in text.lower() or "ул." in text.lower() or "г." in text.lower()) and len(text) < 150:
                                if "frag portal" not in text.lower() and "frag.gg" not in text.lower():
                                    address = text

                        # Если клуб уже есть, ОБНОВЛЯЕМ его данные (особенно если нет фото)
                        if existing:
                            print(f"  Клуб '{name}' уже в базе. Обновляем данные...")
                            if not existing.club_logo_url or "frag-og.png" in existing.club_logo_url:
                                existing.club_logo_url = logo
                            if not existing.phone: existing.phone = phone
                            if not existing.instagram: existing.instagram = instagram
                            if address != "Адрес не указан" and not existing.address: existing.address = address
                            db.session.commit()
                            print(f"      [~] Обновлено: {name} | Фото: {'OK' if logo else 'Fail'}")
                            continue

                        new_club = Club(
                            name=name[:100],
                            api_key="",
                            cafe_id="",
                            club_logo_url=logo[:255],
                            address=address[:255],
                            phone=phone[:50],
                            description="",
                            instagram=instagram[:100],
                            working_hours="Круглосуточно",
                            lat=0.0,
                            lng=0.0
                        )
                        db.session.add(new_club)
                        db.session.commit()
                        clubs_added += 1
                        print(f"  [+] Добавлен: {name}")
                        print(f"      - Фото: {logo[:50]}...")
                        print(f"      - Тел: {phone}")
                        print(f"      - Inst: {instagram}")
                        
                        time.sleep(1) # Не спамим запросами
                        
                    except Exception as e:
                        print(f"  [!] Ошибка при парсинге {club_url}: {e}")
            except Exception as e:
                print(f"[!] Ошибка запроса страницы {page}: {e}")
                
        print(f"\n✅ Парсинг завершён! Добавлено клубов: {clubs_added}")

if __name__ == "__main__":
    scrape_clubs()
