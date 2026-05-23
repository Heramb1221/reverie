import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: env.EMAIL_USER ? {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    } : undefined,
  });
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!env.EMAIL_USER) {
    console.log(`[DEV] Email to ${options.to}: ${options.subject}`);
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    ...options,
  });
};

// EMAIL TEMPLATES
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Georgia, serif; background: #F4F2EE; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 48px auto; background: #fff; border-radius: 16px; overflow: hidden; }
    .header { background: #4A6B55; padding: 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 24px; margin: 0; font-weight: 400; font-style: italic; letter-spacing: -0.5px; }
    .body { padding: 40px; color: #3A3A36; }
    .body p { line-height: 1.7; font-size: 15px; margin-bottom: 16px; }
    .btn { display: inline-block; background: #4A6B55; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 100px; font-size: 14px; font-family: sans-serif; margin: 8px 0; }
    .footer { padding: 24px 40px; border-top: 1px solid #E8EBE6; color: #9B9B9B; font-size: 12px; font-family: sans-serif; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Reverie</h1></div>
    <div class="body">${content}</div>
    <div class="footer">A quiet space for your thoughts. · reverie.app</div>
  </div>
</body>
</html>
`;

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetUrl: string
): Promise<void> => {
  const html = baseTemplate(`
    <p>Hello ${name},</p>
    <p>You asked to reset your Reverie password. Click below to choose a new one. This link expires in 10 minutes.</p>
    <p><a class="btn" href="${resetUrl}">Reset my password</a></p>
    <p>If you didn't request this, you can safely ignore this email. Your journal is safe.</p>
  `);

  await sendEmail({
    to: email,
    subject: 'Reset your Reverie password',
    html,
  });
};

export const sendWelcomeEmail = async (
  email: string,
  name: string
): Promise<void> => {
  const html = baseTemplate(`
    <p>Hello ${name},</p>
    <p>Welcome to Reverie — your quiet space for thoughts, feelings, and memories.</p>
    <p>Your journal is ready. Write when you're ready. There's no rush here.</p>
    <p><a class="btn" href="${env.CLIENT_URL}/home">Open my journal</a></p>
    <p>With warmth,<br/>The Reverie team</p>
  `);

  await sendEmail({
    to: email,
    subject: 'Welcome to Reverie',
    html,
  });
};

export const sendReminderEmail = async (
  email: string,
  name: string,
  daysSince: number
): Promise<void> => {
  const message = daysSince === 0
    ? "You haven't written yet today."
    : `It's been ${daysSince} days since your last entry.`;

  const html = baseTemplate(`
    <p>Hello ${name},</p>
    <p>${message} Your journal is waiting quietly.</p>
    <p>Even a few words — what you noticed today, how the morning felt — is enough.</p>
    <p><a class="btn" href="${env.CLIENT_URL}/journal/new">Write something</a></p>
  `);

  await sendEmail({
    to: email,
    subject: 'Your journal is waiting',
    html,
  });
};
