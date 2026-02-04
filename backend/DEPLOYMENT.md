# MusicApp Backend - Deployment Guide

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   FastAPI       │────▶│   Supabase      │
│   (Vercel)      │     │   (Railway)     │     │   (Database)    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │     Redis       │
                        │   (Upstash)     │
                        └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Worker 1 │ │ Worker 2 │ │ Worker N │
              └──────────┘ └──────────┘ └──────────┘
```

## Quick Deploy Options

### Option 1: Railway (Recommended)

1. **Create Railway Account**: https://railway.app

2. **Deploy Backend**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Create new project
   railway init

   # Deploy
   railway up
   ```

3. **Add Redis**:
   - In Railway dashboard → New → Database → Redis

4. **Add Worker**:
   - New Service → From same repo
   - Override start command: `rq worker music_generation --url $REDIS_URL`

5. **Set Environment Variables**:
   - Go to each service → Variables
   - Add all variables from `.env.example`

### Option 2: Render

1. **Connect GitHub Repo** to Render

2. **Use Blueprint**:
   - Render will auto-detect `render.yaml`
   - Creates: API + Worker + Redis

3. **Set Environment Variables** in dashboard

### Option 3: Docker (VPS / Self-hosted)

```bash
# Build and run with docker-compose
docker-compose up -d

# Scale workers
docker-compose up -d --scale worker=5
```

## Environment Variables

### Required for Production

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `JWT_SECRET` | JWT secret (or leave empty for ES256/JWKS) |
| `REDIS_URL` | Redis connection string |
| `SUNO_API_KEY` | SunoAPI key for music generation |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key |
| `FLUTTERWAVE_PUBLIC_KEY` | Flutterwave public key |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Webhook verification secret |
| `CORS_ORIGINS` | Your frontend URL |
| `ENVIRONMENT` | Set to `production` |
| `DEBUG` | Set to `false` |

## Scaling Workers

### How many workers do I need?

| Concurrent Users | Recommended Workers | Max Wait Time |
|------------------|---------------------|---------------|
| 10 | 1-2 | ~4 min |
| 50 | 3-5 | ~4 min |
| 100 | 5-10 | ~4 min |
| 200 | 10-20 | ~4 min |
| 500 | 25-50 | ~4 min |

Formula: `workers = concurrent_users / 5` (assuming 2min/job, 5min max wait)

### Railway: Scale Workers
```bash
# In Railway dashboard, duplicate worker service
# Or use railway.json with replicas
```

### Docker: Scale Workers
```bash
docker-compose up -d --scale worker=10
```

## Monitoring

### Check Queue Status
```bash
# Connect to your Redis
rq info --url $REDIS_URL
```

### Health Checks
- API: `GET /health`
- Workers: Check RQ dashboard or logs

## Costs Estimation

| Service | Free Tier | Paid |
|---------|-----------|------|
| Railway | $5 credit/month | ~$5-20/service |
| Render | 750 hrs/month | ~$7/service |
| Upstash Redis | 10K commands/day | $0.2/100K |
| Supabase | 500MB, 50K requests | $25/month Pro |

**Typical monthly cost for small app**: $30-50/month

## Troubleshooting

### Workers not processing jobs
1. Check Redis connection: `redis-cli ping`
2. Check worker logs: `railway logs` or `render logs`
3. Verify `REDIS_URL` is correct

### Fork crash on macOS (local only)
```bash
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
rq worker music_generation --url $REDIS_URL
```

### CORS errors
- Ensure `CORS_ORIGINS` includes your frontend URL
- Format: `https://yourdomain.com` (no trailing slash)

## Security Checklist

- [ ] Set `DEBUG=false` in production
- [ ] Set `ENVIRONMENT=production`
- [ ] Use HTTPS for all URLs
- [ ] Keep API keys secure (use Railway/Render secrets)
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Set up Flutterwave webhook verification
