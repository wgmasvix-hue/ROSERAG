"""
Knowledge Graph — in-memory entity and relationship store.

Designed for future Neo4j migration: uses node/edge dicts that map
directly to Neo4j node labels and relationship types.

Entity types: PERSON, ORGANIZATION, TOPIC, LOCATION, PROJECT, DEPARTMENT

Entity extraction uses lightweight regex patterns — no NLP dependencies.
"""

import re
from typing import Dict, List, Any, Set, Optional
from collections import defaultdict

# ---- Extraction patterns ----

_STOPWORDS: Set[str] = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "this", "that", "these", "those",
    "it", "its", "we", "our", "they", "their", "he", "she", "his", "her",
    "not", "no", "so", "if", "then", "than", "about", "into", "through",
    "during", "before", "after", "above", "below", "between", "each",
    "both", "all", "any", "such", "while", "also", "which", "who", "whom",
    "what", "when", "where", "how", "can", "page", "chapter", "section",
    "figure", "table", "et", "al",
}

_ORG_PATTERNS = [
    r"\b([A-Z][a-z]+ (?:University|College|Institute|Department|Ministry|Agency|Authority|Centre|Center|Foundation|Association|Corporation|Committee|Council|Board))\b",
    r"\b(?:University|Institute|Ministry|Department) of [A-Z][a-zA-Z ]+\b",
]

_PERSON_PATTERNS = [
    r"\b((?:Dr|Prof|Professor|Mr|Ms|Mrs|Sir)\.? [A-Z][a-z]+(?: [A-Z][a-z]+)*)\b",
]

_LOCATION_PATTERNS = [
    r"\b([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)+)\b",
]


def extract_entities(text: str, doc_id: str, doc_name: str) -> List[Dict[str, Any]]:
    entities = []

    for pattern in _ORG_PATTERNS:
        for match in re.finditer(pattern, text):
            entities.append({
                "name": match.group().strip(),
                "type": "ORGANIZATION",
                "doc_id": doc_id,
                "doc_name": doc_name,
            })

    for pattern in _PERSON_PATTERNS:
        for match in re.finditer(pattern, text):
            entities.append({
                "name": match.group().strip(),
                "type": "PERSON",
                "doc_id": doc_id,
                "doc_name": doc_name,
            })

    for pattern in _LOCATION_PATTERNS:
        for match in re.finditer(pattern, text):
            name = match.group().strip()
            if len(name) > 5:
                entities.append({
                    "name": name,
                    "type": "LOCATION",
                    "doc_id": doc_id,
                    "doc_name": doc_name,
                })

    # Topic extraction: frequent capitalized phrases
    cap_phrases = re.findall(r"\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})*)\b", text)
    for phrase in cap_phrases:
        if phrase.lower() not in _STOPWORDS and len(phrase) > 4:
            entities.append({
                "name": phrase,
                "type": "TOPIC",
                "doc_id": doc_id,
                "doc_name": doc_name,
            })

    return entities


# ---- In-memory graph ----

class KnowledgeGraph:
    """
    Node schema (→ Neo4j node):
        { id, name, type, doc_ids: [str], frequency: int }

    Edge schema (→ Neo4j relationship):
        { source_id, target_id, relation, weight: int }
    """

    def __init__(self) -> None:
        self._nodes: Dict[str, Dict[str, Any]] = {}
        self._edges: Dict[tuple, Dict[str, Any]] = {}

    def _node_id(self, name: str, entity_type: str) -> str:
        return f"{entity_type}::{name.lower()}"

    def add_entities(self, entities: List[Dict[str, Any]]) -> None:
        doc_entities_by_type: Dict[str, List[str]] = defaultdict(list)

        for ent in entities:
            nid = self._node_id(ent["name"], ent["type"])
            if nid not in self._nodes:
                self._nodes[nid] = {
                    "id": nid,
                    "name": ent["name"],
                    "type": ent["type"],
                    "doc_ids": [],
                    "frequency": 0,
                }
            node = self._nodes[nid]
            node["frequency"] += 1
            if ent["doc_id"] not in node["doc_ids"]:
                node["doc_ids"].append(ent["doc_id"])

            doc_entities_by_type[ent["type"]].append(nid)

        # Co-occurrence edges within same entity type in same chunk
        for etype, nids in doc_entities_by_type.items():
            unique_nids = list(set(nids))
            for i in range(len(unique_nids)):
                for j in range(i + 1, len(unique_nids)):
                    edge_key = (unique_nids[i], unique_nids[j])
                    if edge_key not in self._edges:
                        self._edges[edge_key] = {
                            "source_id": edge_key[0],
                            "target_id": edge_key[1],
                            "relation": "CO_OCCURS_WITH",
                            "weight": 0,
                        }
                    self._edges[edge_key]["weight"] += 1

    def get_nodes(
        self,
        entity_type: Optional[str] = None,
        min_frequency: int = 1,
        limit: int = 200,
    ) -> List[Dict[str, Any]]:
        nodes = list(self._nodes.values())
        if entity_type:
            nodes = [n for n in nodes if n["type"] == entity_type]
        nodes = [n for n in nodes if n["frequency"] >= min_frequency]
        nodes.sort(key=lambda n: n["frequency"], reverse=True)
        return nodes[:limit]

    def get_edges(self, min_weight: int = 1, limit: int = 500) -> List[Dict[str, Any]]:
        edges = [e for e in self._edges.values() if e["weight"] >= min_weight]
        edges.sort(key=lambda e: e["weight"], reverse=True)
        return edges[:limit]

    def get_topics(self, limit: int = 20) -> List[str]:
        topics = [n for n in self._nodes.values() if n["type"] == "TOPIC"]
        topics.sort(key=lambda n: n["frequency"], reverse=True)
        return [t["name"] for t in topics[:limit]]

    def stats(self) -> Dict[str, int]:
        type_counts: Dict[str, int] = defaultdict(int)
        for node in self._nodes.values():
            type_counts[node["type"]] += 1
        return dict(type_counts)

    def clear_document(self, doc_id: str) -> None:
        to_remove = [
            nid for nid, node in self._nodes.items()
            if doc_id in node.get("doc_ids", [])
        ]
        for nid in to_remove:
            node = self._nodes[nid]
            node["doc_ids"].remove(doc_id)
            if not node["doc_ids"]:
                del self._nodes[nid]

        self._edges = {
            k: v for k, v in self._edges.items()
            if k[0] in self._nodes and k[1] in self._nodes
        }


# Singleton graph instance
_graph = KnowledgeGraph()


def get_graph() -> KnowledgeGraph:
    return _graph
