import json, pathlib, re, time, requests, os
from datetime import datetime
from bs4 import BeautifulSoup
import tests.test_schema

RAW_DIR = pathlib.Path("data/raw/blogs")
RAW_DIR.mkdir(parents=True, exist_ok=True)

def fetch(url: str) -> str:
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    return r.text

def extract_code(html: str):
    soup = BeautifulSoup(html, "html.parser")
    out = []
    for pre in soup.find_all(["pre","code"]):
        txt = pre.get_text("\n")
        if "use::core" in txt or "starknet::" in txt or "pub" in txt or "mod" in txt or "fn " in txt:
            out.append(txt)

    return out

def main(feeds_file: str = "feeds.txt", max_items: int = 50):
    feeds = [ln.strip() for ln in pathlib.Path(feeds_file).read_text().splitlines() if ln.strip() and not ln.startswith("#")]
    print(feeds)
    n = 0
    for feed in feeds:
        try:
            xml = fetch(feed)
            code = extract_code(xml)

            file_name = os.path.join(RAW_DIR, f'cairo_blog_{datetime.now().strftime("%d-%m-%Y %H-%M-%S")}.txt')
            print(file_name)

            with open(file_name, 'a') as file:
                for c in code:
                    try:
                        file.write(c + '\n')
                    except Exception as e:
                        print(e)

        except Exception as e:
            print("skip feed", feed, e)
            continue

        # For Naive XML based RSS Parsing...
        # # naive RSS parse to avoid extra deps
        # links = re.findall(r"<link>(.*?)</link>", xml)
        # # filter obvious platform links
        # links = [l for l in links if l.startswith("http")]
        # for link in links[:max_items]:
        #     try:
        #         html = fetch(link)
        #         codes = extract_code(html)
        #         print(codes)
        #         if codes:
        #             out = RAW_DIR / ("blog_" + re.sub(r"[^a-z0-9]+","_", link.lower())[:150] + ".json")
        #             out.write_text(json.dumps({"source":"blog","url":link,"blocks":codes}, indent=2))
        #             n += 1

        #     except Exception as e:
        #         print("skip post", link, e)
        # if n >= max_items:
        #     break


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--feeds", default="feeds.txt")
    ap.add_argument("--max_items", type=int, default=50)
    args = ap.parse_args()
    main(args.feeds, args.max_items)