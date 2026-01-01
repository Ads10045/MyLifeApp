import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { Search, ShoppingCart, Zap, Tag, Star, Heart, Trash2, CreditCard, X } from 'lucide-react-native';

const ALL_PRODUCTS = [
    // Digital Products
    { id: '1', name: 'Guide Meal Prep (7j)', category: 'Digital', price: 9.90, originalPrice: 14.90, rating: 4.9, reviews: 234, image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&h=200&fit=crop', flash: true },
    { id: '2', name: 'Programme Détox 30j', category: 'Digital', price: 19.90, originalPrice: 29.90, rating: 4.8, reviews: 156, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop', flash: false },
    { id: '3', name: 'Recettes Smoothies', category: 'Digital', price: 7.90, originalPrice: 12.90, rating: 4.7, reviews: 89, image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=200&h=200&fit=crop', flash: true },
    
    // Print on Demand
    { id: '4', name: 'Tablier MyLifeApp Pro', category: 'Vêtements', price: 24.50, originalPrice: 34.50, rating: 4.7, reviews: 67, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop', flash: false },
    { id: '5', name: 'T-Shirt Bio "Healthy"', category: 'Vêtements', price: 19.90, originalPrice: 29.90, rating: 4.6, reviews: 123, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop', flash: true },
    { id: '6', name: 'Mug Motivant', category: 'Vêtements', price: 12.90, originalPrice: 18.90, rating: 4.5, reviews: 45, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=200&h=200&fit=crop', flash: false },
    
    // Dropshipping
    { id: '7', name: 'Hachoir Tech-V1', category: 'Cuisine', price: 59.00, originalPrice: 89.00, rating: 4.8, reviews: 312, image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=200&h=200&fit=crop', flash: true },
    { id: '8', name: 'Balance Connectée', category: 'Cuisine', price: 39.00, originalPrice: 59.00, rating: 4.6, reviews: 178, image: 'https://images.unsplash.com/photo-1522401421628-e5e3a2bd28fc?w=200&h=200&fit=crop', flash: false },
    { id: '9', name: 'Blender Pro 2000W', category: 'Cuisine', price: 89.00, originalPrice: 129.00, rating: 4.9, reviews: 456, image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=200&h=200&fit=crop', flash: true },
    { id: '10', name: 'Lunch Box Isotherme', category: 'Cuisine', price: 29.00, originalPrice: 45.00, rating: 4.5, reviews: 234, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop', flash: false },
];

const CATEGORIES = ['Tout', 'Digital', 'Vêtements', 'Cuisine'];

const ProductCard = ({ item, onAddToCart }) => {
    const discount = Math.round((1 - item.price / item.originalPrice) * 100);
    
    return (
        <TouchableOpacity style={styles.productCard} onPress={() => onAddToCart(item)}>
            {/* Flash Sale Badge */}
            {item.flash && (
                <View style={styles.flashBadge}>
                    <Zap color="#FFFFFF" size={10} fill="#FFFFFF" />
                    <Text style={styles.flashBadgeText}>FLASH</Text>
                </View>
            )}
            
            {/* Discount Badge */}
            <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discount}%</Text>
            </View>
            
            {/* Favorite Button */}
            <TouchableOpacity style={styles.favoriteButton}>
                <Heart color="#9CA3AF" size={18} strokeWidth={1.5} />
            </TouchableOpacity>
            
            <View style={styles.imageContainer}>
                <Image 
                    source={{ uri: item.image }} 
                    style={styles.productImage}
                    resizeMode="cover"
                />
            </View>
            
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            
            <View style={styles.ratingRow}>
                <Star color="#F97316" size={12} fill="#F97316" />
                <Text style={styles.ratingText}>{item.rating}</Text>
                <Text style={styles.reviewsText}>({item.reviews})</Text>
            </View>
            
            <View style={styles.priceRow}>
                <View>
                    <Text style={styles.price}>{item.price.toFixed(2)} €</Text>
                    <Text style={styles.originalPrice}>{item.originalPrice.toFixed(2)} €</Text>
                </View>
                <TouchableOpacity 
                    style={styles.cartButton}
                    onPress={() => onAddToCart(item)}
                >
                    <ShoppingCart color="#FFFFFF" size={16} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

export default function StoreScreen() {
  const [selectedCategory, setSelectedCategory] = useState('Tout');
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);

  const filteredProducts = selectedCategory === 'Tout' 
    ? ALL_PRODUCTS 
    : ALL_PRODUCTS.filter(p => p.category === selectedCategory);

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
    Alert.alert(
      '🛒 Ajouté au panier !',
      `${product.name}\n${product.price.toFixed(2)} €`,
      [{ text: 'Continuer', style: 'default' }]
    );
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
    if (cartItems.length === 0) {
      Alert.alert('Panier vide', 'Ajoutez des produits pour continuer');
      return;
    }
    Alert.alert(
      '💳 Paiement',
      `Total: ${cartTotal.toFixed(2)} €\n\nChoisissez votre méthode de paiement:`,
      [
        { text: 'Carte Bancaire', onPress: () => processPayment('card') },
        { text: 'PayPal', onPress: () => processPayment('paypal') },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  const processPayment = (method) => {
    setShowCartModal(false);
    Alert.alert(
      '✅ Commande confirmée !',
      `Paiement de ${cartTotal.toFixed(2)} € par ${method === 'card' ? 'Carte Bancaire' : 'PayPal'}\n\nMerci pour votre achat !`,
      [{ text: 'OK', onPress: () => setCartItems([]) }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
            <View>
                <Text style={styles.headerLogo}>🛍️ Store</Text>
            </View>
            <TouchableOpacity style={styles.cartContainer} onPress={() => setShowCartModal(true)}>
                <ShoppingCart color="#FFFFFF" size={24} />
                {cartCount > 0 && (
                    <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cartCount}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
        
        {/* Promotional Banner */}
        <TouchableOpacity style={styles.promoBanner}>
            <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=200&fit=crop' }}
                style={styles.promoBannerImage}
                resizeMode="cover"
            />
            <View style={styles.promoBannerOverlay}>
                <Text style={styles.promoBannerTitle}>🎉 SOLDES DE JANVIER</Text>
                <Text style={styles.promoBannerSubtitle}>Jusqu'à -50% sur tout le store</Text>
            </View>
        </TouchableOpacity>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
            <Search color="#9CA3AF" size={20} />
            <TextInput 
                style={styles.searchInput}
                placeholder="Rechercher des produits..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </View>
      </View>

      {/* Promo Banner */}
      <View style={styles.promoBanner}>
        <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>🔥 VENTES FLASH</Text>
            <Text style={styles.promoSubtitle}>Jusqu'à -50% sur tout le site !</Text>
        </View>
        <View style={styles.promoTimer}>
            <Text style={styles.promoTimerText}>⏰ 23:59:59</Text>
        </View>
      </View>
      
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard item={item} onAddToCart={handleAddToCart} />}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={() => (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity 
                        key={cat} 
                        style={selectedCategory === cat ? styles.categoryButtonActive : styles.categoryButton}
                        onPress={() => setSelectedCategory(cat)}
                    >
                        <Text style={selectedCategory === cat ? styles.categoryTextActive : styles.categoryText}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
          </View>
        )}
      />

      {/* Cart Modal */}
      <Modal
        visible={showCartModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCartModal(false)}
      >
        <View style={styles.cartModalOverlay}>
          <View style={styles.cartModal}>
            {/* Header */}
            <View style={styles.cartModalHeader}>
              <Text style={styles.cartModalTitle}>🛒 Mon Panier</Text>
              <TouchableOpacity onPress={() => setShowCartModal(false)}>
                <X color="#6B7280" size={24} />
              </TouchableOpacity>
            </View>

            {/* Cart Items */}
            {cartItems.length === 0 ? (
              <View style={styles.emptyCart}>
                <Text style={styles.emptyCartEmoji}>🛒</Text>
                <Text style={styles.emptyCartText}>Votre panier est vide</Text>
                <Text style={styles.emptyCartSubtext}>Ajoutez des produits pour commencer</Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.cartItemsList}>
                  {cartItems.map((item) => (
                    <View key={item.id} style={styles.cartItem}>
                      <View style={styles.cartItemImage}>
                        <Text style={styles.cartItemEmoji}>{item.emoji}</Text>
                      </View>
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.cartItemPrice}>{item.price.toFixed(2)} €</Text>
                      </View>
                      <View style={styles.cartItemActions}>
                        <View style={styles.quantityControls}>
                          <TouchableOpacity 
                            style={styles.quantityBtn}
                            onPress={() => updateQuantity(item.id, -1)}
                          >
                            <Text style={styles.quantityBtnText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{item.quantity}</Text>
                          <TouchableOpacity 
                            style={styles.quantityBtn}
                            onPress={() => updateQuantity(item.id, 1)}
                          >
                            <Text style={styles.quantityBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                          <Trash2 color="#DC2626" size={20} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {/* Cart Summary */}
                <View style={styles.cartSummary}>
                  <View style={styles.cartSummaryRow}>
                    <Text style={styles.cartSummaryLabel}>Sous-total</Text>
                    <Text style={styles.cartSummaryValue}>{cartTotal.toFixed(2)} €</Text>
                  </View>
                  <View style={styles.cartSummaryRow}>
                    <Text style={styles.cartSummaryLabel}>Livraison</Text>
                    <Text style={styles.cartSummaryFree}>GRATUITE</Text>
                  </View>
                  <View style={styles.cartDivider} />
                  <View style={styles.cartSummaryRow}>
                    <Text style={styles.cartTotalLabel}>Total</Text>
                    <Text style={styles.cartTotalValue}>{cartTotal.toFixed(2)} €</Text>
                  </View>
                </View>

                {/* Checkout Button */}
                <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                  <CreditCard color="#FFFFFF" size={20} />
                  <Text style={styles.checkoutButtonText}>Payer {cartTotal.toFixed(2)} €</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF7ED', // Light orange background
    },
    header: {
        backgroundColor: '#F97316', // Jumia Orange
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLogo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    cartContainer: {
        position: 'relative',
    },
    cartBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#DC2626',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#111827',
    },
    promoBanner: {
        backgroundColor: '#EA580C',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    promoContent: {
        flex: 1,
    },
    promoTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    promoSubtitle: {
        color: '#FED7AA',
        fontSize: 12,
        marginTop: 2,
    },
    promoTimer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    promoTimerText: {
        color: '#EA580C',
        fontWeight: 'bold',
        fontSize: 12,
    },
    categoriesContainer: {
        marginBottom: 16,
        marginTop: 8,
    },
    categoryButton: {
        marginRight: 10,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FDBA74',
    },
    categoryButtonActive: {
        marginRight: 10,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F97316',
    },
    categoryText: {
        fontWeight: '600',
        color: '#F97316',
        fontSize: 13,
    },
    categoryTextActive: {
        fontWeight: '600',
        color: '#FFFFFF',
        fontSize: 13,
    },
    listContainer: {
        paddingHorizontal: 12,
        paddingBottom: 100,
    },
    productCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 10,
        margin: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        position: 'relative',
    },
    flashBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#DC2626',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        zIndex: 10,
    },
    flashBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#F97316',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 3,
        zIndex: 10,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    favoriteButton: {
        position: 'absolute',
        bottom: 50,
        right: 10,
        zIndex: 10,
    },
    imageContainer: {
        height: 140,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        marginBottom: 10,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    promoBanner: {
        marginTop: 12,
        marginHorizontal: 0,
        borderRadius: 12,
        overflow: 'hidden',
        height: 100,
    },
    promoBannerImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    promoBannerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    promoBannerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    promoBannerSubtitle: {
        color: '#FFFFFF',
        fontSize: 14,
        marginTop: 4,
    },
    productEmoji: {
        fontSize: 56,
    },
    productName: {
        color: '#1F2937',
        fontWeight: '600',
        fontSize: 13,
        marginBottom: 6,
        minHeight: 36,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 4,
    },
    ratingText: {
        color: '#F97316',
        fontSize: 12,
        fontWeight: 'bold',
    },
    reviewsText: {
        color: '#9CA3AF',
        fontSize: 11,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        color: '#DC2626',
        fontWeight: 'bold',
        fontSize: 16,
    },
    originalPrice: {
        color: '#9CA3AF',
        fontSize: 11,
        textDecorationLine: 'line-through',
    },
    cartButton: {
        backgroundColor: '#F97316',
        padding: 10,
        borderRadius: 10,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    
    // Cart Modal Styles
    cartModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    cartModal: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingBottom: 30,
    },
    cartModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    cartModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    emptyCart: {
        padding: 40,
        alignItems: 'center',
    },
    emptyCartEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyCartText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    emptyCartSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    cartItemsList: {
        maxHeight: 300,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    cartItemImage: {
        width: 50,
        height: 50,
        backgroundColor: '#FFF7ED',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cartItemEmoji: {
        fontSize: 28,
    },
    cartItemInfo: {
        flex: 1,
    },
    cartItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    cartItemPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#F97316',
    },
    cartItemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    quantityBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F97316',
    },
    quantityText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        paddingHorizontal: 8,
    },
    cartSummary: {
        padding: 20,
        backgroundColor: '#FFF7ED',
    },
    cartSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cartSummaryLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    cartSummaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    cartSummaryFree: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981',
    },
    cartDivider: {
        height: 1,
        backgroundColor: '#FDBA74',
        marginVertical: 12,
    },
    cartTotalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    cartTotalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F97316',
    },
    checkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F97316',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        gap: 10,
    },
    checkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
