Merci à tous. On est alignés à 100 %.
Le Style Registry est validé comme différenciateur stratégique et fondation technique du MVP.

Décisions confirmées (finales)

✅ Style Registry dès le MVP (styles universels, urbains, africains first-class)

✅ UI → style_id uniquement (zéro couplage)

✅ Prompt Builder côté backend (FR/EN, do/don’t, BPM, instrumentation)

✅ SunoProvider consomme le registry (MVP), moteur interne plus tard sans changer l’API

✅ Timeline inchangée : 4–6 semaines

Intégration backlog (actée)

Epic 4 mis à jour avec :

Style Registry

Prompt Builder

Style Selector (Frontend)
Impact : +0.5 semaine max — acceptable.# 🚀 Implementation Plan - MusicApp MVP
## Quick Flow (4-6 Semaines)

---

## 🎯 Objectif MVP

Créer une plateforme web permettant de générer des chansons personnalisées complètes (paroles + musique + voix) à partir de texte ou contexte, avec paiement par crédits.

**KPI #1 :** Taux de conversion visiteur → payeur

**Timeline :** 4-6 semaines (solo dev + IA)

**Pays cibles :** 🇨🇲 CM, 🇨🇮 CI, 🇸🇳 SN, 🇳🇬 NG

---

## 📚 Stack Technique

### Backend
- **Framework :** FastAPI (Python 3.11+)
- **Database :** PostgreSQL (Supabase)
- **Auth :** Supabase Auth
- **Queue :** Redis + RQ (Redis Queue)
- **Storage :** Supabase Storage
- **Payment :** Flutterwave
- **Music Provider :** SunoAPI.org

### Frontend
- **Framework :** Next.js 14 (App Router)
- **Language :** TypeScript
- **UI :** Shadcn/UI + Tailwind CSS
- **State :** React Context / Zustand (minimal)
- **HTTP Client :** Axios / Fetch

### Deployment
- **Backend :** Railway / Fly.io
- **Frontend :** Vercel
- **Redis :** Upstash (managed) ou Railway

### Monitoring (MVP minimal)
- **Logs :** Railway/Fly.io native
- **Errors :** Sentry (optionnel MVP)

---

## 🗂️ Project Structure

```
musicapp/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app
│   │   ├── config.py               # Env variables
│   │   ├── database.py             # DB connection
│   │   ├── models/                 # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   ├── job.py
│   │   │   └── transaction.py
│   │   ├── schemas/                # Pydantic schemas
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       ├── projects.py
│   │   │       ├── generation.py
│   │   │       └── payments.py
│   │   ├── services/
│   │   │   ├── credits.py
│   │   │   ├── lyrics_generator.py
│   │   │   └── flutterwave.py
│   │   ├── providers/
│   │   │   └── suno_provider.py
│   │   ├── styles/
│   │   │   ├── registry.json       # Style definitions
│   │   │   ├── registry_loader.py
│   │   │   └── prompt_builder.py
│   │   ├── workers/
│   │   │   ├── lyrics_worker.py
│   │   │   ├── music_worker.py
│   │   │   └── status_worker.py
│   │   └── utils/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                # Landing
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── create/
│   │   │   └── page.tsx             # Creation wizard
│   │   ├── projects/
│   │   │   └── [id]/
│   │   └── credits/
│   │       └── page.tsx             # Buy credits
│   ├── components/
│   │   ├── ui/                      # Shadcn components
│   │   ├── AudioPlayer.tsx
│   │   ├── StyleSelector.tsx
│   │   └── CreditBalance.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── api.ts
│   └── package.json
│
└── README.md
```

---

## 🗄️ Database Schema

### Table: `profiles`
```sql
-- Note: id references auth.users from Supabase Auth
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  credits INTEGER DEFAULT 0,
  credits_reserved INTEGER DEFAULT 0,  -- Credits reserved for ongoing generations
  total_credits_spent INTEGER DEFAULT 0,  -- Total credits consumed (not money)
  total_spent_money DECIMAL(10,2) DEFAULT 0  -- Total money spent on purchases
);
```

