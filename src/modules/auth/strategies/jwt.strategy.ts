import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../../../common/constants/jwt';
import {
    AccessTokenPayload,
    AuthenticatedUser,
} from '../../../common/dto/entities';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.authSecret,
        });
    }

    // Passport assigns whatever this returns to `req.user`. It used to return
    // the raw payload (the whole user row); now it maps the slim payload into
    // the single shape `@CurrentUser()` and `GqlRolesGuard` consume.
    async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
        // A pre-Phase-0 token carried the user row and has no `sub`. Rejecting
        // it here means such a token can never produce a user with
        // `id: undefined` — it is simply an expired session.
        if (payload?.sub == null) {
            throw new UnauthorizedException();
        }
        return {
            id: payload.sub,
            email: payload.email,
            role_ids: payload.role_ids ?? [],
        };
    }
}
