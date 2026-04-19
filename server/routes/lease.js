import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { generateLease } from '../services/aiService.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/lease/generate
router.post('/generate', requireAuth, aiRateLimiter, async (req, res) => {
  try {
    const { dealId, ...inputs } = req.body;

    const required = ['landlordName', 'tenantName', 'propertyAddress', 'leaseType', 'baseRent', 'leaseStartDate', 'leaseEndDate'];
    const missing = required.filter(f => !inputs[f]);
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    const leaseText = await generateLease(inputs);

    // Auto-save to DB
    let documentId = null;
    if (dealId) {
      const deal = await prisma.deal.findFirst({
        where: { id: dealId, userId: req.user.id },
      });
      if (deal) {
        const doc = await prisma.document.create({
          data: {
            dealId,
            type: 'LEASE_AGREEMENT',
            content: { text: leaseText, inputs },
          },
        });
        documentId = doc.id;
      }
    }

    res.json({ content: leaseText, documentId });
  } catch (err) {
    console.error('Lease generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate lease' });
  }
});

export default router;
