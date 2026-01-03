import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bot, Play, BarChart2, Clock, CheckCircle, Package } from 'lucide-react-native';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function AIAgentScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/agent/status`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      setStats(data);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching agent status:', error);
      setRefreshing(false);
    }
  };

  const handleRunAgent = async () => {
    try {
      setLoading(true);
      Alert.alert('🤖 Agent Démarré', 'L\'agent recherche de nouveaux produits en arrière-plan...');
      
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/agent/run`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      // Removed artificial delay
      setLoading(false);
      fetchStatus();
      
      if (data.products && data.products.length > 0) {
          Alert.alert('✅ Terminé', `L'agent a trouvé ${data.products.length} nouveaux produits !`);
      } else {
          Alert.alert('✅ Terminé', 'L\'agent a fini sa tâche.');
      }

    } catch (error) {
      console.error('Error running agent:', error);
      setLoading(false);
      Alert.alert('Erreur', 'Impossible de démarrer l\'agent: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#312E81']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Bot color="#FFFFFF" size={40} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Sourcing Agent</Text>
            <Text style={styles.headerSubtitle}>v1.0.0 • {stats?.isRunning ? '🟢 En cours' : '⚪ En attente'}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Statut du système</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Clock color="#4F46E5" size={24} />
              <Text style={styles.statValue}>{stats?.lastRun ? new Date(stats.lastRun).toLocaleTimeString() : '--:--'}</Text>
              <Text style={styles.statLabel}>Dernier Run</Text>
            </View>
            <View style={styles.statItem}>
              <Package color="#10B981" size={24} />
              <Text style={styles.statValue}>{stats?.stats?.productsFound || 0}</Text>
              <Text style={styles.statLabel}>Produits Trouvés</Text>
            </View>
          </View>
        </View>
        
        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.runButton, loading && styles.runButtonDisabled]} 
          onPress={handleRunAgent}
          disabled={loading || stats?.isRunning}
        >
          <LinearGradient
            colors={loading ? ['#9CA3AF', '#6B7280'] : ['#F97316', '#EA580C']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Play color="#FFFFFF" size={24} fill="#FFFFFF" />
                <Text style={styles.runButtonText}>LANCER LE SOURCING MAINTENANT</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Comment ça marche ?</Text>
          <Text style={styles.infoText}>
            L'agent utilise l'IA (OpenAI GPT-4) pour analyser les tendances mondiales.
          </Text>
          <View style={styles.step}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.stepText}>Analyse catégories (Tech, Mode, Cuisine...)</Text>
          </View>
          <View style={styles.step}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.stepText}>Génération titres & descriptions vendeurs</Text>
          </View>
          <View style={styles.step}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.stepText}>Calcul automatique des marges</Text>
          </View>
          <View style={styles.step}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.stepText}>Import direct dans le Store</Text>
          </View>
        </View>

        {/* Batch Info */}
        <View style={styles.batchCard}>
            <Text style={styles.batchTitle}>📅 Tâche Planifiée</Text>
            <Text style={styles.batchText}>Le sourcing automatique s'exécute tous les jours à <Text style={{fontWeight: 'bold'}}>02:00 AM</Text>.</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 24, paddingTop: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconContainer: { width: 64, height: 64, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { color: '#E0E7FF', fontSize: 14 },
  content: { flex: 1, marginTop: -30 },
  scrollContent: { padding: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginVertical: 4 },
  statLabel: { color: '#6B7280', fontSize: 12 },
  runButton: { marginBottom: 24, borderRadius: 16, overflow: 'hidden', shadowColor: '#F97316', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  runButtonDisabled: { opacity: 0.8 },
  gradientButton: { padding: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  runButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 20 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  infoText: { color: '#4B5563', marginBottom: 16, lineHeight: 20 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  stepText: { color: '#374151', fontSize: 14 },
  batchCard: { backgroundColor: '#E0E7FF', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: '#4F46E5' },
  batchTitle: { color: '#3730A3', fontWeight: 'bold', marginBottom: 4 },
  batchText: { color: '#4338CA', fontSize: 13 },
});
