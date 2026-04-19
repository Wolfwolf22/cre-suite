import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'branding');
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo_${req.user.id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG/JPG images allowed'));
    }
  },
});

// GET /api/v1/settings
router.get('/', requireAuth, async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { userId: req.user.id } });
    res.json({ settings: settings || { primaryColor: '#C8472A' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/v1/settings
router.put('/', requireAuth, async (req, res) => {
  try {
    const stringFields = ['companyName', 'agentName', 'licenseNumber', 'officeAddress',
      'city', 'state', 'zip', 'phone', 'email', 'website', 'primaryColor', 'tagline', 'bio'];
    const intFields = ['yearsExperience'];
    const boolFields = ['referralVisible'];
    const arrayFields = ['specialty'];

    const data = {};
    stringFields.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    intFields.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f] ? parseInt(req.body[f]) : null; });
    boolFields.forEach(f => { if (req.body[f] !== undefined) data[f] = Boolean(req.body[f]); });
    arrayFields.forEach(f => {
      if (req.body[f] !== undefined) {
        data[f] = Array.isArray(req.body[f]) ? req.body[f] : [];
      }
    });

    const settings = await prisma.settings.upsert({
      where: { userId: req.user.id },
      update: data,
      create: { userId: req.user.id, ...data },
    });

    // Sync specialty/bio/experience to referral profile if it exists
    if (data.specialty || data.bio || data.yearsExperience !== undefined) {
      const profile = await prisma.referralProfile.findUnique({ where: { userId: req.user.id } });
      if (profile) {
        await prisma.referralProfile.update({
          where: { userId: req.user.id },
          data: {
            ...(data.specialty && { specialty: data.specialty }),
            ...(data.bio !== undefined && { bio: data.bio }),
            ...(data.yearsExperience !== undefined && { yearsExperience: data.yearsExperience }),
          },
        });
      }
    }

    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/settings/logo
router.post('/logo', requireAuth, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const logoPath = `/uploads/branding/${req.file.filename}`;
    await prisma.settings.upsert({
      where: { userId: req.user.id },
      update: { logoPath },
      create: { userId: req.user.id, logoPath },
    });
    res.json({ logoPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
