# 💰 Guide de Monétisation - NutriPlusApp

## Sites d'affiliation supportés

### ✅ Configurés (Actifs)

| Site | Région | Tag/ID | Commission |
|------|--------|--------|------------|
| Amazon US | 🇺🇸 | `nutriplusapp2-21` | 1-10% |
| Amazon ES | 🇪🇸 | `nutriplusap07-21` | 1-10% |
| Amazon DE | 🇩🇪 | `nutriplusap0f-21` | 1-10% |
| Amazon UK | 🇬🇧 | `nutriplusa0c7-21` | 1-10% |
| Amazon IT | 🇮🇹 | `nutriplusap0e-21` | 1-10% |

### ⏳ À configurer

| Site | Commission | Inscription |
|------|------------|-------------|
| **AliExpress** | 3-8% | [portals.aliexpress.com](https://portals.aliexpress.com) |
| **eBay** | 1-4% | [partnernetwork.ebay.com](https://partnernetwork.ebay.com) |
| **Cdiscount** | 2-5% | [affiliation.cdiscount.com](https://affiliation.cdiscount.com) |
| **iHerb** | 5-10% | [iherb.com/info/partners](https://www.iherb.com/info/partners) |
| **MyProtein** | 8% | Programme affilié MyProtein |
| **Decathlon** | 3-5% | Via [Awin](https://www.awin.com) |
| **Fnac** | 2-4% | Via [Awin](https://www.awin.com) ou Tradedoubler |
| **Rakuten** | Variable | [rakutenadvertising.com](https://rakutenadvertising.com) |
| **Bulk** | 5-8% | Programme affilié Bulk |

---

## Comment activer un nouveau site

### 1. Inscrivez-vous au programme

Visitez le lien d'inscription dans le tableau ci-dessus.

### 2. Obtenez votre ID

Après validation, récupérez votre :
- **Tag** (Amazon)
- **Tracking ID** (AliExpress)
- **Campaign ID** (eBay)
- **Code promo** (iHerb)

### 3. Configurez dans l'app

Modifiez `src/config/affiliate.js` :

```javascript
// Exemple pour AliExpress
aliexpress: {
  trackingId: 'VOTRE_ID_ICI', // ← Ajoutez votre ID
  baseUrl: 'https://www.aliexpress.com/',
  paramName: 'aff_id',
},

// Exemple pour iHerb
iherb: {
  code: 'VOTRE_CODE', // ← Votre code promo
  baseUrl: 'https://www.iherb.com/',
  paramName: 'rcode',
},
```

### 4. Testez

L'app détecte automatiquement le site et ajoute votre tag !

---

## Fonctionnement technique

```
Utilisateur clique "Acheter sur Amazon"
         ↓
App détecte: amazon.de → région DE
         ↓
Ajoute le tag: ?tag=nutriplusap0f-21
         ↓
Ouvre le lien avec votre affiliation
         ↓
Utilisateur achète → Vous gagnez la commission 💰
```

---

## Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `src/config/affiliate.js` | Configuration des IDs |
| `src/screens/ProductDetailScreen.js` | Bouton "Acheter sur [Site]" |
| `src/screens/StoreScreen.js` | Liste des produits |

---

## Obligations légales

> ⚠️ **Important** : Mentionnez que vous utilisez des liens affiliés :
> - Dans les conditions d'utilisation de l'app
> - Optionnel : petit texte sur la page produit

---

*Dernière mise à jour : 2026-01-02*
