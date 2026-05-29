import mongoose, { Document, Schema } from 'mongoose';

export type MoodType = 'calm' | 'reflective' | 'hopeful' | 'overwhelmed';

export interface IJournalImage {
  url: string;
  publicId: string;
  encryptedCaption?: string;
}

export interface IJournalEntry extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  plainTextContent?: string;
  contentPreview: string;
  tags: string[];
  encryptedSessionKey: string;
  iv: string;
  encryptionVersion: number;
  mood: MoodType;
  images: IJournalImage[];
  wordCount: number;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JournalImageSchema = new Schema<IJournalImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    encryptedCaption: { type: String },
  },
  { _id: false }
);

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    plainTextContent: { type: String, default: '' },
    contentPreview: { type: String, default: '' },
    tags: { type: [String], default: [] },
    encryptedSessionKey: { type: String, default: '' },
    iv: { type: String, default: '' },
    encryptionVersion: { type: Number, default: 1 },
    mood: {
      type: String,
      enum: ['calm', 'reflective', 'hopeful', 'overwhelmed'],
      required: true,
      index: true,
    },
    images: {
      type: [JournalImageSchema],
      default: [],
    },
    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for efficient user queries with date sorting
JournalEntrySchema.index({ userId: 1, createdAt: -1 });
// Index for calendar queries
JournalEntrySchema.index({ userId: 1, mood: 1, createdAt: -1 });

export const JournalEntry = mongoose.model<IJournalEntry>(
  'JournalEntry',
  JournalEntrySchema
);