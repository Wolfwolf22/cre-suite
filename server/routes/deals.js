import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/deals
router.get('/', requireAuth, async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      where: { userId: req.user.id },
      include: {
        documents: { select: { id: true, type: true, createdAt: true } },
        cashFlows: { select: { id: true, createdAt: true } },
        debtAnalyses: { select: { id: true, createdAt: true } },
        propertyData: { select: { id: true, source: true, pulledAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ deals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/deals
router.post('/', requireAuth, async (req, res) => {
  try {
    const { address, propertyType } = req.body;
    if (!address || !propertyType) {
      return res.status(400).json({ error: 'address and propertyType are required' });
    }
    const deal = await prisma.deal.create({
      data: { userId: req.user.id, address, propertyType },
    });
    res.status(201).json({ deal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/deals/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const deal = await prisma.deal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        documents: true,
        cashFlows: true,
        debtAnalyses: true,
        propertyData: true,
        comps: true,
      },
    });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    res.json({ deal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/v1/deals/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { address, propertyType, status, closingDate, finalSalePrice, commission, closingNotes } = req.body;
    const deal = await prisma.deal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const updated = await prisma.deal.update({
      where: { id: req.params.id },
      data: {
        ...(address && { address }),
        ...(propertyType && { propertyType }),
        ...(status !== undefined && { status }),
        ...(closingDate !== undefined && { closingDate: closingDate ? new Date(closingDate) : null }),
        ...(finalSalePrice !== undefined && { finalSalePrice: finalSalePrice ? parseFloat(finalSalePrice) : null }),
        ...(commission !== undefined && { commission: commission ? parseFloat(commission) : null }),
        ...(closingNotes !== undefined && { closingNotes }),
      },
    });
    res.json({ deal: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/v1/deals/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deal = await prisma.deal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    await prisma.deal.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
