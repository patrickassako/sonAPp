# 📡 api_contract.md (MVP)
## SaaS de Création Musicale Personnalisée — API Produit (FastAPI)
### Provider MVP : Suno Wrapper (via https://docs.sunoapi.org)

> Ce document décrit **NOTRE API publique** (stable) + une annexe “Provider SunoWrapper” (détails d’intégration).
> 
> ⚠️ Principe : le frontend n’appelle jamais le wrapper Suno directement.  
> Il appelle **notre API** (`/projects`, `/jobs`, `/tracks`).  
> Le backend orchestre et appelle le provider (Suno wrapper) via `SunoProvider`.

---

# 0) Conventions

## Base URL
- `/api/v1`

## Auth
- `Authorization: Bearer <SUPABASE_JWT>`

## Content-Type
- `application/json`

## Dates
- ISO 8601 UTC

## Enum
### Language
- `FR | EN`

### Mode
- `TEXT | CONTEXT | VOICE`  
> MVP: `VOICE` désactivé (feature flag), mais le schéma le prévoit.

### JobStatus
- `QUEUED | RUNNING | SUCCEEDED | FAILED | CANCELED`

### Provider
- `SUNO | INTERNAL`
> MVP: `SUNO` only.

---

# 1) Errors (standard)

Toutes les erreurs renvoient :

