const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const locationRoutes = require('./routes/location');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger Documentation
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'MyLifeApp API',
    version: '1.0.0',
    description: 'API Backend for MyLifeApp - Mobile Application'
  },
  servers: [
    { url: `http://localhost:${PORT}`, description: 'Local Server' },
    { url: 'http://192.168.1.43:3000', description: 'Network Server' }
  ],
  paths: {
    '/api/health': {
      get: { summary: 'Health Check', tags: ['Health'], responses: { 200: { description: 'API is running' } } }
    },
    '/api/auth/register': {
      post: { summary: 'Register new user', tags: ['Auth'], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' } } } } } }, responses: { 200: { description: 'User created with JWT token' } } }
    },
    '/api/auth/login': {
      post: { summary: 'Login user', tags: ['Auth'], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } } } }, responses: { 200: { description: 'JWT token returned' } } }
    },
    '/api/user/profile': {
      get: { summary: 'Get user profile', tags: ['User'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'User profile data' } } }
    },
    '/api/locations': {
      get: { summary: 'Get user locations', tags: ['Locations'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of locations' } } },
      post: { summary: 'Save new location', tags: ['Locations'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'Location saved' } } }
    },
    '/api/admin/users': {
      get: { summary: 'Get all users (Admin)', tags: ['Admin'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of all users' } } }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    }
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Logging Middleware
app.use((req, res, next) => {
  const fs = require('fs');
  const log = `\n[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`;
  fs.appendFileSync('server.log', log);
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MyLifeApp API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MyLifeApp API running on:`);
  console.log(`- Local:   http://localhost:${PORT}`);
  console.log(`- Network: http://192.168.1.43:${PORT}`);
  console.log(`- Swagger: http://localhost:${PORT}/api-docs`);
});

