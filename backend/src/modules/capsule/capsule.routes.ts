import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { MemoryCapsule } from '../../models/MemoryCapsule.js';
import { authenticate } from '../../middleware/auth.js';
import { sendSuccess, AppError, parsePagination, getPaginationMeta } from '../../utils/response.js';
import { deleteFromCloudinary } from '../../config/cloudinary.js';

// SERVICE
const createCapsule = async (userId: string, data: Record<string, unknown>) => {
  const unlockDate = new Date(data.unlockDate as string);
  if (unlockDate <= new Date()) throw new AppError('Unlock date must be in the future', 400);

  return MemoryCapsule.create({
    userId: new mongoose.Types.ObjectId(userId),
    title: data.title,
    content: data.content,
    mood: data.mood,
    unlockDate,
    images: data.images || [],
    encryptedSessionKey: data.encryptedSessionKey || '',
    iv: data.iv || '',
  });
};

// CONTROLLER HANDLERS
const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const uid = new mongoose.Types.ObjectId(req.user!.userId);

    const [capsules, total] = await Promise.all([
      MemoryCapsule.find({ userId: uid })
        .sort({ unlockDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      MemoryCapsule.countDocuments({ userId: uid }),
    ]);

    // Mask content of locked capsules
    const safeCapsules = capsules.map(c => {
      const isLocked = new Date() < new Date(c.unlockDate);
      if (isLocked) {
        return { ...c, content: null, encryptedSessionKey: null, iv: null, isLocked };
      }
      return { ...c, isLocked };
    });

    sendSuccess(res, { capsules: safeCapsules }, undefined, 200, getPaginationMeta(total, page, limit));
  } catch (error) { next(error); }
};

const getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user!.userId);
    const capsule = await MemoryCapsule.findOne({ _id: req.params.id, userId: uid });
    if (!capsule) throw new AppError('Capsule not found', 404);

    const isLocked = new Date() < capsule.unlockDate;

    if (!isLocked && !capsule.openedAt) {
      capsule.openedAt = new Date();
      await capsule.save();
    }

    if (isLocked) {
      const safe = capsule.toJSON();
      sendSuccess(res, { capsule: { ...safe, content: null, encryptedSessionKey: null, iv: null, isLocked } });
    } else {
      sendSuccess(res, { capsule: { ...capsule.toJSON(), isLocked } });
    }
  } catch (error) { next(error); }
};

const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const capsule = await createCapsule(req.user!.userId, req.body);
    sendSuccess(res, { capsule }, 'Memory capsule sealed', 201);
  } catch (error) { next(error); }
};

const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user!.userId);
    const capsule = await MemoryCapsule.findOne({ _id: req.params.id, userId: uid });
    if (!capsule) throw new AppError('Capsule not found', 404);

    if (capsule.images.length > 0) {
      await Promise.allSettled(capsule.images.map(img => deleteFromCloudinary(img.publicId)));
    }

    await capsule.deleteOne();
    sendSuccess(res, null, 'Capsule deleted');
  } catch (error) { next(error); }
};

// ROUTES
const router = Router();
router.use(authenticate);

router.get('/',      list);
router.post('/',     create);
router.get('/:id',   getOne);
router.delete('/:id', remove);

export { router as capsuleRouter };
