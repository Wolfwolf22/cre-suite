import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { generateCashFlowSummary } from '../services/aiService.js';
import { calculateCashFlow } from '../services/cashflowService.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/cashflow/analyze
router.post('/analyze', requireAuth, aiRateLimiter, async (req, res) => {
  try {
    const { dealId, ...inputs } = req.body;

    // Validate required fields
    const required = ['purchasePrice', 'downPaymentPercent', 'interestRate', 'loanTerm', 'grossRentalIncome', 'vacancyRate'];
    const missing = required.filter(f => !inputs[f] && inputs[f] !== 0);
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    const outputs = calculateCashFlow(inputs);

    // Generate AI deal summary
    let aiSummary = null;
    try {
      aiSummary = await generateCashFlowSummary(inputs, outputs);
    } catch (aiErr) {
      console.error('AI summary error:', aiErr.message);
    }

    // Auto-save to DB
    let cashFlowId = null;
    if (dealId) {
      const deal = await prisma.deal.findFirst({
        where: { id: dealId, userId: req.user.id },
      });
      if (deal) {
        const cf = await prisma.cashFlow.create({
          data: { dealId, inputs, outputs: { ...outputs, aiSummary } },
        });
        cashFlowId = cf.id;

        await prisma.document.create({
          data: {
            dealId,
            type: 'CASH_FLOW_ANALYSIS',
            content: { inputs, outputs, aiSummary },
          },
        });
      }
    }

    res.json({ outputs, aiSummary, cashFlowId });
  } catch (err) {
    console.error('Cash flow error:', err);
    res.status(500).json({ error: err.message || 'Cash flow analysis failed' });
  }
});

export default router;
