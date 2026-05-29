import cron from 'node-cron';
import { reflectionService } from '../reflection/reflection.service.js';
import { User } from '../../models/User.js';
import { JournalEntry } from '../../models/JournalEntry.js';
import { sendReminderEmail } from '../../utils/email.js';

// WEEKLY REFLECTION GENERATION
// Every Sunday at 9 PM UTC
export const weeklyReflectionCron = cron.schedule('0 21 * * 0', async () => {
  console.log('[CRON] Starting weekly reflection generation...');
  try {
    await reflectionService.generateForAllUsers();
  } catch (error) {
    console.error('[CRON] Weekly reflection error:', error);
  }
}, { scheduled: false });

// JOURNAL REMINDER EMAILS
// Every day at 7 PM UTC — check users who haven't written recently
export const reminderCron = cron.schedule('0 19 * * *', async () => {
  console.log('[CRON] Checking journal reminders...');
  try {
    const users = await User.find({
      notificationsEnabled: true,
    }).select('_id name email reminderFrequency').lean();

    const now = new Date();

    for (const user of users) {
      const thresholdDays = {
        daily: 1,
        every3days: 3,
        weekly: 7,
      }[user.reminderFrequency] || 3;

      const threshold = new Date(now);
      threshold.setDate(threshold.getDate() - thresholdDays);

      const lastEntry = await JournalEntry.findOne({
        userId: user._id,
        createdAt: { $gte: threshold },
      }).select('_id').lean();

      if (!lastEntry) {
        const lastAny = await JournalEntry.findOne({ userId: user._id })
          .sort({ createdAt: -1 })
          .select('createdAt')
          .lean();

        const daysSince = lastAny
          ? Math.floor((now.getTime() - new Date(lastAny.createdAt).getTime()) / 86400000)
          : 0;

        await sendReminderEmail(user.email, user.name, daysSince).catch(console.error);
      }
    }
  } catch (error) {
    console.error('[CRON] Reminder error:', error);
  }
}, { scheduled: false });

export const startCronJobs = () => {
  weeklyReflectionCron.start();
  reminderCron.start();
  console.log('Cron jobs started');
};

export const stopCronJobs = () => {
  weeklyReflectionCron.stop();
  reminderCron.stop();
};
