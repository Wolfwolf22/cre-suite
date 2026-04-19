import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { generatePropertySummary } from '../services/aiService.js';
import { geocodeAddress, fetchAttomData, fetchCensusData, fetchFloodZoneData } from '../services/propertyService.js';
import { getPropertyByAddress, getPropertyHistory, getMarketStatsByZip, getNeighborhoodData } from '../services/bridgeService.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/property/lookup
router.post('/lookup', requireAuth, aiRateLimiter, async (req, res) => {
  try {
    const { address, dealId } = req.body;
    if (!address) return res.status(400).json({ error: 'address is required' });

    // Run all API calls in parallel - fail gracefully on each
    const [geocodeResult, attomResult, bridgePropertyResult] = await Promise.all([
      geocodeAddress(address),
      fetchAttomData(address),
      getPropertyByAddress(address),
    ]);

    let censusResult = { success: false, error: 'Geocoding failed - cannot fetch census data' };
    let floodResult = { success: false, error: 'Geocoding failed - cannot fetch flood data' };
    let bridgeMarketResult = { success: false };
    let bridgeNeighborhoodResult = { success: false };
    let bridgeHistoryResult = { success: false };

    const zip = bridgePropertyResult.success ? bridgePropertyResult.data?.zip : null;
    const parcelId = bridgePropertyResult.success ? bridgePropertyResult.data?.parcelId : null;

    const secondRound = [];
    if (geocodeResult.success) {
      secondRound.push(
        fetchCensusData(geocodeResult.lat, geocodeResult.lon, address),
        fetchFloodZoneData(geocodeResult.lat, geocodeResult.lon),
      );
    } else {
      secondRound.push(Promise.resolve(censusResult), Promise.resolve(floodResult));
    }
    secondRound.push(
      zip ? getMarketStatsByZip(zip) : Promise.resolve({ success: false }),
      zip ? getNeighborhoodData(zip) : Promise.resolve({ success: false }),
      parcelId ? getPropertyHistory(parcelId) : Promise.resolve({ success: false }),
    );

    [censusResult, floodResult, bridgeMarketResult, bridgeNeighborhoodResult, bridgeHistoryResult] =
      await Promise.all(secondRound);

    // Compile all data
    const rawData = {
      address,
      geocode: geocodeResult.success ? geocodeResult : null,
      bridge: bridgePropertyResult.success ? bridgePropertyResult.data : null,
      bridgeMarket: bridgeMarketResult.success ? bridgeMarketResult.data : null,
      bridgeNeighborhood: bridgeNeighborhoodResult.success ? bridgeNeighborhoodResult.data : null,
      bridgeHistory: bridgeHistoryResult.success ? bridgeHistoryResult.data : null,
      // ATTOM as fallback when Bridge has no ownership/valuation data
      attom: attomResult.success ? attomResult.data : null,
      census: censusResult.success ? censusResult.data : null,
      flood: floodResult.success ? floodResult.data : null,
    };

    // Build errors list for any failed sources
    const errors = [];
    if (!geocodeResult.success) errors.push({ source: 'Geocoding', error: geocodeResult.error });
    if (!bridgePropertyResult.success) errors.push({ source: 'Bridge Property Data', error: bridgePropertyResult.error });
    if (!attomResult.success) errors.push({ source: 'ATTOM Property Data', error: attomResult.error });
    if (!censusResult.success) errors.push({ source: 'Census Bureau', error: censusResult.error });
    if (!floodResult.success) errors.push({ source: 'FEMA Flood Zone', error: floodResult.error });

    // Generate AI summary from available data
    let aiSummary = null;
    try {
      aiSummary = await generatePropertySummary(rawData);
    } catch (aiErr) {
      errors.push({ source: 'AI Summary', error: aiErr.message });
    }

    // Auto-save to DB
    let propertyDataId = null;
    if (dealId) {
      const deal = await prisma.deal.findFirst({
        where: { id: dealId, userId: req.user.id },
      });
      if (deal) {
        const pd = await prisma.propertyData.create({
          data: {
            dealId,
            rawData: { ...rawData, aiSummary },
            source: 'multi-source',
          },
        });
        propertyDataId = pd.id;

        // Also save as a document
        await prisma.document.create({
          data: {
            dealId,
            type: 'PROPERTY_INTELLIGENCE',
            content: { rawData, aiSummary, errors },
          },
        });
      }
    }

    res.json({
      data: rawData,
      aiSummary,
      errors,
      propertyDataId,
    });
  } catch (err) {
    console.error('Property lookup error:', err);
    res.status(500).json({ error: err.message || 'Property lookup failed' });
  }
});

export default router;
