// DEV FLAG: Set to true for local development, false for production (Render)
export const DEV = true;

// Local development server (votre IP locale - ipconfig getifaddr en0)
const LOCAL_API = 'http://192.168.1.43:3000/api';

// Production server (Render.com)
const PROD_API = 'https://mylifeapp-backend.onrender.com/api';

// Switch API URL based on DEV flag
export const API_URL = DEV ? LOCAL_API : PROD_API;

export const API_ENDPOINTS = {
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
};

// Export current environment info
export const ENV_INFO = {
  isDev: DEV,
  apiUrl: API_URL,
  swaggerUrl: DEV ? 'http://192.168.1.43:3000/api-docs' : 'https://mylifeapp-backend.onrender.com/api-docs'
};
