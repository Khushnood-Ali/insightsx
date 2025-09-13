
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');
const { ShopifySyncScheduler } = require('./services/shopify_service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import routes
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenants');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');
const metricsRoutes = require('./routes/metrics');
const webhookRoutes = require('./routes/webhook');
const shopifyRoutes = require('./routes/shopify');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { tenantContext } = require('./middleware/tenant');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com', 'https://your-domain.herokuapp.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});


app.use(express.static(path.join(__dirname, 'client')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

 // Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    node_version: process.version
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', authenticateToken, tenantRoutes);
app.use('/api/shopify', authenticateToken, shopifyRoutes);

// Tenant-specific routes
app.use('/api/:tenantId/customers', authenticateToken, tenantContext, customerRoutes);
app.use('/api/:tenantId/orders', authenticateToken, tenantContext, orderRoutes);
app.use('/api/:tenantId/products', authenticateToken, tenantContext, productRoutes);
app.use('/api/:tenantId/metrics', authenticateToken, tenantContext, metricsRoutes);

// Webhook routes (no auth required for Shopify webhooks)
app.use('/webhooks', webhookRoutes);


// Serve React static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));

  app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
} else {
  // Development route
  app.get('/', (req, res) => {
    res.json({
      message: 'InsightX API Server',
      version: '2.0.0',
      endpoints: {
        auth: '/api/auth',
        tenants: '/api/tenants',
        shopify: '/api/shopify',
        health: '/health'
      }
    });
  });
}

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The requested API endpoint ${req.originalUrl} was not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.errors.map(e => e.message).join(', ')
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Invalid token'
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await sequelize.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Sync database models (in development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('📋 Database models synchronized');
    }

    // Initialize Shopify sync scheduler
    if (process.env.NODE_ENV === 'production') {
      // In production, you would get tenant configs from database
      // For now, we'll just initialize the scheduler
      console.log('🔄 Shopify sync scheduler initialized');
    }

    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);

      if (process.env.NODE_ENV === 'production') {
        console.log('🌐 Production mode: Serving React build');
      } else {
        console.log('🛠️  Development mode: API server only');
        console.log('💡 Start React client separately: cd client && npm start');
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
