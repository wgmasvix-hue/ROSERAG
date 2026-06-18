"""
Institutional Copilot — base agent architecture.

Agents are specialized reasoning personas that apply domain-specific
prompts and retrieval strategies on top of the core RAG pipeline.
Each agent is a stateless callable: receive query → return response.

Future evolution:
  - Tool use (web search, DSpace API calls, cross-institution federation)
  - Multi-agent orchestration (Research + Librarian collaborating)
  - Long-term memory per agent type
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, Any, List


class AgentType(str, Enum):
    RESEARCH    = "research"
    LIBRARIAN   = "librarian"
    POLICY      = "policy"
    COMPLIANCE  = "compliance"
    EXECUTIVE   = "executive"


class BaseAgent(ABC):
    agent_type: AgentType
    description: str
    system_prompt: str

    @abstractmethod
    async def run(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Execute agent reasoning over retrieved chunks.

        Args:
            query:  The user's question.
            chunks: Top-k chunks retrieved from Qdrant.

        Returns:
            {
                "answer": str,
                "agent": AgentType,
                "reasoning_notes": str,  # agent-specific insight
            }
        """
        ...