### Table: `projects`
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  mode TEXT NOT NULL,              -- 'text' or 'context'
  style_id TEXT NOT NULL,
  language TEXT NOT NULL,          -- 'fr' or 'en'
  input_text TEXT NOT NULL,        -- user input (lyrics or context)
  generated_lyrics TEXT,           -- if mode=context
  status TEXT DEFAULT 'draft',     -- 'draft', 'queued', 'processing', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `jobs`
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'suno',
  provider_job_id TEXT,             -- external provider job ID
  status TEXT DEFAULT 'queued',     -- 'queued', 'processing', 'succeeded', 'failed'
  result_urls JSONB,                -- array of audio URLs
  metadata JSONB,                   -- provider response, timestamps, etc
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `transactions`
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,               -- 'purchase', 'reserve', 'debit', 'refund'
  amount INTEGER NOT NULL,          -- credits amount
  price DECIMAL(10,2),              -- money amount (for purchases)
  project_id UUID REFERENCES projects(id),
  payment_provider TEXT,            -- 'flutterwave'
  payment_id TEXT,                  -- external payment ID
  status TEXT DEFAULT 'pending',    -- 'pending', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_jobs_project_id ON jobs(project_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
```

---

## 🎼 Style Registry

### Structure (`backend/app/styles/registry.json`)

```json
{
  "styles": [
    {
      "id": "pop",
      "label": "Pop",
      "category": "UNIVERSAL",
      "bpm_range": [100, 130],
      "energy": "medium",
      "instrumentation": ["synth", "drums", "bass"],
      "prompt_template_fr": "Chanson pop moderne, mélodie accrocheuse, arrangements légers, ambiance positive",
      "prompt_template_en": "Modern pop song, catchy melody, light arrangement, positive vibe",
      "negative_tags": ["heavy metal", "screaming"],
      "style_weight": 0.7
    },
    {
      "id": "makossa",
      "label": "Makossa 🇨🇲",
      "category": "AFRICAN",
      "bpm_range": [110, 125],
      "energy": "high",
      "instrumentation": [
        "syncopated bass",
        "electric guitar",
        "warm percussion",
        "brass section"
      ],
      "prompt_template_fr": "Chanson Makossa camerounaise authentique, groove dansant, guitare rythmique syncopée, cuivres chaleureux, percussion africaine festive, basse groovy",
      "prompt_template_en": "Authentic Cameroonian Makossa song, dance groove, syncopated rhythmic guitar, warm brass section, festive African percussion, groovy bass",
      "negative_tags": ["trap hi-hats", "dubstep", "EDM drop", "autotune heavy"],
      "style_weight": 0.85
    },
    {
      "id": "amapiano",
      "label": "Amapiano",
      "category": "AFRICAN",
      "bpm_range": [110, 120],
      "energy": "medium-high",
      "instrumentation": [
        "log drum",
        "deep bass",
        "piano chords",
        "percussive synth"
      ],
      "prompt_template_fr": "Chanson Amapiano sud-africaine, piano mélodique, basse profonde, log drum distinctif, groove lent et chaleureux",
      "prompt_template_en": "South African Amapiano song, melodic piano, deep bass, distinctive log drum, slow warm groove",
      "negative_tags": ["rock guitar", "metal", "screaming"],
      "style_weight": 0.8
    },
    {
      "id": "afrobeats",
      "label": "Afrobeats",
      "category": "AFRICAN",
      "bpm_range": [100, 128],
      "energy": "high",
      "instrumentation": [
        "shekere",
        "talking drum",
        "synth",
        "bass"
      ],
      "prompt_template_fr": "Chanson Afrobeats moderne, percussions africaines authentiques, shekere, talking drum, basse puissante, synthés modernes",
      "prompt_template_en": "Modern Afrobeats song, authentic African percussion, shekere, talking drum, powerful bass, modern synths",
      "negative_tags": ["country", "folk acoustic"],
      "style_weight": 0.8
    },
    {
      "id": "coupe_decale",
      "label": "Coupé-Décalé 🇨🇮",
      "category": "AFRICAN",
      "bpm_range": [130, 145],
      "energy": "very-high",
      "instrumentation": [
        "electronic percussion",
        "synth stabs",
        "heavy bass"
      ],
      "prompt_template_fr": "Chanson Coupé-Décalé ivoirienne énergique, rythme rapide et dansant, percussions électroniques, basse lourde, ambiance festive",
      "prompt_template_en": "Energetic Ivorian Coupé-Décalé song, fast dance rhythm, electronic percussion, heavy bass, festive atmosphere",
      "negative_tags": ["slow ballad", "classical"],
      "style_weight": 0.85
    },
    {
      "id": "bikutsi",
      "label": "Bikutsi 🇨🇲",
      "category": "AFRICAN",
      "bpm_range": [140, 160],
      "energy": "very-high",
      "instrumentation": [
        "balafon",
        "rapid percussion",
        "electric guitar",
        "bass"
      ],
      "prompt_template_fr": "Chanson Bikutsi camerounaise traditionnelle moderne, rythme rapide et énergique, balafon, percussions intenses, guitare électrique rythmée",
      "prompt_template_en": "Modern traditional Cameroonian Bikutsi song, fast energetic rhythm, balafon, intense percussion, rhythmic electric guitar",
      "negative_tags": ["slow tempo", "ambient", "chill"],
      "style_weight": 0.85
    },
    {
      "id": "rap",
      "label": "Rap",
      "category": "URBAN",
      "bpm_range": [80, 100],
      "energy": "medium",
      "instrumentation": ["808 bass", "hi-hats", "snare"],
      "prompt_template_fr": "Beat rap moderne, 808 bass puissante, hi-hats rapides, snare claquant",
      "prompt_template_en": "Modern rap beat, powerful 808 bass, fast hi-hats, snappy snare",
      "negative_tags": ["rock", "guitar solo"],
      "style_weight": 0.75
    },
    {
      "id": "afrotrap",
      "label": "Afro Trap",
      "category": "URBAN",
      "bpm_range": [130, 150],
      "energy": "high",
      "instrumentation": [
        "trap hi-hats",
        "808",
        "african percussion",
        "flute"
      ],
      "prompt_template_fr": "Afro Trap moderne, fusion trap et percussion africaine, 808 puissante, hi-hats rapides, flûte mélodique",
      "prompt_template_en": "Modern Afro Trap, fusion of trap and African percussion, powerful 808, fast hi-hats, melodic flute",
      "negative_tags": ["country", "classical"],
      "style_weight": 0.8
    },
    {
      "id": "acoustic",
      "label": "Acoustic / Folk",
      "category": "UNIVERSAL",
      "bpm_range": [70, 100],
      "energy": "low",
      "instrumentation": ["acoustic guitar", "light percussion"],
      "prompt_template_fr": "Chanson acoustique intimiste, guitare folk, arrangements simples et chaleureux",
      "prompt_template_en": "Intimate acoustic song, folk guitar, simple warm arrangements",
      "negative_tags": ["heavy bass", "electronic"],
      "style_weight": 0.7
    },
    {
      "id": "gospel",
      "label": "Gospel",
      "category": "UNIVERSAL",
      "bpm_range": [60, 110],
      "energy": "medium",
      "instrumentation": ["piano", "organ", "choir", "drums"],
      "prompt_template_fr": "Chanson gospel spirituelle, piano émotionnel, orgue, chœurs puissants, message d'espoir",
      "prompt_template_en": "Spiritual gospel song, emotional piano, organ, powerful choir, message of hope",
      "negative_tags": ["dark", "aggressive"],
      "style_weight": 0.75
    }
  ],
  "categories": [
    {
      "id": "UNIVERSAL",
      "label_fr": "Universels",
      "label_en": "Universal"
    },
    {
      "id": "URBAN",
      "label_fr": "Urbains",
      "label_en": "Urban"
    },
    {
      "id": "AFRICAN",
      "label_fr": "Africains 🌍",
      "label_en": "African 🌍"
    }
  ]
}
```

### Prompt Builder Logic

```python
# backend/app/styles/prompt_builder.py

def build_prompt(style_id: str, lyrics: str, language: str = "fr") -> dict:
    """
    Construit le prompt complet pour SunoAPI à partir du style et lyrics.
    
    Returns:
        {
            "style_text": str,  # Description complète du style (renamed from 'prompt')
            "lyrics": str,
            "style_params": dict  # BPM, energy, etc pour metadata
        }
    """
    style = get_style_by_id(style_id)
    
    # Sélection du template selon la langue
    template_key = f"prompt_template_{language}"
    style_description = style.get(template_key, style["prompt_template_en"])
    
    # Construction du prompt enrichi
    prompt_parts = [style_description]
    
    # Ajout des détails instrumentaux
    if style.get("instrumentation"):
        instruments = ", ".join(style["instrumentation"])
        prompt_parts.append(f"Instrumentation: {instruments}")
    
    # Ajout des contraintes négatives si existantes
    if style.get("negative_tags"):
        negative = ", ".join(style["negative_tags"])
        prompt_parts.append(f"Éviter: {negative}")
    
    final_style_text = " | ".join(prompt_parts)
    
    return {
        "style_text": final_style_text,  # Renamed for clarity
        "lyrics": lyrics,
        "style_params": {
            "bpm_range": style.get("bpm_range"),
            "energy": style.get("energy"),
            "style_weight": style.get("style_weight", 0.7)
        }
    }
```

---

## 🔌 API Endpoints

### Auth
**Note:** Auth handled by Supabase Auth on frontend (signUp, signIn, signOut)
- `GET /api/v1/auth/me` - Current user profile (validates JWT)

### Users
- `GET /api/v1/users/profile` - User profile
- `GET /api/v1/users/credits` - Credit balance
- `GET /api/v1/users/history` - Generation history

### Styles
- `GET /api/v1/styles` - Liste tous les styles (grouped by category)
- `GET /api/v1/styles/{style_id}` - Détails d'un style

### Projects
- `POST /api/v1/projects` - Créer un projet (draft)
- `GET /api/v1/projects` - Liste projects user
- `GET /api/v1/projects/{id}` - Détails projet
- `DELETE /api/v1/projects/{id}` - Supprimer projet

### Generation
- `POST /api/v1/generate` - Lancer une génération
  ```json
  {
    "project_id": "uuid",
    "mode": "text|context",
    "style_id": "makossa",
    "language": "fr",
    "input_text": "...",
    "duration": 120
  }
  ```
- `GET /api/v1/jobs/{job_id}` - Status d'un job
- `GET /api/v1/jobs/{job_id}/result` - Récupérer résultat (signed URLs)

### Payments
- `POST /api/v1/payments/initiate` - Initier paiement Flutterwave
- `POST /api/v1/payments/webhook` - Webhook Flutterwave
- `GET /api/v1/payments/packages` - Credit packages disponibles

---

## 🎵 SunoProvider Implementation

### Base Structure

```python
# backend/app/providers/suno_provider.py

import httpx
from typing import Dict, List, Optional
from app.styles.prompt_builder import build_prompt

class SunoProvider:
    """
    Provider for SunoAPI.org
    Docs: https://docs.sunoapi.org/
    """
    
    def __init__(self, api_key: str, base_url: str = "https://api.sunoapi.org"):
        self.api_key = api_key
        self.base_url = base_url
        self.client = httpx.Client()  # Sync client for RQ compatibility
    
    def create_track(
        self,
        lyrics: str,
        style_id: str,
        language: str = "fr",
        duration: int = 120
    ) -> str:
        """
        Crée une track sur SunoAPI.org.
        Docs: https://docs.sunoapi.org/api/generate-music
        
        Returns:
            task_id (str): ID de la tâche côté provider
        """
        # Build enriched style description from registry
        prompt_data = build_prompt(style_id, lyrics, language)
        
        # IMPORTANT: In customMode with instrumental=false:
        # - prompt = actual lyrics (what will be sung)
        # - style = style description/genre
        # - title = song title (auto-generated if empty)
        
        payload = {
            "customMode": True,  # Custom mode (user provides lyrics)
            "prompt": lyrics,  # LYRICS (what will be sung)
            "style": prompt_data["style_text"],  # STYLE description from registry
            "title": "",  # Auto-generated by Suno
            "instrumental": False,  # We want vocals
            "callBackUrl": "",  # Optional webhook (empty for MVP polling)
            "model": "V4_5PLUS"  # Model enum: V4, V4_5PLUS, V5 (check SunoAPI docs)
        }
        
        response = self.client.post(
            f"{self.base_url}/api/v1/generate",
            json=payload,
            headers={
                "Authorization": f"Bearer {self.api_key}",  # Bearer token auth
                "Content-Type": "application/json"
            }
        )
        response.raise_for_status()
        
        data = response.json()
        
        # SunoAPI.org REAL response: {"code":200,"msg":"success","data":{"taskId":"..."}}
        if data.get("code") != 200:
            raise Exception(f"SunoAPI error: {data.get('msg', 'Unknown error')}")
        
        return data["data"]["taskId"]  # Provider task ID (camelCase)
    
    def get_status(self, task_id: str) -> Dict:
        """
        Récupère le status d'une tâche.
        Docs: https://docs.sunoapi.org/api/get-info
        
        REAL response format:
        {
          "code": 200,
          "msg": "success",
          "data": {
            "status": "SUCCESS",  // or "PROCESSING", "FAIL", etc.
            "response": {
              "sunoData": [
                {
                  "audioUrl": "https://...",
                  "streamAudioUrl": "https://...",
                  "imageUrl": "https://...",
                  "duration": 180,
                  "title": "...",
                  "tags": "..."
                }
              ]
            }
          }
        }
        
        Returns:
            {
                "status": "queued|processing|completed|failed",
                "audio_urls": [str] (if completed),
                "metadata": dict (optional - stream URLs, images, etc.),
                "error": str (if failed)
            }
        """
        response = self.client.get(
            f"{self.base_url}/api/v1/generate/record-info",
            params={"taskId": task_id},
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        response.raise_for_status()
        
        data = response.json()
        
        # Check response code
        if data.get("code") != 200:
            return {"status": "failed", "error": data.get("msg", "Unknown error")}
        
        # Extract nested data
        result_data = data.get("data", {})
        provider_status = result_data.get("status")  # e.g. "SUCCESS", "PROCESSING", "FAIL"
        response_obj = result_data.get("response") or {}
        suno_data = response_obj.get("sunoData") or []
        
        # Map provider status to our internal status
        if provider_status == "SUCCESS":
            # SUCCESS but sunoData might be empty or partial (1 track instead of 2)
            if not suno_data:
                # SUCCESS declared but no audio yet - keep processing
                return {"status": "processing", "audio_urls": []}
            
            # Extract audio URLs from all available tracks (usually 2, but accept 1+)
            audio_urls = []
            stream_urls = []
            image_urls = []
            
            for track in suno_data:
                if track.get("audioUrl"):
                    audio_urls.append(track["audioUrl"])
                if track.get("streamAudioUrl"):
                    stream_urls.append(track["streamAudioUrl"])
                if track.get("imageUrl"):
                    image_urls.append(track["imageUrl"])
            
            # Accept 1 or 2 tracks (MVP tolerant UX)
            if audio_urls:
                return {
                    "status": "completed",
                    "audio_urls": audio_urls,
                    "metadata": {
                        "stream_urls": stream_urls,
                        "image_urls": image_urls,
                        "suno_data": suno_data,  # Keep full data for reference
                        "track_count": len(audio_urls)  # 1 or 2
                    }
                }
            else:
                # SUCCESS but no valid audioUrl - keep processing
                return {"status": "processing", "audio_urls": []}
        
        elif provider_status in ("FAIL", "FAILED", "ERROR"):
            error_msg = result_data.get("errorMessage") or "Generation failed"
            return {"status": "failed", "error": error_msg}
        
        elif provider_status == "PROCESSING" or provider_status == "PENDING":
            return {"status": "processing", "audio_urls": []}
        
        else:
            # No status yet or unknown status - still queued
            return {"status": "queued", "audio_urls": []}
    
    def fetch_result(self, task_id: str) -> List[str]:
        """
        Récupère les URLs audio finales.
        
        Returns:
            List of audio URLs (SunoAPI.org returns 2 tracks)
        """
        status_data = self.get_status(task_id)
        return status_data.get("audio_urls", [])
    
    def cancel(self, task_id: str) -> bool:
        """
        Annule une tâche (non supporté par SunoAPI.org MVP).
        """
        # Not supported in current SunoAPI.org version
        return False
```

---

## ⚙️ Workers Implementation

### Music Worker (RQ)

```python
# backend/app/workers/music_worker.py

from rq import Queue
from redis import Redis
from app.providers.suno_provider import SunoProvider
from app.database import get_db
from app.models.job import Job

redis_conn = Redis.from_url(os.getenv("REDIS_URL"))
queue = Queue("music", connection=redis_conn)

def generate_music(job_id: str):
    """
    Worker task: génère la musique via SunoProvider.
    (Sync function for RQ compatibility)
    """
    db = next(get_db())
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        return
    
    try:
        # Update job status
        job.status = "processing"
        db.commit()
        
        # Get project data
        project = job.project
        
        # Call SunoProvider (sync)
        provider = SunoProvider(api_key=os.getenv("SUNO_API_KEY"))
        provider_task_id = provider.create_track(
            lyrics=project.generated_lyrics or project.input_text,
            style_id=project.style_id,
            language=project.language
        )
        
        # Save provider task ID
        job.provider_job_id = provider_task_id
        job.metadata = {
            "started_at": str(datetime.utcnow()),
            "attempt_count": 0
        }
        db.commit()
        
        # Queue status worker (polling) with initial attempt
        queue.enqueue(poll_status, job_id, delay=10)
        
    except Exception as e:
        job.status = "failed"
        job.error = str(e)
        db.commit()
        
        # Refund credits
        from app.services.credits import refund_credits
        refund_credits(project.user_id, project_id=project.id)
```

### Status Worker (Polling)

```python
# backend/app/workers/status_worker.py

def poll_status(job_id: str):
    """
    Polling worker: vérifie le status de la tâche chez le provider.
    (Sync function for RQ compatibility)
    """
    db = next(get_db())
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        return
    
    # Get current attempt count
    attempt_count = job.metadata.get("attempt_count", 0)
    max_attempts = 30  # 30 attempts × 10s = 5 minutes max
    
    # Check if max attempts reached
    if attempt_count >= max_attempts:
        job.status = "failed"
        job.error = "Generation timeout: max polling attempts reached"
        db.commit()
        
        # Refund credits
        from app.services.credits import refund_credits
        refund_credits(job.project.user_id, project_id=job.project_id)
        return
    
    provider = SunoProvider(api_key=os.getenv("SUNO_API_KEY"))
    status_data = provider.get_status(job.provider_job_id)
    
    if status_data["status"] == "completed":
        # Fetch audio URLs (already included in status_data for SunoAPI.org)
        audio_urls = status_data.get("audio_urls", [])
        
        if not audio_urls:
            job.status = "failed"
            job.error = "No audio URLs returned"
            db.commit()
            refund_credits(job.project.user_id, project_id=job.project_id)
            return
        
        # Download and upload to our storage
        stored_urls = []
        for url in audio_urls:
            stored_url = upload_to_storage(url, job.project_id)  # Sync
            stored_urls.append(stored_url)
        
        # Update job
        job.status = "succeeded"
        job.result_urls = stored_urls
        job.metadata["completed_at"] = str(datetime.utcnow())
        db.commit()
        
        # Debit credits (actually apply the reserved credits)
        from app.services.credits import debit_credits
        debit_credits(job.project.user_id, amount=1, project_id=job.project_id)
        
    elif status_data["status"] == "failed":
        job.status = "failed"
        job.error = status_data.get("error", "Generation failed")
        db.commit()
        
        # Refund credits
        from app.services.credits import refund_credits
        refund_credits(job.project.user_id, project_id=job.project_id)
        
    else:
        # Still processing, increment attempt and re-queue polling
        job.metadata["attempt_count"] = attempt_count + 1
        db.commit()
        
        queue.enqueue(poll_status, job_id, delay=10)
```

---

## 💳 Credits Management

### Logic

```python
# backend/app/services/credits.py

def reserve_credits(user_id: str, amount: int, project_id: str) -> bool:
    """
    Réserve des crédits (avant génération).
    Les crédits sont déplacés de 'credits' vers 'credits_reserved'.
    """
    db = next(get_db())
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    
    if profile.credits < amount:
        return False
    
    # Move credits from available to reserved
    profile.credits -= amount
    profile.credits_reserved += amount
    
    # Create transaction record
    txn = Transaction(
        user_id=user_id,
        type="reserve",
        amount=-amount,
        project_id=project_id,
        status="completed"
    )
    db.add(txn)
    db.commit()
    
    return True

def debit_credits(user_id: str, amount: int, project_id: str):
    """
    Débite les crédits réservés (après succès génération).
    Les crédits passent de 'credits_reserved' à définitivement dépensés.
    """
    db = next(get_db())
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    
    if not profile:
        return
    
    # Remove from reserved (they're already spent)
    profile.credits_reserved -= amount
    profile.total_credits_spent += amount  # Track credits consumed (not money)
    
    # Create transaction record
    txn = Transaction(
        user_id=user_id,
        type="debit",
        amount=-amount,
        project_id=project_id,
        status="completed"
    )
    db.add(txn)
    db.commit()

def refund_credits(user_id: str, project_id: str):
    """
    Rembourse les crédits réservés (si génération échoue).
    Les crédits retournent de 'credits_reserved' vers 'credits'.
    """
    db = next(get_db())
    
    # Find reserve transaction
    reserve_txn = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.project_id == project_id,
        Transaction.type == "reserve"
    ).first()
    
    if reserve_txn:
        amount = abs(reserve_txn.amount)
        
        # Move credits back from reserved to available
        profile = db.query(Profile).filter(Profile.id == user_id).first()
        if profile:
            profile.credits_reserved -= amount
            profile.credits += amount
        
        # Create refund transaction
        txn = Transaction(
            user_id=user_id,
            type="refund",
            amount=amount,
            project_id=project_id,
            status="completed"
        )
        db.add(txn)
        db.commit()
```

---

## 💰 Flutterwave Integration

### Initiate Payment

```python
# backend/app/services/flutterwave.py

import httpx

class FlutterwaveService:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.base_url = "https://api.flutterwave.com/v3"
    
    async def initiate_payment(
        self,
        user_id: str,
        email: str,
        amount: float,  # XAF, XOF, NGN, etc
        currency: str,
        credits: int,
        redirect_url: str
    ) -> dict:
        """
        Initie un paiement Flutterwave.
        
        Returns:
            {
                "payment_link": str,
                "transaction_id": str
            }
        """
        payload = {
            "tx_ref": f"MUSIC_{user_id}_{int(time.time())}",
            "amount": amount,
            "currency": currency,
            "redirect_url": redirect_url,
            "customer": {
                "email": email,
                "name": email.split("@")[0]
            },
            "customizations": {
                "title": "MusicApp Crédits",
                "description": f"{credits} crédits",
                "logo": "https://yourdomain.com/logo.png"
            },
            "meta": {
                "user_id": user_id,
                "credits": credits
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/payments",
                json=payload,
                headers={"Authorization": f"Bearer {self.secret_key}"}
            )
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "payment_link": data["data"]["link"],
                "transaction_id": data["data"]["id"]
            }
    
    async def verify_payment(self, transaction_id: str) -> dict:
        """
        Vérifie le statut d'un paiement.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/transactions/{transaction_id}/verify",
                headers={"Authorization": f"Bearer {self.secret_key}"}
            )
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "status": data["data"]["status"],  # "successful", "failed"
                "amount": data["data"]["amount"],
                "currency": data["data"]["currency"],
                "meta": data["data"].get("meta", {})
            }
```

### Webhook Handler

```python
# backend/app/api/v1/payments.py

@router.post("/webhook")
async def flutterwave_webhook(request: Request):
    """
    Webhook Flutterwave (payment confirmation).
    """
    payload = await request.json()
    
    # Verify webhook signature
    signature = request.headers.get("verif-hash")
    if signature != os.getenv("FLUTTERWAVE_WEBHOOK_SECRET"):
        raise HTTPException(status_code=401)
    
    # Process payment
    if payload["event"] == "charge.completed" and payload["data"]["status"] == "successful":
        meta = payload["data"]["meta"]
        user_id = meta["user_id"]
        credits = int(meta["credits"])
        amount_paid = float(payload["data"]["amount"])
        
        # Add credits to user profile
        db = next(get_db())
        profile = db.query(Profile).filter(Profile.id == user_id).first()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile.credits += credits
        profile.total_spent_money += amount_paid  # Track money spent (DECIMAL)
        
        # Create transaction record
        txn = Transaction(
            user_id=user_id,
            type="purchase",
            amount=credits,
            price=amount_paid,
            payment_provider="flutterwave",
            payment_id=payload["data"]["id"],
            status="completed"
        )
        db.add(txn)
        db.commit()
    
    return {"status": "ok"}
```

---

## 🎨 Frontend Routes

### Pages Structure

1. **Landing Page** - `/`
   - Hero section
   - CTA "Créer ma chanson"
   - Examples (audio players)
   - Pricing

2. **Auth Pages**
   - `/auth/signup`
   - `/auth/login`

3. **Dashboard** - `/dashboard`
   - User profile
   - Credit balance
   - Recent projects

4. **Create Wizard** - `/create`
   - Step 1: Choisir mode (texte / contexte)
   - Step 2: Sélectionner style (StyleSelector component)
   - Step 3: Saisir texte/contexte
   - Step 4: Paramètres (langue, durée)
   - Step 5: Confirmation + lancement

5. **Project Detail** - `/projects/[id]`
   - Status de génération
   - Audio player (2 versions)
   - Download buttons
   - Share buttons

6. **Buy Credits** - `/credits`
   - Credit packages
   - Flutterwave payment integration

### Key Components

#### StyleSelector.tsx
```typescript
// frontend/components/StyleSelector.tsx

interface Style {
  id: string;
  label: string;
  category: string;
  bpm_range: [number, number];
  energy: string;
}

export function StyleSelector({ onSelect }: { onSelect: (styleId: string) => void }) {
  const [styles, setStyles] = useState<Style[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  
  useEffect(() => {
    // Fetch styles from API
    fetch("/api/v1/styles")
      .then(res => res.json())
      .then(data => setStyles(data.styles));
  }, []);
  
  const categories = ["ALL", "UNIVERSAL", "URBAN", "AFRICAN"];
  
  const filteredStyles = selectedCategory === "ALL" 
    ? styles 
    : styles.filter(s => s.category === selectedCategory);
  
  return (
    <div>
      <div className="flex gap-2 mb-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat ? "active" : ""}
          >
            {cat}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {filteredStyles.map(style => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className="style-card"
          >
            <h3>{style.label}</h3>
            <p>{style.energy}</p>
            <p>{style.bpm_range[0]}-{style.bpm_range[1]} BPM</p>
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### AudioPlayer.tsx
```typescript
// frontend/components/AudioPlayer.tsx

export function AudioPlayer({ urls }: { urls: string[] }) {
  const [currentTrack, setCurrentTrack] = useState(0);
  
  return (
    <div>
      <h3>Version {currentTrack + 1} / {urls.length}</h3>
      
      <audio controls src={urls[currentTrack]} />
      
      <div className="flex gap-2 mt-4">
        {urls.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentTrack(idx)}
            className={idx === currentTrack ? "active" : ""}
          >
            Version {idx + 1}
          </button>
        ))}
      </div>
      
      <a href={urls[currentTrack]} download className="btn-download">
        Télécharger Version {currentTrack + 1}
      </a>
    </div>
  );
}
```

---

## 🚀 Deployment Checklist

### Backend (Railway / Fly.io)

**Environment Variables:**
```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_KEY=...
REDIS_URL=redis://...
SUNO_API_KEY=sk-...
OPENAI_API_KEY=sk-... # for lyrics generation
FLUTTERWAVE_SECRET_KEY=...
FLUTTERWAVE_WEBHOOK_SECRET=...
JWT_SECRET=...
ENVIRONMENT=production
```

**Commands:**
```bash
# Railway
railway up

# Fly.io
fly deploy
```

### Frontend (Vercel)

**Environment Variables:**
```bash
NEXT_PUBLIC_API_URL=https://api.musicapp.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Commands:**
```bash
vercel --prod
```

### Redis (Upstash)

1. Create Upstash Redis instance
2. Copy `REDIS_URL`
3. Add to backend env vars

### Database Migrations

```bash
# Init migrations
alembic init migrations

# Create migration
alembic revision --autogenerate -m "initial schema"

# Apply migrations
alembic upgrade head
```

---

## 📊 Epic Timeline (Final)

| Epic | Semaine | Livrables |
|------|---------|-----------|
| **1+2: Foundation & Auth** | 1-2 | Setup complet + Auth fonctionnel |
| **3: Music Provider** | 2-3 | SunoProvider + Jobs + Style Registry |
| **4: Generation Flow** | 3-4.5 | 2 modes fonctionnels + Crédits |
| **5: Frontend MVP** | 4-5 | UI complète + Player |
| **6: Paiement** | 5-6 | Flutterwave integration |
| **7: Launch** | 6 | MVP LIVE 🚀 |

---

## ✅ MVP Definition of Done

- [ ] User peut s'inscrire/connecter
- [ ] User peut voir et acheter des crédits (Flutterwave)
- [ ] User peut créer chanson mode "Texte" avec style africain (ex: Makossa)
- [ ] User peut créer chanson mode "Contexte" (lyrics auto-générées)
- [ ] User reçoit 2 versions audio
- [ ] User peut écouter et télécharger
- [ ] Credits fonctionnent (réserve → débit → refund)
- [ ] Mobile Money fonctionne (CM, CI, SN, NG)
- [ ] Deployed en production
- [ ] Monitoring basique opérationnel

---

## 🎯 Success Metrics (MVP)

**KPI #1 :** Taux de conversion visiteur → payeur

**KPIs secondaires :**
- Nombre de chansons créées
- Taux de partage
- Temps moyen jusqu'au paiement
- Styles les plus utilisés (focus africains)

---

## 🔥 Next Steps

1. **Setup projet** (Day 1)
   - Init monorepo
   - Configure Supabase
   - Setup Redis

2. **Start Epic 1+2** (Week 1)
   - Backend skeleton
   - Frontend skeleton
   - Auth flow

3. **Daily progress** (solo dev + IA)
   - Code 4-6h/day
   - Deploy daily to staging
   - Test end-to-end weekly

4. **Week 6 target:** MVP LIVE 🚀

---

**🎵 Let's build this. Time to code.** 🚀
