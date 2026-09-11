import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

// Not `@Global()`, matching `LoggingModule`: a module that wants to send mail
// imports this deliberately. Today that is only `AuthModule` (email MFA).
@Module({
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
