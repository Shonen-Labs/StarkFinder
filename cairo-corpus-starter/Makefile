venv:
	python -m venv .venv

install:
	pip install -r requirements.txt

scrape-github:
	python -m src.scrape_github --query "language:Cairo starknet erc" --max_repos 50

scrape-docs:
	python -m src.scrape_docs --max_items 50

scrape-blogs:
	python -m src.scrape_blogs --feeds feeds.txt --max_items 50

build:
	python -m src.clean_standardize
	python -m src.build_jsonl --out data/processed/dataset.jsonl

test:
	pytest -q
