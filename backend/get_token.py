"""
Get Supabase JWT Token via REST API.
Usage: python get_token.py
"""
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

def get_token(email, password):
    """Get JWT token by authenticating with email/password."""
    auth_url = f"{url}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": key,
        "Content-Type": "application/json"
    }
    data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(auth_url, headers=headers, json=data)
        if response.status_code == 200:
            result = response.json()
            token = result["access_token"]
            print("\n" + "="*70)
            print("✅ Token généré avec succès !")
            print("="*70)
            print(f"\nTOKEN:\n{token}")
            print("\n" + "="*70)
            print("\nUtilisation:")
            print(f'export TOKEN="{token}"')
            print("curl http://localhost:8000/api/v1/users/wallet -H \"Authorization: Bearer $TOKEN\"")
            print("="*70 + "\n")
            return token
        else:
            print(f"❌ Erreur: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

if __name__ == "__main__":
    print("🔐 Génération du Token JWT Supabase...")
    print("Email: patrick@gmail.com")
    token = get_token("patrick@gmail.com", "motdepasse")
    
    if token:
        # Save to file for easy reuse
        with open(".token", "w") as f:
            f.write(token)
        print("💾 Token sauvegardé dans .token")
