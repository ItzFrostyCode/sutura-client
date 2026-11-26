import api from '@/lib/axios';

const FORMAT = /^\S+@\S+\.\S+$/;

/**
 * Asks the server whether this email can still sign up. Sign-up forms use it BEFORE asking for a password.
 * Fails open: if the check cannot be made (offline, rate limit), the form carries on and the server's own check at
 * submit still refuses a taken email, so a hiccup never blocks a new person.
 */
export async function isEmailTaken(email: string): Promise<boolean> {
  return (await checkSignupEmail(email)).taken;
}

/** Same check, plus whether the domain takes mail at all ("gmaill.com" or a made-up domain does not). Fails open too. */
export async function checkSignupEmail(email: string): Promise<{ taken: boolean; deliverable: boolean }> {
  const value = email.trim();
  if (!FORMAT.test(value)) return { taken: false, deliverable: true };
  try {
    const res = await api.post('/auth/check-email', { email: value });
    return { taken: res.data?.data?.available === false, deliverable: res.data?.data?.deliverable !== false };
  } catch {
    return { taken: false, deliverable: true };
  }
}

// Common slips on the big free mail domains. Some of these are real domains (so the DNS check passes them), but
// nobody's mailbox is there: catch them before the link goes to the wrong place.
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmail.om': 'gmail.com',
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'yahoo.con': 'yahoo.com',
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.co': 'outlook.com',
};

/** "juan@gmial.com" → "juan@gmail.com"; null when the domain looks right. */
export function suggestEmail(email: string): string | null {
  const [user, domain] = email.trim().toLowerCase().split('@');
  const fix = domain ? DOMAIN_TYPOS[domain] : undefined;
  return user && fix ? `${user}@${fix}` : null;
}

export const EMAIL_TAKEN_MESSAGE = 'This email is already registered.';
