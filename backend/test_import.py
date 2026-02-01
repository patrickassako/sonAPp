"""
Quick test - Check if server can start.
"""

print("🎵 MusicApp Backend - Quick Import Test\n")

try:
    print("1. Testing imports...")
    from app.config import settings
    print(f"   ✓ Settings loaded (env={settings.ENVIRONMENT})")
    
    from app.styles import get_all_styles
    styles = get_all_styles()
    print(f"   ✓ Style Registry loaded ({len(styles)} styles)")
    
    from app.providers.suno import SunoProvider
    print(f"   ✓ SunoProvider imported")
    
    from app.main import app
    print(f"   ✓ FastAPI app created")
    
    print("\n2. Checking routes...")
    routes = [r.path for r in app.routes]
    api_routes = [r for r in routes if r.startswith("/api")]
    print(f"   ✓ {len(api_routes)} API routes registered")
    
    print("\n✅ All imports successful!")
    print("\nReady to start server:")
    print("  uvicorn app.main:app --reload")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
