import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtPayload } from '../types';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_REFRESH_SECRET || 'rt-secret', // Fallback for dev
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: JwtPayload) {
        const authorization = req.get('authorization');
        if (!authorization) throw new ForbiddenException('Refresh token malformed');
        const refreshToken = authorization.replace('Bearer', '').trim();
        return {
            ...payload,
            refreshToken,
        };
    }
}
