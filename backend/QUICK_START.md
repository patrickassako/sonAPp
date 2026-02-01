# 🎵 MusicApp Backend - Quick Start Guide

## 🚀 Setup Process

### 1. Install Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment

Your `.env` file should have real credentials for:
- ✅ Supabase (DATABASE_URL, SUPABASE_URL, SUPABASE_KEY)
- ✅ SunoAPI (SUNO_API_KEY)
- ⏳ Redis (can use placeholder for now)
- ⏳ Flutterwave (can use placeholder for now)

### 3. Setup Database

Go to your Supabase project → SQL Editor:

```bash
cat database/schema.sql
```

Copy and execute the entire SQL script. This creates:
- `profiles` table
- `projects` table  
- `generation_jobs` table
- `audio_files` table
- `transactions` table
- RLS policies
- Triggers

### 4. Start Server

```bash
source venv/bin/activate
uvicorn app.main:app --reload
```

Server starts at: `http://localhost:8000`

### 5. Test API

Visit: `http://localhost:8000/docs` for interactive Swagger UI

## 📡 Available Endpoints

### Public (No Auth)
- `GET /` - Health check
- `GET /api/v1/styles` - List all musical styles
- `GET /api/v1/styles/{id}` - Get style details

### Protected (Requires Auth)
- `GET /api/v1/auth/me` - Current user profile
- `GET /api/v1/users/profile` - User profile
- `GET /api/v1/users/wallet` - Credits info

## 🧪 Test SunoProvider

```bash
python tests/test_suno.py
```

This will:
1. Test Style Registry
2. Create a Makossa track 🇨🇲
3. Check generation status

## 🎵 Musical Styles Available

### African 🌍
- **Makossa** 🇨🇲 - Cameroonian groove
- **Bikutsi** 🇨🇲 - Fast traditional
- **Amapiano** - South African piano
- **Afrobeats** - West African modern
- **Coupé-Décalé** 🇨🇮 - Ivorian dance

### Urban 🎤
- Rap, Afro Trap

### Universal 🌍
- Pop, Acoustic, Gospel

## 🔑 Authentication

Frontend should use Supabase Auth:

```javascript
// Sign up/in with Supabase client
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com', 
  password: 'password'
})

// Get JWT token
const token = data.session.access_token

// Call API with token
fetch('http://localhost:8000/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

## 📊 Next Steps

### Epic 3: Generation Flow
- [ ] Create projects endpoint
- [ ] Implement RQ workers for async generation
- [ ] Add Redis job queue
- [ ] Test full generation flow (TEXT mode)

### Epic 4: Context Mode
- [ ] Integrate OpenAI/Claude for lyrics generation
- [ ] Implement CONTEXT mode

### Epic 5: Storage
- [ ] Upload audio files to Supabase Storage
- [ ] Generate signed URLs

### Epic 6: Payments
- [ ] Flutterwave integration
- [ ] Credit packages
- [ ] Webhook handling

## 🐛 Troubleshooting

**Database connection error?**
- Check DATABASE_URL in .env
- Verify Supabase project is active

**Import errors?**
- Activate venv: `source venv/bin/activate`
- Reinstall: `pip install -r requirements.txt`

**SunoAPI errors?**
- Check SUNO_API_KEY is valid
- Run test: `python tests/test_suno.py`

## 📚 Key Files

- `app/main.py` - FastAPI app
- `app/config.py` - Settings
- `app/auth.py` - JWT validation
- `app/schemas.py` - API schemas
- `app/providers/suno.py` - Music generation
- `app/styles/registry.json` - Musical styles (differentiator!)
- `database/schema.sql` - Full database schema

## 💡 Tips

1. Use Swagger UI (`/docs`) for testing
2. Check logs for errors
3. Test with Makossa style first (our differentiator!)
4. Monitor credits in wallet endpoint
