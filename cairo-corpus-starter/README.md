# Cairo Contract Dataset Starter

End-to-end pipeline to build a structured, high-quality dataset of Cairo smart contracts for LLM fine-tuning (code generation + deployment assistance).

## Features
- Scrapers: GitHub, Starknet docs/tutorials, community/blogs
- Cleaning & standardization: deduplication, formatting, Cairo version split
- Metadata schema + JSONL builder
- Quality tagging (production vs tutorial, reliability score)
- Tests for integrity and reproducibility

## Quickstart
```bash
python -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Set your GitHub token (recommended to avoid rate limits)
cp .env.example .env
# edit .env with GITHUB_TOKEN=...

# Crawl (examples)
python -m src.scrape_github --query "language:Cairo starknet erc20 erc721" --max_repos 50
python -m src.scrape_docs --max_items 50
python -m src.scrape_blogs --feeds feeds.txt --max_items 50

# Build dataset
python -m src.clean_standardize
python -m src.build_jsonl --out data/processed/dataset.jsonl

# Validate
pytest -q
```

## Data Layout
```
data/
  raw/         # raw scraped files + metadata
  processed/   # cleaned code, split by version, finalized JSONL
```

## JSONL Record Schema
See `src/schema.py` for full definition. Minimal example:
```json
{
  "contract_name": "ERC20",
  "source": "github",
  "type": "ERC20",
  "cairo_version": "2",
  "last_updated": "2025-01-01",
  "quality": {"category": "production", "score": 0.83},
  "repo": {"url": "...", "stars": 123, "forks": 10},
  "code": "contract ERC20 ..."
}
```

## Notes
- The scrapers prefer **production** contracts via heuristics (stars/forks/archived, presence of tests/audit files, CI).
- Tutorials/examples are tagged to avoid contaminating production distributions.
- Re-run safely: scrapers are idempotent and store checkpoints under `data/raw`.
