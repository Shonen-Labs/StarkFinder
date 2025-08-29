import json, pathlib, datetime
from typing import Dict, Any, List
from .detect_cairo_version import detect_cairo_version
from .utils.text import strip_trailing_ws, normalize_indentation, is_duplicate
from src.utils.github_api import *

RAW = pathlib.Path("data/raw")
PROC = pathlib.Path("data/processed")
V1 = PROC / "cairo_v1"
V2 = PROC / "cairo_v2"
for p in [PROC, V1, V2]: p.mkdir(parents=True, exist_ok=True)

def _iter_raw():
    for path in RAW.rglob("*.json"):
        print(path)
        data = json.loads(path.read_text())
        yield path, data

def _write_split(code: str, meta: Dict[str, Any], name_hint: str):
    v = detect_cairo_version(code)
    sub = V2 if v == "2" else V1
    fname = (name_hint.replace("/","__").replace(" ","_"))[:100] + ".cairo"
    (sub / fname).write_text(code)
    return v, str((sub / fname).as_posix())

def main():
    seen: List[str] = []
    index: List[Dict[str, Any]] = []

    for path, data in _iter_raw():
    
        src = data.get("source") or data.get("meta",{}).get("source")
        # github shape
        if "files" in data and "meta" in data:
            meta = data["meta"]
            for rec in data["files"]:
                code = normalize_indentation(strip_trailing_ws(rec["code"]))
                # drops likely Cario 0.x: rough heuristic
                if "from starkware" in code or "felt" in code and "fn " not in code:
                    continue
                # dedup
                if any(is_duplicate(code, s) for s in seen):
                    continue
                seen.append(code)
                v, saved = _write_split(code, meta, meta["repo"]["full_name"] + "__" + rec["path"])
                index.append({
                    "contract_name": rec["path"].split("/")[-1].replace(".cairo",""),
                    "source": "github",
                    "type": "Other",
                    "cairo_version": v,
                    "last_updated": meta["repo"].get("last_commit",""),
                    "quality": {"category": "unknown"},
                    "repo": meta["repo"],
                    "code_path": saved
                })

        # docs/blog shape
        elif "blocks" in data and "source" in data:
            for i, code in enumerate(data["blocks"]):
                code = normalize_indentation(strip_trailing_ws(code))
                if len(code) < 40: 
                    continue
                if any(is_duplicate(code, s) for s in seen):
                    continue
                seen.append(code)
                v, saved = _write_split(code, data, f"{data.get('source')}_{i}")
                index.append({
                    "contract_name": f"{data.get('source')}_{i}",
                    "source": data["source"],
                    "type": "Other",
                    "cairo_version": v,
                    "last_updated": "",
                    "quality": {"category": "tutorial"},
                    "repo": {},
                    "code_path": saved
                })
    (PROC / "index.json").write_text(json.dumps(index, indent=2))

if __name__ == "__main__":
    main()
    # print(get_repo_tree("kkrt-labs", 'kakarot'))
    # print(len(search_repos("language: Cairo starknet", max_repos=2)))