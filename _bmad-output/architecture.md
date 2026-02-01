# 🏗️ Architecture Technique
## SaaS de Création Musicale Personnalisée (Architecture Hybride)

---

## 1. Objectif de l’architecture

Concevoir une architecture :
- Modulaire
- Évolutive
- Résiliente
- Provider-agnostic (indépendante du moteur IA)

Permettre :
- Un lancement rapide (API type Suno)
- Une migration progressive vers un moteur interne
- Zéro refonte produit lors du changement de moteur

---

## 2. Principe fondamental

> **Le produit ne dépend jamais directement d’un moteur de musique.**

Toute génération musicale passe par une **couche d’abstraction** appelée :

### 🎼 Music Provider Abstraction Layer

---

## 3. Vue d’ensemble (logique)

[ Frontend Web ]
|
v
[ API Backend (FastAPI) ]
|
v
[ Job Queue / Workers ]
|
v
[ Music Provider Layer ]
| |
v v
[Suno API] [Internal Engine]
|
v
[ Storage + Database ]

---

## 4. Composants principaux

---

### 4.1 Frontend (Web App)

**Rôle**
- Interface utilisateur
- Création de projets
- Suivi des générations
- Lecture et téléchargement audio

**Technos**
- Web app (Next.js ou FlutterFlow)
- Player audio HTML5
- Internationalisation FR / EN

**Communication**
- REST API
- SSE / polling pour suivi des jobs

---

### 4.2 Backend API (FastAPI)

**Rôle**
- Point d’entrée unique du système
- Orchestration des flux
- Sécurité, crédits, logique métier

**Responsabilités**
- Authentification (Supabase Auth)
- Gestion des projets
- Création et suivi des jobs
- Réservation / débit des crédits
- Gestion des providers
- Webhooks providers
- URLs de téléchargement sécurisées

**Principe**
> Le backend ne sait PAS comment la musique est générée.  
Il sait seulement **quel provider appeler**.

---

### 4.3 Job Queue & Workers

**Pourquoi**
- La génération musicale est lente
- Elle ne doit jamais bloquer l’API

**Technos**
- Redis
- Celery / RQ / Dramatiq

**Workers typiques**
- `lyrics_worker`
- `music_worker`
- `postprocess_worker`
- `delivery_worker`
- `status_worker` (polling providers)

**Avantage**
- Scalabilité horizontale
- Retry automatique
- Gestion des échecs propre

---

## 5. Music Provider Abstraction Layer (cœur du système)

### 5.1 Interface standardisée

Chaque provider implémente le même contrat :

- `create_track(request)`
- `get_status(task_id)`
- `fetch_result(task_id)`
- `cancel(task_id)`
- `handle_webhook(payload)`

👉 Le backend parle **uniquement** à cette interface.

---

### 5.2 Providers implémentés

#### Provider 1 — SunoProvider (MVP)

- Utilise une API type Suno (wrapper)
- Génération chanson complète
- Voix + paroles intégrées
- Temps de réponse rapide

**Usage**
- MVP
- Validation marché
- Tests A/B

---

#### Provider 2 — InternalMusicProvider (Phase 2)

Pipeline interne :
1. Génération des paroles (LLM)
2. Génération musicale par sections
3. Assemblage audio
4. Normalisation
5. (Option) Conversion de voix

**Modèles possibles**
- MusicGen (AudioCraft)
- Stable Audio Open
- TTS + Singing Voice Conversion

---

#### Provider 3 — Fallback Instrumental (optionnel)

- Mubert / instrumental-only
- Utilisé si provider principal échoue

---

## 6. Flux de génération (exemple : mode CONTEXTE)

1. L’utilisateur valide la création
2. Backend :
   - vérifie crédits
   - réserve les crédits
   - crée un job `QUEUED`
3. Job envoyé à la queue
4. `lyrics_worker` :
   - génère les paroles (FR / EN)
5. `music_worker` :
   - appelle le provider sélectionné
6. Provider :
   - génère la chanson
   - notifie via webhook ou polling
7. Résultat reçu :
   - upload audio
   - sauvegarde métadonnées
8. Job marqué `SUCCEEDED`
9. Crédits débités
10. Frontend affiche le player

---

## 7. Gestion des crédits

### Principe
- **Réservation au lancement**
- **Débit au succès**
- **Remboursement à l’échec**

### Avantages
- Pas de génération gratuite abusive
- Pas de frustration utilisateur
- Contrôle des coûts IA

---

## 8. Stockage & données

### Audio & assets
- Stockage objet (S3 / Supabase Storage / R2)
- URLs signées pour téléchargement

### Métadonnées
- Prompts
- Lyrics
- Paramètres
- Provider utilisé
- Seeds / versions

👉 Permet la régénération et la migration moteur.

---

## 9. Observabilité & monitoring

### Logs
- job_id
- provider
- latence
- erreurs
- coûts

### Metrics
- Taux de succès par provider
- Temps moyen de génération
- Coût moyen par chanson
- Styles les plus utilisés

### Alertes
- Provider down
- Augmentation des échecs
- Explosion des coûts

---

## 10. Sécurité

- Auth sécurisée
- Isolation des données utilisateur
- URLs de téléchargement temporaires
- Rate limiting
- Protection anti-abus

---

## 11. Scalabilité

- Workers horizontaux
- Providers interchangeables
- Séparation claire API / workers
- Aucun état critique en mémoire

---

## 12. Migration Suno → Interne (sans douleur)

1. Ajout du provider interne
2. Feature flag par job
3. A/B testing
4. Augmentation progressive du trafic interne
5. Décommissionnement du provider externe

👉 Frontend et UX **inchangés**

---

## 13. Risques & mitigations

| Risque | Mitigation |
|------|-----------|
| API externe coupée | Provider abstraction |
| Coûts IA élevés | Crédits + quotas |
| Qualité variable | Multi-provider |
| Charge élevée | Workers scalables |

---

## 14. Principe directeur final

> “L’architecture doit évoluer sans que l’utilisateur ne le remarque.”

---

## 15. Phrase clé technique

> **On ne construit pas un SaaS sur une IA.  
On construit un SaaS qui peut changer d’IA à tout moment.**
