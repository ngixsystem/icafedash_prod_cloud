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
                        
                        # Парсим название (обычно h1 или h2 на странице клуба/профиля)
                        # Точный селектор зависит от верстки frag.gg. Пример:
                        name_tag = c_soup.find("h1") or c_soup.find("h2")
                        name = name_tag.text.strip() if name_tag else "Unknown Club"
                        
                        # Избегаем дублирования
                        existing = Club.query.filter_by(name=name).first()
                        if existing:
                            print(f"  Клуб '{name}' уже есть в БД. Пропуск.")
                            continue
                            
                        # Извлекаем фото. 
                        # Лучший вариант: OpenGraph Image
                        logo = ""
                        og_img = c_soup.find("meta", property="og:image")
                        if og_img and og_img.get("content"):
                            logo = og_img["content"]
                        else:
                            # Запасной: Например <img class="logo" src="...">
                            img_tag = c_soup.find("img", {"class": re.compile(r"logo|avatar|image|foto", re.IGNORECASE)})
                            if not img_tag:
                                # Ищем просто большую картинку
                                for img in c_soup.find_all("img"):
                                    if "avatar" in img.get("src", "").lower() or "upload" in img.get("src", "").lower():
                                        img_tag = img
                                        break
                                        
                            if img_tag and img_tag.get("src"):
                                src = img_tag["src"]
                                logo = src if src.startswith("http") else base_url + src
                        # Извлекаем контакты (телефон и адрес) - 
                        # Ищем по тексту
                        address = "Адрес не указан"
                        phone = ""
                        description = ""
                        
                        # Наивный парсинг всех параграфов
                        for p in c_soup.find_all(["p", "div", "span", "li"]):
                            text = p.text.strip()
                            # Телефон
                            if not phone and re.search(r"(\+?\d{1,3}[\s-]?\(?\d{2,3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})", text):
                                phone_match = re.search(r"(\+?\d{1,3}[\s-]?\(?\d{2,3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})", text)
                                if phone_match:
                                    phone = phone_match.group(1)
                            # Адрес
                            if "улица" in text.lower() or "ул." in text.lower() or "пр." in text.lower() or "район" in text.lower():
                                if len(text) < 150:
                                    address = text

                        # Пробуем найти iframe карты, чтобы вытащить координаты (lat, lng)
                        lat, lng = 0.0, 0.0
                        for iframe in c_soup.find_all("iframe"):
                            src = iframe.get("src", "")
                            # Например Яндекс карты: ll=37.6173,55.7558
                            ll_match = re.search(r"ll=([\d\.]+),([\d\.]+)", src)
                            if ll_match:
                                lng = float(ll_match.group(1))
                                lat = float(ll_match.group(2))
                                break
                            
                        # Также можно спарсить VIP залы, ПК и т.д., но для этого нужна модель Zone.
                        
                        new_club = Club(
                            name=name[:100],
                            api_key="",
                            cafe_id="",
                            club_logo_url=logo[:255],
                            address=address[:255],
                            phone=phone[:50],
                            description=description,
                            lat=lat,
                            lng=lng
                        )
                        db.session.add(new_club)
                        db.session.commit()
                        clubs_added += 1
                        print(f"  [+] Добавлен клуб: {name}")
                        
                        time.sleep(1) # Не спамим запросами
                        
                    except Exception as e:
                        print(f"  [!] Ошибка при парсинге {club_url}: {e}")
            except Exception as e:
                print(f"[!] Ошибка запроса страницы {page}: {e}")
                
        print(f"\n✅ Парсинг завершён! Добавлено клубов: {clubs_added}")

if __name__ == "__main__":
    scrape_clubs()
