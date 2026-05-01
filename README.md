# u.ax4.cz

URL shortener with a built-in QR generator.

## Setup

```bash
bun install
cp .env.example .env  # then fill in DATABASE_URL
bunx prisma migrate dev --name init
bun dev
```

Open http://localhost:3000.

## Stack

- Next.js (App Router) on Vercel
- Neon Postgres + Prisma (with `@prisma/adapter-neon`)
- Client-side QR generation (`qrcode`)

## Deploy

1. Create a Neon project and copy the **pooled** connection string.
2. Set `DATABASE_URL` and `SHORT_URL_BASE` on Vercel.
3. Push to the `main` branch — Vercel runs `prisma generate && next build`.
4. Run `bunx prisma migrate deploy` against the Neon DB once before first deploy (or wire it into your deploy step).
