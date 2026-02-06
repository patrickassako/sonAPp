# Refonte du Flux de Paiement MusicApp

## Objectif

Ameliorer l'experience de paiement en:
- Affichant clairement le pack selectionne
- Collectant les infos utilisateur (nom, telephone, pays)
- Proposant Mobile Money direct (sans page Flutterwave) pour les pays supportes
- Gardant la redirection Flutterwave pour les paiements par carte

---

## Fichiers Modifies

### Backend

#### 1. `backend/app/config.py` - Configuration des pays supportes

Ajout de `SUPPORTED_COUNTRIES` avec 9 pays:

| Pays | Code | Devise | Mobile Money | Reseaux | Type API |
|------|------|--------|--------------|---------|----------|
| Cameroun | CM | XAF | Oui | MTN, ORANGE | mobile_money_franco |
| Cote d'Ivoire | CI | XOF | Oui | MTN, ORANGE, MOOV | mobile_money_franco |
| Senegal | SN | XOF | Oui | ORANGE, FREE | mobile_money_franco |
| Ghana | GH | GHS | Oui | MTN, VODAFONE, AIRTELTIGO | mobile_money_ghana |
| Kenya | KE | KES | Oui | MPESA, AIRTEL | mpesa |
| Uganda | UG | UGX | Oui | MTN, AIRTEL | mobile_money_uganda |
| Nigeria | NG | NGN | Non | - | card |
| South Africa | ZA | ZAR | Non | - | card |
| International | OTHER | USD | Non | - | card |

#### 2. `backend/app/schemas.py` - Nouveaux schemas

**Schemas ajoutes/modifies:**

- `InitiatePaymentRequest` - Enrichi avec:
  - `customer_name`: Nom du client
  - `phone_number`: Numero de telephone
  - `country_code`: Code pays (CM, CI, etc.)
  - `payment_method`: "card" ou "mobile_money"
  - `network`: Reseau mobile (MTN, ORANGE, MPESA, etc.)

- `InitiatePaymentResponse` - Enrichi avec:
  - `payment_link`: URL Flutterwave (null pour Mobile Money)
  - `payment_method`: Methode utilisee
  - `status`: Statut initial
  - `instructions`: Instructions USSD pour Mobile Money

- `MobileMoneyChargeResponse` - Reponse charge directe
- `CountryInfo` - Info pays avec options de paiement
- `CountriesListResponse` - Liste des pays
- `ChargeStatusResponse` - Statut de la charge

#### 3. `backend/app/services/flutterwave.py` - Nouvelles methodes

**Methodes ajoutees:**

```python
async def charge_mobile_money(
    phone_number, amount, currency, country,
    network, email, tx_ref, customer_name
) -> Dict
```
- Charge directe Mobile Money via `/v3/charges?type={flw_type}`
- Supporte: mobile_money_franco, mobile_money_ghana, mpesa, mobile_money_uganda

```python
async def get_charge_status(tx_ref) -> Dict
```
- Verification du statut via `/v3/transactions?tx_ref=`
- Retourne: pending, successful, ou failed

```python
def _get_instructions(flw_type, network) -> str
```
- Instructions USSD par pays/reseau
- Ex: "Composez *126# et validez avec votre code PIN MTN"

#### 4. `backend/app/api/v1/payments.py` - Nouveaux endpoints

**Endpoints ajoutes:**

```
GET /api/v1/payments/countries
```
- Liste tous les pays supportes avec leurs options de paiement
- Response: `CountriesListResponse`

```
GET /api/v1/payments/charge-status/{tx_ref}
```
- Verifie le statut d'une charge Mobile Money
- Utilise pour le polling cote frontend
- Met a jour les credits si successful

**Endpoint modifie:**

```
POST /api/v1/payments/initiate
```
- Supporte maintenant deux flux:
  - `payment_method: "card"` -> Redirection Flutterwave
  - `payment_method: "mobile_money"` -> Charge directe

---

### Frontend

#### 5. `frontend/lib/types/payment.ts` - Types TypeScript

