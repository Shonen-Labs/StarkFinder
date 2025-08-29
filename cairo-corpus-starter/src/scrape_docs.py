import json, pathlib, re, requests
from bs4 import BeautifulSoup
from tqdm import tqdm

RAW_DIR = pathlib.Path("data/raw/docs")
RAW_DIR.mkdir(parents=True, exist_ok=True)

DOC_URLS = []

def generate_doc_urls():

    global DOC_URLS

    # Fetch the whole docs.
    response = requests.get("https://www.starknet.io/cairo-book/ch07-05-separating-modules-into-different-files.html")
    soup = BeautifulSoup(response.text, "html.parser")

    # Find all <li> elements with class "chapter-item expanded"
    chapter_items = soup.find_all("li", class_="chapter-item expanded")

    # Extract <a> tags inside those <li> elements
    for item in chapter_items:
        a_tags = item.find_all("a", href=True)
        for a in a_tags:
            DOC_URLS.append(f"https://www.starknet.io/cairo-book/{a["href"]}")


def extract_code_blocks(html: str):
    soup = BeautifulSoup(html, "html.parser")
    blocks = []
    for code in soup.find_all("code"):
        txt = code.get_text("\n")
        if "use::core" in txt or "starknet::" in txt or "pub" in txt or "mod" in txt or "fn " in txt:
            blocks.append(txt)
    return blocks


def main(max_items: int = 50):
    count = 0
    for url in tqdm(DOC_URLS, desc="docs"):
        try:
            r = requests.get(url, timeout=30)
            r.raise_for_status()
            blocks = extract_code_blocks(r.text)
        except Exception as e:
            print("skip", url, e)
            continue
        if not blocks: 
            continue
        out = RAW_DIR / ("docs_" + re.sub(r"[^a-z0-9]+","_",url.lower()) + ".json")
        out.write_text(json.dumps({"source":"docs","url":url,"blocks":blocks[:max_items]}, indent=2))
        count += 1
        if count >= max_items:
            break

if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--max_items", type=int, default=50)
    args = ap.parse_args()
    
    # Generate all possible URL's that can contain .cairo files from the docs.
    generate_doc_urls()
    main(args.max_items)


