import mongoose from 'mongoose';
import { JournalEntry, IJournalEntry, MoodType } from '../../models/JournalEntry.js';
import { AppError, getPaginationMeta } from '../../utils/response.js';
import { deleteFromCloudinary } from '../../config/cloudinary.js';

interface CreateEntryInput {
  userId: string;
  title: string;
  content: string;
  contentPreview: string;
  mood: MoodType;
  wordCount: number;
  encryptedSessionKey?: string;
  iv?: string;
  tags?: string[];
  images?: Array<{ url: string; publicId: string; encryptedCaption?: string }>;
}

interface UpdateEntryInput extends Partial<CreateEntryInput> {
  entryId: string;
}

export class JournalService {

  // CREATE
  async createEntry(data: CreateEntryInput): Promise<IJournalEntry> {
    const entry = await JournalEntry.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      title: data.title,
      content: data.content,
      contentPreview: data.contentPreview,
      mood: data.mood,
      wordCount: data.wordCount,
      encryptedSessionKey: data.encryptedSessionKey || '',
      iv: data.iv || '',
      tags: data.tags || [],
      images: data.images || [],
      encryptionVersion: 1,
    });
    return entry;
  }

  // LIST (paginated)
  async getEntries(
    userId: string,
    page: number,
    limit: number,
    mood?: MoodType
  ) {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };
    if (mood) filter.mood = mood;

    const [entries, total] = await Promise.all([
      JournalEntry.find(filter)
        .select('-content')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JournalEntry.countDocuments(filter),
    ]);

    return { entries, pagination: getPaginationMeta(total, page, limit) };
  }

  // GET SINGLE
  async getEntry(entryId: string, userId: string): Promise<IJournalEntry> {
    if (!mongoose.Types.ObjectId.isValid(entryId)) {
      throw new AppError('Invalid entry ID', 400);
    }
    const entry = await JournalEntry.findOne({
      _id: entryId,
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!entry) throw new AppError('Entry not found', 404);
    return entry;
  }

  // UPDATE
  async updateEntry(data: UpdateEntryInput): Promise<IJournalEntry> {
    const { entryId, userId, ...updates } = data;

    if (!mongoose.Types.ObjectId.isValid(entryId)) {
      throw new AppError('Invalid entry ID', 400);
    }

    const entry = await JournalEntry.findOneAndUpdate(
      { _id: entryId, userId: new mongoose.Types.ObjectId(userId!) },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!entry) throw new AppError('Entry not found', 404);
    return entry;
  }

  // DELETE
  async deleteEntry(entryId: string, userId: string): Promise<void> {
    const entry = await JournalEntry.findOne({
      _id: entryId,
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!entry) throw new AppError('Entry not found', 404);

    if (entry.images.length > 0) {
      await Promise.allSettled(
        entry.images.map(img => deleteFromCloudinary(img.publicId))
      );
    }

    await entry.deleteOne();
  }

  // CALENDAR VIEW
  // Returns lightweight entries for a given month
  async getCalendarEntries(
    userId: string,
    year: number,
    month: number
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const entries = await JournalEntry.find({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .select('mood createdAt wordCount')
      .sort({ createdAt: 1 })
      .lean();

    return entries;
  }

  // STATS
  async getStats(userId: string) {
    const uid = new mongoose.Types.ObjectId(userId);

    const [moodStats, wordStats, streak] = await Promise.all([
      JournalEntry.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: '$mood', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      JournalEntry.aggregate([
        { $match: { userId: uid } },
        {
          $group: {
            _id: null,
            totalEntries: { $sum: 1 },
            totalWords: { $sum: '$wordCount' },
            avgWords: { $avg: '$wordCount' },
          },
        },
      ]),
      this.calculateStreak(userId),
    ]);

    const totalStats = wordStats[0] || { totalEntries: 0, totalWords: 0, avgWords: 0 };

    return {
      moodDistribution: moodStats.reduce((acc: Record<string, number>, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      totalEntries: totalStats.totalEntries,
      totalWords: totalStats.totalWords,
      avgWordsPerEntry: Math.round(totalStats.avgWords || 0),
      currentStreak: streak,
    };
  }

  // STREAK CALCULATION
  private async calculateStreak(userId: string): Promise<number> {
    const uid = new mongoose.Types.ObjectId(userId);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const entries = await JournalEntry.find({ userId: uid })
      .select('createdAt')
      .sort({ createdAt: -1 })
      .limit(365)
      .lean();

    if (entries.length === 0) return 0;

    // Get unique dates (YYYY-MM-DD)
    const dates = [...new Set(entries.map(e =>
      new Date(e.createdAt).toISOString().split('T')[0]
    ))];

    let streak = 0;
    const checkDate = new Date();

    for (let i = 0; i < dates.length; i++) {
      const check = checkDate.toISOString().split('T')[0];
      if (dates[i] === check) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // GET WEEK ENTRIES (for AI reflection)
  async getWeekEntries(userId: string, weekStart: Date, weekEnd: Date) {
    return JournalEntry.find({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: weekStart, $lte: weekEnd },
    })
      .select('content mood createdAt wordCount')
      .sort({ createdAt: 1 })
      .lean();
  }
}

export const journalService = new JournalService();
