import mongoose, { Document, Schema } from 'mongoose';
import { MoodType } from './JournalEntry.js';

export interface IMemoryCapsule extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  encryptedSessionKey: string;
  iv: string;
  mood: MoodType;
  images: Array<{ url: string; publicId: string }>;
  unlockDate: Date;
  openedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isLocked: boolean;
}

const MemoryCapsuleSchema = new Schema<IMemoryCapsule>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    encryptedSessionKey: { type: String, default: '' },
    iv: { type: String, default: '' },
    mood: {
      type: String,
      enum: ['calm', 'reflective', 'hopeful', 'overwhelmed'],
      required: true,
    },
    images: {
      type: [{ url: String, publicId: String }],
      default: [],
    },
    unlockDate: {
      type: Date,
      required: true,
    },
    openedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual: isLocked based on current time vs unlockDate
MemoryCapsuleSchema.virtual('isLocked').get(function () {
  return new Date() < this.unlockDate;
});

MemoryCapsuleSchema.index({ userId: 1, unlockDate: 1 });

export const MemoryCapsule = mongoose.model<IMemoryCapsule>(
  'MemoryCapsule',
  MemoryCapsuleSchema
);
