import { Router } from 'express';
import axios from 'axios';

const router = Router();
let cache = { data: null, fetchedAt: null };
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// GET /api/v1/news
router.get('/', async (req, res) => {
  try {
    if (cache.data && (Date.now() - cache.fetchedAt) < CACHE_TTL) {
      return res.json(cache.data);
    }

    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey || apiKey.startsWith('your_')) {
      return res.json({ articles: fallbackArticles(), source: 'fallback', fetchedAt: new Date().toISOString() });
    }

    try {
      const r = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: '"commercial real estate" OR "cap rate" OR "CMBS" OR "multifamily lending" OR "CRE market"',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 30,
          apiKey,
        },
        timeout: 8000,
      });

      const articles = (r.data.articles || [])
        .filter(a => a.title && a.url && !a.title.includes('[Removed]') && a.source?.name !== '[Removed]')
        .slice(0, 30);

      const payload = { articles, source: 'newsapi', fetchedAt: new Date().toISOString() };
      cache = { data: payload, fetchedAt: Date.now() };
      return res.json(payload);
    } catch (apiErr) {
      console.error('NewsAPI error:', apiErr.message);
    }

    // Fallback
    const payload = { articles: fallbackArticles(), source: 'fallback', fetchedAt: new Date().toISOString() };
    cache = { data: payload, fetchedAt: Date.now() };
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function fallbackArticles() {
  const now = Date.now();
  return [
    { title: 'Industrial Real Estate Demand Remains Strong as Supply Peaks', description: 'E-commerce and reshoring continue to drive leasing activity in warehouse and distribution markets, even as record new deliveries come online through mid-2026.', url: 'https://www.globest.com', source: { name: 'GlobeSt.com' }, publishedAt: new Date(now - 1800000).toISOString() },
    { title: 'Multifamily Cap Rates Compress in Major Sun Belt Markets', description: 'Investment volume in apartment communities picked up sharply in Q1 2026 as interest rate expectations stabilized and institutional capital returned to the sector.', url: 'https://www.costar.com', source: { name: 'CoStar News' }, publishedAt: new Date(now - 5400000).toISOString() },
    { title: 'Office Vacancy Hits Record Highs in Gateway Cities', description: 'Remote and hybrid work continue reshaping office demand. Several major markets now exceed 25% overall vacancy, putting pressure on landlords to convert or reposition assets.', url: 'https://www.bisnow.com', source: { name: 'Bisnow' }, publishedAt: new Date(now - 9000000).toISOString() },
    { title: 'CMBS Spreads Tighten as Investor Confidence Returns', description: 'Commercial mortgage-backed securities saw their tightest spreads in 18 months, reflecting renewed institutional appetite for fixed-rate CRE debt across all property types.', url: 'https://www.globest.com', source: { name: 'GlobeSt.com' }, publishedAt: new Date(now - 14400000).toISOString() },
    { title: 'Retail Real Estate Outperforms in Neighborhood and Strip Center Segment', description: 'Grocery-anchored strip centers continue to post strong rent growth and occupancy, bucking the broader retail narrative as experiential and necessity-based tenants thrive.', url: 'https://www.icsc.com', source: { name: 'ICSC' }, publishedAt: new Date(now - 21600000).toISOString() },
    { title: '1031 Exchange Volume Rebounds in Q1 2026', description: 'Deferral transaction activity surged as investors sought to redeploy capital from stabilized assets amid improving market liquidity and clearer interest rate outlook.', url: 'https://www.bisnow.com', source: { name: 'Bisnow' }, publishedAt: new Date(now - 28800000).toISOString() },
    { title: 'Life Insurance Companies Return as Top CRE Lenders', description: 'Life company allocations to commercial real estate debt hit a five-year high, drawn by attractive spreads on Class A industrial, multifamily, and well-leased office assets.', url: 'https://www.costar.com', source: { name: 'CoStar News' }, publishedAt: new Date(now - 36000000).toISOString() },
    { title: 'Self-Storage Cap Rates Stabilize After Correction', description: 'Self-storage fundamentals remain solid despite a wave of new supply. Street rates are stabilizing in most markets and operators report improving occupancy heading into summer.', url: 'https://www.globest.com', source: { name: 'GlobeSt.com' }, publishedAt: new Date(now - 43200000).toISOString() },
    { title: 'Senior Housing Demand Surge Drives Record Development Pipeline', description: 'Demographics are driving a significant wave of senior housing development, with memory care and assisted living facilities seeing occupancy levels not seen since pre-pandemic.', url: 'https://www.nic.org', source: { name: 'NIC' }, publishedAt: new Date(now - 50400000).toISOString() },
    { title: 'Net Lease Investors Flock to QSR and Medical Outpatient Assets', description: 'Single-tenant net lease investment continues to attract retail investors seeking predictable, long-term income from recession-resistant tenants with investment-grade credit ratings.', url: 'https://www.costar.com', source: { name: 'CoStar News' }, publishedAt: new Date(now - 57600000).toISOString() },
  ];
}

export default router;
