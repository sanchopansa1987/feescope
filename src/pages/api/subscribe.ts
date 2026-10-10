import type { APIRoute } from "astro";
import {
  EMAIL_RE,
  emailKey,
  normalizeEmail,
  tokenKey,
  type SignupEnv,
  type SignupRecord,
} from "../../lib/signup";

const RESEND_API = "https://api.resend.com/emails";

async function sendWelcomeEmail(
  env: SignupEnv,
  email: string,
  unsubscribeToken: string,
): Promise<void> {
  // No-op until RESEND_API_KEY + RESEND_FROM are set in Cloudflare Pages.
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) return;
  const unsubscribeUrl = `https://feescope.io/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [email],
      subject: "You're on the FeeScope list",
      html: `<p>Welcome to FeeScope — you're on the list.</p><p>You'll get one email when the live funding feed launches.</p><p><a href="${unsubscribeUrl}">Unsubscribe</a></p>`,
    }),
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as { runtime?: { env?: SignupEnv } }).runtime?.env ?? {};
  const kv = env.SIGNUPS;

  const json = (status: number, body: { ok: boolean }) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  if (!kv) {
    return json(500, { ok: false });
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    honeypot?: string;
  };

  // Honeypot: bots fill the hidden field, humans never see it.
  if (body.honeypot) {
    return json(200, { ok: true });
  }

  const raw = (body.email ?? "").trim();
  if (!raw || raw.length > 254 || !EMAIL_RE.test(raw)) {
    return json(400, { ok: false });
  }

  const email = normalizeEmail(raw);
  const existingRaw = await kv.get(emailKey(email));

  if (existingRaw) {
    const record = JSON.parse(existingRaw) as SignupRecord;
    if (!record.unsubscribed) {
      // Already subscribed and active — don't send a duplicate welcome email.
      return json(200, { ok: true });
    }
    // Re-subscribe after unsubscribe: clear the flag, issue a fresh token.
    record.unsubscribed = false;
    record.subscribedAt = new Date().toISOString();
    record.unsubscribeToken = crypto.randomUUID();
    await kv.put(emailKey(email), JSON.stringify(record));
    await kv.put(tokenKey(record.unsubscribeToken), email);
    await sendWelcomeEmail(env, email, record.unsubscribeToken).catch(() => {});
    return json(200, { ok: true });
  }

  const record: SignupRecord = {
    email,
    subscribedAt: new Date().toISOString(),
    source: "footer",
    unsubscribed: false,
    unsubscribeToken: crypto.randomUUID(),
  };
  await kv.put(emailKey(email), JSON.stringify(record));
  await kv.put(tokenKey(record.unsubscribeToken), email);
  await sendWelcomeEmail(env, email, record.unsubscribeToken).catch(() => {});

  return json(200, { ok: true });
};
