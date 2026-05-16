# Engagd Backoffice Setup and Run Guide

Source repo: engagd-backoffice @ f7ad5a4e1abc057c9c67fb766c4d8fd32a6b7659

## What it is

- Stack: Next.js 13.5, React 18, TypeScript
- App type: server-rendered React app

Implementation reference:
- `package.json`
- `next.config.js`

## Prerequisites

- Node.js 18.x (matches `@types/node` 18.x and Next 13.5)
- npm (package manager implied by `package.json` scripts)

## Environment configuration

The app uses Next.js public environment variables. Example values are in:
- `.env.development`
- `.env.test`
- `.env.production`

Key variables:
- `NEXT_PUBLIC_API_ENDPOINT` (base URL for gateway API)
- `NEXT_PUBLIC_HOST` (public host for the backoffice)
- `NEXT_PUBLIC_API_JWT_NAME` (token storage name)

Implementation reference:
- `.env.development`, `.env.test`, `.env.production`

## Local development

```bash
cd /mnt/e/git/engagd-backoffice
npm install
npm run dev
```

Default dev port:
- `3015` (from `package.json` scripts)

## Production build

```bash
cd /mnt/e/git/engagd-backoffice
npm install
npm run build
```

Output:
- Next.js build output in `.next/`

## Run production server

```bash
npm run start
```

For environment-specific runs:
- `npm run dev:prod`
- `npm run build:production`
- `npm run start:production`

## Deployment notes

- Next.js requires a Node runtime to serve `.next/` output unless exported as static (not configured here).
- There are no Dockerfiles in this repo; deploy with a Node process manager (systemd, PM2, etc.).

Implementation reference:
- `package.json` (scripts)
- `next.config.js`

