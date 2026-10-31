// 254 is the longest address email servers accept. Checking length first keeps
// the pattern below fast: on long malformed input its time grows with length².
export const EMAIL_MAX_LENGTH = 254;

export function isValidEmail(email: string): boolean {
  return email.length <= EMAIL_MAX_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
