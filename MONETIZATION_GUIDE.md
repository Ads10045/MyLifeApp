# 💰 Stratégies de Monétisation - NutriPlusApp

## Vue d'ensemble

Vous affichez des produits Amazon/AliExpress dans votre app. Voici comment gagner de l'argent comme intermédiaire.

---

## 1. Programme d'Affiliation Amazon Associates ⭐ (Recommandé)

### Comment ça marche
- Vous obtenez un **tag d'affilié unique** (ex: `votreapp-21`)
- Chaque lien produit inclut votre tag
- Quand un utilisateur clique et achète → **vous gagnez une commission**

### Commissions par catégorie
| Catégorie | Commission |
|-----------|------------|
| Mode, Beauté | 10% |
| Maison, Jardin | 7% |
| Électronique | 3-4% |
| Alimentaire | 1-3% |

### Format du lien affilié
```
https://www.amazon.fr/dp/B0XXXXX?tag=votreapp-21
```

### Avantages
- ✅ Aucun stock à gérer
- ✅ Aucune gestion des commandes
- ✅ Amazon gère le paiement et la livraison
- ✅ Cookie de 24h (l'utilisateur peut acheter autre chose)

---

## 2. Comment obtenir votre lien d'affiliation Amazon

### Étape 1 : S'inscrire à Amazon Associates
1. Allez sur **https://partenaires.amazon.fr** (France) ou **https://affiliate-program.amazon.com** (US)
2. Cliquez sur **"Inscrivez-vous gratuitement"**
3. Connectez-vous avec votre compte Amazon (ou créez-en un)

### Étape 2 : Remplir le formulaire
1. **Informations personnelles** : Nom, adresse, téléphone
2. **Informations sur le site/app** :
   - URL de votre app (si publiée) ou site web
   - Description : "Application mobile de shopping avec produits nutrition et lifestyle"
   - Catégories : Santé, Nutrition, Shopping
3. **Identifiant de suivi** : Choisissez un nom simple comme `nutriplusapp-21`

### Étape 3 : Validation
- Amazon examine votre candidature (1-3 jours)
- Vous devez générer **3 ventes qualifiées en 180 jours** pour validation définitive

### Étape 4 : Obtenir vos liens
Une fois approuvé :
1. Allez sur n'importe quel produit Amazon
2. Utilisez la barre d'outils "SiteStripe" en haut
3. Cliquez sur **"Texte"** → copiez le lien avec votre tag

---

## 3. AliExpress Affiliate Program

### Inscription
- URL : **https://portals.aliexpress.com**
- Commission : 3-8% selon catégorie

### Avantages
- Produits moins chers
- Plus de marge potentielle
- Bon pour le dropshipping

---

## 4. Dropshipping (Alternative)

### Comment ça marche
1. L'utilisateur voit le prix : **29.99€** (votre prix)
2. L'utilisateur achète sur VOTRE app
3. Vous commandez chez AliExpress : **15€** (prix fournisseur)
4. **Marge : 14.99€**

### Ce qu'il faut
- Intégration paiement (Stripe, PayPal)
- Gestion des commandes
- Service client
- Gestion des retours

### Risques
- Délais de livraison longs (Chine → Europe : 15-30 jours)
- Qualité variable
- SAV à gérer

---

## 5. Modèle Hybride (Ma Recommandation) 🎯

| Source | Méthode | Pourquoi |
|--------|---------|----------|
| Amazon | Affiliation | Livraison rapide, confiance client |
| AliExpress | Dropshipping | Marge plus élevée |
| Dans l'app | Publicités AdMob | Revenus passifs |

---

## 6. Implémentation technique dans NutriPlusApp

### Pour l'affiliation Amazon
1. Stocker votre tag dans `src/config/affiliate.js`
2. Modifier `ProductDetailScreen.js` : bouton "Acheter" → ouvre le lien avec tag
3. Tracker les clics (optionnel mais recommandé)

### Exemple de code
```javascript
// src/config/affiliate.js
export const AFFILIATE_CONFIG = {
  amazon: {
    tag: 'nutriplusapp-21',
    baseUrl: 'https://www.amazon.fr/dp/'
  },
  aliexpress: {
    trackingId: 'VOTRE_ID',
    baseUrl: 'https://www.aliexpress.com/item/'
  }
};

// Générer un lien affilié
export const getAffiliateLink = (product) => {
  if (product.source === 'amazon') {
    return `${AFFILIATE_CONFIG.amazon.baseUrl}${product.asin}?tag=${AFFILIATE_CONFIG.amazon.tag}`;
  }
  return product.sourceUrl;
};
```

---

## 7. Ressources

- **Amazon Associates France** : https://partenaires.amazon.fr
- **Amazon Associates US** : https://affiliate-program.amazon.com
- **AliExpress Portals** : https://portals.aliexpress.com
- **Guide des commissions Amazon** : https://partenaires.amazon.fr/help/node/topic/GRXPHT8U84RAYDXZ

---

## 8. Conseils importants

1. **Transparence** : Mentionnez que vous utilisez des liens affiliés (obligation légale)
2. **Qualité** : Ne recommandez que des produits de qualité
3. **Diversifier** : Ne dépendez pas d'une seule source de revenus
4. **Analytics** : Trackez vos conversions pour optimiser

---

*Document créé le 2026-01-01*
