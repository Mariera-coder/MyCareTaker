# Security Notes

## Supported Use

This repository is intended to be shared without committed secrets. Runtime secrets must be provided through environment variables or your deployment platform secret manager.

## Pre-Publish Checklist

1. Confirm `.env` is not staged.
2. Confirm no `.log` files are staged.
3. Replace placeholder JWT secrets in deployment environments.
4. Set `CORS_ORIGIN` to the exact frontend origin.
5. Treat seeded credentials as development-only.

## Known Hardening Gaps

- Authentication tokens are currently stored in browser storage rather than `httpOnly` cookies.
- Authentication endpoints do not yet have rate limiting.
- Demo seed data includes predictable credentials for local development.
