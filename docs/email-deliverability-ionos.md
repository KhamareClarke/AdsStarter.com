# Fix AdsStarter email delivery (IONOS → Gmail)

If SMTP returns `250 OK` but Gmail never receives mail (or you get bounces from `mailer-daemon@kundenserver.de`), the domain is not authenticated.

## 1. Add SPF (required)

1. Log in to [IONOS](https://www.ionos.co.uk/)
2. **Domains & SSL** → `adsstarter.com` → **DNS**
3. **Add record** → **IONOS SPF (TXT)** → **Save**

Or add manually:

| Type | Host | Value |
|------|------|--------|
| TXT | `@` | `v=spf1 include:_spf-eu.ionos.com ~all` |

Wait 1–24 hours, then test again.

## 2. Enable DKIM

1. **Email** → select `admin@adsstarter.com` (or domain)
2. **DKIM** → Activate
3. Add any CNAME records IONOS shows to DNS

## 3. Confirm mailbox exists

**Email** → **Mailboxes** → `admin@adsstarter.com` must exist and be active.

## 4. Env vars (local + Vercel)

```env
EMAIL_USER=admin@adsstarter.com
EMAIL_PASS=your-ionos-mailbox-password
EMAIL_SMTP_HOST=smtp.ionos.co.uk
EMAIL_SMTP_PORT=587
```

UK accounts use `smtp.ionos.co.uk`. US accounts use `smtp.ionos.com`.

## 5. Test

```bash
node --env-file=.env.local scripts/send-diagnostic-email.mjs your@gmail.com
```

Check Gmail **Spam** and search `AdsStarter test`.

## Temporary workaround

Until SPF propagates, send from Gmail:

```env
EMAIL_USER=khamareclarke@gmail.com
EMAIL_PASS=your-google-app-password
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
```

Create an [App Password](https://myaccount.google.com/apppasswords) (2FA required).
