import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { generateDebtAnalysis, generateAdvancedDebtAnalysis } from '../services/aiService.js';
import { calculateDebtMetrics } from '../services/debtService.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/debt/analyze
router.post('/analyze', requireAuth, aiRateLimiter, async (req, res) => {
  try {
    const { dealId, mode = 'basic', ...inputs } = req.body;

    const required = ['noi', 'purchasePrice', 'propertyType', 'requestedLtv', 'loanTerm', 'amortization'];
    const missing = required.filter(f => !inputs[f] && inputs[f] !== 0);
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    const calculations = calculateDebtMetrics(inputs);

    let aiAnalysis = null;
    try {
      if (mode === 'advanced') {
        aiAnalysis = await generateAdvancedDebtAnalysis(inputs, calculations);
      } else {
        aiAnalysis = await generateDebtAnalysis(inputs, calculations);
      }
    } catch (aiErr) {
      console.error('AI debt analysis error:', aiErr.message);
    }

    const outputs = { ...calculations, aiAnalysis, mode };

    if (dealId) {
      const deal = await prisma.deal.findFirst({ where: { id: dealId, userId: req.user.id } });
      if (deal) {
        const da = await prisma.debtAnalysis.create({ data: { dealId, inputs, outputs } });
        await prisma.document.create({
          data: { dealId, type: 'DEBT_ANALYSIS', content: { inputs, outputs } },
        });
      }
    }

    res.json({ calculations, aiAnalysis, mode });
  } catch (err) {
    console.error('Debt analysis error:', err);
    res.status(500).json({ error: err.message || 'Debt analysis failed' });
  }
});

export default router;
