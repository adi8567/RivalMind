"""LLM provider factory supporting OpenAI, Anthropic, and Demo mode."""

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
        logger.debug("Demo mode active; LLM invocation skipped in favor of demo fixtures.")
        return None

    api_key = settings.LLM_API_KEY.strip()
    if not api_key:
        logger.info("LLM_API_KEY not configured; agents will fall back to built-in datasets.")
        return None

    provider = settings.LLM_PROVIDER.lower().strip()
    target_model = model_name or settings.LLM_MODEL

    try:
        if provider == "openai":
            from langchain_openai import ChatOpenAI

            return ChatOpenAI(
                api_key=api_key,
                model=target_model,
                temperature=temperature,
            )
        elif provider == "anthropic":
            try:
                from langchain_anthropic import ChatAnthropic

                return ChatAnthropic(
                    api_key=api_key,
                    model_name=target_model,
                    temperature=temperature,
                )
            except ImportError:
                logger.warning(
                    "langchain-anthropic package is not installed. Please install it to use Anthropic provider."
                )
                return None
        else:
            logger.warning(f"Unsupported LLM provider '{provider}'. Falling back to None.")
            return None
    except Exception as exc:
        logger.error(f"Failed to initialize LLM provider ({provider}): {exc}")
        return None
