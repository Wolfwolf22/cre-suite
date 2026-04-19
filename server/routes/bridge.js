import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { bridgeRateLimiter } from '../middleware/rateLimiter.js';
import {
  getParcels,
  getMarketReport,
  getPropertyByAddress,
  getPropertyHistory,
  getMarketStatsByZip,
  getMarketTrends,
  getNearbyComps,
  getNeighborhoodData,
} from '../services/bridgeService.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function logCall(req, endpoint) {
  const userId = req.user?.id || 'unknown';
  console.log(`[Bridge] ${endpoint} | user=${userId} | ${new Date().toISOString()}`);
}

// GET /api/v1/bridge/property?address=...
router.get('/property', requireAuth, bridgeRateLimiter, async (req, res) => {
  const {
    address,
    county,
    state,
    city,
    zip,
  } = req.query;
  if (!address) return res.status(400).json({ error: 'address query param required' });
  logCall(req, 'property');
  try {
    const result = await getPropertyByAddress(address, { county, state, city, zip });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/bridge/parcels?county=...&state=...&city=...&zip=...
router.get('/parcels', requireAuth, bridgeRateLimiter, async (req, res) => {
  const { county, state, city, zip } = req.query;
  logCall(req, 'parcels');
  try {
    const result = await getParcels({ county, state, city, zip });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/bridge/history?parcelId=...
router.get('/history', requireAuth, bridgeRateLimiter, async (req, res) => {
  const { parcelId, county, state, city, zip } = req.query;
  if (!parcelId) return res.status(400).json({ error: 'parcelId query param required' });
  logCall(req, 'history');
  try {
    const result = await getPropertyHistory(parcelId, { county, state, city, zip });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/bridge/market?zip=...
router.get('/market', requireAuth, bridgeRateLimiter, async (req, res) => {
  const { zip, regionCounty, regionCity, regionState } = req.query;
  logCall(req, 'market');
  try {
    const result = await getMarketStatsByZip(zip, { regionCounty, regionCity, regionState });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/bridge/market-report?regionCounty=...&regionCity=...&regionState=...
router.get('/market-report', requireAuth, bridgeRateLimiter, async (req, res) => {
  const { regionCounty, regionCity, regionState } = req.query;
  logCall(req, 'market-report');
  try {
    const result = await getMarketReport({ regionCounty, regionCity, regionState });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/bridge/trends?zip=...&months=12
router.get('/trends', requireAuth, bridgeRateLimiter, async (req, res) => {
  const { zip, months = 12, regionCounty, regionCity, regionState } = req.query;
  logCall(req, 'trends');
  try {
    const result = await getMarketTrends(zip, parseInt(months, 10) || 12, {
      regionCounty, regionCity, regionState,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/bridge/comps?lat=...&lng=...&radius=1&type=...
router.get('/comps', requireAuth, bridgeRateLimiter, async (req, res) => {
  const { lat, lng, radius = 1, type = '' } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng query params required' });
  logCall(req, 'comps');
  try {
    const result = await getNearbyComps(
      parseFloat(lat), parseFloat(lng),
      parseFloat(radius) || 1,
      type,
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/bridge/neighborhood?zip=...
router.get('/neighborhood', requireAuth, bridgeRateLimiter, async (req, res) => {
  const { zip } = req.query;
  if (!zip) return res.status(400).json({ error: 'zip query param required' });
  logCall(req, 'neighborhood');
  try {
    const result = await getNeighborhoodData(zip);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
