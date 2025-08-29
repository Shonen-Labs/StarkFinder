import os, time, json, re
from typing import Dict, Any, Iterable, List, Optional
import requests
from dotenv import load_dotenv

load_dotenv()
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
USER_AGENT = os.getenv("USER_AGENT", "cairo-corpus-bot/0.1")

def _headers():
    h = {"Accept": "application/vnd.github+json", "User-Agent": USER_AGENT}
    if GITHUB_TOKEN:
        h["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return h

headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}

def search_repos(query: str, per_page: int = 30, max_repos: int = 60) -> List[Dict[str, Any]]:
    """Search GitHub repos by query; returns basic metadata."""
    url = "https://api.github.com/search/repositories"
    params = {"q": query, "sort": "stars", "order": "desc", "per_page": min(100, per_page), "page": 1}
    out = []
    while len(out) < max_repos:
        r = requests.get(url, headers=headers, params=params, timeout=30)
        r.raise_for_status()
        items = r.json().get("items", [])
        if not items: break
        out.extend(items)
        params["page"] += 1
        if len(items) < params["per_page"]: break
        time.sleep(0.6)

    return out[:max_repos]

def get_repo_tree(owner: str, repo: str, branch: str = "main") -> List[Dict[str, Any]]:
    # get default branch first
    r = requests.get(f"https://api.github.com/repos/{owner}/{repo}", headers=_headers(), timeout=30)
    # r.raise_for_status()
    branch = r.json().get("default_branch", branch)
    r = requests.get(f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
                     headers=_headers(), timeout=30)
    # r.raise_for_status()
    return r.json().get("tree", [])

def get_file(owner: str, repo: str, path: str) -> str:
    r = requests.get(f"https://raw.githubusercontent.com/{owner}/{repo}/HEAD/{path}",
                     headers=_headers(), timeout=30)
    r.raise_for_status()
    return r.text
