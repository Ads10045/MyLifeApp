import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert, useWindowDimensions, Linking } from 'react-native';
import { ArrowLeft, Star, Heart, ShoppingCart, Zap, Share2, Truck, Shield, RotateCcw, CreditCard, Banknote, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PAYMENT_CONFIG, convertToLocal } from '../config/payment';

export default function ProductDetailScreen({ product, onBack, onAddToCart }) {
  const { width } = useWindowDimensions();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showPayment, setShowPayment] = useState(false);

  // Use product.images from API/database, or fallback to single imageUrl
  const images = (product.images && product.images.length > 0) 
    ? product.images 
    : [product.imageUrl];

  const totalPrice = (product.price * quantity).toFixed(2);
  const totalPriceLocal = convertToLocal(product.price * quantity);

  const handleBuyNow = () => {
    setShowPayment(true);
  };

  const processPayment = (method) => {
    if (method === 'card') {
      Alert.alert(
        '💳 Paiement par Carte',
        `Montant: ${totalPrice} €\n\n${PAYMENT_CONFIG.messages.cardSuccess}`,
        [{ text: 'Confirmer', onPress: () => {
          Alert.alert('✅ Paiement Réussi !', PAYMENT_CONFIG.messages.cardSuccess);
          onBack();
        }}]
      );
    } else if (method === 'paypal') {
      Alert.alert(
        '🅿️ PayPal',
        `Montant: ${totalPrice} €\n\nEnvoi vers: ${PAYMENT_CONFIG.paypal.email}`,
        [{ text: 'Confirmer', onPress: () => {
          Alert.alert('✅ PayPal', PAYMENT_CONFIG.messages.paypalSuccess);
          onBack();
        }}]
      );
    } else if (method === 'cash') {
      const cod = PAYMENT_CONFIG.cashOnDelivery;
      Alert.alert(
        '💵 Paiement à la Livraison',
        `Montant: ${totalPriceLocal} DH\n\nContact: ${cod.contactName}\nTél: ${cod.contactPhone}\n\n${cod.instructions}`,
        [{ text: 'Confirmer', onPress: () => {
          Alert.alert('✅ Commande Confirmée !', PAYMENT_CONFIG.messages.cashSuccess);
          onBack();
        }}]
      );
    } else if (method === 'bank') {
      const bank = PAYMENT_CONFIG.bankTransfer;
      Alert.alert(
        '🏦 Virement Bancaire',
        `Montant: ${totalPrice} €\n\nBénéficiaire: ${bank.beneficiaryName}\nIBAN: ${bank.iban}\nBIC: ${bank.bic}\nBanque: ${bank.bankName}\n\n${PAYMENT_CONFIG.messages.bankInstructions}`,
        [{ text: 'J\'ai compris', onPress: () => onBack() }]
      );
    }
    setShowPayment(false);
  };

  if (showPayment) {
    return (
      <View style={styles.container}>
        <View style={styles.paymentHeader}>
          <TouchableOpacity onPress={() => setShowPayment(false)} style={styles.backButton}>
            <ArrowLeft color="#111827" size={24} />
          </TouchableOpacity>
          <Text style={styles.paymentTitle}>Mode de Paiement</Text>
        </View>

        <ScrollView style={styles.paymentContent}>
          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <Image source={{ uri: product.imageUrl }} style={styles.summaryImage} />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryName} numberOfLines={2}>{product.name}</Text>
              <Text style={styles.summaryQty}>Quantité: {quantity}</Text>
              <Text style={styles.summaryTotal}>{(product.price * quantity).toFixed(2)} €</Text>
            </View>
          </View>

          {/* Payment Methods */}
          <Text style={styles.sectionTitle}>Choisir un mode de paiement</Text>

          <TouchableOpacity style={styles.paymentOption} onPress={() => processPayment('card')}>
            <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.paymentIcon}>
              <CreditCard color="#FFFFFF" size={24} />
            </LinearGradient>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>Carte Bancaire</Text>
              <Text style={styles.paymentDesc}>Visa, Mastercard, CB</Text>
            </View>
            <ArrowLeft color="#9CA3AF" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentOption} onPress={() => processPayment('paypal')}>
            <View style={[styles.paymentIconPlain, { backgroundColor: '#0070BA' }]}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>P</Text>
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>PayPal</Text>
              <Text style={styles.paymentDesc}>Paiement sécurisé</Text>
            </View>
            <ArrowLeft color="#9CA3AF" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentOption} onPress={() => processPayment('cash')}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.paymentIcon}>
              <Banknote color="#FFFFFF" size={24} />
            </LinearGradient>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>Paiement à la Livraison</Text>
              <Text style={styles.paymentDesc}>Cash on Delivery</Text>
            </View>
            <ArrowLeft color="#9CA3AF" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentOption} onPress={() => processPayment('bank')}>
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.paymentIcon}>
              <CreditCard color="#FFFFFF" size={24} />
            </LinearGradient>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>Virement Bancaire</Text>
              <Text style={styles.paymentDesc}>IBAN / SWIFT</Text>
            </View>
            <ArrowLeft color="#9CA3AF" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <Shield color="#10B981" size={20} />
            <Text style={styles.securityText}>Paiement 100% sécurisé • Protection acheteur</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  const isLargeScreen = width >= 1024;

  const renderActionButtons = () => (
    <View style={isLargeScreen ? styles.desktopActions : styles.bottomBar}>
      <TouchableOpacity 
        style={styles.addToCartBtn}
        onPress={() => {
          onAddToCart(product, quantity);
          Alert.alert('✅ Ajouté !', `${quantity}x ${product.name} ajouté au panier.`);
        }}
      >
        <ShoppingCart color="#F97316" size={22} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow}>
        <Zap color="#FFFFFF" size={20} fill="#FFFFFF" />
        <Text style={styles.buyNowText}>Acheter • {(product.price * quantity).toFixed(2)} €</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft color="#111827" size={24} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitleText}>Détails Produit</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={styles.headerBtn}>
            <Heart color={isFavorite ? '#EF4444' : '#6B7280'} size={24} fill={isFavorite ? '#EF4444' : 'transparent'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Share2 color="#6B7280" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={isLargeScreen ? styles.desktopContainer : null} showsVerticalScrollIndicator={false}>
        
        {/* LEFT COLUMN: Images */}
        <View style={isLargeScreen ? styles.leftColumn : styles.imageGallery}>
          <Image 
            source={{ uri: images[currentImageIndex] }} 
            style={[styles.mainImage, !isLargeScreen && { width }]} 
            resizeMode={isLargeScreen ? "contain" : "cover"} 
          />
          
          {/* Thumbnails */}
          <View style={styles.thumbnails}>
            {images.map((img, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => setCurrentImageIndex(index)}
                style={[styles.thumbnail, currentImageIndex === index && styles.thumbnailActive]}
              >
                <Image source={{ uri: img }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* RIGHT COLUMN: Details */}
        <View style={[styles.productInfo, isLargeScreen && styles.rightColumn]}>
          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price?.toFixed(2)} €</Text>
            <Text style={styles.oldPrice}>{(product.price * 1.4)?.toFixed(2)} €</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-30%</Text>
            </View>
          </View>

          {/* Name */}
          <Text style={styles.name}>{product.name}</Text>

          {/* Rating & Sales */}
          <View style={styles.metaRow}>
            <View style={styles.ratingBox}>
              <Star color="#FFD700" size={16} fill="#FFD700" />
              <Text style={styles.ratingText}>{product.rating || 4.5}</Text>
            </View>
            <Text style={styles.salesText}>500+ ventes</Text>
            <Text style={styles.salesText}>500+ ventes</Text>
            <Text style={styles.supplierText}>par {product.supplier}</Text>
          </View>

          {/* Source Link */}
          {product.sourceUrl && (
            <TouchableOpacity 
              style={styles.sourceLink} 
              onPress={() => {
                console.log('Opening URL:', product.sourceUrl);
                if (!product.sourceUrl) {
                  Alert.alert('Erreur', 'Pas de lien disponible');
                  return;
                }
                Linking.openURL(product.sourceUrl).catch(err => {
                  console.error('Failed to open URL:', err);
                  Alert.alert('Erreur', 'Impossible d\'ouvrir le lien: ' + err.message);
                });
              }}
            >
              <ExternalLink size={14} color="#3B82F6" />
              <Text style={styles.sourceLinkText}>Voir sur la boutique officielle ({product.supplier})</Text>
            </TouchableOpacity>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Quantité :</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

           {/* Desktop Action Buttons Placement */}
           {isLargeScreen && (
             <View style={styles.desktopActionContainer}>
               {renderActionButtons()}
             </View>
           )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <Truck color="#F97316" size={20} />
              <Text style={styles.featureText}>Livraison gratuite</Text>
            </View>
            <View style={styles.feature}>
              <Shield color="#10B981" size={20} />
              <Text style={styles.featureText}>Garantie 30 jours</Text>
            </View>
            <View style={styles.feature}>
              <RotateCcw color="#3B82F6" size={20} />
              <Text style={styles.featureText}>Retour facile</Text>
            </View>
          </View>
        </View>
        
        {!isLargeScreen && <View style={{ height: 100 }} />}
      </ScrollView>

      {/* Mobile Action Bar (Fixed at bottom) */}
      {!isLargeScreen && renderActionButtons()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12 },
  headerTitleText: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12 },

  // Layout Logic
  desktopContainer: { flexDirection: 'row', padding: 40, maxWidth: 1400, alignSelf: 'center', gap: 40 },
  leftColumn: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 20, padding: 20, alignItems: 'center', justifyContent: 'flex-start' },
  rightColumn: { flex: 1, paddingTop: 0 },

  // Image Gallery
  imageGallery: { backgroundColor: '#F3F4F6' },
  mainImage: { height: 350, width: '100%', borderRadius: 12 },
  thumbnails: { flexDirection: 'row', justifyContent: 'center', padding: 12, gap: 8, marginTop: 16 },
  thumbnail: { width: 60, height: 60, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbnailActive: { borderColor: '#F97316' },
  thumbnailImage: { width: '100%', height: '100%' },

  // Product Info
  productInfo: { padding: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#DC2626' },
  oldPrice: { fontSize: 18, color: '#9CA3AF', textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  discountText: { fontSize: 12, fontWeight: 'bold', color: '#DC2626' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  ratingText: { fontSize: 13, fontWeight: 'bold', color: '#D97706' },
  salesText: { fontSize: 13, color: '#6B7280' },
  supplierText: { fontSize: 13, color: '#F97316' },

  // Quantity
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
  quantityLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  quantitySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10 },
  qtyBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  qtyBtnText: { fontSize: 20, fontWeight: 'bold', color: '#F97316' },
  qtyValue: { fontSize: 16, fontWeight: 'bold', paddingHorizontal: 16 },

  // Desktop Actions
  desktopActionContainer: { marginBottom: 32, paddingVertical: 10 },
  desktopActions: { flexDirection: 'row', gap: 16 },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 24 },

  // Features
  features: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#F9FAFB', padding: 20, borderRadius: 16 },
  feature: { alignItems: 'center', gap: 8 },
  featureText: { fontSize: 12, color: '#6B7280', textAlign: 'center' },

  // Bottom Bar (Mobile)
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 12 },
  addToCartBtn: { width: 56, height: 56, backgroundColor: '#FFF7ED', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F97316' },
  buyNowBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#F97316', borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8, height: 56 },
  buyNowText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  // Payment Screen
  paymentHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6, gap: 16' },
  paymentTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  paymentContent: { flex: 1, padding: 20 },
  orderSummary: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 24, gap: 16 },
  summaryImage: { width: 80, height: 80, borderRadius: 8 },
  summaryInfo: { flex: 1, justifyContent: 'center' },
  summaryName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
  summaryQty: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  summaryTotal: { fontSize: 18, fontWeight: 'bold', color: '#DC2626' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', gap: 16 },
  paymentIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  paymentIconPlain: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  paymentInfo: { flex: 1 },
  paymentName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  paymentDesc: { fontSize: 12, color: '#6B7280' },
  securityInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 8 },
  securityText: { fontSize: 12, color: '#6B7280' },

  // Source Link
  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, padding: 8, backgroundColor: '#EFF6FF', alignSelf: 'flex-start', borderRadius: 8 },
  sourceLinkText: { color: '#3B82F6', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
});
