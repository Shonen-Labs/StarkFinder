import re
from typing import Literal

def detect_cairo_version(code: str) -> Literal["1","2"]:
    # Heuristics: Cairo 1/2 typically include "use" statements and modern syntax.
    # Cairo 0.x will be filtered earlier; this function distinguishes 1 vs 2 if needed.
    # (Adjust heuristics as needed as Cairo evolves.)
    # Example heuristic: Cairo 2 often uses "mod", trait impls, "extern func" styles changed.
    if re.search(r"\bmod\b|\btrait\b|\bimpl\b|\buse\b", code):
        return "2"
    return "1"
