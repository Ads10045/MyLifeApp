# NutriPlus Backend API

Backend Node.js/Express avec PostgreSQL pour l'application NutriPlus.

## 🗄️ Base de données

- **PostgreSQL** : localhost:5432
- **Database** : nutriplus
- **User** : postgres
- **Password** : postgres

## 📦 Installation

```bash
cd backend
npm install
```

## 🚀 Démarrage

```bash
# Development
npm run dev

# Production
npm start
```

## 🔧 Prisma Commands

```bash
# Créer une migration
npm run prisma:migrate

# Générer le client Prisma
npm run prisma:generate

# Ouvrir Prisma Studio (GUI)
npm run prisma:studio
```

## 🛣️ Routes API

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Utilisateur
- `GET /api/user/profile` - Profil utilisateur (authentifié)
- `PUT /api/user/profile` - Modifier profil (authentifié)

### Emplacements GPS
- `GET /api/locations` - Liste emplacements (authentifié)
- `POST /api/locations` - Sauvegarder emplacement (authentifié)
- `DELETE /api/locations/:id` - Supprimer emplacement (authentifié)

### Health Check
- `GET /api/health` - Statut du serveur

## 🔐 Authentification

Utilise JWT (JSON Web Token). Ajoutez le token dans le header :

```
Authorization: Bearer YOUR_TOKEN_HERE
```

## 📊 Structure des données

### User
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "createdAt": "datetime"
}
```

### Location
```json
{
  "id": "uuid",
  "latitude": "float",
  "longitude": "float",
  "address": "string",
  "city": "string",
  "country": "string"
}
```

## 🌐 URL API

`http://localhost:3000`
