import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bot, Play, Truck, Database, Activity, Terminal, Package, Wallet, Settings, Calendar as CalendarIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function ManagerHub() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStates, setLoadingStates] = useState({ sourcing: false, fulfillment: false });
  const [refreshing, setRefreshing] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [products, setProducts] = useState([]);
  
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({ start: '', end: '' });
  const [savingConfig, setSavingConfig] = useState(false);
  
  // Date Picker State
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleDateChange = (event, selectedDate, field) => {
    // Android: dismiss picker on selection
    if (Platform.OS === 'android') {
        if (field === 'start') setShowStartPicker(false);
        if (field === 'end') setShowEndPicker(false);
    }

    if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        setConfig(prev => ({ ...prev, [field]: dateStr }));
    }
  };

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
      
      // Update local config state from server if not already editing
      if (!showConfig && data?.fulfillment?.config?.cleanupRange) {
         setConfig({
             start: data.fulfillment.config.cleanupRange.start?.split('T')[0] || '',
             end: data.fulfillment.config.cleanupRange.end?.split('T')[0] || ''
         });
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const saveConfig = async () => {
      console.log('🔍 saveConfig appelé - config:', config);
      
      const showMessage = (title, message) => {
          if (Platform.OS === 'web') {
              window.alert(`${title}: ${message}`);
          } else {
              Alert.alert(title, message);
          }
      };
      
      if (!config.start || !config.end) {
          console.log('❌ Validation échouée - dates manquantes');
          showMessage('Erreur', 'Veuillez sélectionner une date de début et de fin.');
          return;
      }

      console.log('✅ Validation OK - envoi au backend...');
      
      try {
          setSavingConfig(true);
          const body = {
              fulfillment: {
                  cleanupRange: {
                      start: new Date(config.start).toISOString(),
                      end: new Date(config.end).toISOString()
                  }
              }
          };
          
          console.log('📤 Body à envoyer:', JSON.stringify(body, null, 2));
          
          const response = await fetch(`${API_ENDPOINTS.BASE_URL}/agent/config`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });
          
          console.log('📥 Réponse reçue - status:', response.status);
          
          if (response.ok) {
              const data = await response.json();
              console.log('✅ Succès - data:', data);
              showMessage('Succès', 'Configuration mise à jour !');
              setShowConfig(false);
              fetchStatus();
          } else {
              const errorText = await response.text();
              console.log('❌ Erreur HTTP - status:', response.status, 'body:', errorText);
              showMessage('Erreur', 'Impossible de sauvegarder.');
          }
      } catch (error) {
          console.error('❌ Exception:', error);
          showMessage('Erreur', 'Date invalide ou erreur réseau.');
      } finally {
          setSavingConfig(false);
      }
  };

  const triggerAgent = async (type, source = null) => {
    try {
      setLoadingStates(prev => ({ ...prev, [type]: true }));
      if (type === 'sourcing' && !source) setProducts([]); // Clear only if global run
      
      const endpoint = type === 'sourcing' ? '/agent/run' : '/agent/fulfill';
      const actionName = source ? `Sourcing ${source}` : (type === 'sourcing' ? 'Sourcing Global' : 'Fulfillment');
      
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source })
      });

      const data = await response.json();
      Alert.alert('🤖 Commandes', data.message || `L'agent ${actionName} démarre...`);
      
      // Poll for completion
      setTimeout(async () => {
        setLoadingStates(prev => ({ ...prev, [type]: false }));
        fetchStatus();
      }, 4000);

    } catch (error) {
      console.error('Error:', error);
      setLoadingStates(prev => ({ ...prev, [type]: false }));
      Alert.alert('Erreur', 'Impossible de lancer l\'agent');
    }
  };

  const SourceMiniCard = ({ name, color, data, products }) => {
    const isRunning = stats?.sourcing?.activeSources?.includes(name);
    const isGlobalRunning = stats?.sourcing?.activeSources?.includes('Global');

    return (
        <View style={[styles.sourceMiniCard, { borderColor: color, opacity: (isGlobalRunning && !isRunning) ? 0.6 : 1 }]}>
            <View style={styles.sourceMiniHeader}>
                <Text style={[styles.sourceMiniTitle, { color }]}>{name}</Text>
                <Text style={styles.sourceMiniRG}>RG: {stats?.sourcing?.stats?.rules?.[name] || '+30%'}</Text>
            </View>
            <View style={styles.sourceMiniStats}>
                <Text style={styles.sourceMiniCount}>{stats?.sourcing?.stats?.[name.toLowerCase() + 'Count'] || 0}</Text>
                <Text style={styles.sourceMiniLabel}>En stock</Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity 
                onPress={() => triggerAgent('sourcing', name)}
                disabled={isRunning || isGlobalRunning || loadingStates.sourcing}
                style={[styles.sourceRunButton, { backgroundColor: color, opacity: (isRunning || isGlobalRunning) ? 0.7 : 1 }]}
            >
                {isRunning ? (
                    <ActivityIndicator color="#FFF" size="small" />
                ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Play color="#FFF" size={12} fill="#FFF" />
                        <Text style={styles.sourceRunText}>LANCER</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Latest Result Preview */}
            {products && products.length > 0 ? (
                <View style={styles.sourceMiniPreview}>
                    <Text style={styles.previewName} numberOfLines={1}>{products[0].name}</Text>
                    <Text style={styles.previewPrice}>{products[0].price}€</Text>
                </View>
            ) : (
                <View style={styles.sourceMiniEmpty}>
                    <Text style={styles.emptyTextMini}>En attente</Text>
                </View>
            )}
        </View>
    );
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
        
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            {type === 'fulfillment' && (
                <TouchableOpacity onPress={() => setShowConfig(true)}>
                    <Settings color="#FFFFFF" size={16} />
                </TouchableOpacity>
            )}
            <View style={[styles.statusBadge, { backgroundColor: data?.activeSources?.length > 0 ? '#10B981' : 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.statusText}>{data?.activeSources?.length > 0 ? 'RUNNING' : 'IDLE'}</Text>
            </View>
        </View>
      </LinearGradient>
      
      <View style={styles.cardBody}>
        {type === 'sourcing' ? (
          <View>
            <View style={styles.sourcingDivisions}>
                <SourceMiniCard name="Amazon" color="#FF9900" products={data?.lastProductsBySource?.Amazon} />
                <SourceMiniCard name="AliExpress" color="#FF4747" products={data?.lastProductsBySource?.AliExpress} />
                <SourceMiniCard name="eBay" color="#0064D2" products={data?.lastProductsBySource?.eBay} />
            </View>
            
            <TouchableOpacity 
                style={[styles.globalRunBtn, (data?.activeSources?.length > 0 || loadingStates.sourcing) && { opacity: 0.5 }]} 
                onPress={() => triggerAgent('sourcing')}
                disabled={data?.activeSources?.length > 0 || loadingStates.sourcing}
            >
                {data?.activeSources?.includes('Global') ? (
                    <ActivityIndicator color="#4F46E5" size="small" />
                ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Bot color="#4F46E5" size={14} />
                        <Text style={styles.globalRunBtnText}>LANCER TOUTES LES SOURCES</Text>
                    </View>
                )}
            </TouchableOpacity>
          </View>
        ) : type === 'fulfillment' ? (
// ...
          <View style={styles.statsRow}>
            <Text style={styles.infoText}>
              Automatise le paiement fournisseurs, l'expédition et 
              <Text style={{fontWeight: 'bold', color: '#EF4444'}}> supprime les produits expirés.</Text>
            </Text>
          </View>
        ) : (
             <View style={styles.statsRow}>
            <View style={styles.stat}>
               <Text style={styles.statVal}>1,240.50€</Text>
               <Text style={styles.statLabel}>Solde Dispo.</Text>
            </View>
            <View style={styles.stat}>
               <Text style={styles.statVal}>345.00€</Text>
               <Text style={styles.statLabel}>En Attente</Text>
            </View>
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
              onPress={() => type === 'finance' ? Alert.alert('Bientôt', 'La configuration des virements arrive bientôt.') : triggerAgent(type)}
              disabled={data?.isRunning || (type !== 'finance' && loadingStates[type])}
              style={styles.executeButton}
          >
            <LinearGradient
              colors={[color1, color2]}
              style={styles.executeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
                {type !== 'finance' && loadingStates[type] ? (
                    <ActivityIndicator color="#FFF" size="small" /> 
                ) : (
                    type === 'finance' ? <Wallet color="#FFF" size={18} /> : <Play color="#FFF" size={18} fill="#FFF" />
                )}
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>{type === 'finance' ? 'Gérer' : 'Exécuter'}</Text>
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

        {/* Finance / Earnings Section */}
        <AgentCard 
            title="Revenus & Règlements" 
            type="finance" 
            data={{ isRunning: false, logs: ['Dernier virement: 12/12/2025'] }} 
            icon={Wallet}
            color1="#059669" // Emerald 600
            color2="#10B981" // Emerald 500
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

      {/* Config Modal */}
      <Modal visible={showConfig} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.configModal}>
                <Text style={styles.configTitle}>Configuration Fulfillment</Text>
                <Text style={styles.configSubtitle}>Intervalle de suppression des produits expirés</Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Date Début</Text>
                    {Platform.OS === 'web' ? (
                        <input
                            type="date"
                            value={config.start}
                            onChange={(e) => setConfig({...config, start: e.target.value})}
                            style={{
                                borderWidth: 1,
                                borderColor: '#D1D5DB',
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 14,
                                width: '100%',
                                fontFamily: 'system-ui',
                                backgroundColor: '#FFF',
                                color: '#111827'
                            }}
                        />
                    ) : (
                        <>
                            <TouchableOpacity style={styles.dateInput} onPress={() => setShowStartPicker(true)}>
                                <CalendarIcon color="#6B7280" size={16} />
                                <Text style={styles.dateText}>{config.start || 'Sélectionner une date'}</Text>
                            </TouchableOpacity>
                            {showStartPicker && (
                                <View>
                                    <DateTimePicker
                                        value={config.start ? new Date(config.start) : new Date(2024, 0, 1)}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(e, d) => handleDateChange(e, d, 'start')}
                                    />
                                    {Platform.OS === 'ios' && (
                                        <TouchableOpacity onPress={() => setShowStartPicker(false)} style={styles.confirmDateBtn}>
                                            <Text style={styles.confirmDateText}>Valider la date</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Date Fin</Text>
                    {Platform.OS === 'web' ? (
                        <input
                            type="date"
                            value={config.end}
                            onChange={(e) => setConfig({...config, end: e.target.value})}
                            style={{
                                borderWidth: 1,
                                borderColor: '#D1D5DB',
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 14,
                                width: '100%',
                                fontFamily: 'system-ui',
                                backgroundColor: '#FFF',
                                color: '#111827'
                            }}
                        />
                    ) : (
                        <>
                            <TouchableOpacity style={styles.dateInput} onPress={() => setShowEndPicker(true)}>
                                <CalendarIcon color="#6B7280" size={16} />
                                <Text style={styles.dateText}>{config.end || 'Sélectionner une date'}</Text>
                            </TouchableOpacity>
                            {showEndPicker && (
                                <View>
                                    <DateTimePicker
                                        value={config.end ? new Date(config.end) : new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(e, d) => handleDateChange(e, d, 'end')}
                                    />
                                    {Platform.OS === 'ios' && (
                                        <TouchableOpacity onPress={() => setShowEndPicker(false)} style={styles.confirmDateBtn}>
                                            <Text style={styles.confirmDateText}>Valider la date</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </>
                    )}
                </View>

                <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowConfig(false)}>
                        <Text style={styles.cancelText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={saveConfig} disabled={savingConfig}>
                        {savingConfig ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Sauvegarder</Text>}
                    </TouchableOpacity>
                </View>
            </View>
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
  
  // Sourcing Divisions Layout
  sourcingDivisions: { flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginTop: 5 },
  sourceMiniCard: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10, borderWidth: 1, minHeight: 140 },
  sourceMiniHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sourceMiniTitle: { fontSize: 10, fontWeight: 'bold' },
  sourceMiniRG: { fontSize: 8, color: '#6B7280', fontWeight: 'bold' },
  sourceMiniStats: { alignItems: 'center', marginBottom: 10 },
  sourceMiniCount: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  sourceMiniLabel: { fontSize: 8, color: '#9CA3AF', textTransform: 'uppercase' },
  
  sourceRunButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, borderRadius: 8, marginBottom: 8 },
  sourceRunText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  
  sourceMiniPreview: { backgroundColor: '#FFF', borderRadius: 6, padding: 4, borderWidth: 1, borderColor: '#EEF2FF' },
  previewName: { fontSize: 8, color: '#374151' },
  previewPrice: { fontSize: 8, fontWeight: 'bold', color: '#10B981' },
  sourceMiniEmpty: { backgroundColor: '#FFF', borderRadius: 6, padding: 4, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB' },
  emptyTextMini: { fontSize: 8, color: '#9CA3AF', fontStyle: 'italic' },

  globalRunBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 15, paddingVertical: 10, backgroundColor: '#EEF2FF', borderRadius: 10, borderWidth: 1, borderColor: '#C7D2FE' },
  globalRunBtnText: { color: '#4F46E5', fontSize: 10, fontWeight: 'bold' },

  infoBox: { flexDirection: 'row', padding: 12, alignItems: 'center', gap: 8 },
  infoBoxText: { flex: 1, color: '#6B7280', fontSize: 11 },
  
  // Modal... (rest of the file stays same)
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#111827' },
  modalHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#374151', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },
  modalTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  closeText: { color: '#60A5FA', fontSize: 14 },
  logsContainer: { padding: 16 },
  logSection: { color: '#10B981', fontWeight: 'bold', marginBottom: 8, fontSize: 12 },
  logLine: { color: '#D1D5DB', fontSize: 11, fontFamily: 'Menlo', marginBottom: 3 },

  // Config Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  configModal: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, width: '100%' },
  configTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  configSubtitle: { fontSize: 12, color: '#6B7280', marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#374151', marginBottom: 5 },
  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12 },
  dateText: { color: '#111827', fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#6B7280' },
  saveBtn: { backgroundColor: '#EA580C', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: '#FFF', fontWeight: 'bold' },
  confirmDateBtn: { alignItems: 'center', padding: 8, backgroundColor: '#EFF6FF', marginTop: 5, borderRadius: 6 },
  confirmDateText: { color: '#2563EB', fontSize: 12, fontWeight: 'bold' }
});
