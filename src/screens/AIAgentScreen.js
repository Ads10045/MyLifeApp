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
    // Refresh status every 5 seconds if running
    let interval;
    if (stats?.sourcing?.isRunning) {
      interval = setInterval(fetchStatus, 5000);
    }
    return () => clearInterval(interval);
  }, [stats?.sourcing?.isRunning]);

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

  const handleRunAgent = async (source = null) => {
    try {
      // Don't set global loading here to avoid freezing all buttons unnecessarily
      const msg = source ? `L'agent cherche sur ${source}...` : "L'agent cherche sur toutes les sources...";
      Alert.alert('🤖 Agent Démarré', msg);
      
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/agent/run`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source })
      });
      
      const data = await response.json();
      
      // Feedback
      if (data.message) {
          Alert.alert('🤖 Résultat', data.message);
      }
      
      fetchStatus();
      
    } catch (error) {
      console.error('Error starting agent:', error);
      Alert.alert('Erreur', 'Impossible de démarrer l\'agent');
    }
  };

  const SourceDivision = ({ name, color, logo, count, featured, rule }) => (
    <View style={[styles.divisionCard, { borderTopColor: color }]}>
        <View style={styles.divisionHeader}>
            <Image source={{ uri: logo }} style={styles.sourceLogo} resizeMode="contain" />
            <View style={styles.countBadge}>
                <Text style={[styles.sourceCount, { color: color }]}>{count || 0}</Text>
            </View>
        </View>
        
        <View style={styles.ruleContainer}>
            <BarChart2 size={14} color="#6B7280" />
            <Text style={styles.ruleText}>RG: {rule || 'Marge +30%'}</Text>
        </View>

        <Text style={styles.divisionTitle}>Dernier résultat {name}</Text>
        
        {featured ? (
            <View style={styles.productPreview}>
                <Image source={{ uri: featured.imageUrl }} style={styles.productThumb} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.productName} numberOfLines={1}>{featured.name}</Text>
                    <Text style={styles.productPrice}>{featured.price}€</Text>
                </View>
            </View>
        ) : (
            <View style={styles.emptyPreview}>
                <Package size={20} color="#D1D5DB" />
                <Text style={styles.placeholderText}>Aucun produit ajouté</Text>
            </View>
        )}

        <TouchableOpacity 
            style={[
                styles.miniRunButton, 
                { backgroundColor: color },
                (stats?.sourcing?.activeSources?.includes(name) || stats?.sourcing?.activeSources?.includes('Global')) && styles.miniRunButtonDisabled
            ]} 
            onPress={() => handleRunAgent(name)}
            disabled={loading || stats?.sourcing?.activeSources?.includes(name) || stats?.sourcing?.activeSources?.includes('Global')}
        >
            {stats?.sourcing?.activeSources?.includes(name) ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Play color="#FFFFFF" size={14} fill="#FFFFFF" />
                    <Text style={styles.miniRunButtonText}>LANCER {name.toUpperCase()}</Text>
                </View>
            )}
        </TouchableOpacity>
    </View>
  );

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
            <Text style={styles.headerSubtitle}>
                {stats?.sourcing?.isRunning ? '🔵 Recherche en cours...' : '⚪ En attente de commande'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.divisionsContainer}>
            <SourceDivision 
                name="Amazon" 
                color="#FF9900" 
                logo="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"
                count={stats?.sourcing?.stats?.amazonCount}
                featured={stats?.sourcing?.stats?.featuredProducts?.Amazon}
                rule={stats?.sourcing?.stats?.rules?.Amazon}
            />

            <SourceDivision 
                name="AliExpress" 
                color="#FF4747" 
                logo="https://upload.wikimedia.org/wikipedia/commons/3/3b/Aliexpress_logo.svg"
                count={stats?.sourcing?.stats?.aliexpressCount}
                featured={stats?.sourcing?.stats?.featuredProducts?.AliExpress}
                rule={stats?.sourcing?.stats?.rules?.AliExpress}
            />

            <SourceDivision 
                name="eBay" 
                color="#0064D2" 
                logo="https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg"
                count={stats?.sourcing?.stats?.ebayCount}
                featured={stats?.sourcing?.stats?.featuredProducts?.eBay}
                rule={stats?.sourcing?.stats?.rules?.eBay}
            />
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.infoNoteText}>Chaque source applique ses propres règles de gestion (RG) lors du sourcing.</Text>
        </View>

        {/* Global Action Button Restored */}
        <TouchableOpacity 
          style={[styles.runButton, (loading || stats?.sourcing?.activeSources?.length > 0) && styles.runButtonDisabled]} 
          onPress={() => handleRunAgent(null)}
          disabled={loading || stats?.sourcing?.activeSources?.length > 0}
        >
          <LinearGradient
            colors={loading || stats?.sourcing?.activeSources?.length > 0 ? ['#9CA3AF', '#6B7280'] : ['#4B5563', '#1F2937']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {stats?.sourcing?.activeSources?.includes('Global') ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Bot color="#FFFFFF" size={20} style={{ marginRight: 10 }} />
                    <Text style={styles.runButtonText}>LANCER TOUTES LES SOURCES</Text>
                </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Category History */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Clock size={18} color="#4F46E5" />
            <Text style={styles.cardTitle}>Historique Catégories</Text>
          </View>
          <View style={styles.categoryBadgeRow}>
            {(stats?.sourcing?.stats?.recentCategories || []).length > 0 ? (
              stats.sourcing.stats.recentCategories.map((cat, i) => (
                <View key={i} style={styles.catBadge}>
                  <Text style={styles.catBadgeText}>{cat}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Aucun historique</Text>
            )}
          </View>
        </View>

        {/* Status Logs */}
        {stats?.sourcing?.logs && stats.sourcing.logs.length > 0 && (
            <View style={styles.logCard}>
                <Text style={styles.logTitle}>Journal d'activité</Text>
                {stats.sourcing.logs.slice(0, 5).map((log, i) => (
                    <Text key={i} style={styles.logText}>{log}</Text>
                ))}
            </View>
        )}

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
  headerSubtitle: { color: '#E0E7FF', fontSize: 14, fontWeight: '500' },
  content: { flex: 1, marginTop: -30 },
  scrollContent: { padding: 20 },
  
  divisionsContainer: { flexDirection: 'column', gap: 15, marginBottom: 20 },
  divisionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderTopWidth: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  divisionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sourceLogo: { width: 80, height: 30 },
  countBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  sourceCount: { fontSize: 20, fontWeight: 'bold' },
  
  ruleContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', padding: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 15 },
  ruleText: { fontSize: 11, color: '#6B7280', fontWeight: 'bold' },
  
  divisionTitle: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  productPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10, gap: 12 },
  productThumb: { width: 45, height: 45, borderRadius: 8, backgroundColor: '#E5E7EB' },
  productName: { color: '#374151', fontSize: 12, fontWeight: '500' },
  productPrice: { color: '#10B981', fontSize: 12, fontWeight: 'bold' },
  emptyPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  placeholderText: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },
  
  miniRunButton: { marginTop: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 10, borderRadius: 12 },
  miniRunButtonDisabled: { opacity: 0.5 },
  miniRunButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },

  infoNote: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ECFDF5', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#10B981' },
  infoNoteText: { color: '#065F46', fontSize: 11, fontWeight: '500', flex: 1 },
  
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  categoryBadgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  catBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#C7D2FE' },
  catBadgeText: { color: '#4F46E5', fontSize: 12, fontWeight: 'bold' },
  
  runButton: { marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
  runButtonDisabled: { opacity: 0.5 },
  gradientButton: { padding: 18, alignItems: 'center' },
  runButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  
  logCard: { backgroundColor: '#1F2937', borderRadius: 16, padding: 15 },
  logTitle: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  logText: { color: '#D1D5DB', fontSize: 11, marginBottom: 4, fontFamily: 'monospace' },
  emptyText: { color: '#9CA3AF', fontStyle: 'italic', fontSize: 13 },
});
