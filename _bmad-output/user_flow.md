# 🧭 User Flow — SaaS de Création Musicale Personnalisée (FR / EN)

---

## 1. Objectif du User Flow

Décrire précisément le parcours utilisateur depuis l’arrivée sur le site jusqu’à la création, l’écoute et la gestion d’une chanson personnalisée.

Le flow doit :
- Minimiser la friction
- Guider sans surcharger
- Mettre l’émotion avant la technique
- Être utilisable sur mobile et desktop

---

## 2. Vue d’ensemble du parcours

Landing Page  
→ Authentification  
→ Choix du mode de création  
→ Configuration de la chanson  
→ Validation & crédits  
→ Génération (job async)  
→ Résultat (écoute)  
→ Téléchargement & bibliothèque

---

## 3. Écran 1 — Landing Page

### Objectif
Faire comprendre la promesse en moins de 10 secondes.

### Contenu
- Headline émotionnelle  
  > “Transformez vos mots en une chanson unique.”
- Sous-titre explicatif
- Boutons :
  - “Créer ma chanson”
  - “Voir des exemples”
- Témoignages ou exemples audio courts

### Actions possibles
- Cliquer sur “Créer ma chanson”
- Se connecter / s’inscrire

---

## 4. Écran 2 — Authentification

### Objectif
Accéder à la création tout en gardant la simplicité.

### Options
- Email + mot de passe
- Magic link
- (Optionnel) Google / Apple

### Règle UX
- L’utilisateur peut commencer la création **avant paiement**
- Le paiement intervient juste avant la génération

---

## 5. Écran 3 — Choix du mode de création

### Objectif
Orienter l’utilisateur sans le perdre.

### Modes proposés (cartes claires)
1. ✍️ **À partir d’un texte**
   > “Vous avez déjà les mots”
2. 💡 **À partir d’une idée / contexte**
   > “Décrivez le moment, on s’occupe du reste”
3. 🎤 **Avec une voix personnalisée** *(Premium / Coming soon)*

### Action
- Sélection d’un mode → écran suivant

---

## 6. Écran 4 — Saisie du contenu

### Cas A : Mode TEXTE
- Champ texte (lyrics fournis par l’utilisateur)
- Aide :
  > “Vous pouvez écrire librement, l’IA adaptera la structure.”

### Cas B : Mode CONTEXTE
- Champ texte guidé :
  - “Pour qui est la chanson ?”
  - “Quelle occasion ?”
  - “Quelle ambiance ?”
- Exemple placeholder :
  > “Chanson d’anniversaire joyeuse pour ma sœur Marie, 30 ans…”

---

## 7. Écran 5 — Paramètres musicaux

### Objectif
Donner le contrôle sans complexité.

### Paramètres
- Langue : FR / EN
- Style musical (sélecteur visuel)
- Ambiance (joyeux, romantique, solennel…)
- Durée :
  - 1 min
  - 2 min
  - 3 min
- Type de voix :
  - Homme
  - Femme
  - Neutre

### UX rule
- Valeurs par défaut intelligentes
- Tooltips simples, pas techniques

---

## 8. Écran 6 — Récapitulatif & crédits

### Objectif
Rassurer avant paiement.

### Contenu
- Résumé :
  - Mode choisi
  - Langue
  - Style
  - Durée
- Coût en crédits
- Crédits disponibles

### Actions
- “Lancer la génération”
- Si crédits insuffisants → “Acheter des crédits”

---

## 9. Écran 7 — Paiement (si nécessaire)

### Objectif
Conversion rapide.

### Moyens de paiement
- Mobile Money (MTN / Orange)
- Carte bancaire

### UX
- Pas de redirection complexe
- Confirmation immédiate
- Retour automatique à la génération

---

## 10. Écran 8 — Génération en cours

### Objectif
Faire patienter sans frustration.

### Contenu
- Loader animé
- Messages émotionnels :
  - “Nous écrivons les paroles…”
  - “Nous composons la musique…”
  - “La voix prend vie…”
- Progression (pourcentage ou étapes)

### Actions
- Quitter la page sans perdre le job
- Notification à la fin (email / in-app)

---

## 11. Écran 9 — Résultat (écoute)

### Objectif
Moment clé : émotion maximale.

### Contenu
- Player audio
- Titre de la chanson
- Boutons :
  - ▶️ Écouter
  - ⬇️ Télécharger
  - 🔁 Regénérer
  - ❤️ Ajouter aux favoris
  - 📤 Partager

### UX rule
- L’audio démarre rapidement
- Qualité perçue prioritaire

---

## 12. Écran 10 — Bibliothèque utilisateur

### Objectif
Centraliser les créations.

### Contenu
- Liste des chansons
- Infos :
  - Date
  - Occasion
  - Langue
  - Durée
- Actions :
  - Réécouter
  - Télécharger
  - Supprimer

---

## 13. États alternatifs & erreurs

### En cas d’échec de génération
- Message clair :
  > “La génération a échoué. Vos crédits ont été remboursés.”
- Bouton :
  - “Relancer”

### En cas de délai
- Message rassurant
- Pas de perte de session

---

## 14. Principes UX transverses

- Mobile-first
- Texte simple, jamais technique
- Toujours expliquer “ce qui se passe”
- Émotion > options
- Aucune surcharge cognitive

---

## 15. Succès du flow

Le flow est réussi si :
- Un utilisateur crée une chanson sans aide
- Le temps perçu < temps réel
- Le résultat est partagé spontanément
- L’utilisateur revient créer une autre chanson

---

## 16. Règle d’or

> “L’utilisateur doit avoir l’impression de créer un souvenir,
pas de configurer un outil.”
