import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { generateDealAnalysis } from '../services/aiService.js';
import { geocodeAddress, fetchAttomData, fetchCensusData } from '../services/propertyService.js';
import { getPropertyByAddress, getNearbyComps, getMarketStatsByZip, getMarketTrends, getNeighborhoodData } from '../services/bridgeService.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/deal-analyzer/analyze
router.post('/analyze', requireAuth, aiRateLimiter, async (req, res) => {
  try {
    const { dealId, ...inputs } = req.body;

    const required = ['propertyAddress', 'askingPrice', 'propertyType', 'currentNoi', 'targetMarket'];
    const missing = required.filter(f => !inputs[f] && inputs[f] !== 0);
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // STEP 1 — Bridge property lookup + geocode + ATTOM in parallel
    const [geocodeResult, attomResult, bridgePropertyResult] = await Promise.all([
      geocodeAddress(inputs.propertyAddress),
      fetchAttomData(inputs.propertyAddress),
      getPropertyByAddress(inputs.propertyAddress),
    ]);

    const lat = geocodeResult.success ? geocodeResult.lat : null;
    const lon = geocodeResult.success ? geocodeResult.lon : null;
    const zip = bridgePropertyResult.success ? bridgePropertyResult.data?.zip : null;

    // STEP 2-4 — Bridge comps / market / trends + census in parallel
    const [censusResult, bridgeCompsResult, bridgeMarketResult, bridgeTrendsResult, bridgeNeighborhoodResult] = await Promise.all([
      geocodeResult.success ? fetchCensusData(lat, lon, inputs.propertyAddress) : Promise.resolve({ success: false }),
      (lat && lon) ? getNearbyComps(lat, lon, 1, inputs.propertyType) : Promise.resolve({ success: false }),
      zip ? getMarketStatsByZip(zip) : Promise.resolve({ success: false }),
      zip ? getMarketTrends(zip, 12) : Promise.resolve({ success: false }),
      zip ? getNeighborhoodData(zip) : Promise.resolve({ success: false }),
    ]);

    const realData = {
      ...(bridgePropertyResult.success && { bridge: bridgePropertyResult.data }),
      ...(bridgeCompsResult.success && { bridgeComps: bridgeCompsResult.data }),
      ...(bridgeMarketResult.success && { bridgeMarket: bridgeMarketResult.data }),
      ...(bridgeTrendsResult.success && { bridgeTrends: bridgeTrendsResult.data }),
      ...(bridgeNeighborhoodResult.success && { bridgeNeighborhood: bridgeNeighborhoodResult.data }),
      ...(attomResult.success && { attom: attomResult.data }),
      ...(censusResult.success && { census: censusResult.data }),
      ...(geocodeResult.success && { geocode: { lat, lon } }),
    };

    const dataSources = {
      bridge: bridgePropertyResult.success,
      bridgeComps: bridgeCompsResult.success,
      bridgeMarket: bridgeMarketResult.success,
      bridgeTrends: bridgeTrendsResult.success,
      attom: attomResult.success,
      census: censusResult.success,
      geocode: geocodeResult.success,
    };

    const analysis = await generateDealAnalysis(inputs, realData);

    // Save comps and document to DB
    if (dealId) {
      const deal = await prisma.deal.findFirst({ where: { id: dealId, userId: req.user.id } });
      if (deal) {
        if (analysis.comparableSales?.length) {
          await prisma.comp.createMany({
            data: analysis.comparableSales.map(comp => ({
              dealId,
              address: comp.description || 'Unknown',
              capRate: comp.capRate || null,
              date: comp.date ? new Date(comp.date) : null,
              source: 'AI Research',
            })),
          });
        }
        await prisma.document.create({
          data: { dealId, type: 'DEAL_ANALYSIS', content: { inputs, analysis, realData, dataSources } },
        });
      }
    }

    res.json({ analysis, realData, dataSources });
  } catch (err) {
    console.error('Deal analysis error:', err);
    res.status(500).json({ error: err.message || 'Deal analysis failed' });
  }
});

export default router;
