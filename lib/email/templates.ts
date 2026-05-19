import { getAppUrl } from '@/lib/app-url';

export function wrapEmailHtml(title: string, body: string) {
  const appUrl = getAppUrl();
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#00c6ff,#0072ff);padding:24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:22px">${title}</h1>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    ${body}
    <p style="margin-top:24px;font-size:13px;color:#64748b">
      <a href="${appUrl}" style="color:#0072ff">adsstarter.com</a>
    </p>
  </div>
</div>`;
}

export function signupVerificationEmail(code: string, expiresMinutes: number) {
  const html = wrapEmailHtml(
    'Verify your email',
    `<p style="color:#334155;font-size:16px;line-height:1.6">Enter this code to finish creating your AdsStarter account:</p>
    <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0072ff;text-align:center;margin:24px 0">${code}</p>
    <p style="color:#64748b;font-size:14px">This code expires in ${expiresMinutes} minutes. If you did not sign up, ignore this email.</p>`
  );
  const text = `Your AdsStarter verification code is ${code}. It expires in ${expiresMinutes} minutes.`;
  return { html, text, subject: `${code} is your AdsStarter verification code` };
}
