import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import dealsRouter from './routes/deals.js';
import loiRouter from './routes/loi.js';
import propertyRouter from './routes/property.js';
import cashflowRouter from './routes/cashflow.js';
import debtRouter from './routes/debt.js';
import leaseRouter from './routes/lease.js';
import dealAnalyzerRouter from './routes/dealAnalyzer.js';
import documentsRouter from './routes/documents.js';
import usersRouter from './routes/users.js';
import uploadsRouter from './routes/uploads.js';
import settingsRouter from './routes/settings.js';
import marketPulseRouter from './routes/marketPulse.js';
import analyticsRouter from './routes/analytics.js';
import newsRouter from './routes/news.js';
import referralsRouter from './routes/referrals.js';
import fredDataRouter from './routes/fredData.js';
import bridgeRouter from './routes/bridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const devOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1|(?:10|192\.168|172\.(1[6-9]|2\d|3[0-1]))\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'production') {
      return callback(origin === process.env.CLIENT_URL ? null : new Error('Not allowed by CORS'), origin === process.env.CLIENT_URL);
    }
    return callback(devOriginPattern.test(origin) ? null : new Error('Not allowed by CORS'), devOriginPattern.test(origin));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API routes
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/deals', dealsRouter);
app.use('/api/v1/loi', loiRouter);
app.use('/api/v1/property', propertyRouter);
app.use('/api/v1/cashflow', cashflowRouter);
app.use('/api/v1/debt', debtRouter);
app.use('/api/v1/lease', leaseRouter);
app.use('/api/v1/deal-analyzer', dealAnalyzerRouter);
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/uploads', uploadsRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/market-pulse', marketPulseRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/news', newsRouter);
app.use('/api/v1/referrals', referralsRouter);
app.use('/api/v1/fred', fredDataRouter);
app.use('/api/v1/bridge', bridgeRouter);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  app.listen(PORT, () => {
    console.log(`CRE Suite server running on http://localhost:${PORT}`);
  });
}

export default app;
