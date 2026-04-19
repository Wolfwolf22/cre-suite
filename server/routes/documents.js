import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/documents - get all documents for user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { type } = req.query;
    const documents = await prisma.document.findMany({
      where: {
        deal: { userId: req.user.id },
        ...(type && { type }),
      },
      include: { deal: { select: { id: true, address: true, propertyType: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ documents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/documents/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        deal: { userId: req.user.id },
      },
      include: { deal: true },
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json({ document });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/v1/documents/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, deal: { userId: req.user.id } },
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
