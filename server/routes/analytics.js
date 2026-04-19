import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/analytics/event
router.post('/event', requireAuth, async (req, res) => {
  try {
    const { toolName, action, dealId, metadata } = req.body;
    if (!toolName || !action) return res.status(400).json({ error: 'toolName and action required' });

    await prisma.analytics.create({
      data: {
        userId: req.user.id,
        toolName,
        action,
        dealId: dealId || null,
        metadata: metadata || null,
      },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/analytics/summary
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [events, deals, docCount] = await Promise.all([
      prisma.analytics.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.deal.findMany({ where: { userId } }),
      prisma.document.count({ where: { deal: { userId } } }),
    ]);

    // Tool usage counts
    const toolCounts = {};
    const TOOL_NAMES = ['LOI Generator', 'Property Intelligence', 'Cash Flow Analyzer',
      'Debt Screener', 'Lease Generator', 'Deal Analyzer'];

    TOOL_NAMES.forEach(t => { toolCounts[t] = { total: 0, started: 0, exported: 0, saved: 0 }; });

    events.forEach(e => {
      if (!toolCounts[e.toolName]) {
        toolCounts[e.toolName] = { total: 0, started: 0, exported: 0, saved: 0 };
      }
      toolCounts[e.toolName].total++;
      const a = e.action;
      if (toolCounts[e.toolName][a] !== undefined) toolCounts[e.toolName][a]++;
    });

    // Activity by day — last 30 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const recentEvents = events.filter(e => new Date(e.createdAt) >= cutoff);
    const byDay = {};
    // Pre-fill all 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      byDay[d.toISOString().slice(0, 10)] = 0;
    }
    recentEvents.forEach(e => {
      const day = new Date(e.createdAt).toISOString().slice(0, 10);
      if (byDay[day] !== undefined) byDay[day]++;
    });

    // Deal status counts
    const statusCounts = { Active: 0, 'Under Contract': 0, Completed: 0, Dead: 0 };
    deals.forEach(d => {
      const s = d.status || 'Active';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    const mostUsedEntry = Object.entries(toolCounts)
      .sort((a, b) => b[1].total - a[1].total)
      .find(([, v]) => v.total > 0);

    res.json({
      totalEvents: events.length,
      totalDeals: deals.length,
      totalDocuments: docCount,
      completedDeals: deals.filter(d => d.status === 'Completed').length,
      toolCounts,
      activityByDay: byDay,
      statusCounts,
      mostUsedTool: mostUsedEntry ? mostUsedEntry[0] : '—',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
