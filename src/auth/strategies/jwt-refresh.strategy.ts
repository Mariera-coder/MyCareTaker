import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../../common/types';
import { extractJwtFromCookie, REFRESH_TOKEN_COOKIE } from '../auth.utils';

export class RefreshTokenUser {
    id!: string;
    email!: string;
    role!: string;
    refreshToken!: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh',
) {
    constructor(configService: ConfigService) {
        const secret = configService.getOrThrow<string>('JWT_REFRESH_SECRET');
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                extractJwtFromCookie(REFRESH_TOKEN_COOKIE),
            ]),
            ignoreExpiration: false,
            secretOrKey: secret,
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: JwtPayload): RefreshTokenUser {
        const refreshToken =
            extractJwtFromCookie(REFRESH_TOKEN_COOKIE)(req) ?? '';
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            refreshToken,
        };
    }
}
