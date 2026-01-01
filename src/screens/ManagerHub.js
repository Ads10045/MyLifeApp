import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bot, Play, Truck, Database, Activity, Terminal, Package } from 'lucide-react-native';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function ManagerHub() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchStatus();
    // Auto-refresh stats every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/agent/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
      // Update products from the agent status (last run results)
      if (data?.sourcing?.lastProducts) {
        setProducts(data.sourcing.lastProducts);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const triggerAgent = async (type) => {
    try {
      setLoading(true);
      setProducts([]); // Clear previous products
      const endpoint = type === 'sourcing' ? '/agent/run' : '/agent/fulfill';
      const actionName = type === 'sourcing' ? 'Sourcing' : 'Fulfillment';
      
      Alert.alert('🤖 Commande Reçue', `L'agent ${actionName} démarre...`);
      
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Poll for completion and fetch products
      setTimeout(async () => {
        setLoading(false);
        fetchStatus();
        
        // Fetch status will now update products automatically from lastProducts
      }, 4000); // Wait for batch to complete

    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const AgentCard = ({ title, type, data, icon: Icon, color1, color2 }) => (
    <View style={styles.card}>
      <LinearGradient
        colors={[color1, color2]}
        style={styles.cardHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.cardHeaderContent}>
        <Icon color="#FFFFFF" size={18} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: data?.isRunning ? '#10B981' : 'rgba(255,255,255,0.2)' }]}>
          <Text style={styles.statusText}>{data?.isRunning ? 'RUNNING' : 'IDLE'}</Text>
        </View>
      </LinearGradient>
      
      <View style={styles.cardBody}>
        {type === 'sourcing' ? (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
               <Text style={styles.statVal}>{data?.stats?.productsFound || 0}</Text>
               <Text style={styles.statLabel}>Prod. Trouvés</Text>
            </View>
            <View style={styles.stat}>
               <Text style={styles.statVal}>{data?.stats?.lastCategory || '-'}</Text>
               <Text style={styles.statLabel}>Dernière Cat.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.statsRow}>
            <Text style={styles.infoText}>Automatise le paiement fournisseurs et l'expédition.</Text>
          </View>
        )}

        {/* Logs Preview */}
        <View style={styles.logPreview}>
            <Text style={styles.logTitle}>Dernière activité:</Text>
            <Text style={styles.logText} numberOfLines={2}>
                {data?.logs?.[0] || 'Aucune activité récente.'}
            </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
              onPress={() => triggerAgent(type)}
              disabled={data?.isRunning || loading}
              style={styles.executeButton}
          >
            <LinearGradient
              colors={[color1, color2]}
              style={styles.executeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
                {loading ? <ActivityIndicator color="#FFF" size="small" /> : (
                    <Play color="#FFF" size={18} fill="#FFF" />
                )}
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>Exécuter</Text>
        </View>

        {/* Products Display */}
        {type === 'sourcing' && products.length > 0 && (
          <View style={styles.productsSection}>
            <Text style={styles.productsTitle}>📦 Derniers produits</Text>
            {products.slice(0, 3).map((p, i) => (
              <View key={i} style={styles.productRow}>
                <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.productPrice}>{p.price}€</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#111827', '#1F2937']} style={styles.header}>
        <View style={styles.headerTop}>
            <View>
                <Text style={styles.headerTitle}>Manager HUB <Text style={{fontSize: 20}}>🤖</Text></Text>
                <Text style={styles.headerSubtitle}>AI Automation Center</Text>
            </View>
            <TouchableOpacity style={styles.logButton} onPress={() => setShowLogs(true)}>
                <Terminal color="#FFFFFF" size={16} />
            </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {/* Sourcing Agent */}
        <AgentCard 
            title="Sourcing Agent" 
            type="sourcing" 
            data={stats?.sourcing} 
            icon={Database}
            color1="#4F46E5"
            color2="#818CF8"
        />

        {/* Fulfillment Agent */}
        <AgentCard 
            title="Fulfillment Agent" 
            type="fulfillment" 
            data={stats?.fulfillment} 
            icon={Truck}
            color1="#EA580C"
            color2="#F97316"
        />

        <View style={styles.infoBox}>
            <Activity color="#6B7280" size={16} />
            <Text style={styles.infoBoxText}>
                Les agents s'exécutent automatiquement toutes les heures. 
                Vous pouvez les lancer manuellement ci-dessus.
            </Text>
        </View>

      </ScrollView>

      {/* Logs Modal */}
      <Modal visible={showLogs} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>System Logs</Text>
                <TouchableOpacity onPress={() => setShowLogs(false)}>
                    <Text style={styles.closeText}>Fermer</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.logsContainer}>
                <Text style={styles.logSection}>--- Sourcing Logs ---</Text>
                {stats?.sourcing?.logs?.map((log, i) => (
                    <Text key={'s'+i} style={styles.logLine}>{log}</Text>
                ))}
                
                <Text style={[styles.logSection, { marginTop: 20 }]}>--- Fulfillment Logs ---</Text>
                {stats?.fulfillment?.logs?.map((log, i) => (
                    <Text key={'f'+i} style={styles.logLine}>{log}</Text>
                ))}
            </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { color: '#9CA3AF', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  logButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10 },
  content: { flex: 1, marginTop: -12 },
  scrollContent: { padding: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  cardHeaderContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusText: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' },
  cardBody: { padding: 12 },
  statsRow: { flexDirection: 'row', marginBottom: 10, justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 10, color: '#6B7280' },
  infoText: { color: '#6B7280', fontSize: 12, textAlign: 'center' },
  logPreview: { backgroundColor: '#F9FAFB', padding: 8, borderRadius: 6, marginBottom: 10 },
  logTitle: { fontSize: 10, fontWeight: 'bold', color: '#374151', marginBottom: 2 },
  logText: { fontSize: 10, color: '#6B7280', fontFamily: 'Menlo' },
  iconButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  buttonContainer: { alignItems: 'center' },
  buttonLabel: { fontSize: 9, color: '#6B7280', marginTop: 4 },
  executeButton: { borderRadius: 22, overflow: 'hidden' },
  executeButtonGradient: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  
  // Products section
  productsSection: { marginTop: 12, padding: 10, backgroundColor: '#F0FDF4', borderRadius: 8 },
  productsTitle: { fontSize: 11, fontWeight: 'bold', color: '#166534', marginBottom: 8 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#DCFCE7' },
  productName: { flex: 1, fontSize: 11, color: '#374151' },
  productPrice: { fontSize: 11, fontWeight: 'bold', color: '#10B981' },
  
  infoBox: { flexDirection: 'row', padding: 12, alignItems: 'center', gap: 8 },
  infoBoxText: { flex: 1, color: '#6B7280', fontSize: 11 },
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#111827' },
  modalHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#374151', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },
  modalTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  closeText: { color: '#60A5FA', fontSize: 14 },
  logsContainer: { padding: 16 },
  logSection: { color: '#10B981', fontWeight: 'bold', marginBottom: 8, fontSize: 12 },
  logLine: { color: '#D1D5DB', fontSize: 11, fontFamily: 'Menlo', marginBottom: 3 },
});
