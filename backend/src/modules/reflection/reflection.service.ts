import mongoose from 'mongoose';
import { Reflection } from '../../models/Reflection.js';
import { journalService } from '../journal/journal.service.js';
import { getGeminiModel, REFLECTION_SYSTEM_PROMPT } from '../../config/gemini.js';
import { AppError } from '../../utils/response.js';
import { MoodType } from '../../models/JournalEntry.js';

export class ReflectionService {
  private getRequestId(provided?: string): string {
    return provided || `refl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private toPromptText(raw?: string): string {
    if (!raw) return '';
    return raw
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getGeminiErrorDetails(error: any) {
    return {
      message: error?.message || 'Unknown Gemini error',
      name: error?.name,
      httpStatus: error?.status ?? error?.statusCode ?? error?.response?.status ?? null,
      statusText: error?.statusText ?? error?.response?.statusText ?? null,
      apiResponse: error?.response?.data ?? error?.errorDetails ?? error?.details ?? null,
      possibleQuotaIssue: String(error?.message || '').toLowerCase().includes('quota')
        || String(error?.message || '').toLowerCase().includes('rate'),
      possibleInvalidKeyIssue: String(error?.message || '').toLowerCase().includes('api key')
        || String(error?.message || '').toLowerCase().includes('permission')
        || String(error?.message || '').toLowerCase().includes('unauthorized'),
      possibleModelIssue: String(error?.message || '').toLowerCase().includes('model')
        || String(error?.message || '').toLowerCase().includes('not found'),
      sdkErrorType: error?.constructor?.name || null,
    };
  }

  // GENERATE WEEKLY REFLECTION
  async generateReflection(
    userId: string,
    options?: { weekStart?: Date; forceRegenerate?: boolean; requestId?: string }
  ): Promise<InstanceType<typeof Reflection>> {
    const requestId = this.getRequestId(options?.requestId);
    const forceRegenerate = Boolean(options?.forceRegenerate);
    const uid = new mongoose.Types.ObjectId(userId);
    const now = options?.weekStart || new Date();
    const start = this.getWeekStart(now);
    const end = this.getWeekEnd(start);
    console.log(`[Reflection][${requestId}] generateReflection:start`, {
      userId,
      weekStart: start.toISOString(),
      weekEnd: end.toISOString(),
      forceRegenerate,
    });

    // Check if already generated for this week
    const existing = await Reflection.findOne({ userId: uid, weekStart: start });
    if (existing && !forceRegenerate) {
      console.log(`[Reflection][${requestId}] existing reflection returned`, {
        reflectionId: existing._id.toString(),
      });
      return existing;
    }
    if (existing && forceRegenerate) {
      console.log(`[Reflection][${requestId}] force deleting existing reflection`, {
        reflectionId: existing._id.toString(),
      });
      await existing.deleteOne();
    }

    const entries = await journalService.getWeekEntries(userId, start, end);
    console.log(`[Reflection][${requestId}] entries fetched`, {
      entriesCount: entries.length,
      entryIds: entries.map((e: any) => e._id?.toString?.() || String(e._id)),
    });

    if (entries.length === 0) {
      throw new AppError('No journal entries found for this week', 404);
    }

    const moodDist = { calm: 0, reflective: 0, hopeful: 0, overwhelmed: 0 };
    entries.forEach(e => { moodDist[e.mood as MoodType]++; });

    const dominantMood = (Object.entries(moodDist).sort((a, b) => b[1] - a[1])[0]?.[0] || null) as MoodType | null;

    const entryTexts = entries
      .map((e: any, i) => {
        const sourceText = this.toPromptText(
          e.plainTextContent || e.contentPreview || e.content
        );
        const boundedSourceText = sourceText.slice(0, 1500);
        return `Entry ${i + 1} (${new Date(e.createdAt).toLocaleDateString()}, mood: ${e.mood}): ${boundedSourceText}`;
      })
      .join('\n\n');
    console.log(`[Reflection][${requestId}] entry content prepared`, {
      sample: entryTexts.slice(0, 600),
      totalEntryTextLength: entryTexts.length,
    });

    const prompt = `${REFLECTION_SYSTEM_PROMPT}

Here are the journal entries from this week (${start.toLocaleDateString()} to ${end.toLocaleDateString()}):

${entryTexts}

Dominant mood this week: ${dominantMood}
Number of entries: ${entries.length}

Please write a warm, personal weekly reflection.`;

    console.log(`[Reflection][${requestId}] prompt prepared`, {
      promptLength: prompt.length,
      model: 'gemini-2.0-flash',
    });

    let reflectionContent: string;
    try {
      const model = getGeminiModel();
      console.log(`[Reflection][${requestId}] gemini request:start`);
      const result = await model.generateContent(prompt);
      console.log(`[Reflection][${requestId}] gemini request:success`);
      reflectionContent = result.response.text().trim();
      console.log(`[Reflection][${requestId}] gemini response:parsed`, {
        reflectionLength: reflectionContent.length,
        reflectionPreview: reflectionContent.slice(0, 300),
      });
      if (!reflectionContent) {
        throw new AppError('Gemini returned empty reflection text.', 503);
      }
    } catch (error: any) {
        const details = this.getGeminiErrorDetails(error);

        console.error(
          `[Reflection][${requestId}] gemini error`,
          details
        );

        const moodMessage =
          dominantMood === 'calm'
            ? 'You seemed to seek balance and quiet moments this week.'
            : dominantMood === 'hopeful'
            ? 'There were signs of optimism and forward movement this week.'
            : dominantMood === 'reflective'
            ? 'You spent time thinking deeply about your experiences.'
            : 'This week may have felt emotionally demanding at times.';

        reflectionContent = `
      ${moodMessage}

      AI reflection is temporarily unavailable.

      You wrote ${entries.length} journal ${
          entries.length === 1 ? 'entry' : 'entries'
        } this week.

      Take a moment to consider:

      • What stood out most?
      • What did you learn?
      • What challenged you?
      • What are you grateful for?
      • What do you want to improve next week?

      Growth often comes from noticing patterns rather than finding perfect answers.
        `.trim();

        console.log(
          `[Reflection][${requestId}] using fallback reflection`
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
    console.log(`[Reflection][${requestId}] reflection saved`, {
      reflectionId: reflection._id.toString(),
      entriesAnalyzed: reflection.entriesAnalyzed,
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