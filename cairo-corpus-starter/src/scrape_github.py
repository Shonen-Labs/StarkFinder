import json, os, re, pathlib, datetime
from typing import Dict, Any, List
from tqdm import tqdm
from .utils.github_api import search_repos, get_repo_tree, get_file

RAW_DIR = pathlib.Path("data/raw/github")
RAW_DIR.mkdir(parents=True, exist_ok=True)

def _meta_from_repo(repo_item) -> Dict[str, Any]:
    return {
        "source": "github",
        "repo": {
            "url": repo_item["html_url"],
            "stars": repo_item.get("stargazers_count", 0),
            "forks": repo_item.get("forks_count", 0),
            "last_commit": repo_item.get("pushed_at", ""),
            "archived": repo_item.get("archived", False),
            "full_name": repo_item.get("full_name", ""),
        }
    }

def _has_tests_or_ci(tree_paths: List[str]) -> Dict[str, bool]:
    j = "\n".join(tree_paths)
    return {
        "has_tests": bool(re.search(r"\btests?\b|\.github/workflows", j, flags=re.IGNORECASE)),
        "has_ci": bool(re.search(r"\.github/workflows|circleci|travis|github/workflows", j, flags=re.IGNORECASE)),
        "has_audit": bool(re.search(r"audit|security", j, flags=re.IGNORECASE)),
    }

def collect_from_repo(full_name: str) -> List[Dict[str, Any]]:
    owner, repo = full_name.split("/")
    tree = get_repo_tree(owner, repo)
    tree_paths = [t["path"] for t in tree if t.get("type") == "blob"]
    # print(tree_paths)
    flags = _has_tests_or_ci(tree_paths)
    
    # Create a folder as UserName/RepoName, after that we insert the .cairo files inside them.
    dir_name = f"data/raw/github/{full_name}"
    os.makedirs(dir_name, exist_ok=True)

    print(flags)
    outputs = []
    i = 0
    files_required = 5
    for path in tree_paths:
        if not path.endswith(".cairo"): 
            continue
        
        # Get only 5 .cairo files from a repo
        if (i > files_required - 1):
            break

        i += 1
        code = get_file(owner, repo, path)

        cairo_file_name = path.split('/')[-1]
        
        # Write the file into desired dir.
        with open(f'{os.path.join(dir_name, cairo_file_name)}', 'w') as file:
            file.write(code)

        rec = {"path": path, "code": code}
        rec.update(flags)
        outputs.append(rec)

    return outputs

def main(query: str, max_repos: int = 50):
    repos = search_repos(query=query, per_page=1, max_repos=max_repos)
    for item in tqdm(repos, desc="repos"):

        meta = _meta_from_repo(item)
        full = item["full_name"]
        try:
            files = collect_from_repo(full)
        except Exception as e:
            print("skip", full, e)
            continue
    
        # Save the whole meta-data for 3rd (Data Cleaning & Standardization) step.
        payload = {"meta": meta, "files": files}
        out = RAW_DIR / (full.replace("/", "__") + ".json")
        out.write_text(json.dumps(payload, indent=2))


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--query", default='language:Cairo starknet')
    ap.add_argument("--max_repos", type=int, default=50)
    args = ap.parse_args()
    main(args.query, args.max_repos)
    # h = search_repos(args.query, max_repos=args.max_repos)
    # print(_meta_from_repo(h[0])['repo']['full_name'])
    # print(collect_from_repo(_meta_from_repo(h[0])['repo']['full_name']))
    # print(collect_from_repo("kkrt-labs/kakarot"))
    # print(get_repo_tree("Scorpion-123", "DynoGPT"))
