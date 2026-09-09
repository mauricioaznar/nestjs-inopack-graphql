import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { mailConstants } from '../../constants/mail';
import { mfaConstants } from '../../constants/mfa';

export interface SendMailParams {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

// The one seam between the app and however mail actually leaves the building.
// Everything above it (the auth service) asks for "send this MFA code to this
// address"; everything below it (SMTP, or the dev console) is chosen here from
// `mailConstants.transport`. A future provider (a transactional API) is a new
// `case` in `send`, and nothing that calls `sendMfaCode` changes.
@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    // Built lazily and reused: nodemailer's transporter holds a connection pool,
    // so one instance per process is correct, and we only pay to create it if
    // SMTP is actually the chosen transport and something actually sends.
    private transporter: Transporter | null = null;

    private getTransporter(): Transporter {
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                host: mailConstants.host,
                port: mailConstants.port,
                secure: mailConstants.secure,
                // Only pass credentials when a username is configured — an open
                // relay on the LAN legitimately needs none, and passing empty
                // strings makes nodemailer attempt a broken AUTH.
                auth: mailConstants.user
                    ? { user: mailConstants.user, pass: mailConstants.pass }
                    : undefined,
            });
        }
        return this.transporter;
    }

    // Throws on delivery failure. Callers decide what a failure means: the MFA
    // login path turns it into a user-visible "could not send the code" rather
    // than issuing tokens, so a mail outage denies access instead of granting it.
    async send(params: SendMailParams): Promise<void> {
        const from = `"${mailConstants.fromName}" <${mailConstants.fromAddress}>`;
        switch (mailConstants.transport) {
            case 'smtp':
                await this.getTransporter().sendMail({ from, ...params });
                return;
            case 'console':
                // Development only — `constants/mail.ts` never selects this in
                // production, precisely so a real MFA code cannot land in
                // `docker logs`. At `debug` level the whole body (code included)
                // is printed so the flow is testable with no mail server.
                this.logger.debug(
                    `[dev mail] to=${params.to} subject="${params.subject}"\n${params.text}`,
                );
                return;
            case 'unconfigured':
                throw new Error(
                    'Mail transport is not configured (MAIL_HOST unset). ' +
                        'Refusing to send mail in production.',
                );
        }
    }

    // The only template today. Kept here rather than in the auth service so the
    // wording and the transport live together; the auth service just supplies
    // the address and the code.
    async sendMfaCode({
        to,
        code,
    }: {
        to: string;
        code: string;
    }): Promise<void> {
        const minutes = mfaConstants.codeTtlMinutes;
        await this.send({
            to,
            subject: 'Tu código de verificación de INOPACK',
            text:
                `Tu código de verificación es: ${code}\n\n` +
                `Caduca en ${minutes} minutos. ` +
                `Si no intentaste iniciar sesión, puedes ignorar este correo.`,
        });
    }
}
