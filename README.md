# 🎵 MusicApp - Plateforme de Création Musicale Personnalisée

[![Status](https://img.shields.io/badge/status-MVP%20Development-yellow)](https://github.com)
[![Python](https://img.shields.io/badge/python-3.11+-blue)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/next.js-14-black)](https://nextjs.org/)

## 📖 Description

MusicApp est une plateforme web permettant de créer des chansons personnalisées complètes (paroles + musique + voix) à partir de texte ou de contexte, avec un focus sur les styles musicaux africains.

**Différenciateur clé :** Style Registry avec styles africains first-class (Makossa 🇨🇲, Bikutsi 🇨🇲, Amapiano, Coupé-Décalé 🇨🇮, etc.)

## 🎯 Objectif MVP

Valider la conversion visiteur → payeur pour des chansons personnalisées générées par IA.

**Pays cibles :** 🇨🇲 Cameroun, 🇨🇮 Côte d'Ivoire, 🇸🇳 Sénégal, 🇳🇬 Nigeria

## 🏗️ Architecture

```
MusicApp/
├── backend/          # FastAPI + PostgreSQL + Redis + RQ
├── frontend/         # Next.js 14 + Shadcn/UI
├── _bmad-output/     # Documentation & Plans
└── README.md
```

### Stack Technique

**Backend:**
- FastAPI (Python 3.11+)
- PostgreSQL (Supabase)
- Redis + RQ (Job Queue)
- SunoAPI.org (Music Provider)

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Shadcn/UI + Tailwind CSS
- Supabase Auth

**Deployment:**
- Backend: Railway / Fly.io
- Frontend: Vercel
- Redis: Upstash

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Configure .env variables
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Configure .env.local variables
npm run dev
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_KEY=...
REDIS_URL=redis://...
SUNO_API_KEY=...
OPENAI_API_KEY=...  # For lyrics generation
FLUTTERWAVE_SECRET_KEY=...
FLUTTERWAVE_WEBHOOK_SECRET=...
JWT_SECRET=...
ENVIRONMENT=development
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 📚 Documentation

- [Implementation Plan](./_bmad-output/implementation-plan.md)
- [Architecture](./_bmad-output/architecture.md)
- [Product Requirements](./_bmad-output/product_requirements.md)
- [API Contract](./_bmad-output/api_contract.md)

## 🎵 Styles Musicaux Supportés

### 🌍 Africains
- Makossa 🇨🇲
- Bikutsi 🇨🇲
- Amapiano
- Afrobeats
- Coupé-Décalé 🇨🇮
- Ndombolo
- Et plus...

### 🎤 Urbains
- Rap
- Afro Trap
- Drill
- Hip-Hop

### 🌍 Universels
- Pop
- Acoustic
- R&B
- Gospel
- Rock

## 📈 KPIs

**Metric #1 (MVP):** Taux de conversion visiteur → payeur

**Secondaires:**
- Nombre de chansons créées
- Taux de partage social
- Styles les plus utilisés

## ⏱️ Timeline MVP

**Durée estimée:** 4-6 semaines (Quick Flow)

## 📄 License

Proprietary - All rights reserved

## 👥 Support

Pour questions: contact@musicapp.com
