import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware to extract Clerk user from header and resolve to DB user
export async function requireAuth(req, res, next) {
  try {
    const clerkUserId = req.headers['x-clerk-user-id'];
    const userEmail = req.headers['x-clerk-user-email'];
    const userName = req.headers['x-clerk-user-name'];

    if (!clerkUserId) {
      return res.status(401).json({ error: 'Unauthorized: no user id provided' });
    }

    // Upsert user in DB so they always exist after first request
    const user = await prisma.user.upsert({
      where: { clerkId: clerkUserId },
      update: {
        email: userEmail || '',
        name: userName || null,
      },
      create: {
        clerkId: clerkUserId,
        email: userEmail || '',
        name: userName || null,
      },
    });

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
}
