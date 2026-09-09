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

function readNumber(name: string, fallback: number): number {
    const raw = process.env[name];
    if (raw === undefined || raw === '') {
        return fallback;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
        throw new Error(`${name} must be a non-negative number, got "${raw}"`);
    }
    return value;
}

export type MailTransportKind = 'smtp' | 'console' | 'unconfigured';

function resolveTransport(): MailTransportKind {
    if (process.env.MAIL_HOST) {
        return 'smtp';
    }
    return process.env.NODE_ENV === 'production' ? 'unconfigured' : 'console';
}

export const mailConstants = {
    transport: resolveTransport(),

    host: process.env.MAIL_HOST || '',
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
