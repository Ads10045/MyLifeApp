import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Platform, ScrollView, Image, Linking, Modal, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';
import { Cast, ChevronUp, ChevronDown, List, Tv2, StopCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

export default function IPTVScreen() {
  const { token } = useAuth();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('Tous');
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isListMinimized, setIsListMinimized] = useState(false);
  const [showCastModal, setShowCastModal] = useState(false);
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});

  useEffect(() => {
    fetchPlaylist();
  }, []);

  // Filter channels when category changes
  useEffect(() => {
    if (selectedGroup === 'Tous') {
      setFilteredChannels(channels);
    } else {
      setFilteredChannels(channels.filter(c => c.group === selectedGroup));
    }
  }, [selectedGroup, channels]);

  const fetchPlaylist = async () => {
    try {
      // Check cache first
      const cachedChannels = await AsyncStorage.getItem('@iptv_channels');
      const cachedGroups = await AsyncStorage.getItem('@iptv_groups');
      
      if (cachedChannels && cachedGroups) {
        const parsedChannels = JSON.parse(cachedChannels);
        const parsedGroups = JSON.parse(cachedGroups);
        setChannels(parsedChannels);
        setGroups(parsedGroups);
        if (parsedChannels.length > 0) {
          setSelectedChannel(parsedChannels[0]);
        }
        console.log(`Loaded ${parsedChannels.length} channels from cache`);
        setLoading(false);
        return;
      }

      // 1. Get Dynamic URL from Backend
      const settingsResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/settings/iptv_url`);
      const setting = await settingsResponse.json();
      
      if (!setting || !setting.value) {
        Alert.alert('Info', 'Aucune URL IPTV configurée');
        setLoading(false);
        return;
      }

      console.log('Fetching Playlist from:', setting.value);

      // 2. Fetch M3U Content
      const playlistResponse = await fetch(setting.value);
      const playlistText = await playlistResponse.text();
      
      // 3. Parse M3U
      const parsedChannels = parseM3U(playlistText);
      
      // Filter: Maroc, Bein, CAN
      const keywords = ['MAROC', 'MOROCCO', 'BEIN', 'CAN', 'AFRICA'];
      const filteredList = parsedChannels.filter(c => {
        const text = (c.title + ' ' + c.group).toUpperCase();
        return keywords.some(k => text.includes(k));
      });

      // Sort: Maroc first, then BeIN, then others
      filteredList.sort((a, b) => {
        const aText = (a.title + ' ' + a.group).toUpperCase();
        const bText = (b.title + ' ' + b.group).toUpperCase();
        const aIsMaroc = aText.includes('MAROC') || aText.includes('MOROCCO');
        const bIsMaroc = bText.includes('MAROC') || bText.includes('MOROCCO');
        const aIsBein = aText.includes('BEIN');
        const bIsBein = bText.includes('BEIN');
        
        if (aIsMaroc && !bIsMaroc) return -1;
        if (!aIsMaroc && bIsMaroc) return 1;
        if (aIsBein && !bIsBein) return -1;
        if (!aIsBein && bIsBein) return 1;
        return 0;
      });

      setChannels(filteredList);
      
      // Extract unique groups from filtered list
      const uniqueGroups = ['Tous', ...new Set(filteredList.map(c => c.group))];
      setGroups(uniqueGroups);
      
      // Save to cache
      await AsyncStorage.setItem('@iptv_channels', JSON.stringify(filteredList));
      await AsyncStorage.setItem('@iptv_groups', JSON.stringify(uniqueGroups));
      
      console.log(`Loaded ${filteredList.length} channels (Cached)`);

      // Auto-play first channel if available
      if (filteredList.length > 0) {
        setSelectedChannel(filteredList[0]);
      }

    } catch (error) {
      console.error('IPTV Error:', error);
      Alert.alert('Erreur', 'Impossible de charger la liste IPTV');
    } finally {
      setLoading(false);
    }
  };

  const parseM3U = (content) => {
    const lines = content.split('\n');
    const items = [];
    let currentItem = {};

    lines.forEach(line => {
      line = line.trim();
      if (line.startsWith('#EXTINF:')) {
        const info = line.substring(8);
        const parts = info.split(',');
        const title = parts[parts.length - 1]?.trim() || 'Chaîne inconnue';
        
        const logoMatch = info.match(/tvg-logo="([^"]*)"/);
        const logo = logoMatch ? logoMatch[1] : null;

        const groupMatch = info.match(/group-title="([^"]*)"/);
        const group = groupMatch ? groupMatch[1] : 'Autres';

        currentItem = { title, logo, group };
      } else if (line.startsWith('http')) {
        currentItem.url = line;
        items.push(currentItem);
        currentItem = {};
      }
    });

    return items;
  };

  const playChannel = (channel) => {
    console.log('Playing:', channel.title, channel.url);
    setSelectedChannel(channel);
    // Minimize list on mobile when a channel is selected
    if (Platform.OS !== 'web') {
      setIsListMinimized(true);
    }
  };

  const toggleListMinimized = () => {
    setIsListMinimized(!isListMinimized);
  };

  const stopChannel = () => {
    setSelectedChannel(null);
    setIsListMinimized(false);
  };

  const handleCast = () => {
    setShowCastModal(true);
  };

  const openCastSettings = () => {
    setShowCastModal(false);
    if (Platform.OS === 'ios') {
      // On iOS, open Control Center instruction
      Alert.alert(
        '📺 AirPlay',
        'Pour caster sur votre TV:\n\n1. Faites glisser depuis le coin supérieur droit pour ouvrir le Centre de contrôle\n2. Appuyez sur l\'icône Screen Mirroring\n3. Sélectionnez votre Apple TV ou TV compatible',
        [{ text: 'OK' }]
      );
    } else if (Platform.OS === 'android') {
      // Try to open cast settings on Android
      Linking.openSettings();
    }
  };

  const renderChannelItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.channelItem, 
        selectedChannel?.url === item.url && styles.selectedChannel
      ]} 
      onPress={() => playChannel(item)}
    >
        {item.logo ? (
          <Image 
            source={{ uri: item.logo }} 
            style={styles.channelLogo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.channelLogoPlaceholder}>
            <Text style={styles.channelIcon}>📺</Text>
          </View>
        )}
        <View style={styles.channelInfo}>
            <Text style={styles.channelName} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.channelGroup}>{item.group}</Text>
        </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.categoryItem,
        selectedGroup === item && styles.selectedCategoryItem
      ]}
      onPress={() => setSelectedGroup(item)}
    >
      <Text style={[
        styles.categoryText,
        selectedGroup === item && styles.selectedCategoryText
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Chargement des chaînes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Cast Button - Hidden in landscape */}
      {Platform.OS !== 'web' && !isLandscape && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📺 IPTV</Text>
          <View style={styles.headerButtons}>
            {selectedChannel && (
              <TouchableOpacity style={styles.headerStopButton} onPress={stopChannel}>
                <StopCircle color="#FFFFFF" size={22} strokeWidth={2} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerCastButton} onPress={handleCast}>
              <Cast color="#FFFFFF" size={22} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[
        styles.contentWrapper,
        isLandscape && styles.contentWrapperLandscape
      ]}>
        
        {/* Video Player Section */}
        <View style={[
          styles.videoSection,
          Platform.OS !== 'web' && isListMinimized && !isLandscape && styles.videoSectionFullscreen,
          isLandscape && styles.videoSectionLandscape
        ]}>
            <View style={[
              styles.videoContainer,
              Platform.OS !== 'web' && isListMinimized && !isLandscape && styles.videoContainerFullscreen,
              isLandscape && { height: height - 40 }
            ]}>
                {selectedChannel ? (
                <Video
                    ref={videoRef}
                    style={styles.video}
                    source={{
                    uri: selectedChannel.url,
                    }}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                    shouldPlay
                    onPlaybackStatusUpdate={status => setStatus(() => status)}
                    onError={(e) => {
                        console.log('Video Error:', e);
                        Alert.alert('Erreur Lecture', 'Impossible de lire cette chaîne (Format ou Connexion)');
                    }}
                />
                ) : (
                <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderEmoji}>📡</Text>
                    <Text style={styles.placeholderText}>Sélectionnez une chaîne</Text>
                </View>
                )}
            </View>
            {selectedChannel && (
                <View style={styles.nowPlaying}>
                    <Text style={styles.nowPlayingTitle}>{selectedChannel.title}</Text>
                    <Text style={styles.nowPlayingGroup}>{selectedChannel.group}</Text>
                </View>
            )}
            
            {/* Toggle Button - Only on Mobile when list is minimized */}
            {Platform.OS !== 'web' && isListMinimized && (
              <TouchableOpacity 
                style={styles.toggleButton}
                onPress={toggleListMinimized}
              >
                <List color="#FFFFFF" size={20} strokeWidth={2.5} />
                <Text style={styles.toggleButtonText}>Chaînes</Text>
              </TouchableOpacity>
            )}
        </View>

        {/* Channel List - Always visible in landscape, toggleable in portrait */}
        {(Platform.OS === 'web' || isLandscape || !isListMinimized) && (
          <View style={[
            styles.listSection,
            isLandscape && styles.listSectionLandscape
          ]}>
              {/* Minimize button on mobile */}
              {Platform.OS !== 'web' && selectedChannel && (
                <TouchableOpacity 
                  style={styles.minimizeButton}
                  onPress={toggleListMinimized}
                >
                  <ChevronUp color="#FFFFFF" size={20} strokeWidth={2.5} />
                  <Text style={styles.minimizeButtonText}>Minimiser</Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.categoriesContainer}>
                  {Platform.OS === 'web' ? (
                      <select
                          style={{
                              width: '90%',
                              padding: 8,
                              margin: 10,
                              borderRadius: 5,
                              border: '1px solid #333',
                              backgroundColor: '#222',
                              fontSize: 14,
                              color: '#FFF',
                              outline: 'none',
                              cursor: 'pointer'
                          }}
                          value={selectedGroup}
                          onChange={(e) => setSelectedGroup(e.target.value)}
                      >
                          {groups.map((group) => (
                              <option key={group} value={group}>
                                  {group}
                              </option>
                          ))}
                      </select>
                  ) : (
                      <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
                          {groups.map((group) => (
                              <TouchableOpacity 
                                  key={group}
                                  style={[
                                      styles.categoryListItem,
                                      selectedGroup === group && styles.categoryListItemSelected
                                  ]}
                                  onPress={() => setSelectedGroup(group)}
                              >
                                  <Text style={[
                                      styles.categoryListText,
                                      selectedGroup === group && styles.categoryListTextSelected
                                  ]}>
                                      {group}
                                  </Text>
                                  {selectedGroup === group && (
                                      <Text style={styles.categoryCheckmark}>✓</Text>
                                  )}
                              </TouchableOpacity>
                          ))}
                      </ScrollView>
                  )}
              </View>

              <View style={styles.listContainer}>
                  <Text style={styles.listTitle}>
                      {selectedGroup === 'Tous' ? `Toutes les chaînes (${channels.length})` : `${selectedGroup} (${filteredChannels.length})`}
                  </Text>
                  <FlatList
                  data={filteredChannels}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={renderChannelItem}
                  contentContainerStyle={styles.listContent}
                  initialNumToRender={20}
                  ListEmptyComponent={
                      <View style={styles.emptyList}>
                          <Text style={styles.emptyListText}>Aucune chaîne trouvée.</Text>
                          <Text style={styles.emptyListSubText}>Vérifiez votre connexion ou l'URL configurée.</Text>
                      </View>
                  }
                  />
              </View>
          </View>
        )}

      </View>

      {/* Cast Modal */}
      <Modal
        visible={showCastModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCastModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.castModal}>
            <Text style={styles.castModalTitle}>📺 Caster vers TV</Text>
            
            <Text style={styles.castModalSubtitle}>
              {selectedChannel ? `Chaîne: ${selectedChannel.title}` : 'Aucune chaîne sélectionnée'}
            </Text>

            <View style={styles.castOptions}>
              <TouchableOpacity style={styles.castOption} onPress={openCastSettings}>
                <Text style={styles.castOptionIcon}>
                  {Platform.OS === 'ios' ? '📱' : '📡'}
                </Text>
                <Text style={styles.castOptionText}>
                  {Platform.OS === 'ios' ? 'AirPlay / Screen Mirroring' : 'Cast Screen / Miracast'}
                </Text>
                <Text style={styles.castOptionDesc}>
                  {Platform.OS === 'ios' 
                    ? 'Diffuser vers Apple TV ou TV compatible' 
                    : 'Diffuser vers Chromecast ou TV compatible'}
                </Text>
              </TouchableOpacity>

              <View style={styles.castDivider} />

              <View style={styles.castInfoBox}>
                <Text style={styles.castInfoTitle}>💡 Conseil</Text>
                <Text style={styles.castInfoText}>
                  {Platform.OS === 'ios'
                    ? 'Ouvrez le Centre de contrôle et appuyez sur "Recopie de l\'écran" pour diffuser.'
                    : 'Assurez-vous que votre téléphone et votre TV sont sur le même réseau WiFi.'}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.castCloseButton} 
              onPress={() => setShowCastModal(false)}
            >
              <Text style={styles.castCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Dark Background
    height: Platform.OS === 'web' ? '100vh' : '100%', // Force full height on Web
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerCastButton: {
    backgroundColor: '#10B981',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerStopButton: {
    backgroundColor: '#DC2626',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  videoSection: {
    // Web: Flex 0.85 (85% width). Mobile: Flex 0
    flex: Platform.OS === 'web' ? 0.85 : 0, 
    backgroundColor: '#000',
    justifyContent: 'center',
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightColor: '#333',
  },
  // Landscape styles
  contentWrapperLandscape: {
    flexDirection: 'row',
  },
  videoSectionLandscape: {
    flex: 0.65,
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  videoContainer: {
    width: '100%',
    height: Platform.OS === 'web' ? '100%' : 250, 
    flex: 1, // Ensure it takes available space in section
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', 
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightColor: '#333',
  },
  video: {
    width: '100%',
    height: '100%',
    position: Platform.OS === 'web' ? 'absolute' : 'relative',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  nowPlaying: {
    padding: 10,
    backgroundColor: '#000',
  },
  nowPlayingTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  nowPlayingGroup: {
    color: '#AAA',
    fontSize: 12,
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    color: '#4B5563', // Darker gray for dark mode
    fontSize: 16,
  },
  
  // List Section
  listSection: {
    // Web: Flex 0.15 (15% width). Mobile: Flex 1
    flex: Platform.OS === 'web' ? 0.15 : 1, 
    width: '100%', // Reset fixed width
    height: Platform.OS === 'web' ? '100%' : 'auto',
    backgroundColor: '#111111', // Dark List Background
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderLeftColor: '#333',
  },
  listSectionLandscape: {
    flex: 0.35,
    borderLeftWidth: 1,
    borderLeftColor: '#333',
  },
  categoriesContainer: {
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    maxHeight: 150,
  },
  categoryList: {
    padding: 8,
  },
  categoryListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#1F1F1F',
  },
  categoryListItemSelected: {
    backgroundColor: '#10B981',
  },
  categoryListText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  categoryListTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  categoryCheckmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoriesContent: {
    padding: 10,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#222',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedCategoryItem: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  categoryText: {
    color: '#D1D5DB', // Light Gray Text
    fontWeight: '600',
    fontSize: 13,
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },

  listContainer: {
    flex: 1,
    marginTop: 0,
  },
  listTitle: {
    color: '#FFFFFF', 
    fontSize: 14,
    fontWeight: 'bold',
    padding: 12,
    backgroundColor: '#111111', 
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  listContent: {
    padding: 10,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937', // Dark Gray Item
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  selectedChannel: {
    backgroundColor: '#064E3B', // Dark Green
    borderColor: '#10B981',
    borderWidth: 1,
  },
  channelIcon: {
    fontSize: 24,
  },
  channelLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#2D3748',
  },
  channelLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#2D3748',
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF', // White Text
  },
  channelGroup: {
    fontSize: 12,
    color: '#9CA3AF', 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000', // Black Loading Screen
  },
  loadingText: {
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 16,
  },
  emptyList: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  
  // Mobile fullscreen styles
  videoSectionFullscreen: {
    flex: 1,
  },
  videoContainerFullscreen: {
    height: '100%',
    flex: 1,
  },
  
  // Toggle button (show list when minimized)
  toggleButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Minimize button (hide list)
  minimizeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#059669',
  },
  minimizeButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Now Playing Container with Cast button
  nowPlayingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    paddingRight: 10,
  },
  
  // Cast Button
  castButton: {
    backgroundColor: '#10B981',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Cast Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  castModal: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  castModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  castModalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  castOptions: {
    marginBottom: 20,
  },
  castOption: {
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  castOptionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  castOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  castOptionDesc: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  castDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 12,
  },
  castInfoBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  castInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 6,
  },
  castInfoText: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  castCloseButton: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  castCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
