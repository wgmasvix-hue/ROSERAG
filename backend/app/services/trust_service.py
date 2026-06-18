"""
Trust Engine — computes a composite trust score for every ROSERAG answer.

Formula (weighted):
  trust_score = 0.60 × retrieval_avg
              + 0.25 × source_diversity
              + 0.15 × citation_density

Levels:
  HIGH    0.90 – 1.00
  MEDIUM  0.70 – 0.89
  LOW     0.00 – 0.69
"""

from typing import List, Dict, Any


def _retrieval_avg(scores: List[float]) -> float:
    if not scores:
        return 0.0
    top = sorted(scores, reverse=True)[:3]
    return sum(top) / len(top)


def _source_diversity(chunks: List[Dict[str, Any]]) -> float:
    unique_docs = {c.get("doc_id") or c.get("document") for c in chunks}
    # 3 unique sources = full diversity score
    return min(len(unique_docs) / 3.0, 1.0)


def _citation_density(retrieved: int, requested: int) -> float:
    if requested == 0:
        return 0.0
    return min(retrieved / max(requested, 1), 1.0)


def compute_trust(
    chunks: List[Dict[str, Any]],
    top_k: int = 5,
) -> Dict[str, Any]:
    scores = [c.get("score", 0.0) for c in chunks]

    r_avg = _retrieval_avg(scores)
    s_div = _source_diversity(chunks)
    c_den = _citation_density(len(chunks), top_k)

    trust_score = round(
        r_avg * 0.60 + s_div * 0.25 + c_den * 0.15,
        3,
    )
    trust_score = min(max(trust_score, 0.0), 1.0)

    if trust_score >= 0.90:
        trust_level = "HIGH"
    elif trust_score >= 0.70:
        trust_level = "MEDIUM"
    else:
        trust_level = "LOW"

    return {
        "trust_score": trust_score,
        "trust_level": trust_level,
        "components": {
            "retrieval_avg": round(r_avg, 3),
            "source_diversity": round(s_div, 3),
            "citation_density": round(c_den, 3),
        },
    }
