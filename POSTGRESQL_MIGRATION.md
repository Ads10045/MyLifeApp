# 🗄️ Migration vers PostgreSQL - MyLifeApp

## ✅ Ce qui a été fait

### 1. Backend API créé (`/backend`)

**Technologies** :
- Node.js + Express
- PostgreSQL avec Prisma ORM
- JWT pour l'authentification
- Bcrypt pour le hashage des mots de passe

**Base de données Cloud (Neon.tech)** :
- Host : `ep-falling-shape-abbss0l8-pooler.eu-west-2.aws.neon.tech`
- Database : `neondb`
- User : `neondb_owner`
- Connexion : SSL requise
- Dashboard : https://console.neon.tech

---

## 🌐 Déploiement Cloud (Neon.tech)

### Étapes effectuées :
1. ✅ Compte Neon créé
2. ✅ Projet `mylifeapp` créé (Région: EU West 2)
3. ✅ URL de connexion configurée dans `.env`
4. ✅ Schema Prisma migré vers Neon

---

## 📱 Build Android (EAS)

**Compte Expo :**
- Email : `abachyouness@gmail.com`
- Username : `@youness231`

**Configuration EAS :**
- App ID : `com.youness231.MyLifeApp`
- Projet EAS : `8ba64987-16b8-4719-9a49-6dd03fc2ab4e`
- Keystore : Généré automatiquement sur Expo

**Build en cours :**
- URL : https://expo.dev/accounts/youness231/projects/MyLifeApp/builds/7c6d7c30-b951-4a22-98b5-6938adea72f9

---

## 🚀 Déploiement Backend (Render.com)

**GitHub Repository :**
- URL : https://github.com/Ads10045/MyLifeApp
- Branch : `main`
- Root Directory : `backend`

**Configuration Render :**
| Champ | Valeur |
|-------|--------|
| **Name** | `mylifeapp-backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `npm start` |

**Variables d'environnement :**
```
DATABASE_URL = postgresql://neondb_owner:npg_5AzdsSYIxJ9C@ep-falling-shape-abbss0l8-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET = nutriplus_secret_key_2025_production
PORT = 10000
```

**Utilisateurs de test dans Neon :**
| Email | Mot de passe |
|-------|--------------|
| `admin@mylife.com` | `admin123` |
| `marie@example.com` | `password123` |
| `jean@example.com` | `password123` |
| `test@neon.com` | `test123456` |

### 2. Tables créées dans PostgreSQL

```sql
✅ User (utilisateurs)
   - id, name, email, password, createdAt, updatedAt

✅ Order (commandes)
   - id, userId, total, items, createdAt

✅ Location (emplacements GPS)
   - id, userId, latitude, longitude, address, city, country, etc.
```

### 3. API Routes disponibles

**Authentification** :
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

**Utilisateur** :
- `GET /api/user/profile` - Profil
- `PUT /api/user/profile` - Modifier profil

**Emplacements GPS** :
- `GET /api/locations` - Liste
- `POST /api/locations` - Sauvegarder
- `DELETE /api/locations/:id` - Supprimer

### 4. Application mobile mise à jour

- `AuthContext.js` → Utilise maintenant l'API PostgreSQL
- `api.js` → Configuration des endpoints
- Tokens JWT stockés localement pour la session

## 🚀 Comment utiliser

### Démarrer le backend

```bash
cd backend
npm start
```

Le serveur tourne sur : **http://localhost:3000**

### Tester l'API

```bash
# Health check
curl http://localhost:3000/api/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@test.com", "password": "test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "test123"}'
```

### Utiliser Prisma Studio (GUI)

```bash
cd backend
npm run prisma:studio
```

Ouvre une interface graphique sur http://localhost:5555 pour gérer la base de données !

## 📊 Avantages vs AsyncStorage

| Feature | AsyncStorage | PostgreSQL |
|---------|--------------|------------|
| Stockage | Local (appareil) | Serveur centralisé |
| Sync multi-appareils | ❌ Non | ✅ Oui |
| Sécurité mots de passe | ⚠️ Basique | ✅ Bcrypt hashé |
| Requêtes complexes | ❌ Limité | ✅ SQL complet |
| Backup | ❌ Manuel | ✅ Automatique |
| Scalabilité | ❌ Limitée | ✅ Illimitée |

## 🔐 Sécurité

- ✅ Mots de passe hashés avec bcrypt (salt rounds: 10)
- ✅ JWT avec expiration (7 jours)
- ✅ Middleware d'authentification sur les routes protégées
- ✅ Validation des propriétaires de ressources

## 📝 Prochaines étapes

1. **Migrer les emplacements GPS** vers l'API
2. **Ajouter les commandes** dans la base
3. **Implémenter le panier** avec PostgreSQL
4. **Déployer** sur un serveur (Heroku, Railway, etc.)

## 🛠️ Commandes utiles

```bash
# Voir les logs du serveur
cd backend && npm start

# Créer une nouvelle migration
cd backend && npm run prisma:migrate

# Réinitialiser la base
cd backend && npx prisma migrate reset

# Ouvrir Prisma Studio
cd backend && npm run prisma:studio
```

## ✅ Test de connexion

L'application mobile se connecte automatiquement à l'API lors de :
- Inscription
- Connexion
- Mise à jour du profil

Les données sont maintenant stockées dans PostgreSQL au lieu d'AsyncStorage !
