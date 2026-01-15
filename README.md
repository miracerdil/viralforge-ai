# ViralForge AI

A production-ready SaaS application that uses AI to analyze TikTok videos and provide actionable recommendations to increase views and engagement.

## Features

- **AI-Powered Video Analysis**: Upload TikTok videos and get detailed AI analysis including hook scores, viral potential, and content recommendations
- **Multi-Language Support**: Full Turkish (TR) and English (EN) localization with URL-based routing
- **A/B Test Predictor**: Compare different hooks, captions, or cover text to determine which will perform better
- **Free & Pro Plans**: Quota enforcement for free users (1 analysis/day) with unlimited access for Pro subscribers
- **Stripe Integration**: Subscription billing with webhook support for plan management
- **Supabase Backend**: Authentication (email + Google OAuth), PostgreSQL database, and file storage
- **Super Admin Panel**: User management, plan overrides, comped access, account disable/enable, and Stripe info viewing

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: Stripe Subscriptions
- **AI**: OpenAI API (GPT-4o)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account
- OpenAI API key

### 1. Clone and Install

```bash
git clone <repository-url>
cd viralforge-ai
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the SQL migrations:
   - Go to **SQL Editor** in your Supabase dashboard
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Run the migration
   - Copy the contents of `supabase/migrations/002_admin_features.sql`
   - Run the second migration

3. Set up Authentication:
   - Go to **Authentication** > **Providers**
   - Enable **Email** provider
   - Enable **Google** provider (optional):
     - Create OAuth credentials in Google Cloud Console
     - Add the Client ID and Secret to Supabase

4. Create Storage Buckets:
   - Go to **Storage**
   - Create two buckets:
     - `videos` (private)
     - `frames` (private)
   - For each bucket, add these RLS policies:
     ```sql
     -- Allow authenticated users to upload to their own folder
     CREATE POLICY "Users can upload own files" ON storage.objects
     FOR INSERT WITH CHECK (
       bucket_id = 'videos' AND
       auth.uid()::text = (storage.foldername(name))[1]
     );

     -- Allow users to view their own files
     CREATE POLICY "Users can view own files" ON storage.objects
     FOR SELECT USING (
       bucket_id = 'videos' AND
       auth.uid()::text = (storage.foldername(name))[1]
     );

     -- Allow users to delete their own files
     CREATE POLICY "Users can delete own files" ON storage.objects
     FOR DELETE USING (
       bucket_id = 'videos' AND
       auth.uid()::text = (storage.foldername(name))[1]
     );
     ```
     (Repeat for `frames` bucket)

5. Get your API keys:
   - Go to **Settings** > **API**
   - Copy the `URL`, `anon key`, and `service_role key`

### 3. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)

2. Create a Product:
   - Go to **Products** > **Add product**
   - Name: "ViralForge Pro"
   - Pricing: Recurring, Monthly
   - Price: $29/month (or your preferred pricing)
   - Copy the **Price ID** (starts with `price_`)

3. Set up Webhook:
   - Go to **Developers** > **Webhooks**
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`
     - `invoice.payment_failed`
   - Copy the **Webhook signing secret**

4. Get API Keys:
   - Go to **Developers** > **API keys**
   - Copy the **Secret key**

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx
OPENAI_API_KEY=sk-proj-xxx
SUPERADMIN_EMAILS=admin@example.com
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll be redirected to `/tr` (Turkish, default language).

## Deployment to Vercel

1. Push your code to GitHub

2. Connect to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add all environment variables from `.env.local`
   - Deploy

3. Update URLs:
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel domain
   - Update Stripe webhook URL
   - Update Supabase OAuth redirect URLs

## Super Admin Panel

### Configuration

1. Add admin emails to your `.env.local`:
```
SUPERADMIN_EMAILS=admin@example.com,another-admin@example.com
```

2. Run the admin migration (`002_admin_features.sql`) if you haven't already.

### Features

Access the admin panel at `/{locale}/admin` (e.g., `/en/admin` or `/tr/admin`). Only users with emails in the `SUPERADMIN_EMAILS` list can access it.

- **User Management**: View all users with search and pagination
- **Plan Management**: Upgrade/downgrade users between FREE and PRO plans
- **Comped Access**: Grant free Pro access until a specific date
- **Account Status**: Enable/disable user accounts
- **Quota Reset**: Reset a user's daily usage quota
- **Stripe Info**: View Stripe customer ID, subscription status, and recent invoices

### Disabled Accounts

When an admin disables a user account:
- The user is redirected to a "Account Disabled" page
- They cannot access protected routes (dashboard, analysis, etc.)
- They can still contact support or log out

## Localization

### How It Works

