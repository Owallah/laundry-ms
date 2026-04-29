# FreshFlow — Laundry Management System

A production-ready, full-stack laundry business management system built with **Next.js 15**, **Supabase**, and **Tailwind CSS v4.2**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Components) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS v4.2 |
| Charts | Recharts |
| Icons | Lucide React |
| Payments | M-Pesa Daraja API (STK Push) + Cash |
| Language | TypeScript (strict) |

---

## Features

- **Dashboard** — Live KPIs, revenue charts (cash vs M-Pesa), order pipeline
- **Orders** — Drop-off/pickup, kg-based pricing, status flow, printable receipts
- **Customers** — Profiles, order history, spend tracking
- **Payments** — M-Pesa STK Push with real-time polling, cash recording, ledger
- **Staff & Shifts** — Team management, shift scheduling, clock-in tracking
- **Inventory** — Stock tracking, low-stock alerts, usage/restock transactions
- **Analytics** — 30-day revenue, service breakdown, top customers, completion rates

---

## Setup

### 1. Clone & install

```bash
git clone <your-repo>
cd laundry-ms
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase/schema.sql`
3. In **Authentication → Settings**, disable email confirmation for staff onboarding

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your values:

```env
# Supabase (from Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# M-Pesa Daraja (from developer.safaricom.co.ke)
MPESA_CONSUMER_KEY=xxx
MPESA_CONSUMER_SECRET=xxx
MPESA_SHORTCODE=174379          # sandbox shortcode
MPESA_PASSKEY=bfb279f9aa9b...   # sandbox passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback
MPESA_ENV=sandbox               # change to "production" when live

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Create the first admin user

In Supabase **Authentication → Users**, click "Invite user" or create a user. Then in **SQL Editor**, run:

```sql
INSERT INTO profiles (id, full_name, role, phone)
VALUES (
  '<paste-user-uuid-here>',
  'Admin User',
  'admin',
  '+254700000000'
);
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in.

---

## M-Pesa Integration

### Sandbox testing
- Use Safaricom sandbox credentials from [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
- Test phone: `254708374149` (sandbox test number)
- For the callback to work locally, use [ngrok](https://ngrok.com): `ngrok http 3000`
- Set `MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/payments/mpesa/callback`

### Going to production
1. Get approved on the Daraja portal
2. Switch `MPESA_ENV=production`
3. Update shortcode, passkey, and callback URL to your live domain

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/           # Login page
│   ├── (dashboard)/            # Protected routes
│   │   ├── dashboard/          # Main dashboard
│   │   ├── orders/             # Orders list + new + detail
│   │   ├── customers/          # Customers list + new + detail
│   │   ├── staff/              # Staff & shifts
│   │   ├── inventory/          # Inventory management
│   │   ├── payments/           # Payment ledger
│   │   └── analytics/          # Analytics & reports
│   └── api/                    # API routes
│       ├── orders/
│       ├── customers/
│       ├── staff/
│       └── payments/
│           └── mpesa/
│               ├── stk/        # Initiate STK push
│               ├── callback/   # Safaricom callback
│               └── status/     # Poll payment status
├── components/
│   ├── layout/                 # Sidebar, TopBar
│   ├── orders/                 # Order components
│   ├── customers/              # Customer components
│   ├── staff/                  # Staff components
│   ├── inventory/              # Inventory components
│   ├── payments/               # Payment panel
│   ├── analytics/              # Charts
│   └── ui/                     # Shared UI (StatusBadge, etc.)
├── lib/
│   ├── supabase/               # Client & server Supabase clients
│   ├── mpesa.ts                # M-Pesa API integration
│   └── utils.ts                # Formatters, helpers
└── types/index.ts              # All TypeScript types
```

---

## Deployment

### Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Add all environment variables in the Vercel project settings.

### Self-hosted

```bash
npm run build
npm start
```

---

## Database Schema

Key tables:
- `profiles` — Staff accounts (extends Supabase auth)
- `customers` — Customer records
- `orders` — Drop-off/pickup orders with kg-based pricing
- `order_status_history` — Full audit trail
- `payments` — Cash and M-Pesa transactions
- `shifts` — Staff shift scheduling
- `inventory_items` — Stock catalogue
- `inventory_transactions` — Stock movements

All tables have **Row Level Security** enabled. Authenticated users have full access (suitable for a single-tenant staff system). For multi-tenant, add tenant filtering to RLS policies.

---

## Customisation

### Adding new service types
Edit directly in the Supabase dashboard or run:
```sql
INSERT INTO service_types (name, price_per_kg, turnaround_hours)
VALUES ('Premium Wash', 350, 24);
```

### Changing the business name / branding
- Search and replace `FreshFlow` across the codebase
- Update colors in `src/app/globals.css` under `@theme`
- Update contact info in `OrderActions.tsx` (receipt print)
