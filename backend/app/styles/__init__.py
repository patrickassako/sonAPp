"""Styles package - Style Registry access."""

from app.styles.registry import (
    get_all_styles,
    get_styles_by_category,
    get_style_by_id,
    get_categories,
    build_prompt
)

__all__ = [
    "get_all_styles",
    "get_styles_by_category",
    "get_style_by_id",
    "get_categories",
    "build_prompt"
]
