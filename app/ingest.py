from app.embedding_engine import build_from_files
from pathlib import Path

RAW_DATA = Path("data/raw")

def main():
    files = list(RAW_DATA.glob("*.txt"))
    if not files:
        print("[ERROR] No scraped data found.")
        return

    build_from_files(files)

if __name__ == "__main__":
    main()
