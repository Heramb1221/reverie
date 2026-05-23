import mongoose, { Document, Schema } from 'mongoose';
import { MoodType } from './JournalEntry.js';

export interface IMoodDistribution {
  calm: number;
  reflective: number;
  hopeful: number;
  overwhelmed: number;
}

export interface IReflection extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  weekStart: Date;
  weekEnd: Date;
  entriesAnalyzed: number;
  dominantMood: MoodType | null;
  moodDistribution: IMoodDistribution;
  content: string;        // Gemini-generated text (stored encrypted)
  encryptedSessionKey: string;
  iv: string;
  promptUsed: string;
  generatedAt: Date;
  createdAt: Date;
}

const ReflectionSchema = new Schema<IReflection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    entriesAnalyzed: { type: Number, default: 0 },
    dominantMood: {
      type: String,
      enum: ['calm', 'reflective', 'hopeful', 'overwhelmed', null],
      default: null,
    },
    moodDistribution: {
      calm: { type: Number, default: 0 },
      reflective: { type: Number, default: 0 },
      hopeful: { type: Number, default: 0 },
      overwhelmed: { type: Number, default: 0 },
    },
    content: { type: String, required: true },
    encryptedSessionKey: { type: String, default: '' },
    iv: { type: String, default: '' },
    promptUsed: { type: String, select: false },
    generatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        delete ret.__v;
        delete ret.promptUsed;
        return ret;
      },
    },
  }
);

// One reflection per user per week
ReflectionSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const Reflection = mongoose.model<IReflection>(
  'Reflection',
  ReflectionSchema
);
