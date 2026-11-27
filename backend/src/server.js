
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

require('./config/loadEnv')();

const { testMySQLConnection } = require('./config/mysql');
const { connectMongoDB, getMongoStatus } = require('./config/mongo');
const { errorHandler } = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger.json');

// Routes
const authRoutes = require('./routes/auth.routes');
const citizensRoutes = require('./routes/citizens.routes');
const officersRoutes = require('./routes/officers.routes');
const paymentsRoutes = require('./routes/payments.routes');
const appealsRoutes = require('./routes/appeals.routes');
const adminRoutes = require('./routes/admin.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const demoRoutes = require('./routes/demo.routes');

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
  origin: [
    CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With'
  ]
}));

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  }
});

app.use('/api/', apiLimiter);

// Static files
app.use('/uploads', express.static(
  path.join(__dirname, '../uploads')
));

// Swagger Docs
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'SmartChallan API Docs'
  })
);

// Health Check
app.get('/api/health', async (req, res, next) => {
  try {
    const mysqlStatus = await testMySQLConnection();
    const mongoStatus = await getMongoStatus();

    res.status(200).json({
      success: true,
      status: 'ONLINE',
      service: 'SmartChallan API',
      database: {
        mysql: mysqlStatus.success
          ? 'CONNECTED'
          : `DISCONNECTED: ${mysqlStatus.error}`,
        mongodb: mongoStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// MongoDB Health
app.get('/api/health/mongo', async (req, res, next) => {
  try {
    const mongoStatus = await getMongoStatus();

    res.status(200).json({
      success: true,
      ...mongoStatus
    });
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/citizens', citizensRoutes);
app.use('/api/v1/officers', officersRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/appeals', appealsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/demo', demoRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// Start Server
async function startServer() {
  try {
    console.log('--- Initializing SmartChallan Backend ---');

    // MongoDB
    await connectMongoDB();

    // MySQL
    const mysqlCheck = await testMySQLConnection();

    if (mysqlCheck.success) {
      console.log(
        '[MySQL] Connected:',
        process.env.MYSQL_DATABASE || 'traffic_challan'
      );
    } else {
      console.warn('[MySQL] Connection failed:', mysqlCheck.error);
    }

    // Start Express
    const server = app.listen(PORT, () => {
      console.log(`[SmartChallan API] Running at http://localhost:${PORT}`);
      console.log(`[Swagger Docs] http://localhost:${PORT}/api/docs`);
      console.log(`[Health Check] http://localhost:${PORT}/api/health`);
    });

    server.on('error', (error) => {
      console.error('[Server Error]', error.message);
      process.exit(1);
    });

  } catch (error) {
    console.error('[Startup Error]', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
