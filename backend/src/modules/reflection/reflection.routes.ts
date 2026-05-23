import { Router, Request, Response, NextFunction } from 'express';
import { reflectionService } from './reflection.service.js';
import { authenticate } from '../../middleware/auth.js';
import { aiLimiter } from '../../middleware/rateLimiter.js';
import { sendSuccess, parsePagination, getPaginationMeta } from '../../utils/response.js';

// CONTROLLER
const getReflections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const { reflections, total } = await reflectionService.getReflections(req.user!.userId, page, limit);
    sendSuccess(res, { reflections }, undefined, 200, getPaginationMeta(total, page, limit));
  } catch (error) { next(error); }
};

const getLatest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reflection = await reflectionService.getLatestReflection(req.user!.userId);
    sendSuccess(res, { reflection });
  } catch (error) { next(error); }
};

const getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reflection = await reflectionService.getReflection(req.params.id, req.user!.userId);
    sendSuccess(res, { reflection });
  } catch (error) { next(error); }
};

const generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reflection = await reflectionService.generateReflection(req.user!.userId);
    sendSuccess(res, { reflection }, 'Reflection generated', 201);
  } catch (error) { next(error); }
};

// ROUTES
const router = Router();
router.use(authenticate);

router.get('/',         getReflections);
router.get('/latest',   getLatest);
router.post('/generate', aiLimiter, generate);
router.get('/:id',      getOne);

export { router as reflectionRouter };
