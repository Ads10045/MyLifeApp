import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Search, Zap, Tag, Star, Heart, X, ArrowRight, List, Filter, ChevronLeft, ChevronRight, Menu, ExternalLink, ShoppingBag } from 'lucide-react-native';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import ProductDetailScreen from './ProductDetailScreen';

const SupplierBadge = ({ supplier }) => {
  const getSupplierInfo = (name) => {
    switch (name?.toLowerCase()) {
      case 'amazon':
        return { color: '#FF9900', label: 'AMZ', textColor: '#000', icon: 'amazon' };
      case 'ebay':
        return { color: '#0064D2', label: 'EBAY', textColor: '#FFF', icon: 'ebay' };
      case 'aliexpress':
        return { color: '#FF4747', label: 'ALI', textColor: '#FFF', icon: 'aliexpress' };
      default:
        return { color: '#10B981', label: 'IA', textColor: '#FFF', icon: 'ia' };
    }
  };

  const info = getSupplierInfo(supplier);

  return (
    <View style={[styles.supplierBadge, { backgroundColor: info.color, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
      <ShoppingBag size={10} color={info.textColor} />
      <Text style={[styles.supplierBadgeText, { color: info.textColor }]}>{info.label}</Text>
    </View>
  );
};

export default function StoreScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  
  // Responsive: Right panel width depends on screen size.
  // Sidebar is fixed width (e.g., 25% or 250px).
  const sidebarWidth = width > 768 ? 250 : 80; // Collapsed on tablet/small, full on desktop
  const contentWidth = width - sidebarWidth;
  const numColumns = contentWidth > 1200 ? 4 : contentWidth > 900 ? 3 : 2;
  const itemWidth = `${Math.floor(100 / numColumns) - 2}%`;
  
  const [products, setProducts] = useState([]);
  // Pagination State
  const [pagination, setPagination] = useState({
      page: 1,
      limit: 20,
      totalPages: 1,
      total: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(['Tout']);
  const [selectedCategory, setSelectedCategory] = useState('Tout');
  const [suppliers, setSuppliers] = useState(['Tous']);
  const [selectedSupplier, setSelectedSupplier] = useState('Tous');
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [flashSales, setFlashSales] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
    fetchTrending();
  }, []);

  // Fetch when filters change
  useEffect(() => {
    fetchProducts(1, pagination.limit, true);
  }, [selectedCategory, selectedSupplier, searchQuery, pagination.limit]);

  const fetchProducts = async (page, limit, reset = false) => {
    try {
      setLoading(true);
      let url = `${API_ENDPOINTS.API_URL}/products?page=${page}&limit=${limit}`;
      
      if (selectedCategory !== 'Tout') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (selectedSupplier !== 'Tous' && selectedSupplier !== 'Tout') {
        url += `&supplier=${encodeURIComponent(selectedSupplier)}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.products) {
        setProducts(data.products);
        setPagination(prev => ({
            ...prev,
            page: data.page,
            totalPages: data.totalPages,
            total: data.total
        }));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
          fetchProducts(newPage, pagination.limit);
      }
  };

  const handleLimitChange = (newLimit) => {
      setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.API_URL}/products/meta/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.API_URL}/products/meta/suppliers`);
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.API_URL}/products/meta/trending`);
      const data = await response.json();
      setFlashSales(data);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  // Cart Logic (Same as before)
  const handleAddToCart = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
    Alert.alert('🛒 Ajouté', `${product.name} ajouté au panier`);
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCartItems(cartItems.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cartItems.length === 0) return Alert.alert('Panier vide', 'Ajoutez des produits pour continuer');
    Alert.alert('Succès', 'Commande simulée avec succès !');
    setCartItems([]);
    setShowCartModal(false);
  };

  // --- Render Components ---

  const ProductCard = ({ item }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => setSelectedProduct(item)}>
      {item.margin > 70 && (
        <View style={styles.dealBadge}>
          <Text style={styles.dealBadgeText}>-{Math.round(item.margin)}%</Text>
        </View>
      )}
      <View style={styles.imageContainer}>
        <SupplierBadge supplier={item.supplier} />
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="contain" />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        {/* Rating */}
        <View style={styles.ratingRow}>
          {[1,2,3,4,5].map((star) => (
            <Star 
              key={star} 
              size={12} 
              color="#FF9900" 
              fill={star <= (item.rating || 4) ? "#FF9900" : "transparent"} 
            />
          ))}
          <Text style={styles.ratingCount}>({Math.floor(Math.random() * 1000) + 50})</Text>
        </View>
        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceSymbol}>€</Text>
          <Text style={styles.priceMain}>{Math.floor(item.price)}</Text>
          <Text style={styles.priceCents}>,{((item.price % 1) * 100).toFixed(0).padStart(2, '0')}</Text>
        </View>
        {/* Prime Badge */}
        <View style={styles.primeBadge}>
          <Text style={styles.primeText}>Prime</Text>
          <Text style={styles.deliveryText}>Livraison GRATUITE</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSidebar = () => (
      <View style={[styles.sidebar, { width: sidebarWidth }]}>
          <View style={styles.sidebarHeader}>
              <Menu size={20} color="#1F2937" />
              <Text style={styles.sidebarTitle}>Rayons</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarList}>
              {categories.map((cat) => (
                  <TouchableOpacity 
                      key={cat} 
                      style={[styles.sidebarItem, selectedCategory === cat && styles.sidebarItemActive]}
                      onPress={() => setSelectedCategory(cat)}
                  >
                      <Text style={[styles.sidebarText, selectedCategory === cat && styles.sidebarTextActive]}>
                          {cat}
                      </Text>
                      {selectedCategory === cat && <ChevronRight size={16} color="#FFF" />}
                  </TouchableOpacity>
              ))}
          </ScrollView>
      </View>
  );

  const renderContentHeader = () => (
      <View>
        {/* Simple deals banner */}
        <View style={styles.dealsBanner}>
          <Text style={styles.dealsBannerText}>⚡ Offres du jour : Économisez jusqu'à 70% sur une sélection de produits</Text>
        </View>

        {/* Suppliers Filter */}
        <View style={styles.suppliersFilterCard}>
            <Text style={styles.filterLabel}>Filtrer par site :</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suppliersScroll}>
                {suppliers.map(sup => (
                    <TouchableOpacity 
                        key={sup} 
                        style={[styles.supplierFilterBtn, selectedSupplier === sup && styles.supplierFilterBtnActive]}
                        onPress={() => setSelectedSupplier(sup)}
                    >
                        <Text style={[styles.supplierFilterText, selectedSupplier === sup && styles.supplierFilterTextActive]}>{sup}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* Controls Bar */}
        <View style={styles.controlsBar}>
            <View style={styles.resultsInfo}>
                <Text style={styles.resultText}>{pagination.total} Produits</Text>
            </View>
            
            <View style={styles.limitContainer}>
                <Filter size={16} color="#6B7280" style={{ marginRight: 8 }} />
                <Text style={styles.label}>Afficher:</Text>
                {[10, 20, 50].map(lim => (
                    <TouchableOpacity 
                        key={lim} 
                        style={[styles.limitBtn, pagination.limit === lim && styles.limitBtnActive]}
                        onPress={() => handleLimitChange(lim)}
                    >
                        <Text style={[styles.limitText, pagination.limit === lim && styles.limitTextActive]}>{lim}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
      </View>
  );

  const renderFooter = () => (
      <View style={styles.paginationFooter}>
          <TouchableOpacity 
              style={[styles.pageBtn, pagination.page === 1 && styles.pageBtnDisabled]}
              disabled={pagination.page === 1}
              onPress={() => handlePageChange(pagination.page - 1)}
          >
              <ChevronLeft size={20} color={pagination.page === 1 ? "#9CA3AF" : "#374151"} />
          </TouchableOpacity>
          
          <View style={styles.pageInfoContainer}>
             <Text style={styles.pageInfoText}>Page {pagination.page} / {pagination.totalPages}</Text>
          </View>

          <TouchableOpacity 
              style={[styles.pageBtn, pagination.page >= pagination.totalPages && styles.pageBtnDisabled]}
              disabled={pagination.page >= pagination.totalPages}
              onPress={() => handlePageChange(pagination.page + 1)}
          >
               <ChevronRight size={20} color={pagination.page >= pagination.totalPages ? "#9CA3AF" : "#374151"} />
          </TouchableOpacity>
      </View>
  );

  // If detail view
  if (selectedProduct) {
    return <ProductDetailScreen product={selectedProduct} onBack={() => setSelectedProduct(null)} onAddToCart={(p, q) => handleAddToCart(p)} />;
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.storeSearchHeader}>
        <View style={styles.searchContainer}>
            <Search color="#9CA3AF" size={20} />
            <TextInput 
                style={styles.searchInput}
                placeholder="Rechercher un produit..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </View>
      </View>

      <View style={styles.mainLayout}>
          {/* Left Sidebar */}
          {width > 600 && renderSidebar()} 
          
          {/* Right Content */}
          <View style={styles.contentArea}>
              {/* Category list for mobile if sidebar hidden */}
              {width <= 600 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mobileCategories}>
                      {categories.map(cat => (
                          <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)} style={[styles.mobileCatItem, selectedCategory === cat && styles.mobileCatItemActive]}>
                              <Text style={[styles.mobileCatText, selectedCategory === cat && styles.mobileCatTextActive]}>{cat}</Text>
                          </TouchableOpacity>
                      ))}
                  </ScrollView>
              )}

              {loading ? (
                  <ActivityIndicator size="large" color="#F97316" style={{ marginTop: 50 }} />
              ) : (
                  <FlatList
                      data={products}
                      renderItem={({ item }) => (
                          <View style={[styles.gridItem, { width: itemWidth }]}>
                              <ProductCard item={item} />
                          </View>
                      )}
                      keyExtractor={(item) => item.id}
                      numColumns={numColumns}
                      key={numColumns}
                      contentContainerStyle={styles.gridContent}
                      ListHeaderComponent={renderContentHeader}
                      ListFooterComponent={renderFooter}
                      showsVerticalScrollIndicator={false}
                      columnWrapperStyle={{ justifyContent: 'space-between' }}
                  />
              )}
          </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
    // Amazon Colors: #131921 (dark), #232F3E (lighter dark), #FF9900 (orange), #FEBD69 (light orange)
    container: { flex: 1, backgroundColor: '#EAEDED' },
    storeSearchHeader: { backgroundColor: '#131921', padding: 12 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerLogo: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 2, borderColor: '#FF9900' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#111827' },
    
    mainLayout: { flex: 1, flexDirection: 'row' },
    
    // Sidebar
    sidebar: { backgroundColor: '#FFFFFF', padding: 16, borderRightWidth: 1, borderRightColor: '#E5E7EB' },
    sidebarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    sidebarTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginLeft: 10 },
    sidebarList: { paddingBottom: 20 },
    sidebarItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8, backgroundColor: '#F9FAFB' },
    sidebarItemActive: { backgroundColor: '#F97316', shadowColor: '#F97316', shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
    sidebarText: { color: '#4B5563', fontSize: 14, fontWeight: '500' },
    sidebarTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
    
    // Content Area
    contentArea: { flex: 1, backgroundColor: '#F3F4F6' },
    mobileCategories: { flexDirection: 'row', padding: 10, backgroundColor: '#FFF' },
    mobileCatItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: '#F3F4F6' },
    mobileCatItemActive: { backgroundColor: '#F97316' },
    mobileCatText: { color: '#374151' },
    mobileCatTextActive: { color: '#FFF' },
    
    gridContent: { padding: 16 },
    
    // Pagination Controls
    controlsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: '#FFF', padding: 10, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    limitContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 4, borderRadius: 20 },
    label: { fontSize: 12, color: '#374151', marginRight: 5, marginLeft: 5 },
    limitBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginLeft: 2 },
    limitBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    limitText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
    limitTextActive: { color: '#F97316', fontWeight: 'bold' },
    resultText: { color: '#6B7280', fontSize: 13, fontWeight: '500' },

    // Footer
    paginationFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 30, gap: 20 },
    pageBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, borderWidth: 1, borderColor: '#F3F4F6' },
    pageBtnDisabled: { opacity: 0.5, backgroundColor: '#F9FAFB' },
    pageInfoContainer: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' },
    pageInfoText: { color: '#374151', fontWeight: '600', fontSize: 14 },

    // Amazon-Style Product Card
    gridItem: { marginBottom: 12 },
    productCard: { backgroundColor: '#FFFFFF', borderRadius: 4, padding: 12, borderWidth: 1, borderColor: '#DDD' },
    imageContainer: { height: 150, backgroundColor: '#FFFFFF', marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
    productImage: { width: '100%', height: '100%' },
    productInfo: { paddingTop: 4 },
    productName: { fontSize: 14, color: '#0F1111', marginBottom: 6, lineHeight: 20 },
    
    // Rating
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 2 },
    ratingCount: { fontSize: 12, color: '#007185', marginLeft: 4 },
    
    // Price Amazon Style
    priceContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
    priceSymbol: { fontSize: 12, color: '#0F1111', marginTop: 2 },
    priceMain: { fontSize: 24, fontWeight: 'bold', color: '#0F1111' },
    priceCents: { fontSize: 12, color: '#0F1111', marginTop: 2 },
    
    // Prime Badge
    primeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    primeText: { fontSize: 12, fontWeight: 'bold', color: '#232F3E', backgroundColor: '#F3A847', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
    deliveryText: { fontSize: 11, color: '#565959' },
    
    // Deal Badge
    dealBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#CC0C39', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2, zIndex: 10 },
    dealBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
    
    supplierBadge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 11, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 },
    supplierBadgeText: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
    
    // Old styles kept for compatibility
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    price: { fontSize: 16, fontWeight: 'bold', color: '#B12704' },
    flashBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
    flashBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },

    // Flash Banner (old - kept for compatibility)
    flashSaleBanner: { borderRadius: 16, padding: 16, marginBottom: 20 },
    flashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    flashTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    flashSubtitle: { color: '#FECACA', fontSize: 12 },
    timerContainer: { backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    timerText: { color: '#DC2626', fontWeight: 'bold', fontSize: 12 },
    flashCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 8, marginRight: 10, width: 100 },
    flashImage: { width: '100%', height: 80, borderRadius: 8, marginBottom: 6 },
    flashPrice: { fontSize: 14, fontWeight: 'bold', color: '#DC2626' },
    
    // Simple Deals Banner (Amazon style)
    dealsBanner: { backgroundColor: '#232F3E', paddingVertical: 10, paddingHorizontal: 16, marginBottom: 10 },
    dealsBannerText: { color: '#FFFFFF', fontSize: 13, textAlign: 'center' },

    // Cart Modal (Simplified for brevity)
    cartModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    cartModal: { backgroundColor: '#FFF', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
    cartModalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    cartModalTitle: { fontSize: 18, fontWeight: 'bold' },
    cartItemsList: { marginBottom: 20 },
    cartItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    checkoutButton: { backgroundColor: '#F97316', padding: 15, borderRadius: 10, alignItems: 'center' },
    checkoutButtonText: { color: '#FFF', fontWeight: 'bold' },

    // Suppliers Filter
    suppliersFilterCard: { backgroundColor: '#FFF', paddingVertical: 12, marginBottom: 10, borderRadius: 4, borderBottomWidth: 1, borderBottomColor: '#DDD' },
    filterLabel: { fontSize: 13, fontWeight: 'bold', color: '#0F1111', marginLeft: 16, marginBottom: 8 },
    suppliersScroll: { paddingHorizontal: 16 },
    supplierFilterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB', marginRight: 10 },
    supplierFilterBtnActive: { backgroundColor: '#232F3E', borderColor: '#232F3E' },
    supplierFilterText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
    supplierFilterTextActive: { color: '#FFF' },
});
