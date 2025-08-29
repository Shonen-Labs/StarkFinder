import re
from rapidfuzz.distance.Levenshtein import normalized_similarity

def strip_trailing_ws(code: str) -> str:
    return "\n".join([ln.rstrip() for ln in code.splitlines()])

def normalize_indentation(code: str) -> str:
    # Convert tabs to 4 spaces and keep consistent trailing newline
    code = code.replace("\t", "    ")
    code = re.sub(r"\r\n?", "\n", code)
    return code.strip() + "\n"

def is_duplicate(a: str, b: str, threshold: float = 0.98) -> bool:
    return normalized_similarity(a, b) >= threshold
