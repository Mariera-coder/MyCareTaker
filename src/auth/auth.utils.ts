import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from './auth.constants';

function parseDurationToMs(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.trim().match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!match) {
    return undefined;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [name, ...rest] = part.trim().split('=');
    if (!name) {
      return acc;
    }

    acc[name] = decodeURIComponent(rest.join('=') ?? '');
    return acc;
  }, {});
}

export function getCookieValue(req: Request, name: string): string | null {
  return parseCookies(req.headers.cookie)[name] ?? null;
}

export function extractJwtFromCookie(name: string) {
  return (req: Request): string | null => getCookieValue(req, name);
}

function isProduction(configService: ConfigService): boolean {
  return configService.get<string>('NODE_ENV') === 'production';
}

function getBaseCookieOptions(configService: ConfigService) {
  return {
    httpOnly: true,
    secure: isProduction(configService),
    sameSite: 'lax' as const,
    path: '/',
  };
}

export function setAuthCookies(
  res: Response,
  configService: ConfigService,
  accessToken: string,
  refreshToken: string,
): void {
  const accessMaxAge = parseDurationToMs(
    configService.get<string>('JWT_ACCESS_EXPIRATION'),
  );
  const refreshMaxAge = parseDurationToMs(
    configService.get<string>('JWT_REFRESH_EXPIRATION'),
  );

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...getBaseCookieOptions(configService),
    maxAge: accessMaxAge,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...getBaseCookieOptions(configService),
    maxAge: refreshMaxAge,
  });
}

export function clearAuthCookies(
  res: Response,
  configService: ConfigService,
): void {
  const options = getBaseCookieOptions(configService);
  res.clearCookie(ACCESS_TOKEN_COOKIE, options);
  res.clearCookie(REFRESH_TOKEN_COOKIE, options);
  res.clearCookie(CSRF_TOKEN_COOKIE, {
    httpOnly: false,
    secure: isProduction(configService),
    sameSite: 'lax',
    path: '/',
  });
}

export function setCsrfCookie(
  res: Response,
  configService: ConfigService,
  token: string,
): void {
  res.cookie(CSRF_TOKEN_COOKIE, token, {
    httpOnly: false,
    secure: isProduction(configService),
    sameSite: 'lax',
    path: '/',
  });
}

export function ensureCsrfCookie(
  req: Request,
  res: Response,
  configService: ConfigService,
): string {
  const existing = getCookieValue(req, CSRF_TOKEN_COOKIE);
  if (existing) {
    return existing;
  }

  const token = randomBytes(32).toString('hex');
  setCsrfCookie(res, configService, token);
  return token;
}

export {
  ACCESS_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
};
