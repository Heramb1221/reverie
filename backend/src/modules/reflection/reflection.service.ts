import mongoose from 'mongoose';
import { Reflection } from '../../models/Reflection.js';
import { journalService } from '../journal/journal.service.js';
import { getGeminiModel, REFLECTION_SYSTEM_PROMPT } from '../../config/gemini.js';
import { AppError } from '../../utils/response.js';
import { MoodType } from '../../models/JournalEntry.js';

export class ReflectionService {

  // GENERATE WEEKLY REFLECTION
  async generateReflection(userId: string, weekStart?: Date): Promise<InstanceType<typeof Reflection>> {
    const uid = new mongoose.Types.ObjectId(userId);

    const now = weekStart || new Date();
    const start = this.getWeekStart(now);
    const end = this.getWeekEnd(start);

    // Check if already generated for this week
    const existing = await Reflection.findOne({ userId: uid, weekStart: start });
    if (existing) return existing;

    const entries = await journalService.getWeekEntries(userId, start, end);

    if (entries.length === 0) {
      throw new AppError('No journal entries found for this week', 404);
    }

    const moodDist = { calm: 0, reflective: 0, hopeful: 0, overwhelmed: 0 };
    entries.forEach(e => { moodDist[e.mood as MoodType]++; });

    const dominantMood = (Object.entries(moodDist).sort((a, b) => b[1] - a[1])[0]?.[0] || null) as MoodType | null;

    const entryTexts = entries
      .map((e, i) => `Entry ${i + 1} (${new Date(e.createdAt).toLocaleDateString()}, mood: ${e.mood}): ${e.content}`)
      .join('\n\n');

    const prompt = `${REFLECTION_SYSTEM_PROMPT}

Here are the journal entries from this week (${start.toLocaleDateString()} to ${end.toLocaleDateString()}):

${entryTexts}

Dominant mood this week: ${dominantMood}
Number of entries: ${entries.length}

Please write a warm, personal weekly reflection.`;

    let reflectionContent: string;
    try {
      const model = getGeminiModel();
      const result = await model.generateContent(prompt);
      reflectionContent = result.response.text().trim();
    } catch (error: any) {
      console.error('Gemini reflection error:', error);

      throw new AppError(
        error?.message || 'Could not generate reflection.',
        503
      );
    }

    const reflection = await Reflection.create({
      userId: uid,
      weekStart: start,
      weekEnd: end,
      entriesAnalyzed: entries.length,
      dominantMood,
      moodDistribution: moodDist,
      content: reflectionContent,
      promptUsed: prompt,
      generatedAt: new Date(),
    });

    return reflection;
  }

  // LIST REFLECTIONS
  async getReflections(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const uid = new mongoose.Types.ObjectId(userId);

    const [reflections, total] = await Promise.all([
      Reflection.find({ userId: uid })
        .sort({ weekStart: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Reflection.countDocuments({ userId: uid }),
    ]);

    return { reflections, total };
  }

  // LATEST REFLECTION
  async getLatestReflection(userId: string) {
    const uid = new mongoose.Types.ObjectId(userId);
    return Reflection.findOne({ userId: uid }).sort({ weekStart: -1 }).lean();
  }

  // GET SINGLE
  async getReflection(reflectionId: string, userId: string) {
    const reflection = await Reflection.findOne({
      _id: reflectionId,
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!reflection) throw new AppError('Reflection not found', 404);
    return reflection;
  }

  // WEEK HELPERS
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getWeekEnd(weekStart: Date): Date {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  // CRON: GENERATE FOR ALL USERS
  async generateForAllUsers(): Promise<void> {
    const { User } = await import('../../models/User.js');
    const users = await User.find({}).select('_id').lean();
    console.log(`[CRON] Generating reflections for ${users.length} users...`);

    const results = await Promise.allSettled(
      users.map(u => this.generateReflection(u._id.toString()))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`[CRON] Reflections done: ${succeeded} generated, ${failed} skipped/failed`);
  }
}

export const reflectionService = new ReflectionService();
