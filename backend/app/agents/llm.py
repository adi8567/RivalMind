"""LLM provider factory supporting OpenAI, Anthropic, Gemini, Groq, Ollama, and OpenRouter."""

import logging
from typing import Any, Optional
from backend.app.config import settings

logger = logging.getLogger(__name__)


def get_llm(
    model_name: Optional[str] = None,
    temperature: float = 0.2,
    override_demo: bool = False,
) -> Optional[Any]:
    """Return configured Chat LLM instance or None if in demo mode / no key.

    Args:
        model_name: Optional override for model name.
        temperature: Sampling temperature for generation.
        override_demo: If True, attempts to construct LLM even if DEMO_MODE is set.

    Returns:
        BaseChatModel instance or None.
    """
    if settings.DEMO_MODE and not override_demo:
        return None

    api_key = settings.LLM_API_KEY.strip()
    provider = settings.LLM_PROVIDER.lower().strip()
    target_model = model_name or settings.LLM_MODEL

    # Ollama doesn't strictly need API key
    if not api_key and provider != "ollama":
        return None

    try:
        from langchain_openai import ChatOpenAI

        if provider == "openai":
            return ChatOpenAI(
                api_key=api_key,
                model=target_model,
                temperature=temperature,
            )
        elif provider in ["gemini", "google"]:
            # Google Gemini OpenAI-compatible gateway
            return ChatOpenAI(
                api_key=api_key,
                model=target_model or "gemini-1.5-flash",
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                temperature=temperature,
            )
        elif provider == "groq":
            return ChatOpenAI(
                api_key=api_key,
                model=target_model or "llama-3.3-70b-versatile",
                base_url="https://api.groq.com/openai/v1",
                temperature=temperature,
            )
        elif provider == "ollama":
            return ChatOpenAI(
                api_key="ollama",
                model=target_model or "llama3",
                base_url="http://localhost:11434/v1",
                temperature=temperature,
            )
        elif provider == "anthropic":
            try:
                from langchain_anthropic import ChatAnthropic

                return ChatAnthropic(
                    api_key=api_key,
                    model_name=target_model or "claude-3-5-sonnet-20241022",
                    temperature=temperature,
                )
            except ImportError:
                logger.warning(
                    "langchain-anthropic package is not installed. Please install it to use Anthropic provider."
                )
                return None
        else:
            # Generic OpenAI compatible provider
            return ChatOpenAI(
                api_key=api_key,
                model=target_model,
                temperature=temperature,
            )
    except Exception as exc:
        logger.error(f"Failed to initialize LLM provider ({provider}): {exc}")
        return None
