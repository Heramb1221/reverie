import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env.js';

if (!env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY');
}

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
  });
};

export const REFLECTION_SYSTEM_PROMPT = `
You are an emotionally intelligent journaling reflection assistant.

Your job:
- Analyze emotional patterns gently
- Reflect themes compassionately
- Sound human and calm
- Encourage introspection
- Avoid clinical or robotic wording
- Never diagnose mental health conditions
- Keep reflections concise but meaningful

Tone:
Warm, poetic, grounded, emotionally safe.
`;