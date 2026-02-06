"""
Style Registry - Music style definitions and access functions.

This is a key differentiator of MusicApp:
African music styles (Makossa, Bikutsi, Amapiano, etc.) as first-class citizens.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional

# Load registry on module import
_REGISTRY_PATH = Path(__file__).parent / "registry.json"
_REGISTRY_DATA = None


def _load_registry() -> Dict:
    """Load registry from JSON file."""
    global _REGISTRY_DATA
    if _REGISTRY_DATA is None:
        with open(_REGISTRY_PATH, "r", encoding="utf-8") as f:
            _REGISTRY_DATA = json.load(f)
    return _REGISTRY_DATA


def get_all_styles() -> List[Dict]:
    """Get all available styles."""
    registry = _load_registry()
    return registry["styles"]


def get_styles_by_category(category: str) -> List[Dict]:
    """
    Get styles filtered by category.
    
    Args:
        category: UNIVERSAL, URBAN, or AFRICAN
    
    Returns:
        List of style dicts
    """
    all_styles = get_all_styles()
    return [s for s in all_styles if s["category"] == category]


def get_style_by_id(style_id: str) -> Optional[Dict]:
    """
    Get a specific style by ID.
    
    Args:
        style_id: Style identifier (e.g., "makossa", "amapiano", "coupe-decale")
    
    Returns:
        Style dict or None if not found
    
    Note:
        Automatically normalizes hyphens to underscores (e.g., "coupe-decale" -> "coupe_decale")
    """
    # Normalize: convert hyphens to underscores for consistent matching
    normalized_id = style_id.replace("-", "_")
    
    all_styles = get_all_styles()
    for style in all_styles:
        if style["id"] == normalized_id:
            return style
    return None


def get_categories() -> List[Dict]:
    """Get all categories."""
    registry = _load_registry()
    return registry["categories"]


def build_prompt(style_id: str, lyrics: str, language: str = "fr") -> Dict:
    """
    Build enriched style prompt for SunoAPI.
    
    Args:
    Args:
        style_id: Style to use (supports suffix ":male" or ":female")
        lyrics: User lyrics
        language: "fr" or "en"
    
    Returns:
        {
            "style_text": str,
            "lyrics": str,
            "style_params": dict
        }
    """
    # Parse Voice Preference from ID (e.g., "rap:male")
    voice_tag = None
    negative_voice_tags = []
    base_style_id = style_id
    
    if ":" in style_id:
        parts = style_id.split(":")
        base_style_id = parts[0]
        voice_pref = parts[1].lower()
        
        if voice_pref == "male":
            voice_tag = "Male vocals"
            negative_voice_tags = ["Female vocals", "Woman"]
        elif voice_pref == "female":
            voice_tag = "Female vocals"
            negative_voice_tags = ["Male vocals", "Man"]
            
    style = get_style_by_id(base_style_id)
    if not style:
        # Fallback if ID invalid, try original just in case
        style = get_style_by_id(style_id)
        if not style:
             raise ValueError(f"Style '{style_id}' not found")
    
    # Prefer boosted prompt (enriched via Suno Style API), fallback to original
    boosted_key = f"boosted_prompt_{language}"
    template_key = f"prompt_template_{language}"
    style_description = (
        style.get(boosted_key)
        or style.get(template_key)
        or style["prompt_template_en"]
    )
    
    # NEW: Build more explicit style text for Suno
    # Format: "Genre/Style, Key instruments, Energy level"
    prompt_parts = []
    
    # 0. Voice Preference (Start with voice for emphasis?) 
    # Actually Suno v3.5 listens to tags anywhere, but specific tags near genre help.
    if voice_tag:
        prompt_parts.append(voice_tag)
        
    # 1. Main style description (genre)
    prompt_parts.append(style_description)
    
    # 2. Explicit instrumentation (append as tags)
    if style.get("instrumentation"):
        instruments_list = style["instrumentation"]
        
        # Filter conflicting voice tags from base style
        if voice_tag:
            if "Female vocals" in voice_tag:
                # Remove Male tags from base instruments
                instruments_list = [i for i in instruments_list if i.lower() not in ["male vocals", "man", "rap vocals"]]
                # "Rap vocals" often implies male in Suno unless specified "Female Rap"
                # But we can keep generic "Rap" if needed, just avoid "Male"
            elif "Male vocals" in voice_tag:
                 # Remove Female tags from base instruments
                instruments_list = [i for i in instruments_list if i.lower() not in ["female vocals", "woman"]]
                
        if len(instruments_list) > 0:
            # Just join them, no "featuring" prefix which wastes tokens/clarity
            instruments_text = ", ".join(instruments_list)
            prompt_parts.append(instruments_text)
    
    # 3. Energy and BPM hints
    energy = style.get("energy", "medium")
    bpm_range = style.get("bpm_range")
    if bpm_range:
        # Format as strict tags for Suno
        prompt_parts.append(f"{energy} energy")
        prompt_parts.append(f"{bpm_range[0]}-{bpm_range[1]} bpm")
    
    # 4. Negative tags (what to avoid)
    negative_items = style.get("negative_tags", []).copy()
    
    # Filter conflicting negative tags from base style
    if voice_tag:
        if "Female vocals" in voice_tag:
            # If we WANT female, remove "female vocals" from NEGATIVE list
            negative_items = [t for t in negative_items if t.lower() not in ["female vocals", "woman", "singing"]] 
            # Also remove 'singing' from negative if we want singing (but user might want rap)
            # For Rap style, "singing" is negative. If Female Rap, we still want Rap.
            # But let's be careful.
        elif "Male vocals" in voice_tag:
             negative_items = [t for t in negative_items if t.lower() not in ["male vocals", "man"]]

    # Merge with voice negatives
    if negative_voice_tags:
        negative_items.extend(negative_voice_tags)
        
    if negative_items:
        # Prefix with "no" is good for Suno style strictness
        no_tags = ", ".join([f"no {tag}" for tag in negative_items])
        prompt_parts.append(no_tags)
    
    # Join with commas to create a tag list
    final_style_text = ", ".join(prompt_parts)
    
    return {
        "style_text": final_style_text,
        "lyrics": lyrics,
        "style_params": {
            "bpm_range": style.get("bpm_range"),
            "energy": style.get("energy"),
            "style_weight": style.get("style_weight", 0.7)
        }
    }

