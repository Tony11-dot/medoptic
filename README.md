# MEDOPTIC — Website & Admin Platform

A premium single-page site for an optometry clinic & eyewear store, plus a full
admin dashboard. Built with **Next.js 16 (App Router) · React 19 · Tailwind v4 ·
Framer Motion**.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

Build & run production:

```bash
npm run build
npm start
```

## What's included

### Public site (`/`) — single page, scroll-based
- Sticky navbar with scroll-spy active highlighting + smooth anchor scrolling
- **Hero** ("Who We Are") with parallax + animated entrance
- **Products** grid with category filter and a details modal
- **Optometrists** cards with staggered scroll reveals
- **Booking** form (קביעת תור) — validated (phone/required/email), success state
- **Footer** (contact / hours / address / social) — all editable from admin
- Scroll progress bar, toasts, modals, hover/morph micro-interactions

### Tri-lingual (he / en / ru)
- Navbar language switcher, preference saved to `localStorage`
- **Hebrew is RTL**; English/Russian are LTR — `dir`/`lang` swap on `<html>`
- UI strings live in `src/lib/i18n/dictionary.ts`; page *content* is localized in
  the data layer and edited per-language in the admin.

### Admin dashboard (`/admin`)
- **Login** — demo password `medoptic` (set `ADMIN_PASSWORD` env to change)
- **Overview** — pending / approved-this-month / products / total stat cards
- **Appointments** — table with status & service filters, search, approve/decline
  (with custom decline reason), **bulk actions**, details modal. Approving or
  declining sends a (placeholder) SMS/email notification.
- **Products** — full CRUD with tri-lingual name/description, price, category and
  image upload. Changes appear on the site immediately.
- **Content** — tabbed editor (Who We Are / Optometrists / Footer) with image
  uploads and per-language fields.

> The admin UI itself is in English (a staff tool); the public site is fully
> tri-lingual as specified.

## Architecture

```
src/
  app/
    page.tsx              public single-page site (server component, reads data)
    layout.tsx            Rubik font + Language/Toast providers
    admin/                login, overview, queue, products, content
    api/                  route handlers (Next 16 async params/cookies)
      appointments, products, content, auth, notify, upload
  components/
    site/   Navbar, Hero, Products, Optometrists, Booking, Footer, Reveal…
    admin/  AdminShell (auth guard + nav), LocalizedField, ImageUpload
    ui/     Button, Modal, Toast, Logo, ImageBlock
  lib/
    db.ts          JSON-file "database" with per-file write locks
    seed.ts        default content + sample products
    i18n/          dictionary + LanguageProvider
    auth.ts        placeholder cookie session
    notify.ts      placeholder SMS/email (wire Twilio/SendGrid here)
    validation.ts  shared form/API validation
data/              runtime JSON store (gitignored; reseeds from seed.ts)
public/uploads/    uploaded images (gitignored)
```

## Notes & next steps (placeholders to wire up later)
- **Auth** (`src/lib/auth.ts`) — simple cookie session; swap for NextAuth / JWT.
- **Notifications** (`src/lib/notify.ts`) — logs instead of sending; drop in
  Twilio (SMS) and SendGrid (email).
- **Storage** (`src/lib/db.ts`) — JSON files; swap for Postgres/SQLite + Prisma.
- **Logo** (`src/components/ui/Logo.tsx`) — placeholder SVG wordmark; replace with
  the real MEDOPTIC asset (drop it in `/public`).
- **Images** — uploads use a plain `<img>`; switch to `next/image` + configured
  patterns for production optimization.

## Environment variables (optional)
| Var | Default | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | `medoptic` | Admin login password |
| `ADMIN_TOKEN` | `medoptic-session-ok` | Session cookie value |
