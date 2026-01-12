import requests
from bs4 import BeautifulSoup
from pathlib import Path

DATA_DIR = Path("data/raw")
DATA_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {"User-Agent": "FounderOS/1.0"}

URLS = {
    "steve_jobs_wikipedia": "https://en.wikipedia.org/wiki/Steve_Jobs",
    # Keep this commented until you add a verified link
    # "jobs_interview_1995": "https://www.pbs.org/wgbh/americanexperience/features/jobs-interview/",
}

def scrape_page(name, url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=30)
        r.raise_for_status()
    except Exception as e:
        print(f"[SKIPPED] {url} ({e})")
        return

    soup = BeautifulSoup(r.text, "html.parser")
    text = "\n".join(p.get_text() for p in soup.find_all("p"))

    out = DATA_DIR / f"{name}.txt"
    out.write_text(text, encoding="utf-8")
    print(f"Saved {out}")

def run():
    for name, url in URLS.items():
        scrape_page(name, url)

if __name__ == "__main__":
    run()
