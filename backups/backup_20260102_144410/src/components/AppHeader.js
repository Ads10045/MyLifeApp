import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, LogOut, X, Info, CheckCircle, Smartphone, Zap } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

export default function AppHeader() {
  const { user, logout, token } = useAuth();

  return (
    <View style={styles.container}>
      {/* Top Info Banner */}
      <View style={styles.topBanner}>
        <Text style={styles.topBannerText}>Livraison gratuite sur votre 1ère commande IA 🎁</Text>
      </View>

      <View style={styles.header}>
        <View style={styles.leftSection}>
          <Text style={styles.logoText}>NutriPlus</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>IA</Text>
          </View>
        </View>

      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.iconButton}>
          <Svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <Path 
              d="M5 8C5 6.89543 5.89543 6 7 6H25C26.1046 6 27 6.89543 27 8V24C27 25.1046 26.1046 26 25 26H7C5.89543 26 5 25.1046 5 24V8Z" 
              fill="#00814C" 
            />
            <Path 
              d="M5 8L16 17L27 8" 
              stroke="#FFFFFF" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={logout}>
          <Svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <Circle cx="16" cy="16" r="16" fill="#EBF1EE" />
            <Path 
              d="M11.4211 11.4206C8.892 13.9498 8.892 18.0502 11.4211 20.5794C13.9502 23.1085 18.0507 23.1085 20.5798 20.5794C23.1089 18.0502 23.1089 13.9498 20.5798 11.4206" 
              stroke="#98B3A6" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
            />
            <Path 
              d="M16.0001 9.14292V16.762" 
              stroke="#98B3A6" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
            />
          </Svg>
        </TouchableOpacity>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
  topBanner: {
    backgroundColor: '#00814C',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBannerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  header: {
    height: 60,
    paddingTop: 5,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
});
