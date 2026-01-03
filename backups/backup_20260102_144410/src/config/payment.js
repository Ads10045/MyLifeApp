// Configuration des paiements
// Modifiez ces valeurs pour changer les comptes qui reçoivent les paiements

export const PAYMENT_CONFIG = {
  // PayPal
  paypal: {
    email: 'votrecompte@paypal.com', // Email PayPal pour recevoir les paiements
    clientId: '', // PayPal Client ID (pour intégration API)
    sandbox: true, // true = mode test, false = production
  },

  // Stripe (Carte bancaire)
  stripe: {
    publishableKey: '', // pk_test_... ou pk_live_...
    secretKey: '', // sk_test_... ou sk_live_... (NE PAS exposer côté client)
    currency: 'EUR',
  },

  // Virement bancaire
  bankTransfer: {
    beneficiaryName: 'Youness Abach',
    iban: 'MA76 0000 0000 0000 0000 0000 000', // IBAN du compte
    bic: 'XXXXXXXX', // Code BIC/SWIFT
    bankName: 'Votre Banque',
  },

  // Cash on Delivery / CashPlus / Wafacash
  cashOnDelivery: {
    enabled: true,
    contactName: 'Youness Abach',
    contactPhone: '+212 6XX XXX XXX',
    contactCIN: 'AB123456',
    instructions: 'Envoyez le montant et la photo du reçu sur WhatsApp.',
  },

  // Mobile Money (Orange Money, Wave, etc.)
  mobileMoney: {
    enabled: true,
    provider: 'Orange Money', // ou 'Wave', 'MTN Money', etc.
    phoneNumber: '+212 6XX XXX XXX',
    accountName: 'Youness Abach',
  },

  // Commission et frais
  fees: {
    deliveryFee: 30, // Frais de livraison en DH
    freeDeliveryMinimum: 500, // Livraison gratuite à partir de X DH
    currency: 'MAD', // Devise locale
    exchangeRate: 10.5, // 1 EUR = X MAD (pour conversion)
  },

  // Messages personnalisés
  messages: {
    cardSuccess: 'Paiement par carte réussi ! Vous recevrez un email de confirmation.',
    paypalSuccess: 'Paiement PayPal confirmé ! Merci pour votre achat.',
    cashSuccess: 'Commande confirmée ! Préparez le montant exact pour le livreur.',
    bankInstructions: 'Veuillez effectuer un virement aux coordonnées ci-dessus et nous envoyer la preuve de paiement.',
  },
};

// Helper pour obtenir le montant en devise locale
export const convertToLocal = (amountEUR) => {
  return (amountEUR * PAYMENT_CONFIG.fees.exchangeRate).toFixed(2);
};

// Helper pour formater le montant
export const formatPrice = (amount, currency = 'EUR') => {
  if (currency === 'MAD') {
    return `${amount.toFixed(2)} DH`;
  }
  return `${amount.toFixed(2)} €`;
};
