// Complete Affiliate Configuration
// Supports multiple affiliate networks and regional tags

export const AFFILIATE_CONFIG = {
  // ==================== AMAZON ====================
  amazon: {
    us: { tag: 'nutriplusapp2-21', baseUrl: 'https://www.amazon.com/dp/' },
    es: { tag: 'nutriplusap07-21', baseUrl: 'https://www.amazon.es/dp/' },
    de: { tag: 'nutriplusap0f-21', baseUrl: 'https://www.amazon.de/dp/' },
    uk: { tag: 'nutriplusa0c7-21', baseUrl: 'https://www.amazon.co.uk/dp/' },
    it: { tag: 'nutriplusap0e-21', baseUrl: 'https://www.amazon.it/dp/' },
    fr: { tag: '', baseUrl: 'https://www.amazon.fr/dp/' }, // À configurer
  },

  // ==================== ALIEXPRESS ====================
  aliexpress: {
    trackingId: 'nutriplusap', // Votre ID Portals AliExpress
    baseUrl: 'https://www.aliexpress.com/',
    paramName: 'aff_id', // Paramètre URL pour l'affiliation
  },

  // ==================== EBAY ====================
  ebay: {
    campaignId: '', // eBay Partner Network Campaign ID
    baseUrl: 'https://www.ebay.com/',
    paramName: 'campid',
  },

  // ==================== CDISCOUNT ====================
  cdiscount: {
    affiliateId: '', // Cdiscount Affiliation ID
    baseUrl: 'https://www.cdiscount.com/',
    paramName: 'aff',
  },

  // ==================== RAKUTEN ====================
  rakuten: {
    mid: '', // Merchant ID
    baseUrl: 'https://www.rakuten.com/',
    paramName: 'mid',
  },

  // ==================== iHERB (Nutrition) ====================
  iherb: {
    code: '', // Votre code promo/affilié iHerb
    baseUrl: 'https://www.iherb.com/',
    paramName: 'rcode',
  },

  // ==================== MYPROTEIN ====================
  myprotein: {
    affiliateId: '', // MyProtein Affiliate ID
    baseUrl: 'https://www.myprotein.fr/',
    paramName: 'affil',
  },

  // ==================== BULK POWDERS ====================
  bulk: {
    affiliateId: '', // Bulk Affiliate ID
    baseUrl: 'https://www.bulk.com/',
    paramName: 'ref',
  },

  // ==================== DECATHLON ====================
  decathlon: {
    publisherId: '', // Via Awin Publisher ID
    baseUrl: 'https://www.decathlon.fr/',
    paramName: 'utm_source',
  },

  // ==================== FNAC ====================
  fnac: {
    publisherId: '', // Via Awin/Tradedoubler Publisher ID
    baseUrl: 'https://www.fnac.com/',
    paramName: 'Origin',
  },
};

// ==================== DETECTION FUNCTIONS ====================

/**
 * Detect affiliate network from URL
 */
const detectNetwork = (url) => {
  if (!url) return null;
  
  if (url.includes('amazon')) return 'amazon';
  if (url.includes('aliexpress')) return 'aliexpress';
  if (url.includes('ebay')) return 'ebay';
  if (url.includes('cdiscount')) return 'cdiscount';
  if (url.includes('rakuten')) return 'rakuten';
  if (url.includes('iherb')) return 'iherb';
  if (url.includes('myprotein')) return 'myprotein';
  if (url.includes('bulk.com')) return 'bulk';
  if (url.includes('decathlon')) return 'decathlon';
  if (url.includes('fnac')) return 'fnac';
  
  return null;
};

/**
 * Detect Amazon region from URL
 */
const detectAmazonRegion = (url) => {
  if (!url) return 'us';
  if (url.includes('amazon.es')) return 'es';
  if (url.includes('amazon.de')) return 'de';
  if (url.includes('amazon.co.uk')) return 'uk';
  if (url.includes('amazon.it')) return 'it';
  if (url.includes('amazon.fr')) return 'fr';
  return 'us';
};

/**
 * Get affiliate tag/ID for a specific network
 */
const getAffiliateId = (network, url = null) => {
  const config = AFFILIATE_CONFIG[network];
  if (!config) return null;
  
  if (network === 'amazon') {
    const region = detectAmazonRegion(url);
    return config[region]?.tag || config.us.tag;
  }
  
  // For other networks, return the main ID
  return config.trackingId || config.campaignId || config.affiliateId || 
         config.code || config.publisherId || config.mid || null;
};

/**
 * Get the parameter name for a network
 */
const getParamName = (network) => {
  if (network === 'amazon') return 'tag';
  return AFFILIATE_CONFIG[network]?.paramName || 'ref';
};

// ==================== MAIN FUNCTIONS ====================

/**
 * Generate affiliate link for any supported network
 */
export const getAffiliateLink = (product) => {
  if (!product) return null;
  
  const url = product.sourceUrl || product.link;
  if (!url) return null;
  
  const network = detectNetwork(url);
  if (!network) return url; // Return original if not recognized
  
  const affiliateId = getAffiliateId(network, url);
  if (!affiliateId) return url; // Return original if no ID configured
  
  const paramName = getParamName(network);
  const separator = url.includes('?') ? '&' : '?';
  
  return `${url}${separator}${paramName}=${affiliateId}`;
};

/**
 * Check if a URL belongs to a supported affiliate network
 */
export const isAffiliateable = (url) => {
  return detectNetwork(url) !== null;
};

/**
 * Get network name for display
 */
export const getNetworkName = (url) => {
  const network = detectNetwork(url);
  const names = {
    amazon: 'Amazon',
    aliexpress: 'AliExpress',
    ebay: 'eBay',
    cdiscount: 'Cdiscount',
    rakuten: 'Rakuten',
    iherb: 'iHerb',
    myprotein: 'MyProtein',
    bulk: 'Bulk',
    decathlon: 'Decathlon',
    fnac: 'Fnac',
  };
  return names[network] || 'le site';
};

/**
 * Check if affiliate is configured for a network
 */
export const isAffiliateConfigured = (url) => {
  const network = detectNetwork(url);
  if (!network) return false;
  return !!getAffiliateId(network, url);
};

/**
 * Get all configured networks (for admin display)
 */
export const getConfiguredNetworks = () => {
  const networks = [];
  
  // Check Amazon regions
  Object.entries(AFFILIATE_CONFIG.amazon).forEach(([region, config]) => {
    if (config.tag) {
      networks.push({ name: `Amazon ${region.toUpperCase()}`, id: config.tag });
    }
  });
  
  // Check other networks
  ['aliexpress', 'ebay', 'cdiscount', 'iherb', 'myprotein', 'bulk', 'decathlon', 'fnac', 'rakuten'].forEach(network => {
    const id = getAffiliateId(network);
    if (id) {
      networks.push({ name: getNetworkName(`${network}.com`), id });
    }
  });
  
  return networks;
};
