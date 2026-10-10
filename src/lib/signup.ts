// Shared types + helpers for the footer email signup (Phase 2).
//
// Cloudflare KV stores two keys per subscriber so the unsubscribe link can
// resolve the record without a full scan:
//   email:<normalized email> -> SignupRecord JSON
//   token:<unsubscribeToken> -> normalized email

export interface SignupRecord {
  email: string;
  subscribedAt: string;
  source: string;
  unsubscribed: boolean;
  unsubscribeToken: string;
}

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export interface SignupEnv {
  SIGNUPS?: KVNamespace;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailKey(email: string): string {
  return `email:${email}`;
}

export function tokenKey(token: string): string {
  return `token:${token}`;
}
