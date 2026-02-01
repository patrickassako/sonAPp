"""
Styles API routes - Musical style registry access.
"""

from fastapi import APIRouter
from typing import List

from app.styles import (
    get_all_styles,
    get_styles_by_category,
    get_style_by_id,
    get_categories
)
from app.schemas import StyleResponse, StylesListResponse, CategoryResponse

router = APIRouter()


@router.get("/", response_model=StylesListResponse)
async def list_styles():
    """
    Get all available musical styles grouped by category.
    
    Returns:
        - styles: List of all styles
        - categories: List of categories
    
    No authentication required - public endpoint.
    """
    styles = get_all_styles()
    categories = get_categories()
    
    return StylesListResponse(
        styles=styles,
        categories=categories
    )


@router.get("/{style_id}", response_model=StyleResponse)
async def get_style(style_id: str):
    """
    Get details for a specific style.
    
    Args:
        style_id: Style identifier (e.g., "makossa", "amapiano")
    
    Returns:
        Style details including instrumentation, BPM range, etc.
    """
    style = get_style_by_id(style_id)
    
    if not style:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Style '{style_id}' not found")
    
    return style


@router.get("/category/{category}", response_model=List[StyleResponse])
async def get_styles_by_cat(category: str):
    """
    Get styles filtered by category.
    
    Args:
        category: UNIVERSAL, URBAN, or AFRICAN
    
    Returns:
        List of styles in that category
    """
    styles = get_styles_by_category(category.upper())
    return styles
