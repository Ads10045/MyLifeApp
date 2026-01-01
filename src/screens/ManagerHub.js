import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const StatCard = ({ title, value, emoji, color }) => (
    <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
            <Text style={styles.statEmoji}>{emoji}</Text>
        </View>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

export default function ManagerHub() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
            <Text style={styles.subtitle}>Tableau de Bord</Text>
            <Text style={styles.title}>Manager Hub</Text>
        </View>
        <TouchableOpacity style={styles.sparkleButton}>
            <Text style={styles.sparkleEmoji}>✨</Text>
        </TouchableOpacity>
      </View>

      {/* AI Agent Section */}
      <View style={styles.suggestionCard}>
        <View style={styles.botIcon}>
            <Text style={styles.botEmoji}>🤖</Text>
        </View>
        <View style={styles.suggestionContent}>
            <Text style={styles.suggestionLabel}>Conseil de votre Agent Gérant</Text>
            <Text style={styles.suggestionText}>
                Vos vidéos TikTok sur le 'Meal Prep' ont généré +25% de trafic. Je suggère d'en publier une nouvelle demain à 18h.
            </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard title="Ventes" value="1,240 €" emoji="📈" color="#10B981" />
        <StatCard title="Commandes" value="48" emoji="🛍️" color="#3B82F6" />
      </View>

      {/* Management Actions */}
      <Text style={styles.sectionTitle}>Actions de Gestion</Text>
      
      <TouchableOpacity style={styles.actionCard}>
        <View style={styles.actionIconGreen}>
            <Text style={styles.actionEmoji}>💬</Text>
        </View>
        <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Réponses Automatiques</Text>
            <Text style={styles.actionSubtitle}>L'agent gère vos clients WhatsApp</Text>
        </View>
        <Text style={styles.activeLabel}>Actif</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard}>
        <View style={styles.actionIconBlue}>
            <Text style={styles.actionEmoji}>📈</Text>
        </View>
        <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Script Marketing IA</Text>
            <Text style={styles.actionSubtitle}>Générer un script TikTok pour aujourd'hui</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.statusCard}>
        <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>Statut de l'Agent</Text>
            <Text style={styles.statusDescription}>
                Votre assistant intelligent surveille le stock et les ventes 24/7.
            </Text>
            <TouchableOpacity style={styles.optimizeButton}>
                <Text style={styles.optimizeText}>Optimiser les Ventes</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.statusBubble} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    contentContainer: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    subtitle: {
        color: '#9CA3AF',
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    title: {
        color: '#111827',
        fontSize: 30,
        fontWeight: 'bold',
    },
    sparkleButton: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: 12,
        borderRadius: 16,
    },
    sparkleEmoji: {
        fontSize: 24,
    },
    suggestionCard: {
        backgroundColor: '#F0FDF4',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#D1FAE5',
        flexDirection: 'row',
        gap: 12,
    },
    botIcon: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: 8,
        borderRadius: 12,
        height: 40,
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    botEmoji: {
        fontSize: 20,
    },
    suggestionContent: {
        flex: 1,
    },
    suggestionLabel: {
        color: '#10B981',
        fontWeight: 'bold',
        fontSize: 10,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    suggestionText: {
        color: '#374151',
        fontSize: 14,
        lineHeight: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statEmoji: {
        fontSize: 20,
    },
    statTitle: {
        color: '#6B7280',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    statValue: {
        color: '#1F2937',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4,
    },
    sectionTitle: {
        color: '#1F2937',
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 16,
        textDecorationLine: 'underline',
        textDecorationColor: '#10B981',
    },
    actionCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 32,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIconGreen: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: 16,
        borderRadius: 16,
        marginRight: 16,
    },
    actionIconBlue: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: 16,
        borderRadius: 16,
        marginRight: 16,
    },
    actionEmoji: {
        fontSize: 24,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        color: '#1F2937',
        fontWeight: 'bold',
        fontSize: 14,
    },
    actionSubtitle: {
        color: '#6B7280',
        fontSize: 12,
    },
    activeLabel: {
        color: '#10B981',
        fontWeight: 'bold',
    },
    arrow: {
        color: '#9CA3AF',
        fontSize: 20,
    },
    statusCard: {
        backgroundColor: '#064E3B',
        padding: 24,
        borderRadius: 40,
        marginTop: 16,
        position: 'relative',
        overflow: 'hidden',
    },
    statusContent: {
        zIndex: 10,
    },
    statusTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    statusDescription: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        marginBottom: 16,
    },
    optimizeButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    optimizeText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    statusBubble: {
        position: 'absolute',
        right: -40,
        bottom: -40,
        width: 160,
        height: 160,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderRadius: 80,
    },
});