- URL-based routing: `/tr/*` for Turkish, `/en/*` for English
- Default language: Turkish
- Language switcher available on all pages
- User preference stored in localStorage

### File Structure

```
lib/i18n/
├── config.ts           # Locale configuration
├── getDictionary.ts    # Dictionary loader
└── dictionaries/
    ├── tr.json         # Turkish translations
    └── en.json         # English translations
```

### Adding New Strings

1. Add the key to both `tr.json` and `en.json`:

```json
// lib/i18n/dictionaries/tr.json
{
  "mySection": {
    "newKey": "Türkçe metin"
  }
}

// lib/i18n/dictionaries/en.json
{
  "mySection": {
    "newKey": "English text"
  }
}
```

2. Use in components:

```tsx
// Server Component
import { getDictionary } from '@/lib/i18n/getDictionary';

export default async function MyPage({ params }) {
  const dictionary = await getDictionary(params.locale);
  return <p>{dictionary.mySection.newKey}</p>;
}

// Client Component
'use client';
import { useEffect, useState } from 'react';

export function MyComponent({ locale }) {
  const [dictionary, setDictionary] = useState(null);

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`)
      .then(m => setDictionary(m.default));
  }, [locale]);

  return <p>{dictionary?.mySection.newKey}</p>;
}
```

### Adding a New Language

1. Create the dictionary file: `lib/i18n/dictionaries/de.json`

2. Update `lib/i18n/config.ts`:
```typescript
export const locales = ['tr', 'en', 'de'] as const;
```

3. Update `lib/i18n/getDictionary.ts`:
```typescript
const dictionaries = {
  tr: () => import('./dictionaries/tr.json').then(m => m.default),
  en: () => import('./dictionaries/en.json').then(m => m.default),
  de: () => import('./dictionaries/de.json').then(m => m.default),
};
```

## Project Structure

```
viralforge-ai/
├── app/
│   ├── api/                    # API routes
│   │   ├── analyze/            # Video analysis endpoint
│   │   ├── abtest/             # A/B test endpoint
│   │   ├── admin/              # Admin API endpoints
│   │   ├── auth/callback/      # OAuth callback
│   │   └── stripe/             # Stripe endpoints
│   ├── [locale]/               # Locale-based routing
│   │   ├── (public)/           # Public pages
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── pricing/        # Pricing page
│   │   │   ├── login/          # Login page
│   │   │   ├── signup/         # Signup page
│   │   │   └── disabled/       # Disabled account page
│   │   ├── (app)/              # Protected pages
│   │   │   ├── dashboard/      # Dashboard
│   │   │   ├── analysis/[id]/  # Analysis results
│   │   │   └── abtest/         # A/B test page
│   │   └── admin/              # Admin panel (super admin only)
│   └── globals.css
├── components/
│   ├── ui/                     # UI components
│   ├── layout/                 # Layout components
│   ├── auth/                   # Auth components
│   ├── dashboard/              # Dashboard components
│   ├── analysis/               # Analysis components
│   ├── abtest/                 # A/B test components
│   └── admin/                  # Admin components
├── lib/
│   ├── supabase/               # Supabase clients
│   ├── stripe/                 # Stripe client
│   ├── openai/                 # OpenAI API client
│   ├── i18n/                   # Internationalization
│   ├── utils/                  # Utility functions
│   └── types/                  # TypeScript types
├── hooks/                      # React hooks
├── supabase/migrations/        # SQL migrations
├── middleware.ts               # Next.js middleware
└── README.md
```

## API Endpoints

### POST /api/analyze
Triggers AI analysis for a video.

**Request:**
```json
{
  "analysisId": "uuid",
  "locale": "tr" | "en"
}
```

### POST /api/abtest
Runs A/B test prediction.

**Request:**
```json
{
  "optionA": "string",
  "optionB": "string",
  "type": "hook" | "caption" | "cover",
  "locale": "tr" | "en"
}
```

### POST /api/stripe/checkout
Creates a Stripe checkout session.

### POST /api/stripe/webhook
Handles Stripe webhook events.

### Admin API Endpoints

All admin endpoints require super admin authentication.

**GET /api/admin/users**
List users with pagination and search.

**GET /api/admin/users/[id]**
Get single user details.

**GET /api/admin/users/[id]/stripe**
Get user's Stripe subscription and invoice data.

**POST /api/admin/users/[id]/plan**
Update user's plan (FREE or PRO).

**POST /api/admin/users/[id]/comped**
Set or clear comped_until date.

**POST /api/admin/users/[id]/disable**
Enable or disable user account.

**POST /api/admin/users/[id]/reset-quota**
Reset user's daily usage quota.

## License

MIT
