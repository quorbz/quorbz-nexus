import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config.js';

let bot: TelegramBot | null = null;

export function initTelegram(): void {
  if (!config.telegramBotToken) {
    console.warn('[nexus] NEXUS_TELEGRAM_BOT_TOKEN not set — Telegram alerts disabled');
    return;
  }
  bot = new TelegramBot(config.telegramBotToken, { polling: false });
  console.log('[nexus] Telegram alert bot initialised');
}

export async function sendAlert(text: string): Promise<void> {
  if (!bot || !config.telegramAdminChatId) return;
  try {
    await bot.sendMessage(config.telegramAdminChatId, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[nexus] Telegram alert failed:', err);
  }
}

export async function sendOtp(chatId: string, otp: string): Promise<void> {
  if (!bot) {
    console.warn('[nexus] Cannot send OTP — Telegram bot not initialised');
    return;
  }
  await bot.sendMessage(chatId, `*Quorbz Nexus* login code: \`${otp}\`\n\nExpires in 5 minutes.`, {
    parse_mode: 'Markdown',
  });
}
