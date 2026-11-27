/**
 * Deposit limits for the Requirements editor and the customer's order form. Kept here (not in jobs/requirements.ts)
 * so that file stays exactly the team lead's.
 */

/** Shop rule: a made-to-order job never starts production on less than this share paid (same as the server). */
export const MIN_DEPOSIT_PERCENT = 50;

/** A typed deposit percent kept between the minimum and 100. */
export const clampDeposit = (n: number) => Math.min(100, Math.max(MIN_DEPOSIT_PERCENT, Math.round(Number.isFinite(n) ? n : MIN_DEPOSIT_PERCENT)));
