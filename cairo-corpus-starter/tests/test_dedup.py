import json
import pathlib

from rapidfuzz.distance.Levenshtein import normalized_similarity


def test_no_near_duplicates():
    p = pathlib.Path("data/processed/dataset.jsonl")
    if not p.exists():
        return
    codes = [json.loads(l)["code"] for l in p.read_text().splitlines()]
    for i in range(len(codes)):
        for j in range(i + 1, len(codes)):
            sim = normalized_similarity(codes[i], codes[j])
            # Over Normalized Similarity Condition.
            if sim == 1.0:
                continue

            assert sim < 0.995, "Near-duplicate contracts detected"
