import {
    BadRequestException,
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { SessionMeta, TokenPair } from '../../common/dto/entities';
import {
    clearRefreshCookie,
    readRefreshCookie,
    setRefreshCookie,
} from './refresh-cookie';

// REST, not GraphQL, on purpose: these three endpoints exist to move an
// httpOnly cookie, and a cookie needs a stable URL path to be scoped to. The
// GraphQL transport cannot set one portably through the upload link.
//
// Every route is `@Public()` because the globally registered `GqlAuthGuard`
// resolves its request through `GqlExecutionContext`, which has no meaningful
// `req` on a plain HTTP route (the same reason `FilesController` is public).
// These endpoints therefore authenticate themselves: `login` by password,
// `refresh` and `logout` by the refresh cookie.
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() body: unknown,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ accessToken: string }> {
        // Hand-validated rather than via a global ValidationPipe: this app has
        // never registered one, and adding it globally would start validating
        // every GraphQL input in the repo at the same time.
        const credentials = readCredentials(body);

        const pair = await this.authService.loginWithCredentials(
            credentials,
            sessionMeta(req),
        );
        return this.respondWithPair(res, pair);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ accessToken: string }> {
        try {
            const pair = await this.authService.rotateRefreshToken(
                readRefreshCookie(req),
                sessionMeta(req),
            );
            return this.respondWithPair(res, pair);
        } catch (error) {
            // The cookie we were sent is worthless — drop it so the browser
            // stops replaying it on every reload.
            clearRefreshCookie(res);
            throw error;
        }
    }

    @Public()
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ success: true }> {
        await this.authService.logout(readRefreshCookie(req));
        clearRefreshCookie(res);
        return { success: true };
    }

    // The refresh token goes into the cookie and nowhere else; the response body
    // carries only the short-lived access token, which the frontend keeps in a
    // module variable rather than in localStorage.
    private respondWithPair(
        res: Response,
        pair: TokenPair,
    ): { accessToken: string } {
        setRefreshCookie(res, pair.refreshToken, pair.refreshExpiresAt);
        return { accessToken: pair.accessToken };
    }
}

function readCredentials(body: unknown): { email: string; password: string } {
    const candidate = body as { email?: unknown; password?: unknown } | null;
    const email = candidate?.email;
    const password = candidate?.password;
    if (typeof email !== 'string' || typeof password !== 'string') {
        throw new BadRequestException(
            'Could not log-in with the provided credentials',
        );
    }
    return { email, password };
}

function sessionMeta(req: Request): SessionMeta {
    return {
        userAgent: req.headers['user-agent'] ?? null,
        // Behind Nginx this is the proxy's address until Express is told to
        // trust the proxy — Phase 2 needs the real client IP for per-IP
        // throttling and will set that up. Stored as informational metadata
        // only; nothing authenticates on it.
        ip: req.ip ?? null,
    };
}
