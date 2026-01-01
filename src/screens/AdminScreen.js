import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { Search, ChevronLeft, ChevronRight, UserPlus, RefreshCw } from 'lucide-react-native';

export default function AdminScreen() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Pagination & Search state
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Form state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('USER');

  useEffect(() => {
    if (user?.role === 'ADMIN' && token) {
      loadData();
    }
  }, [user, token]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchUsers(1, pagination.limit, searchQuery);
    }, 300);
    setSearchTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(1, pagination.limit, ''), fetchStats()]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page = 1, limit = 5, search = '') => {
    try {
      const url = `${API_ENDPOINTS.ADMIN.USERS}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.users) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else if (response.ok && Array.isArray(data)) {
        // Fallback for old API format
        setUsers(data);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN.STATS, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setStats(data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUsers(newPage, pagination.limit, searchQuery);
    }
  };

  const handleSaveUser = async () => {
    if (!userName || !userEmail) {
      Alert.alert('Erreur', 'Nom et email obligatoires');
      return;
    }

    try {
      let url = API_ENDPOINTS.ADMIN.USERS;
      let method = 'POST';
      let body = { name: userName, email: userEmail, role: userRole, password: userPassword };

      if (editMode && currentUser) {
        url = `${API_ENDPOINTS.ADMIN.USERS}/${currentUser.id}`;
        method = 'PUT';
        if (!userPassword) delete body.password;
      } else {
        if (!userPassword) {
          Alert.alert('Erreur', 'Mot de passe obligatoire');
          return;
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur');

      Alert.alert('Succès', editMode ? 'Utilisateur modifié' : 'Utilisateur créé');
      setModalVisible(false);
      resetForm();
      fetchUsers(pagination.page, pagination.limit, searchQuery);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleDeleteUser = (id) => {
    Alert.alert('Confirmer', 'Supprimer cet utilisateur ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_ENDPOINTS.ADMIN.USERS}/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
            });
            fetchUsers(pagination.page, pagination.limit, searchQuery);
            Alert.alert('Succès', 'Utilisateur supprimé');
          } catch (error) {
            Alert.alert('Erreur', error.message);
          }
        },
      },
    ]);
  };

  const openAddModal = () => {
    setEditMode(false);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (u) => {
    setEditMode(true);
    setCurrentUser(u);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRole(u.role);
    setUserPassword('');
    setModalVisible(true);
  };

  const resetForm = () => {
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setUserRole('USER');
    setCurrentUser(null);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.accessDeniedText}>⛔ Accès Refusé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛠️ Admin Dashboard</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <RefreshCw color="#6B7280" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats Section */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.users}</Text>
              <Text style={styles.statLabel}>Utilisateurs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.orders}</Text>
              <Text style={styles.statLabel}>Commandes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.revenue} €</Text>
              <Text style={styles.statLabel}>Revenus</Text>
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search color="#9CA3AF" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un utilisateur..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Utilisateurs ({pagination.total})</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <UserPlus color="#FFF" size={16} />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#10B981" />
        ) : (
          users.map((item) => (
            <View key={item.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{item.name}</Text>
                  {item.role === 'ADMIN' && <Text style={styles.adminBadge}>ADMIN</Text>}
                </View>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userDetails}>
                  Commandes: {item._count?.Order || 0} • GPS: {item._count?.Location || 0}
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconButton}>
                  <Text style={styles.iconText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteUser(item.id)} style={styles.iconButton}>
                  <Text style={styles.iconText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity 
              style={[styles.pageBtn, pagination.page === 1 && styles.pageBtnDisabled]}
              disabled={pagination.page === 1}
              onPress={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft size={20} color={pagination.page === 1 ? "#9CA3AF" : "#374151"} />
            </TouchableOpacity>
            
            <View style={styles.pageInfo}>
              <Text style={styles.pageText}>Page {pagination.page} / {pagination.totalPages}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.pageBtn, pagination.page >= pagination.totalPages && styles.pageBtnDisabled]}
              disabled={pagination.page >= pagination.totalPages}
              onPress={() => handlePageChange(pagination.page + 1)}
            >
              <ChevronRight size={20} color={pagination.page >= pagination.totalPages ? "#9CA3AF" : "#374151"} />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={{height: 100}} />
      </ScrollView>

      {/* User Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editMode ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Nom complet"
                    value={userName}
                    onChangeText={setUserName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={userEmail}
                    onChangeText={setUserEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder={editMode ? "Nouveau mot de passe" : "Mot de passe"}
                    value={userPassword}
                    onChangeText={setUserPassword}
                    secureTextEntry
                />

                <View style={styles.roleContainer}>
                    <Text style={styles.roleLabel}>Rôle:</Text>
                    <View style={styles.roleButtons}>
                        <TouchableOpacity style={[styles.roleButton, userRole === 'USER' && styles.roleButtonActive]} onPress={() => setUserRole('USER')}>
                            <Text style={[styles.roleButtonText, userRole === 'USER' && styles.roleButtonTextActive]}>USER</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.roleButton, userRole === 'ADMIN' && styles.roleButtonActive]} onPress={() => setUserRole('ADMIN')}>
                            <Text style={[styles.roleButtonText, userRole === 'ADMIN' && styles.roleButtonTextActive]}>ADMIN</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.submitButton} onPress={handleSaveUser}>
                        <Text style={styles.submitButtonText}>{editMode ? 'Modifier' : 'Créer'}</Text>
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
  header: { backgroundColor: '#FFFFFF', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  refreshButton: { padding: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },
  refreshButtonText: { fontSize: 18 },
  content: { padding: 20 },
  
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, marginTop: 10 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#10B981', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7280' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  addButton: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  
  // User Card
  userCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginRight: 8 },
  adminBadge: { fontSize: 10, color: '#FFFFFF', backgroundColor: '#3B82F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' },
  userEmail: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  userDetails: { fontSize: 12, color: '#9CA3AF' },
  
  actions: { flexDirection: 'row' },
  iconButton: { padding: 8, marginLeft: 4 },
  iconText: { fontSize: 18 },

  // Modal 
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16 },
  roleContainer: { marginBottom: 24 },
  roleLabel: { marginBottom: 8 },
  roleButtons: { flexDirection: 'row' },
  roleButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', marginRight: 8, borderRadius: 8 },
  roleButtonActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  roleButtonText: { color: '#6B7280' },
  roleButtonTextActive: { color: '#FFFFFF' },
  modalActions: { flexDirection: 'row' },
  cancelButton: { flex: 1, backgroundColor: '#F3F4F6', padding: 14, borderRadius: 8, marginRight: 10, alignItems: 'center' },
  cancelButtonText: { fontWeight: 'bold' },
  submitButton: { flex: 1, backgroundColor: '#10B981', padding: 14, borderRadius: 8, marginLeft: 10, alignItems: 'center' },
  submitButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 20 },
  accessDeniedText: { fontSize: 24, fontWeight: 'bold', color: '#DC2626' },

  // Search
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#111827' },

  // Pagination
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, gap: 16 },
  pageBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  pageBtnDisabled: { opacity: 0.5, backgroundColor: '#F9FAFB' },
  pageInfo: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  pageText: { color: '#374151', fontWeight: '600', fontSize: 14 },
});