Types crees:
- `Country` - Configuration pays
- `CreditPackage` - Pack de credits
- `PaymentMethod` - "card" | "mobile_money"
- `MobileNetwork` - MTN, ORANGE, MPESA, etc.
- `CustomerInfo` - Infos client
- `PaymentStep` - 1 | 2 | 3 | 4
- `InitiatePaymentRequest/Response`
- `ChargeStatusResponse`
- `NETWORK_DISPLAY` - Mapping reseaux par pays

#### 6. `frontend/app/(dashboard)/credits/page.tsx` - Interface multi-etapes

**Architecture Stepper 4 etapes:**

```
STEP 1: Selection Pack
├── Affichage des 3 packs (Starter, Creator, Pro)
├── Badge "POPULAIRE" sur le pack recommande
└── Prix et features affiches

STEP 2: Informations Client
├── Nom complet (input text)
├── Pays (dropdown avec detection IP automatique)
└── Telephone (avec indicatif pays)

STEP 3: Choix Moyen de Paiement
├── Mobile Money (si supporte par le pays)
│   └── Selection du reseau (MTN, Orange, etc.)
└── Carte bancaire (toujours disponible)

STEP 4: Confirmation & Paiement
├── Recapitulatif (pack, credits, methode, total)
├── Bouton "Confirmer le paiement"
├── [Mobile Money] Affichage instructions + polling
└── [Carte] Redirection vers Flutterwave
```

**Fonctionnalites:**
- Detection automatique du pays via IP (ipapi.co)
- Polling toutes les 3 secondes pour Mobile Money
- Gestion des etats: idle, pending, successful, failed
- Navigation fluide entre etapes
- Validation des champs avant progression

---

## Flux de Paiement

### Mobile Money (Direct)

```
1. User selectionne pack -> remplit infos -> choisit Mobile Money + reseau
2. Frontend: POST /payments/initiate (payment_method: "mobile_money")
3. Backend: Cree transaction (pending) + appelle Flutterwave Charge API
4. Flutterwave: Envoie USSD push au telephone
5. Frontend: Affiche "Validez le paiement sur votre telephone"
6. Frontend: Poll GET /payments/charge-status/{tx_ref} toutes les 3s
7. Quand status = "successful":
   - Backend met a jour transaction + credits
   - Frontend affiche succes
```

### Carte (Redirect)

```
1. User selectionne pack -> remplit infos -> choisit Carte
2. Frontend: POST /payments/initiate (payment_method: "card")
3. Backend: Cree transaction + appelle Flutterwave Standard API
4. Backend: Retourne payment_link
5. Frontend: Redirect vers page Flutterwave
6. Apres paiement: Webhook + verification -> credits ajoutes
```

---

## Tests

### Backend

```bash
# Lister les pays
curl http://localhost:8000/api/v1/payments/countries

# Test charge Mobile Money (sandbox)
curl -X POST http://localhost:8000/api/v1/payments/initiate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "package_id": "<uuid>",
    "customer_name": "Jean Test",
    "phone_number": "677123456",
    "country_code": "CM",
    "payment_method": "mobile_money",
    "network": "MTN"
  }'

# Verifier statut
curl http://localhost:8000/api/v1/payments/charge-status/{tx_ref}
```

### Frontend

1. Ouvrir http://localhost:3000/credits
2. Selectionner un pack
3. Remplir le formulaire (pays Cameroun)
4. Verifier que Mobile Money est propose avec MTN/Orange
5. Selectionner Mobile Money -> MTN -> Confirmer
6. Verifier message d'attente USSD
7. Tester aussi le flux Carte

---

## Notes Importantes

- **Sandbox Flutterwave**: Les numeros de test ne recoivent pas de vrai USSD
- **Timeout**: Les charges Mobile Money expirent apres ~2-5 minutes
- **Webhook**: Toujours garde comme backup, meme avec le polling
- **Detection IP**: Utilise ipapi.co (gratuit, limite de requetes)
