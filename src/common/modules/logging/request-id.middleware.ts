import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

// Declaration merging rather than a cast at every read: `req.requestId` is then
// typed everywhere Express's `Request` is, and nothing has to remember what the
// middleware put there.
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}

// A short id per request, stamped on every line that request produces, so two
// concurrent requests can be told apart. Without it a rotation racing a logout —
// the exact scenario Phase 1.6 exists for — reads as three indistinguishable
// lines from two requests.
//
// **Middleware, not a helper called from the controller.** Nest's request
// lifecycle is middleware → guards → interceptors → handler, and
// `AllowedOriginGuard` also logs: a helper invoked inside the handler would run
// too late for the guard to see an id at all.
//
// Eight hex characters, not a full UUID. A full one makes every line unreadable
// and the only requirement is disambiguating requests alive at the same instant.
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        req.requestId = randomUUID().slice(0, 8);
        next();
    }
}
