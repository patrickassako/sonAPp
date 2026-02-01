#!/usr/bin/env python3
"""
Test complet Epic 4 - Génération End-to-End

Usage:
  python test_epic4_e2e.py YOUR_JWT_TOKEN
"""

import sys
import time
import requests
import json

API_BASE = "http://localhost:8000/api/v1"

def test_e2e(token: str):
    """Test end-to-end de la génération."""
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("🎵 Test Epic 4 - Génération Makossa End-to-End")
    print("=" * 70)
    
    # 1. Vérifier le wallet
    print("\n1️⃣ Vérification du wallet...")
    resp = requests.get(f"{API_BASE}/users/wallet", headers=headers)
    
    if resp.status_code != 200:
        print(f"❌ Erreur wallet: {resp.status_code}")
        print(resp.text)
        return False
    
    wallet = resp.json()
    print(f"✅ Credits disponibles: {wallet['credits_available']}")
    
    if wallet['credits_available'] < 10:
        print(f"❌ Pas assez de crédits (besoin: 10, disponible: {wallet['credits_available']})")
        print("\n💡 Ajoutez des crédits via Supabase SQL:")
        print("   UPDATE profiles SET credits = 100 WHERE email = 'your-email';")
        return False
    
    # 2. Créer un projet
    print("\n2️⃣ Création du projet...")
    project_data = {
        "title": "Test Makossa E2E",
        "mode": "TEXT",
        "language": "fr",
        "style_id": "makossa",
        "lyrics_final": """Je veux danser au rythme du Makossa
La guitare groove, les cuivres éclatent
C'est la fête ce soir, tout le monde danse
Makossa makossa, on ne s'arrête pas"""
    }
    
    resp = requests.post(f"{API_BASE}/projects", headers=headers, json=project_data)
    
    if resp.status_code != 201:
        print(f"❌ Erreur création projet: {resp.status_code}")
        print(resp.text)
        return False
    
    project = resp.json()
    project_id = project["id"]
    print(f"✅ Projet créé: {project['title']}")
    print(f"   ID: {project_id}")
    print(f"   Status: {project['status']}")
    
    # 3. Lancer la génération
    print("\n3️⃣ Lancement de la génération...")
    resp = requests.post(
        f"{API_BASE}/generate",
        headers=headers,
        json={"project_id": project_id}
    )
    
    if resp.status_code != 202:
        print(f"❌ Erreur génération: {resp.status_code}")
        print(resp.text)
        return False
    
    job = resp.json()
    job_id = job["id"]
    print(f"✅ Job créé: {job_id}")
    print(f"   Status: {job['status']}")
    print(f"   Coût: {job['credits_cost']} crédits")
    
    # 4. Surveiller le status (max 6 minutes)
    print("\n4️⃣ Surveillance du job (max 6 minutes)...")
    print("   Le worker va appeler SunoAPI et poller le status...")
    
    max_attempts = 36  # 6 minutes (10s interval)
    attempt = 0
    
    while attempt < max_attempts:
        time.sleep(10)
        attempt += 1
        
        resp = requests.get(f"{API_BASE}/generate/jobs/{job_id}", headers=headers)
        
        if resp.status_code != 200:
            print(f"❌ Erreur status: {resp.status_code}")
            continue
        
        job_status = resp.json()
        status = job_status["status"]
        
        print(f"   [{attempt}/{max_attempts}] Status: {status}")
        
        if status == "completed":
            print(f"\n✅ GÉNÉRATION TERMINÉE !")
            break
        
        elif status == "failed":
            error = job_status.get("error_message", "Unknown error")
            print(f"\n❌ Génération échouée: {error}")
            return False
    
    if attempt >= max_attempts:
        print(f"\n⏱️ Timeout après {max_attempts * 10}s")
        return False
    
    # 5. Récupérer les fichiers audio
    print("\n5️⃣ Récupération des fichiers audio...")
    resp = requests.get(f"{API_BASE}/projects/{project_id}/audio", headers=headers)
    
    if resp.status_code != 200:
        print(f"❌ Erreur audio: {resp.status_code}")
        print(resp.text)
        return False
    
    audio_files = resp.json()
    print(f"✅ {len(audio_files)} fichiers audio générés:")
    
    for i, audio in enumerate(audio_files, 1):
        print(f"\n   🎵 Track {audio['version_number']}:")
        print(f"      URL: {audio['file_url'][:60]}...")
        if audio.get('stream_url'):
            print(f"      Stream: {audio['stream_url'][:60]}...")
        if audio.get('image_url'):
            print(f"      Image: {audio['image_url'][:60]}...")
    
    # 6. Vérifier le wallet final
    print("\n6️⃣ Vérification du wallet final...")
    resp = requests.get(f"{API_BASE}/users/wallet", headers=headers)
    
    if resp.status_code == 200:
        wallet_final = resp.json()
        print(f"✅ Credits après génération:")
        print(f"   Disponibles: {wallet_final['credits_available']}")
        print(f"   Réservés: {wallet_final['credits_reserved']}")
        print(f"   Total dépensé: {wallet_final['total_spent']} crédits")
        
        credits_used = wallet['credits_available'] - wallet_final['credits_available']
        print(f"   Crédits utilisés: {credits_used}")
    
    print("\n" + "=" * 70)
    print("🎉 TEST COMPLET RÉUSSI !")
    print("=" * 70)
    
    # Afficher les URLs pour écouter
    print("\n🎧 Ouvrez ces URLs dans votre navigateur pour écouter:")
    for i, audio in enumerate(audio_files, 1):
        print(f"\n   Track {i}: {audio['file_url']}")
    
    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_epic4_e2e.py YOUR_JWT_TOKEN")
        print("\nPour obtenir votre JWT token:")
        print("1. Allez sur Supabase → Authentication → Users")
        print("2. Cliquez sur votre user")
        print("3. Copiez le 'Access Token'")
        print("\nOu connectez-vous via l'API Supabase et récupérez session.access_token")
        sys.exit(1)
    
    token = sys.argv[1]
    
    try:
        success = test_e2e(token)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
