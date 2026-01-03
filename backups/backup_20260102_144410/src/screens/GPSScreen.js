import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, Platform, TextInput, Linking, Modal, ScrollView } from 'react-native';
import { Save, MapPin, Navigation, Route, X, Map, Satellite, Globe2, User, Trash2, ChevronDown, ChevronUp, Compass, Layers, BookmarkPlus, Crosshair, Navigation2, LocateFixed, Play, Square, ArrowRight, Clock, Ruler, Car, Footprints, Bike } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

export default function GPSScreen() {
  const { token, user } = useAuth();
  const [location, setLocation] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListVisible, setIsListVisible] = useState(true);
  const [mapType, setMapType] = useState('standard');
  
  // Route state
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDestination, setRouteDestination] = useState(null);
  const [isRouteMode, setIsRouteMode] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  
  // Navigation Modal & Mode
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [departureText, setDepartureText] = useState('Ma position actuelle');
  const [destinationText, setDestinationText] = useState('');
  const [departureCoords, setDepartureCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeSteps, setRouteSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [transportMode, setTransportMode] = useState('driving'); // 'driving', 'walking', 'cycling'
  const locationSubscription = useRef(null);
  
  // Dynamic imports for maps
  const [MapView, setMapView] = useState(null);
  const [Marker, setMarker] = useState(null);
  const [Polyline, setPolyline] = useState(null);
  const [MapContainer, setMapContainer] = useState(null);
  const [TileLayer, setTileLayer] = useState(null);
  const [LeafletMarker, setLeafletMarker] = useState(null);
  const [LeafletPolyline, setLeafletPolyline] = useState(null);
  const [MapRecenter, setMapRecenter] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Mobile: react-native-maps
      import('react-native-maps').then((maps) => {
        setMapView(() => maps.default);
        setMarker(() => maps.Marker);
        setPolyline(() => maps.Polyline);
      });
    } else {
      // Web: react-leaflet
      import('react-leaflet').then((leaflet) => {
        setMapContainer(() => leaflet.MapContainer);
        setTileLayer(() => leaflet.TileLayer);
        setLeafletMarker(() => leaflet.Marker);
        setLeafletPolyline(() => leaflet.Polyline);
        
        // Component to recenter map
        const Recenter = ({ lat, lng }) => {
          const map = leaflet.useMap();
          useEffect(() => {
            map.setView([lat, lng], 13);
          }, [lat, lng]);
          return null;
        };
        setMapRecenter(() => Recenter);
      });
      
      // Load Leaflet CSS
      require('../styles/leaflet.css');
    }
    
    getCurrentLocation();
    if (token) {
      loadSavedLocations();
    }
  }, [token]);

  // Autocomplete with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        fetchSuggestions(searchQuery);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSuggestions = async (query) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MyLifeApp/1.0',
          },
        }
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    
    setSelectedMarker({ latitude: lat, longitude: lon });
    setLocation({ latitude: lat, longitude: lon });
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      setSelectedMarker(currentLocation.coords);
    } catch (error) {
      setErrorMsg('GPS Error');
      const defaultLocation = { latitude: 48.8566, longitude: 2.3522 };
      setLocation(defaultLocation);
      setSelectedMarker(defaultLocation);
    }
  };

  const searchAddress = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }

    try {
      const geocode = await Location.geocodeAsync(searchQuery);
      
      if (geocode && geocode.length > 0) {
        const result = geocode[0];
        setSelectedMarker({
          latitude: result.latitude,
          longitude: result.longitude,
        });
        setLocation({
          latitude: result.latitude,
          longitude: result.longitude,
        });
        Alert.alert('✅', `Address found: ${searchQuery}`);
      } else {
        Alert.alert('❌', 'Address not found');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to search address');
    }
  };

  // Fetch route from OSRM and display on map (In-app routing)
  const fetchRouteAndDisplay = async (destination) => {
    if (!location) {
      Alert.alert('Erreur', 'Position actuelle non disponible');
      return;
    }

    const startLat = location.latitude;
    const startLng = location.longitude;
    const destLat = destination.latitude;
    const destLng = destination.longitude;

    try {
      // Use OSRM public API for routing
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`
      );
      
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0]
        }));
        
        // Set route coordinates for polyline
        setRouteCoordinates(coordinates);
        setRouteDestination(destination);
        setIsRouteMode(true);
        
        // Calculate distance and duration
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);
        
        setRouteInfo({
          distance: distanceKm,
          duration: durationMin
        });
        
        Alert.alert(
          '🗺️ Itinéraire calculé',
          `📏 Distance: ${distanceKm} km\n⏱️ Durée: ${durationMin} min`,
          [
            { text: 'OK', style: 'default' },
            { 
              text: '🧭 GPS Navigation', 
              onPress: () => openExternalNavigation(destination)
            }
          ]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de calculer l\'itinéraire');
      }
    } catch (error) {
      console.error('Route error:', error);
      Alert.alert('Erreur', 'Erreur lors du calcul de l\'itinéraire');
    }
  };

  // Clear route from map
  const clearRoute = () => {
    setRouteCoordinates([]);
    setRouteDestination(null);
    setIsRouteMode(false);
    setRouteInfo(null);
  };

  // Open external navigation app (fallback)
  const openExternalNavigation = async (destination) => {
    const startLat = location.latitude;
    const startLng = location.longitude;
    const destLat = destination.latitude;
    const destLng = destination.longitude;

    let url;
    if (Platform.OS === 'ios') {
      url = `maps://?saddr=${startLat},${startLng}&daddr=${destLat},${destLng}&dirflg=d`;
    } else {
      url = `google.navigation:q=${destLat},${destLng}&mode=d`;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destLat},${destLng}&travelmode=driving`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la navigation');
    }
  };

  // Open route planning modal
  const openRouteModal = () => {
    setDepartureCoords(location);
    setDepartureText('Ma position actuelle');
    setDestinationText('');
    setDestinationCoords(null);
    setShowRouteModal(true);
  };

  // Search and geocode destination
  const searchDestinationAddress = async (query) => {
    if (query.length < 3) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'User-Agent': 'MyLifeApp/1.0' } }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setDestinationCoords({
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        });
        setDestinationText(data[0].display_name.substring(0, 50) + '...');
      }
    } catch (error) {
      console.error('Geocode error:', error);
    }
  };

  // Plan route with departure and destination
  const planRoute = async () => {
    if (!departureCoords || !destinationCoords) {
      Alert.alert('Erreur', 'Veuillez saisir le départ et la destination');
      return;
    }

    try {
      // OSRM modes: driving, walking, cycling (bike = cycling for OSRM)
      const osrmMode = transportMode === 'cycling' ? 'bike' : transportMode;
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/${osrmMode}/${departureCoords.longitude},${departureCoords.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=geojson&steps=true`
      );
      
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0]
        }));
        
        // Extract turn-by-turn steps
        const steps = route.legs[0].steps.map(step => ({
          instruction: step.maneuver.instruction || getManeuverInstruction(step.maneuver),
          distance: step.distance,
          duration: step.duration,
          location: { latitude: step.maneuver.location[1], longitude: step.maneuver.location[0] }
        }));
        
        setRouteCoordinates(coordinates);
        setRouteDestination(destinationCoords);
        setRouteSteps(steps);
        setIsRouteMode(true);
        
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);
        
        setRouteInfo({
          distance: distanceKm,
          duration: durationMin,
          steps: steps.length
        });
        
        setShowRouteModal(false);
      } else {
        Alert.alert('Erreur', 'Impossible de calculer l\'itinéraire');
      }
    } catch (error) {
      console.error('Route error:', error);
      Alert.alert('Erreur', 'Erreur de connexion');
    }
  };

  // Get maneuver instruction
  const getManeuverInstruction = (maneuver) => {
    const types = {
      'turn': maneuver.modifier === 'left' ? '↰ Tournez à gauche' : '↱ Tournez à droite',
      'straight': '↑ Continuez tout droit',
      'arrive': '🏁 Vous êtes arrivé',
      'depart': '🚗 Départ',
      'roundabout': '🔄 Rond-point',
      'merge': '⤵️ Insertion'
    };
    return types[maneuver.type] || `→ ${maneuver.type}`;
  };

  // Start real-time navigation
  const startNavigation = async () => {
    if (routeSteps.length === 0) return;
    
    setIsNavigating(true);
    setCurrentStepIndex(0);
    
    // Start watching position
    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 10 },
      (newLocation) => {
        setLocation({
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude
        });
        
        // Check if near next step
        if (routeSteps[currentStepIndex]) {
          const stepLoc = routeSteps[currentStepIndex].location;
          const dist = getDistance(
            newLocation.coords.latitude, newLocation.coords.longitude,
            stepLoc.latitude, stepLoc.longitude
          );
          
          if (dist < 30 && currentStepIndex < routeSteps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
          }
        }
      }
    );
  };

  // Stop navigation
  const stopNavigation = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    setIsNavigating(false);
    setCurrentStepIndex(0);
  };

  // Calculate distance between two points
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const loadSavedLocations = async () => {
    if (!token) return;

    try {
      const response = await fetch(API_ENDPOINTS.LOCATIONS, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedLocations(data);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveCurrentLocation = async () => {
    if (!selectedMarker) {
      Alert.alert('Error', 'No location selected');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: selectedMarker.latitude,
        longitude: selectedMarker.longitude,
      });

      let detailedAddress = `${selectedMarker.latitude.toFixed(4)}, ${selectedMarker.longitude.toFixed(4)}`;
      let locationData = {
        latitude: selectedMarker.latitude,
        longitude: selectedMarker.longitude,
        address: detailedAddress,
        street: 'N/A',
        city: 'N/A',
        postalCode: 'N/A',
        region: 'N/A',
        country: 'N/A',
      };
      
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const addressParts = [
          place.name,
          place.street,
          place.district,
          place.subregion,
          place.city,
          place.postalCode,
          place.region,
          place.country,
        ].filter((item, index, self) => item && self.indexOf(item) === index);
        
        if (addressParts.length > 0) {
           detailedAddress = addressParts.join(', ');
        }
        
        locationData = {
            ...locationData,
            address: detailedAddress,
            street: place.street || 'N/A',
            city: place.city || 'N/A',
            postalCode: place.postalCode || 'N/A',
            region: place.region || 'N/A',
            country: place.country || 'N/A',
        };
      }

      const response = await fetch(API_ENDPOINTS.LOCATIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        throw new Error('API Error');
      }

      const savedLocation = await response.json();
      setSavedLocations([savedLocation, ...savedLocations]);
      Alert.alert('✅ Success', `Location saved\n\n📍 ${detailedAddress}`);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Unable to save location');
    }
  };

  const deleteLocation = async (id) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.LOCATIONS}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSavedLocations((prev) => prev.filter(loc => loc.id !== id));
      } else {
        Alert.alert('Error', 'Unable to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Network error');
    }
  };

  const goToLocation = (loc) => {
    setSelectedMarker({ latitude: loc.latitude, longitude: loc.longitude });
    setLocation({ latitude: loc.latitude, longitude: loc.longitude });
    setSearchQuery(loc.address);
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🌍</Text>
        <Text style={styles.loadingText}>Loading GPS...</Text>
      </View>
    );
  }

  // Web version with Leaflet
  if (Platform.OS === 'web' && MapContainer && TileLayer && LeafletMarker) {
    return (
      <View style={styles.container}>
        <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
          <MapContainer
            center={[location.latitude, location.longitude]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            onClick={(e) => {
              setSelectedMarker({
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
              });
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {MapRecenter && <MapRecenter lat={location.latitude} lng={location.longitude} />}
            
            <LeafletMarker position={[location.latitude, location.longitude]}>
              <div>📍 My position</div>
            </LeafletMarker>

            {selectedMarker && (
              <LeafletMarker position={[selectedMarker.latitude, selectedMarker.longitude]}>
                <div style={{backgroundColor: 'white', padding: '5px', borderRadius: '4px', border: '1px solid #ccc'}}>
                    🎯 {searchQuery || "Selected"}
                </div>
              </LeafletMarker>
            )}

            {savedLocations.map((loc) => (
              <LeafletMarker key={loc.id} position={[loc.latitude, loc.longitude]}>
                <div>✅ {loc.city || 'Saved'}</div>
              </LeafletMarker>
            ))}
          </MapContainer>
        </div>

        {/* Search bar */}
        <View style={styles.searchOverlay}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search address..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchAddress}
          />
          <TouchableOpacity style={styles.searchButton} onPress={searchAddress}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Autocomplete suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(item)}
                >
                  <Text style={styles.suggestionIcon}>📍</Text>
                  <View style={{flex: 1}}>
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Info overlay */}
        <View style={styles.infoOverlayWeb}>
          <Text style={styles.infoTitle}>📍 GPS MyLifeApp</Text>
          {selectedMarker && (
            <View style={styles.coords}>
              <Text style={styles.coordsText}>Lat: {selectedMarker.latitude.toFixed(6)}</Text>
              <Text style={styles.coordsText}>Long: {selectedMarker.longitude.toFixed(6)}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.saveButtonIcon} onPress={saveCurrentLocation}>
          <Save color="#FFFFFF" size={26} strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.currentLocationButtonWeb} onPress={getCurrentLocation}>
          <Navigation color="#10B981" size={22} strokeWidth={2} />
        </TouchableOpacity>

        {/* Bottom sheet toggleable */}
        <View style={[styles.bottomSheetWeb, !isListVisible && { maxHeight: 60 }]}>
          <TouchableOpacity 
            onPress={() => setIsListVisible(!isListVisible)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isListVisible ? 12 : 0 }}
          >
              <Text style={styles.sheetTitle}>📍 Endroits visités ({savedLocations.length})</Text>
              <Text style={{ fontSize: 20 }}>{isListVisible ? '🔽' : '🔼'}</Text>
          </TouchableOpacity>
          
          {isListVisible && (
          <FlatList
            data={savedLocations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.locationCardWeb}>
                <TouchableOpacity onPress={() => goToLocation(item)} style={{flex: 1}}>
                  <Text style={styles.locationDate}>
                    📅 {new Date(item.timestamp).toLocaleDateString('fr-FR')} - {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.locationAddress}>📍 {item.address}</Text>
                  {item.city !== 'N/A' && (
                    <View style={styles.detailsBox}>
                      <Text style={styles.detailItem}>🏙️ {item.city}</Text>
                      {item.postalCode !== 'N/A' && <Text style={styles.detailItem}>📮 {item.postalCode}</Text>}
                      {item.country !== 'N/A' && <Text style={styles.detailItem}>🌍 {item.country}</Text>}
                    </View>
                  )}
                  <Text style={styles.locationCoords}>
                    🗺️ {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteLocation(item.id)}>
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>No saved locations</Text>
            )}
          />
          )}
        </View>
      </View>
    );
  }

  // Mobile version with react-native-maps
  if (!MapView || !Marker) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🗺️</Text>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapType={mapType}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        region={selectedMarker ? {
          latitude: selectedMarker.latitude,
          longitude: selectedMarker.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
        onPress={(e) => setSelectedMarker(e.nativeEvent.coordinate)}
      >
        <Marker coordinate={location} title="My position" pinColor="blue" />
        {selectedMarker && (
            <Marker 
                coordinate={selectedMarker} 
                title={searchQuery || "Selected address"} 
                description="Click Save to save"
                pinColor="red" 
            />
        )}
        {savedLocations.map((loc) => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={new Date(loc.timestamp).toLocaleDateString()}
            pinColor="green"
          />
        ))}
        
        {/* Route Polyline */}
        {Polyline && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#3B82F6"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Search bar */}
      <View style={styles.searchOverlay}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search address..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchAddress}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchAddress}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => selectSuggestion(item)}
              >
                <Text style={styles.suggestionIcon}>📍</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Info overlay */}
      <View style={styles.infoOverlay}>
        <Text style={styles.infoTitle}>📍 GPS MyLifeApp</Text>
        {selectedMarker && (
          <View style={styles.coords}>
            <Text style={styles.coordsText}>Lat: {selectedMarker.latitude.toFixed(6)}</Text>
            <Text style={styles.coordsText}>Long: {selectedMarker.longitude.toFixed(6)}</Text>
          </View>
        )}
      </View>

      {/* Route Info Overlay */}
      {isRouteMode && routeInfo && (
        <View style={styles.routeInfoOverlay}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Navigation2 color="#3B82F6" size={16} strokeWidth={2} style={{ marginRight: 6 }} />
            <Text style={styles.routeInfoTitle}>Itinéraire</Text>
          </View>
          <Text style={styles.routeInfoText}>📏 {routeInfo.distance} km</Text>
          <Text style={styles.routeInfoText}>⏱️ {routeInfo.duration} min</Text>
          <TouchableOpacity 
            style={styles.routeNavButton}
            onPress={() => openExternalNavigation(routeDestination)}
          >
            <Text style={styles.routeNavButtonText}>🧭 Navigation GPS</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.saveButtonIcon} onPress={saveCurrentLocation}>
        <BookmarkPlus color="#FFFFFF" size={24} strokeWidth={2} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
        <Crosshair color="#10B981" size={22} strokeWidth={2} />
      </TouchableOpacity>

      {/* Route Planning Button */}
      <TouchableOpacity 
        style={[styles.routeButton, { bottom: 280 }]} 
        onPress={openRouteModal}
      >
        <Route color="#FFFFFF" size={22} strokeWidth={2} />
      </TouchableOpacity>

      {/* Quick Route Button - only visible when marker is selected */}
      {selectedMarker && !isRouteMode && (
        <TouchableOpacity 
          style={[styles.routeButton, { bottom: 340 }]} 
          onPress={() => fetchRouteAndDisplay(selectedMarker)}
        >
          <Navigation2 color="#FFFFFF" size={22} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Navigation Controls - visible when route is active */}
      {isRouteMode && !isNavigating && (
        <TouchableOpacity 
          style={[styles.routeButton, { backgroundColor: '#10B981' }]} 
          onPress={startNavigation}
        >
          <Play color="#FFFFFF" size={22} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {isNavigating && (
        <TouchableOpacity 
          style={[styles.routeButton, { backgroundColor: '#EF4444' }]} 
          onPress={stopNavigation}
        >
          <Square color="#FFFFFF" size={22} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Clear Route Button */}
      {isRouteMode && !isNavigating && (
        <TouchableOpacity 
          style={[styles.routeButton, { backgroundColor: '#EF4444', bottom: 340 }]} 
          onPress={clearRoute}
        >
          <X color="#FFFFFF" size={22} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Satellite Toggle Button */}
      <TouchableOpacity 
        style={styles.satelliteButton}
        onPress={() => {
          const types = ['standard', 'satellite', 'hybrid'];
          const currentIndex = types.indexOf(mapType);
          const nextIndex = (currentIndex + 1) % types.length;
          setMapType(types[nextIndex]);
        }}
      >
        {mapType === 'standard' ? <Map color="#10B981" size={20} strokeWidth={2} /> : mapType === 'satellite' ? <Satellite color="#10B981" size={20} strokeWidth={2} /> : <Layers color="#10B981" size={20} strokeWidth={2} />}
      </TouchableOpacity>

      <View style={[styles.bottomSheet, !isListVisible && { height: 'auto', paddingBottom: 30 }]}>
        <TouchableOpacity 
            onPress={() => setIsListVisible(!isListVisible)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isListVisible ? 12 : 5 }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.sheetHandle, { marginBottom: 0, marginRight: 10 }]} />
                <MapPin color="#10B981" size={18} strokeWidth={2} style={{ marginRight: 6 }} />
                <Text style={styles.sheetTitle}>Endroits visités ({savedLocations.length})</Text>
            </View>
            {isListVisible ? <ChevronDown color="#6B7280" size={20} strokeWidth={2} /> : <ChevronUp color="#6B7280" size={20} strokeWidth={2} />}
        </TouchableOpacity>
        
        {isListVisible && (
        <FlatList
          data={savedLocations}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.locationCard}>
              <TouchableOpacity onPress={() => goToLocation(item)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}><User color="#6B7280" size={14} strokeWidth={2} style={{ marginRight: 4 }} /><Text style={styles.locationUser}>{user?.name || 'Utilisateur'}</Text></View>
                <Text style={styles.locationDate}>
                  {new Date(item.timestamp).toLocaleDateString('fr-FR')}
                </Text>
                <Text style={styles.locationTime}>
                  {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.locationCoords} numberOfLines={2}>{item.address}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteLocation(item.id)}>
                <Trash2 color="#EF4444" size={18} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>Cliquez sur la carte pour sauvegarder</Text>
          )}
        />
        )}
      </View>

      {/* Navigation Instruction Overlay */}
      {isNavigating && routeSteps[currentStepIndex] && (
        <View style={styles.navigationOverlay}>
          <View style={styles.navInstructionBox}>
            <Text style={styles.navStepNumber}>Étape {currentStepIndex + 1}/{routeSteps.length}</Text>
            <Text style={styles.navInstruction}>{routeSteps[currentStepIndex].instruction}</Text>
            <View style={styles.navDetails}>
              <View style={styles.navDetailItem}>
                <Ruler color="#6B7280" size={14} />
                <Text style={styles.navDetailText}>{(routeSteps[currentStepIndex].distance / 1000).toFixed(1)} km</Text>
              </View>
              <View style={styles.navDetailItem}>
                <Clock color="#6B7280" size={14} />
                <Text style={styles.navDetailText}>{Math.round(routeSteps[currentStepIndex].duration / 60)} min</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Route Planning Modal */}
      <Modal
        visible={showRouteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRouteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🗺️ Planifier un itinéraire</Text>
              <TouchableOpacity onPress={() => setShowRouteModal(false)}>
                <X color="#6B7280" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>📍 Départ</Text>
              <View style={styles.inputRow}>
                <MapPin color="#10B981" size={18} />
                <TextInput
                  style={styles.modalInput}
                  value={departureText}
                  onChangeText={(text) => {
                    setDepartureText(text);
                    if (text === 'Ma position actuelle') {
                      setDepartureCoords(location);
                    }
                  }}
                  placeholder="Ma position actuelle"
                />
              </View>

              <Text style={styles.inputLabel}>🎯 Destination</Text>
              <View style={styles.inputRow}>
                <Navigation2 color="#3B82F6" size={18} />
                <TextInput
                  style={styles.modalInput}
                  value={destinationText}
                  onChangeText={setDestinationText}
                  onBlur={() => searchDestinationAddress(destinationText)}
                  placeholder="Entrez l'adresse de destination"
                />
              </View>

              {destinationCoords && (
                <View style={styles.destinationPreview}>
                  <Text style={styles.destinationPreviewText}>✅ Destination trouvée</Text>
                </View>
              )}

              {/* Transport Mode Selector */}
              <Text style={styles.inputLabel}>🚗 Mode de transport</Text>
              <View style={styles.transportModeContainer}>
                <TouchableOpacity 
                  style={[styles.transportModeBtn, transportMode === 'driving' && styles.transportModeBtnActive]}
                  onPress={() => setTransportMode('driving')}
                >
                  <Car color={transportMode === 'driving' ? '#FFFFFF' : '#6B7280'} size={22} />
                  <Text style={[styles.transportModeText, transportMode === 'driving' && styles.transportModeTextActive]}>Voiture</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.transportModeBtn, transportMode === 'walking' && styles.transportModeBtnActive]}
                  onPress={() => setTransportMode('walking')}
                >
                  <Footprints color={transportMode === 'walking' ? '#FFFFFF' : '#6B7280'} size={22} />
                  <Text style={[styles.transportModeText, transportMode === 'walking' && styles.transportModeTextActive]}>À pied</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.transportModeBtn, transportMode === 'cycling' && styles.transportModeBtnActive]}
                  onPress={() => setTransportMode('cycling')}
                >
                  <Bike color={transportMode === 'cycling' ? '#FFFFFF' : '#6B7280'} size={22} />
                  <Text style={[styles.transportModeText, transportMode === 'cycling' && styles.transportModeTextActive]}>Moto/Vélo</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.planButton, !destinationCoords && styles.planButtonDisabled]}
                onPress={planRoute}
                disabled={!destinationCoords}
              >
                <Route color="#FFFFFF" size={20} />
                <Text style={styles.planButtonText}>Calculer l'itinéraire</Text>
              </TouchableOpacity>

              {/* Saved Locations Quick Select */}
              <Text style={styles.savedLocationsTitle}>📌 Destinations récentes</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.savedLocationsList}>
                {savedLocations.slice(0, 5).map((loc) => (
                  <TouchableOpacity 
                    key={loc.id}
                    style={styles.savedLocationChip}
                    onPress={() => {
                      setDestinationCoords({ latitude: loc.latitude, longitude: loc.longitude });
                      setDestinationText(loc.address?.substring(0, 30) + '...' || loc.city);
                    }}
                  >
                    <Text style={styles.savedLocationChipText}>{loc.city || 'Location'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
    backgroundColor: '#F9FAFB',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  searchOverlay: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 10,
    zIndex: 1000,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchButton: {
    backgroundColor: '#10B981',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 13,
    color: '#374151',
  },
  infoOverlay: {
    position: 'absolute',
    top: 90,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 800,
  },
  infoOverlayWeb: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: 280,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 800,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  coords: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  routeInfoOverlay: {
    position: 'absolute',
    top: 180,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 900,
  },
  routeInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  routeInfoText: {
    fontSize: 13,
    color: '#4B5563',
    marginVertical: 2,
  },
  routeNavButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  routeNavButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    paddingBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  modalInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 12,
    marginLeft: 10,
  },
  destinationPreview: {
    backgroundColor: '#D1FAE5',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  destinationPreviewText: {
    color: '#065F46',
    fontSize: 13,
  },
  planButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  planButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  planButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  savedLocationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 10,
  },
  savedLocationsList: {
    flexDirection: 'row',
  },
  savedLocationChip: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },
  savedLocationChipText: {
    color: '#4F46E5',
    fontSize: 13,
  },
  // Navigation Overlay Styles
  navigationOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  navInstructionBox: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
  },
  navStepNumber: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  navInstruction: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  navDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  navDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navDetailText: {
    fontSize: 13,
    color: '#D1D5DB',
  },
  saveButtonIcon: {
    position: 'absolute',
    bottom: 220,
    right: 20,
    zIndex: 3000,
    width: 50,
    height: 50,
    backgroundColor: '#10B981',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  saveIconText: {
    fontSize: 28,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 280,
    right: 20,
    backgroundColor: '#FFFFFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  routeButton: {
    position: 'absolute',
    bottom: 340,
    right: 20,
    backgroundColor: '#3B82F6',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  satelliteButton: {
    position: 'absolute',
    bottom: 400,
    right: 20,
    backgroundColor: '#FFFFFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  satelliteButtonText: {
    fontSize: 24,
  },
  routeInfoOverlay: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1005,
  },
  routeInfoContent: {
    flex: 1,
  },
  routeInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  routeInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  routeClearButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationButtonWeb: {
    position: 'absolute',
    bottom: 380,
    right: 20,
    backgroundColor: '#FFFFFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  currentLocationText: {
    fontSize: 24,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSheetWeb: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 90,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 2000,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  locationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationCardWeb: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationUser: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  locationDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  locationTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  locationAddress: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  detailsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  detailItem: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  deleteButtonText: {
    fontSize: 18,
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    padding: 16,
    textAlign: 'center',
  },
  
  // Transport Mode Selector
  transportModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  transportModeBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  transportModeBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  transportModeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  transportModeTextActive: {
    color: '#FFFFFF',
  },
});
