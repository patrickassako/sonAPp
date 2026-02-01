# 📄 Product Requirements Document (PRD)
## SaaS de Création Musicale Personnalisée (FR / EN)

---

## 1. Objectif du produit

Permettre à un utilisateur non-musicien de créer **une chanson personnalisée complète** (paroles + musique + voix) à partir :
- d’un texte
- d’un contexte
- (plus tard) de sa propre voix

Le produit doit être :
- Simple à utiliser
- Rapide (résultat en quelques minutes)
- Émotionnellement fort
- Monétisable par crédits

---

## 2. Périmètre du MVP

### Inclus dans le MVP
- Génération de chansons complètes (1 à 3 minutes)
- Modes de création :
  - Texte → chanson
  - Contexte → chanson (lyrics générés)
- Langues : Français et Anglais
- Choix du style musical
- Choix de la durée
- Voix génériques (homme / femme)
- Téléchargement audio
- Historique des créations
- Paiement par crédits

### Exclu du MVP
- Voice cloning personnalisé
- Édition audio avancée
- Stems multipistes
- Collaboration
- Application mobile native

---

## 3. Personas utilisateurs

### Persona 1 — Grand public (cœur de cible)
- Non-musicien
- Cherche un cadeau émotionnel
- Sensible à la simplicité
- Utilise mobile ou desktop

### Persona 2 — Créateur occasionnel
- YouTuber / créateur de contenu
- Besoin de musique émotionnelle ponctuelle
- Prêt à payer pour un résultat rapide

---

## 4. Parcours utilisateur (User Flow)

1. Arrivée sur la landing page
2. Création de compte / connexion
3. Choix du mode de création
4. Saisie des informations (texte ou contexte)
5. Choix :
   - style musical
   - langue
   - durée
   - voix
6. Validation & paiement (crédits)
7. Génération de la chanson (job async)
8. Écoute du résultat
9. Téléchargement / partage
10. Accès à l’historique

---

## 5. Fonctionnalités fonctionnelles (Functional Requirements)

### 5.1 Création de projet
- L’utilisateur peut créer un projet musical
- Chaque projet contient :
  - un titre
  - une langue (FR / EN)
  - un mode de création
  - des paramètres musicaux
  - un statut

### 5.2 Génération de chanson
- Le système doit :
  - générer des paroles si nécessaire
  - appeler un moteur de génération musicale
  - suivre l’état du job
  - notifier l’utilisateur à la fin

### 5.3 Gestion des crédits
- Chaque génération consomme des crédits
- Les crédits sont réservés au lancement
- Les crédits sont débités au succès
- Les crédits sont remboursés en cas d’échec

### 5.4 Historique & bibliothèque
- L’utilisateur peut :
  - voir toutes ses chansons
  - rejouer une chanson
  - télécharger une chanson
  - voir les paramètres utilisés

---

## 6. Exigences non fonctionnelles (Non-Functional Requirements)

### Performance
- Temps de génération cible : < 2 minutes
- Player audio fluide

### Scalabilité
- Jobs asynchrones
- Architecture orientée workers
- Possibilité de changer de moteur IA sans casser le produit

### Disponibilité
- 99 % uptime cible
- Gestion des échecs et retries

### Sécurité
- Authentification sécurisée
- Isolation des données utilisateur
- URLs de téléchargement signées

---

## 7. Architecture technique (résumé)

- Frontend : Web app
- Backend : API REST
- Queue : jobs async
- Providers IA :
  - Phase 1 : API Suno (wrapper)
  - Phase 2 : moteur interne
- Storage : audio + métadonnées
- Paiement : crédits

---

## 8. Gestion des erreurs & états

### États possibles d’un job
- QUEUED
- RUNNING
- SUCCEEDED
- FAILED
- CANCELED

### En cas d’échec
- Message clair à l’utilisateur
- Crédits remboursés
- Possibilité de relancer

---

## 9. Internationalisation (FR / EN)

- UI multilingue
- Paroles générées dans la langue choisie
- Prompts IA adaptés à la langue

---

## 10. Analytics & métriques clés

### Métriques produit
- Taux de création réussie
- Temps moyen de génération
- Styles les plus utilisés
- Langues utilisées

### Métriques business
- Crédits consommés
- Conversion visite → création
- Rétention utilisateur
- Coût par chanson générée

---

## 11. Contraintes légales

- Les chansons sont générées par IA
- Usage non exclusif par défaut
- Usage commercial via option
- Consentement requis pour toute voix personnalisée (future feature)

---

## 12. Critères de succès du MVP

- L’utilisateur comprend le produit sans tutoriel
- Une chanson peut être créée en < 3 minutes
- L’utilisateur partage le résultat
- Le produit peut être monétisé dès la première utilisation

---

## 13. Roadmap post-MVP (indicatif)

### Phase 2
- Voice cloning
- Regénération partielle
- Qualité audio HD

### Phase 3
- Variantes multiples
- Musique générée à partir d’un message vocal
- Offres B2B événementielles

---

## 14. Risques identifiés

- Dépendance à un provider externe
- Coût de génération
- Qualité perçue variable
- Cadre légal évolutif

---

## 15. Principe directeur

> “L’utilisateur ne doit jamais sentir la complexité technique.
Il doit seulement ressentir l’émotion.”
