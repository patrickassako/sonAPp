"""
Test script for SunoProvider - Quick validation.

This script tests the SunoProvider integration with real API calls.
Run ONLY when you have real API credentials in .env
"""

import sys
import os
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv()

from app.providers.suno import SunoProvider
from app.styles import build_prompt


def test_suno_provider():
    """Test SunoProvider basic functionality."""
    
    print("🎵 Testing SunoProvider Integration\n")
    print("=" * 60)
    
    # Initialize provider
    api_key = os.getenv("SUNO_API_KEY")
    if not api_key or api_key == "placeholder-key":
        print("❌ ERROR: Please set SUNO_API_KEY in .env file")
        return
    
    print(f"✓ API Key loaded: {api_key[:10]}...")
    
    provider = SunoProvider(api_key=api_key)
    print("✓ SunoProvider initialized\n")
    
    # Test 1: Create a Makossa track
    print("TEST 1: Creating Makossa track 🇨🇲")
    print("-" * 60)
    
    lyrics = """
Je veux danser, danser toute la nuit
Au rythme du Makossa, oh oui
Guitare résonne, les cuivres chantent
C'est la fête qui commence
    """.strip()
    
    try:
        print(f"Lyrics: {lyrics[:50]}...")
        print(f"Style: makossa")
        print(f"Language: fr\n")
        
        task_id = provider.create_track(
            lyrics=lyrics,
            style_id="makossa",
            language="fr",
            title="Test Makossa"
        )
        
        print(f"✅ Track created successfully!")
        print(f"Task ID: {task_id}\n")
        
        # Test 2: Check status
        print("TEST 2: Checking task status")
        print("-" * 60)
        
        status = provider.get_status(task_id)
        print(f"Status: {status['status']}")
        print(f"Audio URLs: {len(status.get('audio_urls', []))} tracks")
        
        if status.get('metadata'):
            print(f"Metadata: track_count={status['metadata'].get('track_count')}")
        
        if status['status'] == 'failed':
            print(f"❌ Error: {status.get('error')}")
        elif status['status'] == 'completed':
            print(f"✅ Generation completed!")
            for i, url in enumerate(status['audio_urls'], 1):
                print(f"  Track {i}: {url[:60]}...")
        else:
            print(f"⏳ Generation in progress...")
            print(f"\n💡 Run this script again in 1-2 minutes to check completion")
            print(f"   Task ID to track: {task_id}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        provider.close()
    
    print("\n" + "=" * 60)
    print("✓ Test complete")


def test_style_registry():
    """Test Style Registry access."""
    print("\n🎨 Testing Style Registry\n")
    print("=" * 60)
    
    from app.styles import get_all_styles, get_style_by_id
    
    styles = get_all_styles()
    print(f"✓ Loaded {len(styles)} styles\n")
    
    # Test Makossa
    makossa = get_style_by_id("makossa")
    if makossa:
        print("Makossa Style 🇨🇲:")
        print(f"  Category: {makossa['category']}")
        print(f"  BPM: {makossa['bpm_range']}")
        print(f"  Energy: {makossa['energy']}")
        print(f"  Instruments: {', '.join(makossa['instrumentation'][:3])}...")
        print(f"  Description (FR): {makossa['prompt_template_fr'][:80]}...")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    print("\n" + "🎵" * 30)
    print("MusicApp - SunoProvider Test Suite")
    print("🎵" * 30 + "\n")
    
    # Test registry first (no API calls)
    test_style_registry()
    
    # Then test provider (real API calls)
    test_suno_provider()
    
    print("\n✅ All tests complete!\n")
