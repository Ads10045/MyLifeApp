import { Platform } from 'react-native';

// DEV FLAG: Set to true for local development, false for production (Render)
export const DEV = true;

// Local development servers
// For mobile: use your machine's local IP (ipconfig getifaddr en0)
const MOBILE_LOCAL_API = 'http://192.168.11.100:3000/api';
// For web: use localhost (browser can access localhost directly)
const WEB_LOCAL_API = 'http://localhost:3000/api';

// Production server (Render.com)
const PROD_API = 'https://mylifeapp-backend.onrender.com/api';

// Auto-detect platform and choose appropriate API URL
const LOCAL_API = Platform.OS === 'web' ? WEB_LOCAL_API : MOBILE_LOCAL_API;

// Switch API URL based on DEV flag
export const API_URL = DEV ? LOCAL_API : PROD_API;

export const API_ENDPOINTS = {
  API_URL: API_URL, // Ajout pour compatibilité
  BASE_URL: API_URL,
  // Auth
  REGISTER: `${API_URL}/auth/register`,
  LOGIN: `${API_URL}/auth/login`,
  SOCIAL_LOGIN: `${API_URL}/auth/social`,
  
  // User
  PROFILE: `${API_URL}/user/profile`,
  
  // Locations
  LOCATIONS: `${API_URL}/locations`,
  
  // Admin
  ADMIN: {
    USERS: `${API_URL}/admin/users`,
    STATS: `${API_URL}/admin/stats`,
  },
  
  // Health
  HEALTH: `${API_URL}/health`,

  // Banners
  BANNERS: `${API_URL}/banners`,
};

// Export current environment info
export const ENV_INFO = {
  isDev: DEV,
  apiUrl: API_URL,
  swaggerUrl: DEV 
    ? (Platform.OS === 'web' ? 'http://localhost:3000/api-docs' : 'http://192.168.11.100:3000/api-docs')
    : 'https://mylifeapp-backend.onrender.com/api-docs'
};
