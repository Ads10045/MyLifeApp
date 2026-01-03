import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import ReactPlayer from 'react-player';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

// WEB SPECIFIC IMPLEMENTATION
export default function IPTVScreen() {
  const { token } = useAuth();
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('Tous');
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState(null);
  
  // ReactPlayer ref
  const playerRef = useRef(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [playerError, setPlayerError] = useState(null);

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
      console.log('Fetching IPTV URL from settings...');
      const settingsResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/settings/iptv_url`);
      const setting = await settingsResponse.json();
      
      if (!setting || !setting.value) {
        Alert.alert('Info', 'Aucune URL IPTV configurée');
        setLoading(false);
        return;
      }

      console.log('Fetching Playlist from:', setting.value);
      const playlistResponse = await fetch(setting.value);
      const playlistText = await playlistResponse.text();
      
      console.log('Playlist received, length:', playlistText.length);
      
      const parsedChannels = parseM3U(playlistText);
      console.log('Parsed channels:', parsedChannels.length);
      
      // Filter Keywords
      const keywords = ['MAROC', 'MOROCCO', 'BEIN', 'CAN', 'AFRICA'];
      const filteredList = parsedChannels.filter(c => {
        const text = (c.title + ' ' + c.group).toUpperCase();
        return keywords.some(k => text.includes(k));
      });

      console.log(`Filtered to ${filteredList.length} channels`);

      const uniqueGroups = ['Tous', ...new Set(filteredList.map(c => c.group))];

      setChannels(filteredList);
      setGroups(uniqueGroups);

      // Auto-play first channel
      if (filteredList.length > 0) {
        setSelectedChannel(filteredList[0]);
      }

    } catch (error) {
      console.error('IPTV Error:', error);
      Alert.alert('Erreur', 'Impossible de charger la liste IPTV: ' + error.message);
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
    console.log('🎬 Channel clicked:', channel.title, channel.url);
    setIsVideoLoading(true);
    setPlayerError(null);
    setSelectedChannel(channel);
  };

  const renderChannelItem = ({ item }) => (
    <div 
        onClick={() => playChannel(item)}
        style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: selectedChannel?.url === item.url ? '#10B981' : '#FFFFFF',
            padding: '14px 16px',
            marginBottom: '8px',
            marginLeft: '12px',
            marginRight: '12px',
            borderRadius: '12px',
            border: selectedChannel?.url === item.url ? '2px solid #059669' : '1px solid #E5E7EB',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: selectedChannel?.url === item.url ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
        onMouseEnter={(e) => {
            if (selectedChannel?.url !== item.url) {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(-1px)';
            }
        }}
        onMouseLeave={(e) => {
            if (selectedChannel?.url !== item.url) {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
            }
        }}
    >
        {/* Channel Logo */}
        {item.logo ? (
            <img 
                src={item.logo} 
                alt={item.title}
                style={{ 
                    width: '36px', 
                    height: '36px', 
                    marginRight: '12px', 
                    borderRadius: '8px',
                    objectFit: 'cover',
                    backgroundColor: '#F3F4F6',
                    border: '1px solid #E5E7EB'
                }}
                onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'inline';
                }}
            />
        ) : null}
        <span style={{ 
            fontSize: '24px', 
            marginRight: '12px', 
            display: item.logo ? 'none' : 'inline',
            filter: selectedChannel?.url === item.url ? 'none' : 'grayscale(0.3)'
        }}>📺</span>
        
        <div style={{ flex: 1 }}>
            <div style={{ 
                color: selectedChannel?.url === item.url ? '#FFFFFF' : '#1F2937', 
                fontWeight: '600', 
                fontSize: '13px',
                marginBottom: '2px'
            }}>{item.title}</div>
            <div style={{ 
                color: selectedChannel?.url === item.url ? 'rgba(255,255,255,0.8)' : '#9CA3AF', 
                fontSize: '10px',
                fontWeight: '500'
            }}>{item.group}</div>
        </div>
    </div>
  );

  return (
    <div style={styles.webContainer}>
        {/* Helper Style Tag for Web Video */}
        <style>
            {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                
                * {
                    font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    box-sizing: border-box;
                }

                video {
                    object-fit: contain !important;
                    width: 100% !important;
                    height: 100% !important;
                    max-height: 100vh !important;
                }
                
                /* Scrollbar Styling */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: #F3F4F6;
                }
                ::-webkit-scrollbar-thumb {
                    background: #D1D5DB;
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #9CA3AF;
                }
            `}
        </style>

        {/* Video Section (Left - 85%) */}
        <div style={styles.videoSection}>
            {selectedChannel ? (
                 <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                     {/* Loading Overlay */}
                     {isVideoLoading && (
                         <div style={styles.loadingOverlay}>
                             <ActivityIndicator size="large" color="#10B981" />
                             <div style={{ color: '#FFF', marginTop: 10, fontSize: 14 }}>Chargement de {selectedChannel.title}...</div>
                         </div>
                     )}
                     
                     {/* Error Overlay */}
                     {playerError && (
                         <div style={styles.errorOverlay}>
                             <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
                             <div style={{ color: '#EF4444', fontWeight: 'bold', marginBottom: 8 }}>Erreur de lecture</div>
                             <div style={{ color: '#AAA', fontSize: 12 }}>{playerError}</div>
                         </div>
                     )}

                     <ReactPlayer
                        key={selectedChannel.url}
                        ref={playerRef}
                        url={selectedChannel.url}
                        width='100%'
                        height='100%'
                        playing={true}
                        controls={true}
                        muted={false}
                        playsinline={true}
                        config={{
                            file: {
                                forceHLS: true,
                                hlsOptions: {
                                    enableWorker: true,
                                    lowLatencyMode: true,
                                },
                                attributes: {
                                    controlsList: 'nodownload',
                                    disablePictureInPicture: false,
                                    playsInline: true,
                                }
                            }
                        }}
                        onReady={() => {
                            console.log('✅ Player Ready:', selectedChannel.title);
                            setIsVideoLoading(false);
                        }}
                        onStart={() => {
                            console.log('▶️ Player Started:', selectedChannel.title);
                            setIsVideoLoading(false);
                        }}
                        onPlay={() => {
                            console.log('▶️ Playing:', selectedChannel.title);
                            setIsVideoLoading(false);
                        }}
                        onBuffer={() => {
                            console.log('⏳ Buffering...');
                            setIsVideoLoading(true);
                        }}
                        onBufferEnd={() => {
                            console.log('✅ Buffer ended');
                            setIsVideoLoading(false);
                        }}
                        onError={(e) => {
                            console.error('❌ ReactPlayer Error:', e);
                            setIsVideoLoading(false);
                            setPlayerError("Flux indisponible ou bloqué");
                        }}
                    />
                 </div>
            ) : (
                <div style={styles.placeholder}>
                     <ActivityIndicator size="large" color="#FFFFFF" />
                     <div style={{ color: '#FFFFFF', marginTop: 16, fontSize: 18, fontWeight: '500' }}>
                         Chargement du canal...
                     </div>
                </div>
            )}
        </div>



        {/* List Section (Right - 15%) */}
        <div style={styles.listSection}>
            <div style={styles.categoriesContainer}>
                 <select
                    style={styles.select}
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                >
                    {groups.map((group) => (
                        <option key={group} value={group}>{group}</option>
                    ))}
                </select>
            </div>
            
            <div style={styles.listContent}>
                <div style={styles.listTitle}>
                    {selectedGroup === 'Tous' ? `CHAÎNES (${channels.length})` : `${selectedGroup.toUpperCase()} (${filteredChannels.length})`}
                </div>
                
                <div style={{ overflowY: 'auto', flex: 1, padding: 10 }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                            <ActivityIndicator size="large" color="#10B981" />
                            <div style={{ color: '#6B7280', marginTop: 16, fontSize: 14, fontWeight: '500' }}>Chargement des chaînes...</div>
                        </div>
                    ) : filteredChannels.length > 0 ? (
                        filteredChannels.slice(0, 100).map((item, index) => (
                             <div key={index}>{renderChannelItem({ item })}</div>
                        ))
                    ) : (
                        <div style={{ padding: 20, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
                            Aucune chaîne disponible.
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}

const styles = {
  webContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
    color: '#1F2937',
  },
  videoSection: {
    flex: '0.80',
    backgroundColor: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRight: '1px solid #E5E7EB',
    height: '100vh',
    boxShadow: '4px 0 12px rgba(0,0,0,0.1)',
  },
  listSection: {
    flex: '0.20',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  categoriesContainer: {
    padding: '20px 16px',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    fontSize: '14px',
    fontWeight: '500',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  listContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  listTitle: {
    padding: '16px 20px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.8px',
    color: '#6B7280',
    textTransform: 'uppercase',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.92)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 11,
  },
};
