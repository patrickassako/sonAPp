# 🎵 Test Epic 4 - Setup Rapide avec Docker

## Étape 1: Lancer Redis (Docker)

```bash
docker run -d --name musicapp-redis -p 6379:6379 redis:alpine
```

Vérifier que Redis fonctionne:
```bash
docker ps | grep redis
# → Vous devriez voir le container running
```

---

## Étape 2: Lancer le Worker RQ

**Terminal 2** (nouveau terminal):
```bash
cd /Users/apple/Documents/MusicAPp/backend
source venv/bin/activate
python start_worker.py
```

Vous devriez voir:
```
🎵 MusicApp Worker Starting...
Redis: redis://localhost:6379/0
============================================================
Listening to queue: music_generation
Worker ready! Waiting for jobs...
```

**Laissez ce terminal ouvert** - c'est votre worker qui va traiter les jobs.

---

## Étape 3: Ajouter des Crédits à votre User

**Dans Supabase SQL Editor:**
```sql
-- Voir votre user
SELECT id, email, credits FROM profiles;

-- Ajouter 100 crédits
UPDATE profiles 
SET credits = 100 
WHERE email = 'VOTRE_EMAIL@example.com';

-- Vérifier
SELECT id, email, credits, credits_reserved FROM profiles;
```

---

## Étape 4: Obtenir un JWT Token

**Option A: Via Supabase Dashboard**
1. Allez sur votre projet Supabase
2. Authentication → Users
3. Cliquez sur votre user
4. Copiez le **Access Token (JWT)**

**Option B: Via Code (si vous avez Node.js)**
```javascript
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_KEY')

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'your@email.com',
  password: 'your-password'
})

console.log('Token:', data.session.access_token)
```

**Sauvegardez le token:**
```bash
export TOKEN="eyJ..."  # Votre JWT token ici
```

---

## Étape 5: Créer un Projet

**Terminal 3** (ou celui du server):
```bash
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Makossa Live",
    "mode": "TEXT",
    "language": "fr",
    "style_id": "makossa",
    "lyrics_final": "Je veux danser au rythme du Makossa\nLa guitare groove, les cuivres éclatent\nC'\''est la fête ce soir, tout le monde danse\nMakossa makossa, on ne s'\''arrête pas"
  }' | python3 -m json.tool
```

**Réponse attendue:**
```json
{
  "id": "abc-123-...",  ← COPIEZ CE ID
  "title": "Test Makossa Live",
  "status": "draft",
  ...
}
```

**Sauvegardez le project_id:**
```bash
export PROJECT_ID="abc-123-..."  # Remplacer par l'ID reçu
```

---

## Étape 6: Lancer la Génération ! 🎵

```bash
curl -X POST http://localhost:8000/api/v1/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\": \"$PROJECT_ID\"}" | python3 -m json.tool
```

**Réponse:**
```json
{
  "id": "job-xyz-...",  ← JOB ID
  "status": "queued",
  "credits_cost": 10,
  "created_at": "..."
}
```

**Regardez le Terminal 2 (Worker)** - vous devriez voir:
```
[Worker] Creating track for project abc-123...
[Worker] SunoAPI task created: 29d1e81f...
[Worker] Attempt 1/30...
[Worker] Attempt 2/30...
...
```

**Sauvegardez le job_id:**
```bash
export JOB_ID="job-xyz-..."
```

---

## Étape 7: Surveiller le Status

```bash
# Checker toutes les 10 secondes
while true; do
  curl -s http://localhost:8000/api/v1/generate/jobs/$JOB_ID \
    -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Status: {data['status']}\")"
  sleep 10
done
```

**Progression:**
- `queued` → Worker pas encore démarré
- `processing` → Worker en train de poller SunoAPI
- `completed` → ✅ FINI !
- `failed` → ❌ Erreur (crédits remboursés)

**CTRL+C pour arrêter** quand status = `completed`

---

## Étape 8: Récupérer les URLs Audio ! 🎉

```bash
curl http://localhost:8000/api/v1/projects/$PROJECT_ID/audio \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Réponse (si succès):**
```json
[
  {
    "id": "...",
    "file_url": "https://musicfile.removeai.ai/...",
    "stream_url": "https://...",
    "image_url": "https://...",
    "version_number": 1
  },
  {
    ...
    "version_number": 2
  }
]
```

**🎵 Ouvrez les URLs dans votre navigateur pour écouter !**

---

## Étape 9: Vérifier les Crédits

```bash
curl http://localhost:8000/api/v1/users/wallet \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Attendu:**
```json
{
  "credits": 90,           // 100 - 10
  "credits_reserved": 0,
  "credits_available": 90,
  "total_spent": 10,
  "total_spent_money": "0.00"
}
```

---

## 🎯 Résumé Complet

```bash
# Terminal 1: Server FastAPI (déjà running)
uvicorn app.main:app --reload

# Terminal 2: Worker RQ
python start_worker.py

# Terminal 3: Tests
# 1. Docker Redis
docker run -d --name musicapp-redis -p 6379:6379 redis:alpine

# 2. Ajouter crédits (SQL)
# UPDATE profiles SET credits = 100 WHERE email = 'your@email.com';

# 3. Export vars
export TOKEN="..."
export PROJECT_ID="..."
export JOB_ID="..."

# 4. Create → Generate → Get Audio
```

---

## 🐛 Troubleshooting

**Worker ne démarre pas:**
```bash
# Vérifier Redis
docker ps | grep redis

# Si absent
docker start musicapp-redis

# Ou relancer
docker run -d --name musicapp-redis -p 6379:6379 redis:alpine
```

**401 Unauthorized:**
- Token expiré → Régénérer depuis Supabase
- Vérifier le header: `Authorization: Bearer TOKEN`

**402 Payment Required:**
- Pas assez de crédits
- SQL: `UPDATE profiles SET credits = 100 WHERE ...`

**Worker logs "[ERROR]":**
- Vérifier SUNO_API_KEY dans .env
- Tester: `python tests/test_suno.py`

---

## 🚀 Bonus: Railway (Production)

Si ça marche en local, on peut déployer sur Railway:

1. **Redis sur Railway:**
   - Railway Dashboard → New → Database → Redis
   - Copy REDIS_URL

2. **Backend sur Railway:**
   - Push sur GitHub
   - Railway → New → From GitHub
   - Variables d'environnement
   - Auto-deploy

3. **Worker sur Railway:**
   - Même repo
   - Commande: `python start_worker.py`
   - Procfile ou railway.toml

**Mais testons d'abord en local ! 🎵**
