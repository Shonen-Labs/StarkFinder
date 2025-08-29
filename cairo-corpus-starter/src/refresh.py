from .build_jsonl import main as build_jsonl
from .clean_standardize import main as clean_std
from .scrape_blogs import main as scrape_blogs
from .scrape_docs import main as scrape_docs
from .scrape_github import main as scrape_github


def refresh():
    # Example orchestrator
    scrape_github(query="language:Cairo starknet", max_repos=30)
    scrape_docs(max_items=30)
    scrape_blogs(max_items=30)
    clean_std()
    build_jsonl(out_path="data/processed/dataset.jsonl")


if __name__ == "__main__":
    refresh()
