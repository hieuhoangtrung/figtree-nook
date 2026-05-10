# 🏡 Figtree Nook

**Private Studio Booking Website** — Figtree, NSW, Australia

A full-stack Airbnb-style direct booking website for "Figtree Nook" private studio. Guests can browse photos, check availability, and book directly with Stripe payments. Hosts get a full admin dashboard.

## 🚀 Quick Start (Local with Docker)

### 1. Clone & configure
```bash
git clone https://github.com/hieuhoangtrung/figtree-nook.git
cd figtree-nook
cp .env.example .env
# Edit .env with your Stripe keys, SMTP, Airbnb iCal URL, etc.
```

### 2. Install dependencies
```bash
npm install
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

### 3. Start with Docker
```bash
docker-compose up --build
```

### 4. Run database migrations & seed
```bash
# In a new terminal (after containers are running)
docker exec figtree-nook-api npx prisma migrate dev --name init --schema=prisma/schema.prisma
docker exec figtree-nook-api node src/scripts/seed.js
```

### 5. Access the app
- 🌐 **Website:** http://localhost:3000
- 🔧 **Admin:** http://localhost:3000/admin (login with ADMIN_EMAIL/ADMIN_PASSWORD from .env)
- 📡 **API:** http://localhost:4000/api/health

---

## 🏗️ Architecture

```
figtree-nook/
├── apps/
│   ├── web/          # Next.js 14 frontend (guest site + admin dashboard)
│   └── api/          # Express.js backend REST API
├── packages/
│   └── db/           # Prisma schema (reference)
├── docker-compose.yml         # Local dev
├── docker-compose.prod.yml    # Production
└── .env.example
```

## 📦 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Payments | Stripe Checkout |
| Availability | Airbnb iCal sync (every 4h) + manual blocks |
| Email | Nodemailer (Gmail SMTP) |
| Deployment | Railway |

## 🔑 Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_... or sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `AIRBNB_ICAL_URL` | Airbnb iCal export URL from host dashboard |
| `SMTP_USER` / `SMTP_PASS` | Gmail SMTP credentials |
| `HOST_EMAIL` | Email to receive booking/message notifications |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin dashboard credentials |

## 🚀 Deployment (Railway)

1. Create a Railway project at https://railway.app
2. Add services: **web** (apps/web/Dockerfile), **api** (apps/api/Dockerfile), **PostgreSQL**
3. Set environment variables in Railway dashboard
4. Connect GitHub repo for auto-deploy on push to `main`

## 💳 Stripe Setup

1. Create Stripe account at https://stripe.com
2. Get API keys from Dashboard > Developers > API keys
3. Set up webhook: Dashboard > Webhooks > Add endpoint
   - URL: `https://your-api-domain.railway.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.expired`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## 📅 Airbnb iCal Sync

1. Go to Airbnb Host Dashboard
2. Navigate to Calendar > Availability settings
3. Export calendar → copy iCal URL
4. Set `AIRBNB_ICAL_URL` in `.env`
5. Sync runs automatically every 4 hours, or manually via Admin > Calendar > "Sync Airbnb iCal"

## 🔐 Admin Dashboard

Access at `/admin` — features:
- 📊 **Dashboard** — bookings stats, revenue, upcoming stays
- 📅 **Bookings** — view/manage all bookings, update status
- 🗓️ **Calendar** — block dates manually, sync Airbnb iCal
- 💬 **Messages** — guest enquiry inbox
- 💰 **Pricing** — update rates, fees, long-stay discounts
- ⭐ **Reviews** — manage displayed reviews
