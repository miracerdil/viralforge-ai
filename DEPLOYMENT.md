# ViralForge AI - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables

Production `.env.local` dosyasinda su degiskenler guncellenmeli:

```env
# Production URL (Vercel/domain URL)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Stripe (Production keys required)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
```

### 2. Supabase Setup

#### Database Migrations
Supabase SQL Editor'de asagidaki migration dosyalarini SIRASYLA calistirin:

1. `001_initial_schema.sql`
2. `002_admin_features.sql`
3. `003_planner_hooks.sql`
4. `004_missions_sharing.sql`
5. `005_platform_support.sql`
6. `006_reward_shop.sql`
7. `007_category_system.sql`
8. `008_creator_persona.sql`
9. `009_performance_tracking.sql`
10. `010_lifecycle_system.sql`
11. `011_plan_alignment.sql`
12. `012_daily_growth_assistant.sql`
13. `013_add_growth_counters.sql`
14. `013b_fix_remaining.sql`
15. `014_admin_panel_user_modules.sql`
16. `015_help_support.sql`
17. `016_referral_affiliate.sql`
18. `017_workspaces.sql`

#### Storage Buckets
Supabase Storage'da su bucket'lar olusturulmali:
- `videos` (public: false)
- `frames` (public: false)
- `support-screenshots` (public: false)
- `workspace-logos` (public: true)

#### Auth Settings
Supabase Authentication ayarlari:
- Email/Password: Enabled
- Site URL: `https://your-domain.com`
- Redirect URLs: `https://your-domain.com/**`

### 3. Stripe Setup

1. [Stripe Dashboard](https://dashboard.stripe.com) gidin
2. Products > Add Product ile "ViralForge PRO" olusturun
3. Price ID'yi `STRIPE_PRO_PRICE_ID` olarak kaydedin
4. Developers > Webhooks > Add endpoint
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`
5. Webhook signing secret'i `STRIPE_WEBHOOK_SECRET` olarak kaydedin

### 4. Vercel Deployment

```bash
# Vercel CLI ile deploy
npm i -g vercel
vercel

# Environment variables ekleyin
vercel env add NEXT_PUBLIC_APP_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRO_PRICE_ID
vercel env add OPENAI_API_KEY
vercel env add OPENAI_MODEL
vercel env add OPENAI_MAX_TOKENS
vercel env add SUPERADMIN_EMAILS

# Production deploy
vercel --prod
```

### 5. Post-Deployment

1. **Admin hesabi olustur**: SUPERADMIN_EMAILS'deki email ile kayit ol
2. **Stripe webhook test**: Test event gondererek webhook'un calistigini dogrula
3. **OpenAI test**: Video analizi yaparak AI'in calistigini dogrula
4. **Supabase RLS**: Row Level Security politikalarinin aktif oldugunu kontrol et

## Domain & SSL

Vercel otomatik SSL saglar. Custom domain icin:
1. Vercel Dashboard > Settings > Domains
2. Domain ekle ve DNS ayarlarini yap
3. SSL otomatik aktif olacak

## Monitoring

- **Vercel Analytics**: Otomatik aktif
- **Supabase Logs**: Database > Logs
- **Stripe Dashboard**: Payments > All payments

## Troubleshooting

### Build Errors
```bash
npm run build
```
TypeScript hatalari icin output'u kontrol edin.

### API Errors
Server logs'u kontrol edin:
- Vercel: Functions > Logs
- Local: Terminal output

### Database Errors
Supabase Dashboard > Database > Logs

---

## Quick Deploy Commands

```bash
# Build test
npm run build

# Local production test
npm run start

# Deploy to Vercel
vercel --prod
```

## Support

Issues: https://github.com/miracerdil/viralforge-ai/issues
