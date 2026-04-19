import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { generateLOI } from '../services/aiService.js';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/loi/generate
router.post('/generate', requireAuth, aiRateLimiter, async (req, res) => {
  try {
    const {
      buyerName, sellerName, propertyAddress, purchasePrice, earnestMoney,
      dueDiligencePeriod, closingPeriod, financingContingency, specialConditions,
      dealId,
    } = req.body;

    // Validate required fields
    const required = { buyerName, sellerName, propertyAddress, purchasePrice, earnestMoney, dueDiligencePeriod, closingPeriod };
    const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    const inputs = {
      buyerName, sellerName, propertyAddress, purchasePrice, earnestMoney,
      dueDiligencePeriod, closingPeriod, financingContingency: !!financingContingency,
      specialConditions,
    };

    const loiData = await generateLOI(inputs);

    // Build plain text version for copy/fallback
    const loiText = loiData.error
      ? loiData.raw || 'Generation failed'
      : buildLoiText(loiData);

    // Auto-save to database
    let documentId = null;
    if (dealId) {
      const deal = await prisma.deal.findFirst({
        where: { id: dealId, userId: req.user.id },
      });
      if (deal) {
        const document = await prisma.document.create({
          data: {
            dealId,
            type: 'LOI',
            content: { text: loiText, structured: loiData, inputs },
          },
        });
        documentId = document.id;
      }
    }

    res.json({ content: loiText, structured: loiData, documentId });
  } catch (err) {
    console.error('LOI generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate LOI' });
  }
});

// POST /api/v1/loi/save
router.post('/save', requireAuth, async (req, res) => {
  try {
    const { dealId, content, inputs } = req.body;
    if (!dealId || !content) {
      return res.status(400).json({ error: 'dealId and content are required' });
    }

    const deal = await prisma.deal.findFirst({
      where: { id: dealId, userId: req.user.id },
    });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'deals', dealId, 'documents');
    await fs.mkdir(uploadsDir, { recursive: true });

    const document = await prisma.document.upsert({
      where: {
        id: req.body.documentId || 'new',
      },
      update: { content: { text: content, inputs }, updatedAt: new Date() },
      create: {
        dealId,
        type: 'LOI',
        content: { text: content, inputs },
      },
    });

    res.json({ document });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function buildLoiText(data) {
  if (!data || data.error) return '';
  const lines = [];
  lines.push(`Date: ${data.date || ''}`);
  lines.push('');
  lines.push('LETTER OF INTENT');
  lines.push('');
  if (data.re) lines.push(data.re);
  lines.push('');
  if (data.salutation) lines.push(data.salutation);
  lines.push('');
  if (data.intro) lines.push(data.intro);
  lines.push('');
  for (const sec of (data.sections || [])) {
    lines.push(`${sec.number}. ${sec.title}`);
    if (sec.body) lines.push(sec.body);
    for (const sub of (sec.subsections || [])) {
      lines.push(`  ${sub.number} ${sub.title}`);
      if (sub.body) lines.push(`  ${sub.body}`);
    }
    lines.push('');
  }
  if (data.closingText) lines.push(data.closingText);
  lines.push('');
  lines.push(`Buyer: ${data.buyerName || ''}`);
  lines.push('Signature: _____________________________');
  lines.push('Date: _____________________________');
  lines.push('');
  lines.push(`Seller: ${data.sellerName || ''}`);
  lines.push('Signature: _____________________________');
  lines.push('Date: _____________________________');
  return lines.join('\n');
}

export default router;
