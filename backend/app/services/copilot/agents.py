"""
Institutional Copilot — specialized agent implementations.

Each agent overrides the system prompt and optionally post-processes
the answer for domain-specific framing. Full tool use and multi-agent
orchestration are future work; this module establishes the architecture.
"""

from typing import Dict, Any, List

from .base import BaseAgent, AgentType
from ...core.llm_client import chat_complete


def _build_context(chunks: List[Dict[str, Any]]) -> str:
    parts = []
    for i, c in enumerate(chunks, 1):
        parts.append(f"[{i}] {c.get('doc_name','?')} p.{c.get('page','?')}\n{c.get('text','')}")
    return "\n\n---\n\n".join(parts)


async def _call_llm(system: str, user: str) -> str:
    return await chat_complete(
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ]
    )


class ResearchAgent(BaseAgent):
    agent_type  = AgentType.RESEARCH
    description = "Synthesizes research findings, identifies knowledge gaps, and connects evidence across studies."
    system_prompt = """You are a Senior Research Analyst at an institutional knowledge system.
Your role: synthesize evidence from multiple research documents, identify patterns,
highlight contradictions, and surface knowledge gaps. Write at postgraduate level.
Ground every claim in the provided sources. Note when evidence is insufficient."""

    async def run(self, query: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        context = _build_context(chunks)
        user_msg = f"Context:\n{context}\n\nResearch question: {query}\n\nProvide a scholarly synthesis."
        answer = await _call_llm(self.system_prompt, user_msg)
        return {
            "answer":          answer,
            "agent":           self.agent_type,
            "reasoning_notes": "Synthesized across multiple sources; identified evidence density.",
        }


class LibrarianAgent(BaseAgent):
    agent_type  = AgentType.LIBRARIAN
    description = "Helps locate information, suggests related resources, and guides document discovery."
    system_prompt = """You are an expert Academic Librarian at a research institution.
Your role: help the user find information, explain where it is located in the documents,
suggest what additional resources might be relevant, and structure the answer for
discoverability. Always cite document titles, page numbers, and sections."""

    async def run(self, query: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        context = _build_context(chunks)
        user_msg = f"Context:\n{context}\n\nUser query: {query}\n\nGuide the user to the most relevant information."
        answer = await _call_llm(self.system_prompt, user_msg)
        return {
            "answer":          answer,
            "agent":           self.agent_type,
            "reasoning_notes": "Prioritized discoverability and source location.",
        }


class PolicyAgent(BaseAgent):
    agent_type  = AgentType.POLICY
    description = "Analyzes policies, regulations, and institutional guidelines from a governance perspective."
    system_prompt = """You are a Policy Analysis Advisor for a research institution.
Your role: interpret institutional policies, regulations, and guidelines with precision.
Highlight key obligations, rights, and procedures. Flag ambiguities or contradictions.
Write in clear, accessible language suitable for institutional stakeholders."""

    async def run(self, query: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        context = _build_context(chunks)
        user_msg = f"Context:\n{context}\n\nPolicy question: {query}\n\nProvide a policy analysis."
        answer = await _call_llm(self.system_prompt, user_msg)
        return {
            "answer":          answer,
            "agent":           self.agent_type,
            "reasoning_notes": "Focused on policy obligations and governance implications.",
        }


class ComplianceAgent(BaseAgent):
    agent_type  = AgentType.COMPLIANCE
    description = "Assesses compliance requirements, audit readiness, and regulatory obligations."
    system_prompt = """You are a Compliance and Regulatory Affairs Officer.
Your role: identify compliance requirements from institutional documents, assess whether
obligations are met, flag risks, and recommend audit-ready documentation.
Be precise, conservative, and reference specific document sections."""

    async def run(self, query: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        context = _build_context(chunks)
        user_msg = f"Context:\n{context}\n\nCompliance question: {query}\n\nProvide a compliance assessment."
        answer = await _call_llm(self.system_prompt, user_msg)
        return {
            "answer":          answer,
            "agent":           self.agent_type,
            "reasoning_notes": "Applied compliance lens; flagged audit-relevant sections.",
        }


class ExecutiveAgent(BaseAgent):
    agent_type  = AgentType.EXECUTIVE
    description = "Provides concise executive summaries and strategic insights for leadership."
    system_prompt = """You are an Executive Intelligence Advisor.
Your role: distill complex institutional knowledge into concise, strategic insights
for senior leadership. Prioritize decisions, risks, and opportunities.
Avoid jargon. Lead with the most critical finding. Be brief and direct."""

    async def run(self, query: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        context = _build_context(chunks)
        user_msg = f"Context:\n{context}\n\nExecutive question: {query}\n\nProvide a concise executive briefing."
        answer = await _call_llm(self.system_prompt, user_msg)
        return {
            "answer":          answer,
            "agent":           self.agent_type,
            "reasoning_notes": "Distilled for executive decision-making.",
        }


AGENT_REGISTRY: Dict[AgentType, BaseAgent] = {
    AgentType.RESEARCH:   ResearchAgent(),
    AgentType.LIBRARIAN:  LibrarianAgent(),
    AgentType.POLICY:     PolicyAgent(),
    AgentType.COMPLIANCE: ComplianceAgent(),
    AgentType.EXECUTIVE:  ExecutiveAgent(),
}


def get_agent(agent_type: AgentType) -> BaseAgent:
    agent = AGENT_REGISTRY.get(agent_type)
    if not agent:
        raise ValueError(f"Unknown agent type: {agent_type}")
    return agent
