from typing import Dict, Any

def quality_tag(meta: Dict[str, Any]) -> Dict[str, Any]:
    """Heuristic quality category + score.
    - If source == docs/blog, default tutorial/example unless indicators suggest otherwise.
    - If github repo: derive from stars, forks, CI, tests, audits.
    """
    src = meta.get("source")
    repo = meta.get("repo", {})
    stars = repo.get("stars", 0) or 0
    forks = repo.get("forks", 0) or 0
    archived = repo.get("archived", False)
    has_tests = meta.get("has_tests", False)
    has_ci = meta.get("has_ci", False)
    has_audit = meta.get("has_audit", False)

    base = 0.2
    if src == "github":
        base += min(stars/2000, 0.4) + min(forks/500, 0.2)
        if has_tests: base += 0.08
        if has_ci: base += 0.06
        if has_audit: base += 0.1
        if archived: base -= 0.1
        category = "production" if base >= 0.55 else "unknown"
    else:
        category = "tutorial"
        base = 0.35
    return {"category": category, "score": round(max(0.0, min(1.0, base)), 3)}
