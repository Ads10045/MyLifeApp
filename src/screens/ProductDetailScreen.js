import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert, useWindowDimensions, Linking } from 'react-native';
import { ArrowLeft, Star, Heart, Share2, Truck, Shield, RotateCcw, ExternalLink, ShoppingBag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAffiliateLink, isAffiliateable } from '../config/affiliate';

export default function ProductDetailScreen({ product, onBack }) {
  const { width } = useWindowDimensions();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const isLargeScreen = width > 768;

  // Use product.images from API/database, or fallback to single imageUrl
  const images = (product.images && product.images.length > 0) 
    ? product.images 
    : [product.imageUrl];

  // Open affiliate link
  const handleBuyOnAmazon = () => {
    const affiliateUrl = getAffiliateLink(product);
    const urlToOpen = affiliateUrl || product.sourceUrl;
    
    if (!urlToOpen) {
      Alert.alert('Erreur', 'Pas de lien disponible pour ce produit');
      return;
    }
    
    console.log('Opening Affiliate URL:', urlToOpen);
    Linking.openURL(urlToOpen).catch(err => {
      console.error('Failed to open URL:', err);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien');
    });
  };

  // Render main buy button
  const renderBuyButton = () => (
    <TouchableOpacity 
      style={[styles.buyNowBtn, isLargeScreen && styles.buyNowBtnDesktop]} 
      onPress={handleBuyOnAmazon}
    >
      <ShoppingBag color="#FFFFFF" size={22} />
      <Text style={styles.buyNowText}>
        {isAffiliateable(product.sourceUrl) ? 'Acheter sur Amazon' : 'Voir le produit'}
      </Text>
      <ExternalLink color="#FFFFFF" size={18} />
    </TouchableOpacity>
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

        {/* RIGHT COLUMN: Product Info */}
        <View style={isLargeScreen ? styles.rightColumn : styles.productInfo}>
          
          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price?.toFixed(2)} €</Text>
            {product.originalPrice && (
              <>
                <Text style={styles.oldPrice}>{product.originalPrice.toFixed(2)} €</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Name */}
          <Text style={styles.name}>{product.name}</Text>

          {/* Rating & Supplier */}
          <View style={styles.metaRow}>
            <View style={styles.ratingBox}>
              <Star color="#F59E0B" size={14} fill="#F59E0B" />
              <Text style={styles.ratingText}>{product.rating || 4.5}</Text>
            </View>
            <Text style={styles.salesText}>500+ ventes</Text>
            <Text style={styles.supplierText}>par {product.supplier}</Text>
          </View>

          {/* Buy Button (Desktop) */}
          {isLargeScreen && (
            <View style={styles.desktopActionContainer}>
              {renderBuyButton()}
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

          {/* Affiliate Notice */}
          <View style={styles.affiliateNotice}>
            <Text style={styles.affiliateNoticeText}>
              💡 En cliquant sur "Acheter", vous serez redirigé vers le site du vendeur. 
              Nous pouvons percevoir une commission sur les ventes.
            </Text>
          </View>
        </View>
        
        {!isLargeScreen && <View style={{ height: 100 }} />}
      </ScrollView>

      {/* Mobile Action Bar (Fixed at bottom) */}
      {!isLargeScreen && (
        <View style={styles.bottomBar}>
          {renderBuyButton()}
        </View>
      )}
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

  // Desktop Actions
  desktopActionContainer: { marginBottom: 32, paddingVertical: 10 },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 24 },

  // Features
  features: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#F9FAFB', padding: 20, borderRadius: 16, marginBottom: 20 },
  feature: { alignItems: 'center', gap: 8 },
  featureText: { fontSize: 12, color: '#6B7280', textAlign: 'center' },

  // Bottom Bar (Mobile)
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  
  // Buy Button
  buyNowBtn: { flexDirection: 'row', backgroundColor: '#F97316', borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 10, height: 56, paddingHorizontal: 24 },
  buyNowBtnDesktop: { alignSelf: 'flex-start', paddingHorizontal: 32 },
  buyNowText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  // Affiliate Notice
  affiliateNotice: { backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12, marginTop: 16 },
  affiliateNoticeText: { fontSize: 12, color: '#92400E', lineHeight: 18, textAlign: 'center' },
});
