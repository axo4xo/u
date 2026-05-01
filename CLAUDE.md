# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

URL shortener served from `https://u.ax4.cz/<slug>`. The page at `/` lets users mint short links and renders a QR code. Stack: Next.js (App Router) on Vercel, Neon Postgres, **Prisma 6** ORM (using Neon driver adapter — `previewFeatures = ["driverAdapters"]`). QR codes are generated client-side.

## Slug rules (these are deliberate — don't "simplify" them away)

- **Charset:** case-sensitive `[A-Za-z0-9]` only. No symbols — most URL-safe symbols get percent-encoded by messaging clients and end up *longer* than the alphanumeric form, defeating the point.
- **Random slugs start at 3 chars** and auto-bump length when collision-check failures cross a threshold (~5% of mints at the current length). Older short slugs keep working forever — the slug is just a lookup key, length doesn't affect resolution.
- **Custom slugs require min 4 chars** so the 3-char space stays owned by random mints (keeps short links short).
- **Reserved list** blocks system paths (`api`, `qr`, etc.) and anything we want to keep for ourselves. Reserved entries share the same namespace as user slugs.

## Runtime

Everything runs on Node (Vercel serverless). The Neon driver adapter would let `/[slug]/route.ts` run on Edge if redirect latency ever matters.

**Pin Prisma to v6.** Prisma 7 introduces a Drizzle-like generator (`prisma-client` instead of `prisma-client-js`, generated client outside `node_modules`, no `url` in datasource, manual `prisma.config.ts`) that the project owner explicitly rejects. Do not run `bun add prisma@latest` — pin to `^6`.

Use Neon's **pooled connection string** for `DATABASE_URL` — unpooled exhausts connections fast on Vercel.

## QR generation

Client-side only (e.g. `qrcode` or `qr-code-styling`). Default mode encodes the freshly minted short URL; a toggle exposes a "customizable QR for arbitrary text" mode as a secondary tool. Don't move QR generation server-side — it costs nothing on the client and keeps the customizable mode trivial.
