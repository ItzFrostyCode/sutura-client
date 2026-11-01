'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { clearShopIntent, parseShopIntent, saveShopIntentFromUrl } from '@/lib/shopIntent';
export type SignupStep = 'email' | 'password' | 'inbox';

const KEY = 'sutura.ownerSignup';
const POLL_MS = 3000;

/**
 * Email-first shop sign-up. Three screens (email + agreement, password, "check your inbox"). Nothing exists on the
 * server until the emailed link is opened, so while waiting this asks "has it been opened?" every few seconds and
 * flips to "verified" by itself. The waiting state survives a refresh (sessionStorage).
 */
export function useOwnerSignup() {
  const [step, setStep] = useState<SignupStep>('email');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pollToken, setPollToken] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [expired, setExpired] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const restored = useRef(false);

  // Remember what the owner clicked on the landing page, and pick up a sign-up that was already waiting.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    saveShopIntentFromUrl(window.location.search);
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as { email: string; pollToken: string } | null;
      if (saved?.pollToken) {
        setEmail(saved.email);
        setPollToken(saved.pollToken);
        setStep('inbox');
      } else if (!parseShopIntent(window.location.search)) {
        clearShopIntent(); // a plain visit to sign up is a fresh start, not last week's trial click
      }
    } catch { /* nothing saved */ }
  }, []);

  const poll = useCallback(async (token: string) => {
    try {
      const res = await api.get(`/owner-signups/${token}`);
      const d = res.data.data as { status: 'pending' | 'verified' | 'expired'; resend_in: number };
      setResendIn(d.resend_in);
      if (d.status === 'verified') setVerified(true);
      setExpired(d.status === 'expired');
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) { // the sign-up was replaced or cleaned up: start over
        try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
        setPollToken(null);
        setStep('email');
      }
    }
  }, []);

  useEffect(() => {
    if (step !== 'inbox' || !pollToken || verified) return;
    poll(pollToken);
    const id = setInterval(() => poll(pollToken), POLL_MS);
    return () => clearInterval(id);
  }, [step, pollToken, verified, poll]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const goTo = (next: SignupStep) => { setError(''); setStep(next); };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/owner-signups', {
        email: email.trim(), password, password_confirmation: confirm, accept_terms: agreed,
      });
      const token = res.data.data.poll_token as string;
      setPollToken(token);
      setResendIn(res.data.data.resend_in ?? 60);
      try { sessionStorage.setItem(KEY, JSON.stringify({ email: email.trim(), pollToken: token })); } catch { /* optional */ }
      setStep('inbox');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create your sign-up. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!pollToken || resendIn > 0) return;
    setError('');
    try {
      const res = await api.post(`/owner-signups/${pollToken}/resend`);
      setResendIn(res.data.data.resend_in ?? 60);
      setExpired(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send the link again.'));
    }
  };

  const changeEmail = () => {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
    setPollToken(null);
    setPassword('');
    setConfirm('');
    goTo('email');
  };

  return {
    step, goTo, email, setEmail, agreed, setAgreed, password, setPassword, confirm, setConfirm,
    verified, expired, resendIn, busy, error, submit, resend, changeEmail,
  };
}

export type OwnerSignupState = ReturnType<typeof useOwnerSignup>;
