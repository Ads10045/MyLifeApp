# 🤖 AI Agent Store - Documentation

## Vue d'ensemble

Ce module permet de créer un système d'affiliation/dropshipping automatisé avec un agent IA qui:
- Recherche des produits sur des APIs de fournisseurs
- Affiche les produits dans l'onglet Store
- Gère les ventes avec commission automatique
- Reçoit les paiements via Stripe

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Agent IA      │────▶│  APIs Fournisseurs│────▶│  Base Produits  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Commission    │◀────│  Paiement Stripe │◀────│   Store Mobile  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Fonctionnalités IA

### 1. Recherche Produits
- Scan automatique des APIs fournisseurs
- Filtrage par catégorie, prix, popularité
- Mise à jour quotidienne du catalogue

### 2. Pricing Intelligent
- Calcul de marge optimal
- Analyse des prix concurrents
- Ajustement automatique

### 3. Génération Contenu
- Descriptions marketing automatiques
- Traduction multi-langue
- Images optimisées

### 4. Analytics
- Tendances du marché
- Prédiction des ventes
- Recommandations produits

---

## APIs Fournisseurs Supportées

| Fournisseur | Type | Commission Moyenne |
|-------------|------|-------------------|
| Amazon Associates | Affiliation | 1-10% |
| AliExpress API | Dropshipping | 15-30% |
| Printful | Print-on-demand | 20-30% |
| CJ Dropshipping | Dropshipping | 10-25% |

---

## Configuration

### Variables d'environnement (.env)

```env
# AI Agent
OPENAI_API_KEY=sk-...
AI_AGENT_ENABLED=true

# Fournisseurs
AMAZON_ASSOCIATE_TAG=mystore-20
ALIEXPRESS_APP_KEY=xxx
ALIEXPRESS_SECRET=xxx

# Paiement
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Commission
DEFAULT_MARGIN_PERCENT=20
```

---

## Endpoints API

### Produits
- `GET /api/products` - Liste tous les produits
- `GET /api/products/:id` - Détail produit
- `POST /api/products/sync` - Sync avec fournisseur
- `GET /api/products/trending` - Produits tendance

### Commandes
- `POST /api/orders` - Créer commande
- `GET /api/orders` - Historique commandes
- `GET /api/orders/stats` - Statistiques ventes

### Agent IA
- `POST /api/agent/search` - Recherche produits
- `POST /api/agent/optimize-price` - Optimiser prix
- `POST /api/agent/generate-description` - Générer description

### Paiement
- `POST /api/payments/checkout` - Créer session Stripe
- `POST /api/payments/webhook` - Webhook Stripe

---

## Modèles Base de Données

### Product
```prisma
model Product {
  id            String   @id @default(uuid())
  name          String
  description   String
  price         Float    // Prix de vente
  supplierPrice Float    // Prix fournisseur
  margin        Float    // Marge en %
  imageUrl      String
  category      String
  supplierId    String   // ID chez le fournisseur
  supplier      String   // Nom du fournisseur
  stock         Int
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Order
```prisma
model Order {
  id         String   @id @default(uuid())
  userId     String
  products   Json     // [{productId, quantity, price}]
  subtotal   Float
  commission Float    // Ta commission
  total      Float
  status     String   @default("PENDING")
  stripeId   String?
  createdAt  DateTime @default(now())
}
```

---

## Flux de Paiement

1. Client ajoute produit au panier
2. Client valide commande
3. Redirection vers Stripe Checkout
4. Stripe confirme paiement (webhook)
5. Commande créée avec statut PAID
6. Commission calculée automatiquement
7. Notification au fournisseur (dropshipping)

---

## Dashboard Agent IA

L'écran `AIAgentScreen` affiche:
- 📊 Revenus du mois
- 🛒 Commandes en cours
- 🤖 Statut de l'agent
- 📈 Graphique des ventes
- 💡 Suggestions de produits

---

## Prochaines étapes

- [ ] Configuration clé OpenAI
- [ ] Création compte Stripe
- [ ] Choix du fournisseur principal
- [ ] Définition de la marge par défaut
