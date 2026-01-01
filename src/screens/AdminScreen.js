import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

export default function AdminScreen() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // User being edited

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN.USERS, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setUsers(data);
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

  const handleSaveUser = async () => {
    if (!name || !email) {
      Alert.alert('Erreur', 'Nom et email obligatoires');
      return;
    }

    try {
      let url = API_ENDPOINTS.ADMIN.USERS;
      let method = 'POST';
      let body = { name, email, role, password };

      if (editMode && currentUser) {
        url = `${API_ENDPOINTS.ADMIN.USERS}/${currentUser.id}`;
        method = 'PUT';
        // Only send password if changed
        if (!password) delete body.password;
      } else {
        if (!password) {
            Alert.alert('Erreur', 'Mot de passe obligatoire pour la création');
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

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      Alert.alert('Succès', editMode ? 'Utilisateur modifié' : 'Utilisateur créé');
      setModalVisible(false);
      resetForm();
      loadData();
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleDeleteUser = (id) => {
    Alert.alert(
      'Confirmer',
      'Supprimer cet utilisateur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_ENDPOINTS.ADMIN.USERS}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              
              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur suppression');
              }
              
              loadData();
              Alert.alert('Succès', 'Utilisateur supprimé');
            } catch (error) {
                Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const openAddModal = () => {
    setEditMode(false);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (user) => {
    setEditMode(true);
    setCurrentUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword(''); // Reset password field
    setModalVisible(true);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('USER');
    setCurrentUser(null);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.accessDeniedText}>⛔ Accès Refusé</Text>
        <Text style={styles.accessDeniedSubtext}>Vous devez être administrateur pour voir cette page.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛠️ Admin Dashboard</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <Text style={styles.refreshButtonText}>🔄</Text>
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

        {/* Users Section */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gestion Utilisateurs ({users.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                <Text style={styles.addButtonText}>+ Ajouter</Text>
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
                    Commandes: {item._count?.orders || 0} • GPS: {item._count?.locations || 0}
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
      </ScrollView>

      {/* Modal Add/Edit */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editMode ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Nom complet"
                    value={name}
                    onChangeText={setName}
                />
                
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TextInput
                    style={styles.input}
                    placeholder={editMode ? "Nouveau mot de passe (laisser vide pour garder)" : "Mot de passe"}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <View style={styles.roleContainer}>
                    <Text style={styles.roleLabel}>Rôle:</Text>
                    <View style={styles.roleButtons}>
                        <TouchableOpacity 
                            style={[styles.roleButton, role === 'USER' && styles.roleButtonActive]} 
                            onPress={() => setRole('USER')}
                        >
                            <Text style={[styles.roleButtonText, role === 'USER' && styles.roleButtonTextActive]}>USER</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.roleButton, role === 'ADMIN' && styles.roleButtonActive]} 
                            onPress={() => setRole('ADMIN')}
                        >
                            <Text style={[styles.roleButtonText, role === 'ADMIN' && styles.roleButtonTextActive]}>ADMIN</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center'
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  refreshButtonText: {
    fontSize: 18,
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  adminBadge: {
    fontSize: 10,
    color: '#FFFFFF',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  iconText: {
    fontSize: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
  },
  roleButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
  },
  roleButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  roleButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