```json
{
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message",
    "details": {}
  }
}

Codes fréquents

UNAUTHORIZED

FORBIDDEN

NOT_FOUND

VALIDATION_ERROR

INSUFFICIENT_CREDITS

RATE_LIMITED

PROVIDER_ERROR

JOB_NOT_CANCELABLE

2) Health
GET /health

200
{
  "status": "ok",
  "version": "1.0.0",
  "time": "2026-01-29T12:00:00Z"
}

3) User / Wallet / Plans
GET /me

200
{
  "user": {
    "id": "usr_123",
    "email": "user@email.com",
    "created_at": "2026-01-01T10:00:00Z"
  },
  "wallet": {
    "credits_balance": 42,
    "credits_reserved": 0
  }
}

3) User / Wallet / Plans
GET /me

200

{
  "user": {
    "id": "usr_123",
    "email": "user@email.com",
    "created_at": "2026-01-01T10:00:00Z"
  },
  "wallet": {
    "credits_balance": 42,
    "credits_reserved": 0
  }
}

GET /wallet

200

{
  "credits_balance": 42,
  "credits_reserved": 0
}

GET /plans

But: le frontend affiche les packs crédits (prix gérés côté backend)

200

{
  "currency": "USD",
  "packs": [
    { "pack_id": "pack_10", "name": "10 chansons", "credits": 10, "price": 9.99 },
    { "pack_id": "pack_50", "name": "50 chansons", "credits": 50, "price": 39.99 }
  ]
}

4) Projects
4.1 Schéma (Project)
{
  "id": "prj_abc",
  "user_id": "usr_123",
  "title": "Anniversaire Marie",
  "mode": "CONTEXT",
  "language": "FR",

  "input_text": null,
  "context_text": "Chanson d'anniversaire joyeuse pour Marie, 30 ans, humour et gratitude.",

  "style": {
    "genre": "POP",
    "mood": "JOYFUL",
    "tempo": "MEDIUM",
    "tags": ["birthday", "warm", "family"]
  },

  "voice": {
    "type": "FEMALE"
  },

  "duration_sec": 120,

  "created_at": "2026-01-29T12:00:00Z",
  "updated_at": "2026-01-29T12:00:00Z"
}

Règles validation (MVP)

title: 1..80

language: FR|EN

duration_sec: 60|120|180

mode=TEXT => input_text requis (1..2000)

mode=CONTEXT => context_text requis (1..1000)

style.tags: max 20 tags, 1..32 chars

voice.type: MALE|FEMALE|NEUTRAL (MVP)

POST /projects

Créer un projet.

Request

{
  "title": "Anniversaire Marie",
  "mode": "CONTEXT",
  "language": "FR",
  "input_text": null,
  "context_text": "Chanson d'anniversaire joyeuse pour Marie, 30 ans, humour et gratitude.",
  "style": {
    "genre": "POP",
    "mood": "JOYFUL",
    "tempo": "MEDIUM",
    "tags": ["birthday", "joy", "family"]
  },
  "voice": { "type": "FEMALE" },
  "duration_sec": 120
}


201

{ "project": { "...": "..." } }

GET /projects

Lister projets (pagination)

Query

limit (default 20, max 50)

cursor (optional)

200

{
  "items": [
    {
      "id": "prj_abc",
      "title": "Anniversaire Marie",
      "mode": "CONTEXT",
      "language": "FR",
      "duration_sec": 120,
      "created_at": "2026-01-29T12:00:00Z"
    }
  ],
  "next_cursor": null
}

GET /projects/{project_id}

200

{ "project": { "...": "..." } }

PATCH /projects/{project_id}

Modifier un projet avant génération (pas de job en RUNNING/SUCCEEDED).

Request (exemple)

{
  "title": "Anniversaire Marie (v2)",
  "context_text": "Chanson d'anniversaire joyeuse pour Marie, 30 ans, très festive."
}


200

{ "project": { "...": "..." } }

DELETE /projects/{project_id}

Supprimer un projet (et assets associés si existants).

204 (no content)

5) Estimation de coût
POST /jobs/estimate

But: afficher “coût en crédits” avant lancement.

Request

{
  "mode": "CONTEXT",
  "duration_sec": 120,
  "provider": "SUNO"
}


200

{
  "estimated_credits": 1,
  "notes": "Le coût final peut varier si options premium activées."
}

6) Jobs (Génération)
6.1 Schéma (Job)
{
  "id": "job_001",
  "project_id": "prj_abc",
  "user_id": "usr_123",

  "provider": "SUNO",
  "provider_task_id": "task_789",

  "status": "RUNNING",
  "progress": 45,

  "cost_credits_reserved": 1,
  "cost_credits_final": null,

  "error": null,

  "created_at": "2026-01-29T12:00:30Z",
  "updated_at": "2026-01-29T12:01:10Z"
}

POST /projects/{project_id}/jobs

Lancer la génération pour un projet.

Request

{
  "provider": "SUNO",
  "options": {
    "lyrics_policy": "AUTO",
    "instrumental": false,
    "return_streaming": true,
    "negative_tags": [],
    "style_weight": 0.7
  }
}

Règles MVP

provider forcé à SUNO

Réserver crédits immédiatement

Idempotency conseillé via header Idempotency-Key

201

{
  "job": {
    "id": "job_001",
    "project_id": "prj_abc",
    "provider": "SUNO",
    "status": "QUEUED",
    "progress": 0,
    "cost_credits_reserved": 1,
    "created_at": "2026-01-29T12:00:30Z"
  }
}


Erreurs possibles :

INSUFFICIENT_CREDITS

VALIDATION_ERROR

PROVIDER_ERROR

GET /jobs/{job_id}

Récupérer statut + résultat si prêt.

200 (RUNNING)

{
  "job": {
    "id": "job_001",
    "status": "RUNNING",
    "progress": 45,
    "provider": "SUNO",
    "provider_task_id": "task_789",
    "error": null,
    "created_at": "2026-01-29T12:00:30Z",
    "updated_at": "2026-01-29T12:01:10Z"
  },
  "result": null
}


200 (SUCCEEDED)

IMPORTANT : le wrapper Suno renvoie souvent 2 tracks.
On expose donc tracks[].

{
  "job": {
    "id": "job_001",
    "status": "SUCCEEDED",
    "progress": 100,
    "provider": "SUNO",
    "created_at": "2026-01-29T12:00:30Z",
    "updated_at": "2026-01-29T12:02:05Z"
  },
  "result": {
    "tracks": [
      {
        "track_id": "trk_001a",
        "title": "Anniversaire Marie",
        "language": "FR",
        "duration_sec": 120,
        "lyrics": "Couplet...\nRefrain...\n",
        "assets": [
          { "type": "AUDIO", "format": "mp3", "url": "https://storage.../trk_001a.mp3" },
          { "type": "IMAGE", "format": "jpg", "url": "https://storage.../trk_001a.jpg" },
          { "type": "META", "format": "json", "url": "https://storage.../trk_001a.meta.json" }
        ]
      },
      {
        "track_id": "trk_001b",
        "title": "Anniversaire Marie (alt)",
        "language": "FR",
        "duration_sec": 120,
        "lyrics": "Couplet...\nRefrain...\n",
        "assets": [
          { "type": "AUDIO", "format": "mp3", "url": "https://storage.../trk_001b.mp3" },
          { "type": "IMAGE", "format": "jpg", "url": "https://storage.../trk_001b.jpg" },
          { "type": "META", "format": "json", "url": "https://storage.../trk_001b.meta.json" }
        ]
      }
    ]
  }
}


200 (FAILED)

{
  "job": {
    "id": "job_001",
    "status": "FAILED",
    "progress": 0,
    "provider": "SUNO",
    "error": {
      "code": "PROVIDER_ERROR",
      "message": "Provider unavailable",
      "details": {}
    }
  },
  "result": null
}

GET /jobs

Lister jobs utilisateur (pagination)

Query

limit, cursor

status (optional)

200

{
  "items": [
    {
      "id": "job_001",
      "project_id": "prj_abc",
      "status": "SUCCEEDED",
      "provider": "SUNO",
      "created_at": "2026-01-29T12:00:30Z"
    }
  ],
  "next_cursor": null
}

POST /jobs/{job_id}/cancel

Annuler un job si annulable.

200

{
  "job": {
    "id": "job_001",
    "status": "CANCELED"
  }
}


Erreurs :

JOB_NOT_CANCELABLE

7) Tracks (Bibliothèque)
GET /tracks

Lister tracks finalisées.

200

{
  "items": [
    {
      "track_id": "trk_001a",
      "project_id": "prj_abc",
      "title": "Anniversaire Marie",
      "language": "FR",
      "duration_sec": 120,
      "audio_preview_url": "https://storage.../trk_001a.mp3",
      "created_at": "2026-01-29T12:02:05Z"
    }
  ],
  "next_cursor": null
}

GET /tracks/{track_id}

Détails d’une track + assets.

200

{
  "track": {
    "track_id": "trk_001a",
    "title": "Anniversaire Marie",
    "language": "FR",
    "duration_sec": 120,
    "lyrics": "Couplet...\nRefrain...\n",
    "assets": [
      { "type": "AUDIO", "format": "mp3", "url": "https://storage.../trk_001a.mp3" },
      { "type": "IMAGE", "format": "jpg", "url": "https://storage.../trk_001a.jpg" }
    ]
  }
}

POST /tracks/{track_id}/download

Retourne une URL signée (anti hotlink / expiration).

200

{
  "download_url": "https://signed-url.../trk_001a.mp3?exp=..."
}

8) Realtime (MVP)
Option A — Polling

Frontend poll :

GET /jobs/{job_id} toutes les 2–5 secondes.

Option B — SSE (recommandé)
GET /jobs/{job_id}/events (SSE)

Exemples d’événements :

event: progress
data: {"progress":45}

event: status
data: {"status":"RUNNING"}

event: done
data: {"status":"SUCCEEDED"}

9) Webhooks (Backend ↔ Provider SunoWrapper)

Le wrapper Suno propose un mécanisme callBackUrl (backend reçoit des updates).
On expose un endpoint webhook “provider” sécurisé par signature HMAC (à définir).

POST /webhooks/providers/suno

Headers (exemple)

X-Provider-Signature: <hmac>

X-Provider-Timestamp: <unix>

Body (shape variable selon wrapper)

{
  "taskId": "task_789",
  "status": "SUCCESS",
  "data": {}
}


200

{ "ok": true }


Règles

Vérifier signature + timestamp (anti-replay)

Mapper taskId → job_id

Mettre à jour jobs.status/progress

Si terminé : déclencher delivery_worker pour récupérer URLs et sauvegarder assets

10) ANNEXE — Intégration Provider MVP (Suno Wrapper)

Cette annexe décrit ce que SunoProvider doit appeler côté backend.
Ces endpoints sont ceux du wrapper (pas exposés au client).

10.1 Config

Base URL : https://api.sunoapi.org

Auth : API key (selon wrapper) via header (ex: Authorization: Bearer <API_KEY> ou X-API-Key: ...)

Timeout & retries :

Timeout HTTP: 30s

Retries: 2–3 avec backoff

10.2 Appels provider
A) Crédits restants (optionnel)

GET https://api.sunoapi.org/api/v1/generate/credit

Mapping

Utilisé pour monitoring interne / alerting (pas pour wallet utilisateur)

Le wallet utilisateur est géré chez nous.

B) Lancer une génération

POST https://api.sunoapi.org/api/v1/generate

Input (conceptuel)

Le wrapper accepte plusieurs champs.
On envoie au minimum :

prompt : le prompt principal (incluant langue + contexte + contraintes)

title : titre

style : tags/style (string ou liste → selon wrapper)

instrumental : bool

customMode : bool (si paroles custom)

callBackUrl : notre webhook /webhooks/providers/suno (URL publique)

Mapping depuis notre modèle

Project.language → injecté dans prompt (ex: “Language: FR”)

Project.mode

TEXT: on injecte input_text (lyrics) et active “custom lyrics” si nécessaire

CONTEXT: on génère lyrics via LLM puis on injecte lyrics + prompt

Project.duration_sec → injecté dans prompt (si wrapper ne supporte pas durée strict)

voice.type → si wrapper supporte “vocalGender”, sinon injecté dans prompt

Output attendu (minimum)

taskId (ou équivalent)

Mapping

job.provider_task_id = taskId

job.status = RUNNING

C) Récupérer état + résultats

GET https://api.sunoapi.org/api/v1/generate/record-info?taskId=<taskId>

Output (conceptuel)

status (ex: PENDING / TEXT_SUCCESS / FIRST_SUCCESS / SUCCESS / etc.)

sunoData: liste d’items (souvent 2) contenant des URLs :

audioUrl (download)

streamAudioUrl (stream)

imageUrl (cover)

duration (si fourni)

title (si fourni)

prompt/lyrics (si fourni)

Mapping (normalisation interne)

Statuts provider → JobStatus :

PENDING / en cours → RUNNING (+progress)

SUCCESS → SUCCEEDED

ERROR → FAILED

sunoData[] → result.tracks[] (2 tracks)

URLs provider → on télécharge / re-uploade dans notre Storage puis on expose nos URLs

10.3 Normalisation des statuts (exemple)

On garde une table de mapping dans SunoProvider :

ProviderStatus in {PENDING, TEXT_SUCCESS, FIRST_SUCCESS} → RUNNING

ProviderStatus in {SUCCESS} → SUCCEEDED

ProviderStatus in {FAILED, ERROR} → FAILED

Progress (exemple MVP) :

PENDING = 10

TEXT_SUCCESS = 40

FIRST_SUCCESS = 70

SUCCESS = 100

10.4 Règles financières (CRUCIAL)

À POST /projects/{id}/jobs :

réserve cost_credits_reserved

À SUCCEEDED :

débite cost_credits_final

À FAILED / CANCELED :

rembourse (libère la réservation)

11) Idempotency (recommandé)

Pour éviter double facturation et double jobs :

Header Idempotency-Key sur :

POST /projects/{project_id}/jobs

endpoints de paiement (si ajoutés)

12) Notes MVP (pragmatiques)

MVP = 1 génération = 1 job = (souvent) 2 tracks → l’UI propose “Version A / Version B”

On sauvegarde toujours :

prompt normalisé

lyrics finales

provider_task_id

provider raw payload (debug, table provider_events)

On garde une option “re-generate” :

relance un job sur le même project (ou clone project)

::contentReference[oaicite:0]{index=0}