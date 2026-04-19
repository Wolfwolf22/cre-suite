import rateLimit from 'express-rate-limit';

// 10 AI requests per user per hour
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => req.headers['x-clerk-user-id'] || req.ip,
  message: {
    error: 'Too many AI requests. You are limited to 10 AI requests per hour. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Bridge API rate limiter — 30 requests per user per hour
export const bridgeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  keyGenerator: (req) => req.headers['x-clerk-user-id'] || req.ip,
  message: {
    error: 'Bridge API rate limit reached. You are limited to 30 requests per hour. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  keyGenerator: (req) => req.headers['x-clerk-user-id'] || req.ip,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
