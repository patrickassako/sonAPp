# 🚀 Guide de Test Rapide - Epic 4

## ✅ Étape 1 : Préparer l'environnement

```bash
cd /Users/apple/Documents/MusicAPp/backend

# Activer venv
source venv/bin/activate

# Reset la DB (optional si déjà fait)
python init_sqlite.py
```

## ✅ Étape 2 : Démarrer les services

**Terminal 1 - Redis:**
```bash
docker start whatsapp-redis || docker run -d --name whatsapp-redis -p 6379:6379 redis:alpine
```

**Terminal 2 - API Server:**
```bash
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 - Worker:**
```bash
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
python start_worker.py
```

## ✅ Étape 3 : Générer un token

**Terminal 4 - Tests:**
```bash
python get_token.py > .token
export TOKEN=$(cat .token)
```

## ✅ Étape 4 : Tester manuellement

**Test 1 - Wallet:**
```bash
curl http://localhost:8000/api/v1/users/wallet \
  -H "Authorization: Bearer $TOKEN"
```
Attendu : `{"credits": 100, ...}`

**Test 2 - Créer un projet:**
```bash
curl -X POST http://localhost:8000/api/v1/projects/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Manuel",
    "mode": "TEXT",
    "language": "fr",
    "style_id": "makossa",
    "context_input": "Dance makossa"
  }'
```
Attendu : `{"id": "...", "title": "Test Manuel", "status": "draft"}`

**Test 3 - Lancer génération:**
```bash
# Remplace PROJECT_ID par l'ID reçu ci-dessus
curl -X POST http://localhost:8000/api/v1/generate/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "PROJECT_ID"}'
```
Attendu : `{"id": "...", "status": "queued", "credits_cost": 10}`

**Test 4 - Vérifier le statut:**
```bash
# Remplace JOB_ID par l'ID reçu ci-dessus
curl http://localhost:8000/api/v1/generate/jobs/JOB_ID \
  -H "Authorization: Bearer $TOKEN"
```
Attendu : `{"status": "processing"}` puis `"completed"` après ~5min

**Test 5 - Récupérer les audios:**
```bash
# Remplace PROJECT_ID
curl http://localhost:8000/api/v1/projects/PROJECT_ID/audio \
  -H "Authorization: Bearer $TOKEN"
```
Attendu : `[{"file_url": "...", "stream_url": "..."}]`

## ✅ Étape 5 : Test automatique (optionnel)

```bash
python test_epic4_e2e.py $TOKEN
```

## 🔍 Logs pour debug

```bash
# Worker
tail -f worker.log

# API
# (Visible dans le terminal où uvicorn tourne)
```

## ✅ Checklist Final

- [ ] Redis démarre sans erreur
- [ ] API démarre sur port 8000
- [ ] Worker démarre sans crash
- [ ] Token généré valide
- [ ] Wallet retourne les crédits
- [ ] Projet créé en DB
- [ ] Job envoyé au worker
- [ ] Worker traite le job (logs montrent "Processing...")
- [ ] Audio files sauvés (ou erreur visible)
- [ ] Credits débités
