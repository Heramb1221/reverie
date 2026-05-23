import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { JournalEntry } from '../models/JournalEntry';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError, AppError } from '../utils/response.js';
import { uploadToCloudinary, deleteFromCloudinary, CLOUDINARY_FOLDERS } from '../config/cloudinary.js';
import { revokeAllUserTokens } from '../utils/jwt';

// Search Router
export const searchRouter = Router();
searchRouter.use(authenticate);

searchRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user!.userId);
    const { q, mood, from, to, page = '1', limit = '20' } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { userId: uid };

    if (mood && ['calm', 'reflective', 'hopeful', 'overwhelmed'].includes(mood)) {
      filter.mood = mood;
    }

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) dateFilter.$lte = new Date(to);
      filter.createdAt = dateFilter;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const entries = await JournalEntry.find(filter)
      .select('-content')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    sendSuccess(res, { entries, query: { q, mood, from, to } });
  } catch (error) { next(error); }
});

// UPLOAD ROUTER
export const uploadRouter = Router();
uploadRouter.use(authenticate);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

uploadRouter.post('/image', upload.single('image'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'No image file provided', 400);
      return;
    }

    const folder = (req.query.folder as string) === 'avatar'
      ? CLOUDINARY_FOLDERS.AVATARS
      : CLOUDINARY_FOLDERS.JOURNAL_IMAGES;

    const { url, publicId } = await uploadToCloudinary(req.file.buffer, folder);
    sendSuccess(res, { url, publicId }, 'Image uploaded', 201);
  } catch (error) { next(error); }
});

uploadRouter.delete('/:publicId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    await deleteFromCloudinary(publicId);
    sendSuccess(res, null, 'Image deleted');
  } catch (error) { next(error); }
});

// USER ROUTER
export const userRouter = Router();
userRouter.use(authenticate);

userRouter.put('/profile', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allowed = ['name', 'theme', 'notificationsEnabled', 'reminderFrequency', 'publicKey', 'encryptedPrivateKey', 'encryptionSalt'];
    const updates: Record<string, unknown> = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const user = await User.findByIdAndUpdate(req.user!.userId, updates, { new: true, runValidators: true });
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, { user });
  } catch (error) { next(error); }
});

userRouter.get('/export', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user!.userId);
    const [user, entries] = await Promise.all([
      User.findById(uid).select('name email createdAt'),
      JournalEntry.find({ userId: uid }).select('-content').sort({ createdAt: -1 }).lean(),
    ]);

    sendSuccess(res, {
      exportedAt: new Date().toISOString(),
      user,
      totalEntries: entries.length,
      entries,
    });
  } catch (error) { next(error); }
});

userRouter.delete('/account', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user!.userId);

    // Delete all user data
    await Promise.all([
      JournalEntry.deleteMany({ userId: uid }),
      (await import('../models/Reflection.js')).Reflection.deleteMany({ userId: uid }),
      (await import('../models/MemoryCapsule.js')).MemoryCapsule.deleteMany({ userId: uid }),
      revokeAllUserTokens(uid),
      User.findByIdAndDelete(uid),
    ]);

    res.clearCookie('reverie_refresh');
    sendSuccess(res, null, 'Account permanently deleted');
  } catch (error) { next(error); }
});
