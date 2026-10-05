/**
 * ForgeMuscle Chat Moderation & Profanity Filter
 */

const BAD_WORDS_REGEX = /\b(бля|блядь|хуй|хуя|хуе|пізд|пизд|єбат|ебат|мудак|гандон|гондон|залуп|сука|сучка|fuck|shit|bitch|asshole|cunt|kurwa|chuj|pierdol)\b/gi;

export function sanitizeChatMessage(text: string): { text: string; hasProfanity: boolean } {
  if (!text) return { text: '', hasProfanity: false };
  const hasProfanity = BAD_WORDS_REGEX.test(text);
  const cleaned = text.replace(BAD_WORDS_REGEX, (match) => '*'.repeat(match.length));
  return {
    text: cleaned,
    hasProfanity
  };
}

export async function reportChatMessage(messageId: string, reportedUserId: string, reason = 'Inappropriate language'): Promise<boolean> {
  try {
    const res = await fetch('/api/chat/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, reportedUserId, reason })
    });
    return res.ok;
  } catch {
    return false;
  }
}
