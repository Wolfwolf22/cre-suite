import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/referrals/network — all visible opted-in profiles (excluding self)
router.get('/network', requireAuth, async (req, res) => {
  try {
    const { specialty, state } = req.query;
    const where = {
      isOptedIn: true,
      isVisible: true,
      userId: { not: req.user.id },
    };
    if (specialty) where.specialty = { has: specialty };
    if (state) where.state = state;

    const profiles = await prisma.referralProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { dealsCount: 'desc' },
    });

    res.json({ profiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/referrals/my-profile
router.get('/my-profile', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.referralProfile.findUnique({
      where: { userId: req.user.id },
    });
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/v1/referrals/my-profile — upsert own profile
router.put('/my-profile', requireAuth, async (req, res) => {
  try {
    const { isOptedIn, isVisible, specialty, state, yearsExperience, bio } = req.body;
    const data = {};
    if (isOptedIn !== undefined) data.isOptedIn = isOptedIn;
    if (isVisible !== undefined) data.isVisible = isVisible;
    if (specialty !== undefined) data.specialty = Array.isArray(specialty) ? specialty : [specialty];
    if (state !== undefined) data.state = state;
    if (yearsExperience !== undefined) data.yearsExperience = parseInt(yearsExperience) || null;
    if (bio !== undefined) data.bio = bio;

    const profile = await prisma.referralProfile.upsert({
      where: { userId: req.user.id },
      update: data,
      create: { userId: req.user.id, ...data },
    });

    // Also update hasSeenReferralModal and referralOptIn on user
    if (isOptedIn !== undefined) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { referralOptIn: isOptedIn, hasSeenReferralModal: true },
      });
    }

    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/referrals/request — send introduction request
router.post('/request', requireAuth, async (req, res) => {
  try {
    const { toUserId, dealDescription } = req.body;
    if (!toUserId) return res.status(400).json({ error: 'toUserId required' });

    // Verify the target exists and is visible
    const target = await prisma.referralProfile.findUnique({ where: { userId: toUserId } });
    if (!target || !target.isVisible) return res.status(404).json({ error: 'Profile not found' });

    const request = await prisma.referralRequest.create({
      data: {
        fromUserId: req.user.id,
        toUserId,
        dealDescription: dealDescription || null,
        status: 'pending',
      },
    });
    res.json({ request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/v1/referrals/request/:id — accept or decline
router.put('/request/:id', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'status must be accepted or declined' });
    }

    const request = await prisma.referralRequest.findFirst({
      where: { id: req.params.id, toUserId: req.user.id },
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const updated = await prisma.referralRequest.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ request: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/referrals/my-requests — requests sent and received
router.get('/my-requests', requireAuth, async (req, res) => {
  try {
    const [sent, received] = await Promise.all([
      prisma.referralRequest.findMany({
        where: { fromUserId: req.user.id },
        include: { toUser: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referralRequest.findMany({
        where: { toUserId: req.user.id },
        include: { fromUser: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    res.json({ sent, received });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
