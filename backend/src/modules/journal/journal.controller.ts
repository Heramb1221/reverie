import { Request, Response, NextFunction } from 'express';
import { journalService } from './journal.service.js';
import { sendSuccess, parsePagination } from '../../utils/response.js';
import { MoodType } from '../../models/JournalEntry.js';

export const createEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entry = await journalService.createEntry({
      userId: req.user!.userId,
      ...req.body,
    });
    sendSuccess(res, { entry }, 'Entry created', 201);
  } catch (error) { next(error); }
};

export const getEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const mood = req.query.mood as MoodType | undefined;
    const result = await journalService.getEntries(req.user!.userId, page, limit, mood);
    sendSuccess(res, { entries: result.entries }, undefined, 200, result.pagination);
  } catch (error) { next(error); }
};

export const getEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entry = await journalService.getEntry(req.params.id, req.user!.userId);
    sendSuccess(res, { entry });
  } catch (error) { next(error); }
};

export const updateEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entry = await journalService.updateEntry({
      entryId: req.params.id,
      userId: req.user!.userId,
      ...req.body,
    });
    sendSuccess(res, { entry }, 'Entry updated');
  } catch (error) { next(error); }
};

export const deleteEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await journalService.deleteEntry(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'Entry deleted');
  } catch (error) { next(error); }
};

export const getCalendarEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ success: false, message: 'Invalid year or month' });
      return;
    }
    const entries = await journalService.getCalendarEntries(req.user!.userId, year, month);
    sendSuccess(res, { entries });
  } catch (error) { next(error); }
};

export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await journalService.getStats(req.user!.userId);
    sendSuccess(res, { stats });
  } catch (error) { next(error); }
};
