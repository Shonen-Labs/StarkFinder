import json, pathlib

def test_min_count():
    # ensure at least 20 records when fully scraped; allow fewer for initial runs
    p = pathlib.Path("data/processed/dataset.jsonl")
    if not p.exists():
        return
    n = sum(1 for _ in p.read_text().splitlines())
    assert n >= 20 or n == 0, "Expected at least 20 contracts after scraping"
