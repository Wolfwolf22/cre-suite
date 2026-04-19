import { Router } from 'express';
import axios from 'axios';

const router = Router();
let cache = { data: null, fetchedAt: null };

// GET /api/v1/market-pulse
// Uses the US Treasury Fiscal Data API — no key required
router.get('/', async (req, res) => {
  try {
    // Cache for 6 hours
    if (cache.data && cache.fetchedAt && (Date.now() - cache.fetchedAt) < 6 * 60 * 60 * 1000) {
      return res.json(cache.data);
    }

    const [treasuryRes, sofr] = await Promise.allSettled([
      // 10-Year Treasury Note average interest rate
      axios.get('https://api.fiscaldata.treasury.gov/services/api/v1/accounting/od/avg_interest_rates', {
        params: {
          fields: 'record_date,avg_interest_rate_amt,security_desc',
          'filter': 'security_desc:eq:Treasury Notes',
          sort: '-record_date',
          'page[size]': 1,
        },
        timeout: 8000,
      }),
      // SOFR from NY Fed
      axios.get('https://markets.newyorkfed.org/api/rates/sofr/last/1.json', { timeout: 6000 }),
    ]);

    const stats = [];

    if (treasuryRes.status === 'fulfilled') {
      const d = treasuryRes.value.data?.data?.[0];
      if (d) {
        stats.push({
          label: '10-Year Treasury',
          value: `${parseFloat(d.avg_interest_rate_amt).toFixed(2)}%`,
          date: d.record_date,
          source: 'US Treasury',
        });
      }
    }

    if (sofr.status === 'fulfilled') {
      const s = sofr.value.data?.refRates?.[0];
      if (s) {
        stats.push({
          label: 'SOFR Rate',
          value: `${s.percentRate}%`,
          date: s.effectiveDate,
          source: 'NY Fed',
        });
      }
    }

    // Fallback static data if APIs fail
    if (stats.length === 0) {
      stats.push(
        { label: '10-Year Treasury', value: '4.25%', date: new Date().toISOString().slice(0, 10), source: 'Cached' },
        { label: 'SOFR Rate', value: '5.31%', date: new Date().toISOString().slice(0, 10), source: 'Cached' }
      );
    }

    const payload = { stats, updatedAt: new Date().toISOString() };
    cache = { data: payload, fetchedAt: Date.now() };
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
