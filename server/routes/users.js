import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/users/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/users/stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [dealCount, docCount] = await Promise.all([
      prisma.deal.count({ where: { userId } }),
      prisma.document.count({ where: { deal: { userId } } }),
    ]);
    res.json({ dealCount, documentCount: docCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/users/seen-referral-modal
// Called once when user dismisses the onboarding modal
router.post('/seen-referral-modal', requireAuth, async (req, res) => {
  try {
    const { referralOptIn } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        hasSeenReferralModal: true,
        ...(referralOptIn !== undefined && { referralOptIn }),
      },
    });

    // If opting in, create/update the referral profile
    if (referralOptIn) {
      await prisma.referralProfile.upsert({
        where: { userId: req.user.id },
        update: { isOptedIn: true, isVisible: true },
        create: { userId: req.user.id, isOptedIn: true, isVisible: true },
      });
    }

    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
