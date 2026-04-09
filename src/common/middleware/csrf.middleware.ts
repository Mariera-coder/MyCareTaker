import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { ensureCsrfCookie, getCookieValue } from '../../auth/auth.utils';
import { CSRF_TOKEN_COOKIE } from '../../auth/auth.constants';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const csrfToken = ensureCsrfCookie(req, res, this.configService);

    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      next();
      return;
    }

    const headerToken = req.get('x-csrf-token');
    const cookieToken = getCookieValue(req, CSRF_TOKEN_COOKIE) ?? csrfToken;

    if (!headerToken || headerToken !== cookieToken) {
      res.status(403).json({
        message: 'Invalid CSRF token',
      });
      return;
    }

    next();
  }
}
