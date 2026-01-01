// Amazon Associates & Affiliate Configuration
// Multi-region Amazon Affiliate IDs

export const AFFILIATE_CONFIG = {
  amazon: {
    // US Amazon (default)
    us: {
      tag: 'nutriplusapp2-21',
      baseUrl: 'https://www.amazon.com/dp/',
    },
    // Spain - Amazon.es
    es: {
      tag: 'nutriplusap07-21',
      baseUrl: 'https://www.amazon.es/dp/',
    },
    // Germany - Amazon.de
    de: {
      tag: 'nutriplusap0f-21',
      baseUrl: 'https://www.amazon.de/dp/',
    },
    // UK - Amazon.co.uk
    uk: {
      tag: 'nutriplusa0c7-21',
      baseUrl: 'https://www.amazon.co.uk/dp/',
    },
    // Italy - Amazon.it
    it: {
      tag: 'nutriplusap0e-21',
      baseUrl: 'https://www.amazon.it/dp/',
    },
  },
  aliexpress: {
    trackingId: '',
    baseUrl: 'https://www.aliexpress.com/item/',
  }
};

/**
 * Detect Amazon region from URL
 * @param {string} url - Product URL
 * @returns {string} - Region code (us, es, de, uk, it, fr)
 */
const detectAmazonRegion = (url) => {
  if (!url) return 'us';
  if (url.includes('amazon.es')) return 'es';
  if (url.includes('amazon.de')) return 'de';
  if (url.includes('amazon.co.uk')) return 'uk';
  if (url.includes('amazon.it')) return 'it';
  if (url.includes('amazon.fr')) return 'us'; // Use US tag for FR (not configured yet)
  return 'us';
};

/**
 * Get the correct affiliate tag based on URL region
 * @param {string} url - Product URL
 * @returns {string} - Affiliate tag
 */
const getAmazonTag = (url) => {
  const region = detectAmazonRegion(url);
  return AFFILIATE_CONFIG.amazon[region]?.tag || AFFILIATE_CONFIG.amazon.us.tag;
};

/**
 * Génère un lien d'affiliation Amazon avec le bon tag régional
 * @param {string} url - URL originale du produit
 * @returns {string} - URL avec tag d'affiliation
 */
export const getAmazonAffiliateLink = (url) => {
  if (!url) return null;
  const tag = getAmazonTag(url);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}tag=${tag}`;
};

/**
 * Génère un lien d'affiliation pour n'importe quel produit
 * @param {Object} product - Le produit avec source et identifiants
 * @returns {string} - URL avec tracking
 */
export const getAffiliateLink = (product) => {
  if (!product) return null;
  
  const url = product.sourceUrl || product.link;
  
  // If Amazon URL, add the correct regional tag
  if (url && url.includes('amazon')) {
    return getAmazonAffiliateLink(url);
  }
  
  // Return original URL for other sources
  return url || null;
};

/**
 * Vérifie si un lien produit peut générer une commission
 * @param {string} url - URL du produit
 * @returns {boolean}
 */
export const isAffiliateable = (url) => {
  if (!url) return false;
  return url.includes('amazon') || url.includes('aliexpress');
};

/**
 * Get all configured Amazon regions
 * @returns {Object} - All region configs
 */
export const getAmazonRegions = () => AFFILIATE_CONFIG.amazon;
