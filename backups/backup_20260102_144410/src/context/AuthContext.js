import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@token');
      const userData = await AsyncStorage.getItem('@user');
      
      if (storedToken && userData) {
        setToken(storedToken);
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Erreur de connexion' };
      }

      // Sauvegarder le token et l'utilisateur
      await AsyncStorage.setItem('@token', data.token);
      await AsyncStorage.setItem('@user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur login:', error);
      return { success: false, error: 'Impossible de se connecter au serveur' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Erreur d\'inscription' };
      }

      // Sauvegarder le token et l'utilisateur
      await AsyncStorage.setItem('@token', data.token);
      await AsyncStorage.setItem('@user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur register:', error);
      return { success: false, error: 'Impossible de se connecter au serveur' };
    }
  };

  const logout = async () => {
    try {
      console.log('Déconnexion en cours...');
      await Promise.all([
        AsyncStorage.removeItem('@token'),
        AsyncStorage.removeItem('@user'),
        AsyncStorage.removeItem('@iptv_channels'),
        AsyncStorage.removeItem('@iptv_groups')
      ]);
    } catch (error) {
      console.error('Erreur lors du nettoyage AsyncStorage:', error);
    } finally {
      // Toujours déconnecter l'utilisateur même si le nettoyage échoue
      setToken(null);
      setUser(null);
      console.log('Utilisateur déconnecté');
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await fetch(API_ENDPOINTS.PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Erreur de mise à jour' };
      }

      // Mettre à jour localement
      const updatedUser = { ...user, ...data };
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur update:', error);
      return { success: false, error: 'Erreur lors de la mise à jour' };
    }
  };

  const socialLogin = async (provider, userData) => {
    try {
      const response = await fetch(API_ENDPOINTS.SOCIAL_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          email: userData.email,
          name: userData.name,
          providerId: userData.id,
          avatar: userData.avatar || userData.picture,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Erreur de connexion' };
      }

      // Sauvegarder le token et l'utilisateur
      await AsyncStorage.setItem('@token', data.token);
      await AsyncStorage.setItem('@user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur social login:', error);
      return { success: false, error: 'Impossible de se connecter' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateProfile, socialLogin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};
