"""
Test Supabase pooler connection with different regions and formats.
"""
import psycopg
import sys

project_ref = "qcreokbkvddbhwctuogz"
password = "Mamapaulette%408215"

# Regions possibles
regions = [
    "eu-central-1",  # Frankfurt
    "eu-west-1",     # Ireland  
    "us-east-1",     # N. Virginia
    "us-west-1",     # N. California
    "ap-southeast-1", # Singapore
]

# Formats possibles
formats = [
    f"postgres.{project_ref}:{password}",
    f"postgres:{password}",
]

print("🔍 Recherche de la bonne configuration Supabase...\n")

for region in regions:
    for fmt in formats:
        host = f"aws-0-{region}.pooler.supabase.com"
        conn_str = f"postgresql://{fmt}@{host}:6543/postgres"
        
        # Masquer le mot de passe dans l'affichage
        safe_str = conn_str.replace(password, "***")
        print(f"Essai: {safe_str[:80]}...")
        
        try:
            conn = psycopg.connect(conn_str, connect_timeout=3)
            print(f"✅ CONNEXION RÉUSSIE !\n")
            
            # Test query
            cur = conn.cursor()
            cur.execute("SELECT current_database(), current_user, version();")
            result = cur.fetchone()
            print(f"Database: {result[0]}")
            print(f"User: {result[1]}")
            print(f"Version: {result[2][:50]}...\n")
            
            cur.close()
            conn.close()
            
            # URL finale sans le mot de passe encodé visible
            final_url = conn_str
            print(f"🎉 URL TROUVÉE !")
            print(f"\nMettez ceci dans votre .env :")
            print(f"DATABASE_URL={final_url}\n")
            
            sys.exit(0)
            
        except Exception as e:
            error = str(e)[:60]
            if "timeout" in error.lower():
                print(f"   ⏱️  Timeout (région incorrecte)\n")
            elif "authentication" in error.lower() or "password" in error.lower():
                print(f"   🔐 Erreur auth: Mauvais mot de passe\n")
            elif "tenant" in error.lower() or "user" in error.lower():
                print(f"   👤 Format username incorrect\n")
            else:
                print(f"   ❌ {error}\n")

print("\n❌ Aucune configuration n'a fonctionné.")
print("\n💡 Solutions:")
print("1. Vérifiez le mot de passe DB dans Settings → Database → Reset Database Password")
print("2. Dans le dashboard, cherchez 'Connection Pooling' pour voir l'URL exacte")
print("3. Essayez le mode 'Session' au lieu de  'Transaction' dans les connection strings")
