import api from '@/lib/axios';

const FORMAT = /^\S+@\S+\.\S+$/;

/**
 * Asks the server whether this email can still sign up. Sign-up forms use it BEFORE asking for a password.
 * Fails open: if the check cannot be made (offline, rate limit), the form carries on and the server's own check at
 * submit still refuses a taken email, so a hiccup never blocks a new person.
 */
export async function isEmailTaken(email: string): Promise<boolean> {
  const value = email.trim();
  if (!FORMAT.test(value)) return false;
  try {
    const res = await api.post('/auth/check-email', { email: value });
    return res.data?.data?.available === false;
  } catch {
    return false;
  }
}

export const EMAIL_TAKEN_MESSAGE = 'This email is already registered.';
