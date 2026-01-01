# Configuration Chromecast pour NutriPlus IPTV

Ce guide explique comment configurer le casting Chromecast complet avec un Expo Development Build.

## Prérequis

- Expo SDK 54+
- Compte Expo (pour EAS Build)
- Appareil physique (le casting ne fonctionne pas sur simulateur)

## Étape 1 : Installer les dépendances

```bash
npx expo install react-native-google-cast expo-build-properties
```

## Étape 2 : Configurer app.json

Ajouter dans `app.json` :

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-cast",
        {
          "iosReceiverAppId": "CC1AD845",
          "androidReceiverAppId": "CC1AD845"
        }
      ],
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ]
  }
}
```

> Note: `CC1AD845` est l'ID par défaut pour les médias. Pour une app personnalisée, créez un receiver sur [Google Cast Developer Console](https://cast.google.com/publish/).

## Étape 3 : Créer un Development Build

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter
eas login

# Configurer le projet
eas build:configure

# Build iOS (Mac requis)
eas build --profile development --platform ios

# Build Android
eas build --profile development --platform android
```

## Étape 4 : Intégration dans le code

```javascript
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import GoogleCast, { 
  CastButton, 
  useCastSession, 
  useRemoteMediaClient 
} from 'react-native-google-cast';

export default function CastPlayer({ videoUrl, title }) {
  const session = useCastSession();
  const client = useRemoteMediaClient();
  
  useEffect(() => {
    // Initialiser Google Cast
    GoogleCast.showIntroductoryOverlay();
  }, []);

  const castVideo = async () => {
    if (client) {
      await client.loadMedia({
        mediaInfo: {
          contentUrl: videoUrl,
          contentType: 'application/x-mpegurl', // Pour HLS
          metadata: {
            type: 'movie',
            title: title,
          }
        }
      });
    }
  };

  return (
    <View>
      {/* Bouton natif Chromecast */}
      <CastButton style={{ width: 24, height: 24 }} />
      
      {/* Ou bouton personnalisé */}
      <TouchableOpacity onPress={castVideo}>
        <Text>Caster</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Étape 5 : Wrapper l'application

Dans `App.js` :

```javascript
import { CastProvider } from 'react-native-google-cast';

export default function App() {
  return (
    <CastProvider>
      {/* Votre app */}
    </CastProvider>
  );
}
```

## Formats supportés

| Format | Extension | Support |
|--------|-----------|---------|
| HLS | .m3u8 | ✅ Oui |
| DASH | .mpd | ✅ Oui |
| MP4 | .mp4 | ✅ Oui |
| WebM | .webm | ⚠️ Partiel |

## Limitations

1. **Expo Go** : Le casting ne fonctionne PAS avec Expo Go (nécessite modules natifs)
2. **Simulateur** : Le casting nécessite un appareil physique
3. **Même réseau** : Le téléphone et la TV doivent être sur le même WiFi
4. **DRM** : Les contenus protégés peuvent ne pas fonctionner

## Troubleshooting

### "No cast devices found"
- Vérifiez que le Chromecast et le téléphone sont sur le même réseau WiFi
- Redémarrez le Chromecast
- Vérifiez les paramètres du routeur (UPnP activé)

### "Cast session failed"
- Le flux vidéo peut ne pas être compatible
- Essayez avec un flux HLS (.m3u8)

### Build échoue sur iOS
- Assurez-vous d'avoir `useFrameworks: "static"` dans expo-build-properties
- Pod install peut nécessiter `--repo-update`

## Ressources

- [react-native-google-cast](https://github.com/react-native-google-cast/react-native-google-cast)
- [Google Cast SDK](https://developers.google.com/cast)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
