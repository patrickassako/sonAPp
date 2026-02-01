# 🎵 MusicApp Backend

FastAPI backend for music generation platform.

## Quick Start

### 1. Setup Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Setup Database

Run the SQL schema in your Supabase SQL Editor:
```bash
cat database/schema.sql
# Copy and execute in Supabase dashboard
```

### 5. Run Development Server

```bash
uvicorn app.main:app --reload
```

Server will start at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings & environment variables
│   ├── database.py          # SQLAlchemy setup
│   ├── models/              # Database models
│   │   └── profile.py       # User profile model
│   ├── styles/              # Style Registry (key differentiator!)
│   │   ├── registry.json    # African music styles + more
│   │   └── registry.py      # Style access functions
│   ├── api/                 # API routes (TODO)
│   ├── providers/           # Music generation providers (TODO)
│   └── workers/             # RQ workers for async jobs (TODO)
├── database/
│   └── schema.sql           # Supabase database schema
├── requirements.txt
└── .env.example
```

## Environment Variables

See `.env.example` for required variables.

**Critical:**
- `DATABASE_URL` - Supabase PostgreSQL connection
- `SUPABASE_URL` / `SUPABASE_KEY` - Supabase project credentials
- `REDIS_URL` - Redis for job queue
- `SUNO_API_KEY` - SunoAPI.org provider
- `FLUTTERWAVE_SECRET_KEY` - Payment gateway

## Development

### Run Tests (TODO)
```bash
pytest
```

### Run Workers (TODO)
```bash
rq worker music_worker --url redis://localhost:6379/0
```

## Epic Progress

- [x] Epic 1: Foundation setup ✅
- [ ] Epic 2: Auth integration
- [ ] Epic 3: SunoProvider + Job Queue
- [ ] Epic 4: Generation modes (TEXT/CONTEXT)
- [ ] Epic 5: Frontend
- [ ] Epic 6: Payment (Flutterwave)

## Key Features

🎵 **Style Registry** - 10+ musical styles
🇨🇲 **African First** - Makossa, Bikutsi, Amapiano as first-class citizens
💳 **Credits System** - Reserve → Debit → Refund logic
🔐 **Supabase Auth** - Secure user authentication
🎶 **Provider-Agnostic** - SunoAPI.org now, own engine later
