# 🎵 Epic 4 - Full Generation Flow

## ✅ Quick Test Guide

### Prerequisites
1. ✅ FastAPI server running (`uvicorn app.main:app --reload`)
2. ⏳ Redis server running (or use Upstash free tier)
3. ⏳ RQ worker running (`python start_worker.py`)
4. ✅ Supabase database with tables
5. ✅ Valid Supabase JWT token

---

## 🚀 Test Flow

### Step 1: Start Redis (Local)
```bash
# If you have Docker:
docker run -d -p 6379:6379 redis

# Or use Upstash (free Redis cloud):
# https://upstash.com → Create database → Copy REDIS_URL to .env
```

### Step 2: Start Worker
```bash
cd backend
source venv/bin/activate
python start_worker.py
```

Output should show:
```
🎵 MusicApp Worker Starting...
Redis: redis://localhost:6379/0
Listening to queue: music_generation
Worker ready! Waiting for jobs...
```

### Step 3: Get Auth Token

Go to Supabase dashboard → API → Get JWT token or:

```bash
# Sign up/login via Supabase client, get token
# For test, use Supabase dashboard → Authentication → Users → Get JWT
```

### Step 4: Create Project

```bash
export TOKEN="your-jwt-token-here"

curl -X POST http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ma Chanson Makossa",
    "mode": "TEXT",
    "language": "fr",
    "style_id": "makossa",
    "lyrics_final": "Je veux danser, danser toute la nuit\nAu rythme du Makossa, oh oui\nGuitare résonne, les cuivres chantent\nC'est la fête qui commence"
  }'
```

Response:
```json
{
  "id": "...",
  "title": "Ma Chanson Makossa",
  "status": "draft",
  ...
}
```

Save the `id` → **PROJECT_ID**

### Step 5: Add Credits to User (Manual for now)

```sql
-- In Supabase SQL Editor
UPDATE profiles 
SET credits = 100 
WHERE email = 'your-email@example.com';
```

### Step 6: Start Generation

```bash
export PROJECT_ID="your-project-id-here"

curl -X POST http://localhost:8000/api/v1/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\": \"$PROJECT_ID\"}"
```

Response:
```json
{
  "id": "...",
  "project_id": "...",
  "status": "queued",
  "credits_cost": 10,
  ...
}
```

Save the `id` → **JOB_ID**

**Check worker logs** - you should see:
```
[Worker] Creating track for project ...
[Worker] SunoAPI task created: ...
[Worker] Attempt 1/30...
```

### Step 7: Check Job Status

```bash
export JOB_ID="your-job-id-here"

curl http://localhost:8000/api/v1/generate/jobs/$JOB_ID \
  -H "Authorization: Bearer $TOKEN"
```

Status progression:
- `queued` → Worker not started yet
- `processing` → Worker polling SunoAPI
- `completed` → Audio ready! ✅
- `failed` → Error (credits refunded)

### Step 8: Get Audio Files

```bash
curl http://localhost:8000/api/v1/projects/$PROJECT_ID/audio \
  -H "Authorization: Bearer $TOKEN"
```

Response (when complete):
```json
[
  {
    "id": "...",
    "file_url": "https://...",
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

🎉 **2 audio files generated!**

---

## 📊 Check Credits

```bash
curl http://localhost:8000/api/v1/users/wallet \
  -H "Authorization: Bearer $TOKEN"
```

Should show:
```json
{
  "credits": 90,           // 100 - 10
  "credits_reserved": 0,
  "credits_available": 90,
  "total_spent": 10,
  "total_spent_money": 0.00
}
```

---

## 🐛 Troubleshooting

**Worker not processing:**
- Check Redis is running: `redis-cli ping` → `PONG`
- Check worker logs for errors

**401 Unauthorized:**
- Token expired → Get new token
- User not found → Check Supabase Auth

**402 Payment Required:**
- Insufficient credits → Add via SQL

**Job stuck in "queued":**
- Worker not running → Start worker
- Check worker logs

**Job "failed":**
- Check job error_message in response
- Credits should be automatically refunded

---

## 🎯 Next Steps

After successful test:
- [ ] Frontend integration
- [ ] Payment flow (Flutterwave)
- [ ] Context mode (LLM lyrics)
- [ ] Supabase Storage (upload audio)

---

**Epic 4 Status:** ✅ Implementation Complete, ⏳ Testing
