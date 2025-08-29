import json
import pathlib

import orjson
from jsonschema import validate

from .schema import schema

PROC = pathlib.Path("data/processed")


def main(out_path: str = "data/processed/dataset.jsonl"):
    idx = json.loads((PROC / "index.json").read_text())
    with open(out_path, "wb") as f:
        for rec in idx:
            # hydrate code
            code = pathlib.Path(rec["code_path"]).read_text()
            # assign type via naive filename heuristics
            name = rec["contract_name"].lower()
            if "erc20" in name:
                rec["type"] = "ERC20"
            elif "erc721" in name:
                rec["type"] = "ERC721"
            elif "amm" in name or "dex" in name or "pool" in name:
                rec["type"] = "DeFi"
            elif "util" in name:
                rec["type"] = "Utility"
            rec["code"] = code
            # minimal validation
            validate(instance=rec, schema=schema)
            f.write(orjson.dumps(rec) + b"\n")
    print("Wrote", out_path)


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="data/processed/dataset.jsonl")
    args = ap.parse_args()
    main(args.out)
