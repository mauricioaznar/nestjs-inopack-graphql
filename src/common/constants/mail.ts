// Single access point for mail configuration, same convention as the other
// `constants/*` files. There was no mail capability in this backend before
// Phase 3; this is the whole of its configuration surface.
//
// Transport selection is deliberately implicit and safe by default:
//   • MAIL_HOST set          ⇒ real SMTP (nodemailer). The only mode that
//                              actually delivers mail.
//   • MAIL_HOST unset, dev   ⇒ a console transport that logs the message (and
//                              the MFA code) to stdout, so the whole flow is
//                              testable locally with no mail server at all.
//   • MAIL_HOST unset, prod  ⇒ `unconfigured`. Sending throws. This is the
//                              important one: a production console transport
//                              would print live MFA codes into `docker logs`
//                              and silently "succeed", so instead an
//                              MFA-enforced login fails loudly until real SMTP
//                              is set. It bounds the damage to enrolled accounts
//                              (password-only users are unaffected) rather than
//                              leaking codes.

import { readNumber } from './env';

export type MailTransportKind = 'smtp' | 'console' | 'unconfigured';

function resolveTransport(): MailTransportKind {
    if (process.env.MAIL_HOST) {
        return 'smtp';
    }
    return process.env.NODE_ENV === 'production' ? 'unconfigured' : 'console';
}

// The hostname the client announces in EHLO/HELO. Nodemailer otherwise uses the
// OS hostname, which on a cloud droplet is an unqualified name (e.g.
// `ubuntu-s-1vcpu-2gb-nyc1`) that Google's SMTP relay rejects at EHLO with a
// generic `421 4.7.0 Try again later, closing connection. (EHLO)`. A valid FQDN
// is required. Prefer an explicit `MAIL_EHLO_NAME` (the sending host's real
// FQDN, e.g. `stage.grupoinopack.com`); otherwise fall back to the MAIL_FROM
// domain, which is always a valid FQDN and keeps us from ever greeting with the
// bare OS hostname again. Empty only when there is no MAIL_FROM domain to derive.
function resolveEhloName(): string {
    if (process.env.MAIL_EHLO_NAME) {
        return process.env.MAIL_EHLO_NAME;
    }
    const from = process.env.MAIL_FROM || '';
    const at = from.lastIndexOf('@');
    return at >= 0 ? from.slice(at + 1) : '';
}

export const mailConstants = {
    transport: resolveTransport(),

    host: process.env.MAIL_HOST || '',
    ehloName: resolveEhloName(),
    port: readNumber('MAIL_PORT', 587),
    // STARTTLS on 587 is the common default, so `secure` (implicit TLS on 465)
    // is off unless explicitly asked for. Any non-empty non-"false" value is truthy.
    secure: process.env.MAIL_SECURE === 'true' || process.env.MAIL_PORT === '465',
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',

    // The From header. A real relay usually requires this to be an address it is
    // authorised to send as, so it is separate from the SMTP username.
    fromAddress: process.env.MAIL_FROM || 'no-reply@inopack.local',
    fromName: process.env.MAIL_FROM_NAME || 'INOPACK',
};
