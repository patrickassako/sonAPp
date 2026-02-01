"""
Check status of a specific SunoAPI task.
Usage: python check_generation.py TASK_ID
"""

import sys
import os
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv()

from app.providers.suno import SunoProvider


def check_generation(task_id: str):
    """Check status of a generation task."""
    
    print(f"\n🔍 Checking generation status for task: {task_id}\n")
    print("=" * 70)
    
    api_key = os.getenv("SUNO_API_KEY")
    provider = SunoProvider(api_key=api_key)
    
    try:
        status = provider.get_status(task_id)
        
        print(f"\n📊 Status: {status['status'].upper()}")
        print(f"🎵 Audio URLs: {len(status.get('audio_urls', []))} tracks")
        
        if status['status'] == 'completed':
            print("\n✅ GÉNÉRATION TERMINÉE !\n")
            for i, url in enumerate(status['audio_urls'], 1):
                print(f"Track {i}: {url}")
            
            if status.get('metadata'):
                meta = status['metadata']
                print(f"\nMetadata:")
                print(f"  - Stream URLs: {len(meta.get('stream_urls', []))}")
                print(f"  - Image URLs: {len(meta.get('image_urls', []))}")
                print(f"  - Track count: {meta.get('track_count')}")
        
        elif status['status'] == 'failed':
            print(f"\n❌ ERREUR: {status.get('error')}")
        
        else:
            print(f"\n⏳ Génération en cours... Réessayez dans 30 secondes.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        provider.close()
    
    print("\n" + "=" * 70)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_generation.py TASK_ID")
        print("\nExample:")
        print("  python check_generation.py 29d1e81fbb73b56a3cfec5603d03f808")
        sys.exit(1)
    
    task_id = sys.argv[1]
    check_generation(task_id)
