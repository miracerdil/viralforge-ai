# ViralForge AI - Admin Panel & User Modules Implementation Plan

## Overview
This plan covers the implementation of a comprehensive Admin Panel and User-facing modules based on the existing codebase architecture.

---

## Phase 1: Database Schema Extensions

### New Tables Required

```sql
-- 1. Feature Flags Table
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  flag_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  target_plans TEXT[] DEFAULT '{}', -- ['free', 'creator_pro', 'business_pro']
  target_user_ids UUID[] DEFAULT '{}', -- specific user overrides
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AI Usage Logs (extends existing pattern)
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  feature TEXT NOT NULL, -- 'hook_generation', 'video_analysis', 'planner'
  model TEXT NOT NULL, -- 'gpt-4o-mini', 'gpt-4o'
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. User Notifications Table
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'system', 'achievement', 'feature', 'warning'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. User Activity Log Table
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'hook_generated', 'video_analyzed', 'plan_upgraded'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Content Share Links Table
CREATE TABLE content_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  share_token TEXT UNIQUE NOT NULL,
  content_type TEXT NOT NULL, -- 'hooks', 'analysis', 'planner'
  content_id UUID NOT NULL,
  is_public BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Admin Audit Log
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID,
  changes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies
- user_notifications: Users can only read their own notifications
- user_activity_log: Users can only read their own activity
- content_shares: Users can manage their own shares; public shares readable by all
- Admin tables: Only users with admin role can access

---

## Phase 2: Admin Panel Implementation

### 2.1 Admin Layout & Navigation
**Files to create:**
- `app/[locale]/(admin)/layout.tsx` - Admin layout with sidebar
- `components/admin/AdminSidebar.tsx` - Navigation sidebar
- `components/admin/AdminHeader.tsx` - Header with admin info

**Navigation Items:**
1. Dashboard (Lifecycle Funnel)
2. Feature Flags
3. AI Costs
4. Analytics
5. User Management
6. Notifications

### 2.2 Lifecycle Funnel Dashboard
**File:** `app/[locale]/(admin)/admin/dashboard/page.tsx`

**Components:**
- `components/admin/LifecycleFunnel.tsx` - Visual funnel chart
- `components/admin/StageMetrics.tsx` - Stage-by-stage metrics
- `components/admin/UserListByStage.tsx` - Expandable user lists

**Data Source:**
- Query `user_lifecycle` table grouped by `current_stage`
- Stages: new_user → activated → engaged → power_user → at_risk → churned

**API Route:** `app/api/admin/lifecycle/route.ts`

### 2.3 Feature Flags & Plan Limits
**File:** `app/[locale]/(admin)/admin/feature-flags/page.tsx`

**Components:**
- `components/admin/FeatureFlagList.tsx` - List all flags with toggles
- `components/admin/FeatureFlagForm.tsx` - Create/edit flag modal
- `components/admin/PlanLimitsEditor.tsx` - Edit plan limits

**Features:**
- Toggle flags globally or per-plan
- Override limits for specific users
- Real-time flag status indicators

**API Routes:**
- `app/api/admin/feature-flags/route.ts` - CRUD operations
- `app/api/admin/plan-limits/route.ts` - Plan limit management

### 2.4 AI Usage & Cost Monitoring
**File:** `app/[locale]/(admin)/admin/ai-costs/page.tsx`

**Components:**
- `components/admin/AICostChart.tsx` - Daily/weekly/monthly charts
- `components/admin/CostByFeature.tsx` - Breakdown by feature
- `components/admin/CostByUser.tsx` - Top users by cost
- `components/admin/CostAlerts.tsx` - Budget threshold alerts

**Metrics:**
- Total cost (daily/weekly/monthly)
- Cost per feature (hooks, analysis, planner)
- Cost per user segment
- Token usage trends

**API Route:** `app/api/admin/ai-costs/route.ts`

### 2.5 Global Content Analytics
**File:** `app/[locale]/(admin)/admin/analytics/page.tsx`

**Components:**
- `components/admin/TopHooksTable.tsx` - Most generated hook patterns
- `components/admin/PlatformDistribution.tsx` - Usage by platform
- `components/admin/CategoryTrends.tsx` - Popular categories
- `components/admin/EngagementMetrics.tsx` - Overall engagement stats

**API Route:** `app/api/admin/analytics/route.ts`

### 2.6 User Manual Overrides
**File:** `app/[locale]/(admin)/admin/users/page.tsx`

**Components:**
- `components/admin/UserSearchTable.tsx` - Search and list users
- `components/admin/UserDetailModal.tsx` - User details view
- `components/admin/UserOverrideForm.tsx` - Override limits/plan

**Features:**
- Search by email/ID
- View user lifecycle stage
- Override plan limits
- Grant/revoke features
- Reset usage counters

**API Routes:**
- `app/api/admin/users/route.ts` - List/search users
- `app/api/admin/users/[id]/route.ts` - User details
- `app/api/admin/users/[id]/override/route.ts` - Apply overrides

### 2.7 Notification & Email Control
**File:** `app/[locale]/(admin)/admin/notifications/page.tsx`

**Components:**
- `components/admin/NotificationComposer.tsx` - Create notifications
- `components/admin/NotificationHistory.tsx` - Sent notifications
- `components/admin/BroadcastForm.tsx` - Send to user segments

**Features:**
- Send to all users / specific plans / specific stages
- Schedule notifications
- View delivery stats

**API Route:** `app/api/admin/notifications/route.ts`

---

## Phase 3: User-Facing Modules

### 3.1 Notification Center
**Components:**
- `components/notifications/NotificationBell.tsx` - Bell icon with badge
- `components/notifications/NotificationDropdown.tsx` - Dropdown list
- `components/notifications/NotificationItem.tsx` - Individual notification

**Integration:**
- Add to `components/layout/Navbar.tsx`
- Real-time updates via polling or Supabase realtime

**API Routes:**
- `app/api/notifications/route.ts` - Get user notifications
- `app/api/notifications/[id]/read/route.ts` - Mark as read
- `app/api/notifications/mark-all-read/route.ts` - Mark all read

### 3.2 Activity Log
**File:** `app/[locale]/(app)/account/activity/page.tsx`

**Components:**
- `components/activity/ActivityTimeline.tsx` - Timeline view
- `components/activity/ActivityItem.tsx` - Individual activity
- `components/activity/ActivityFilters.tsx` - Filter by type/date

**Features:**
- Chronological timeline
- Filter by action type
- Date range selection
- Pagination

**API Route:** `app/api/activity/route.ts`

### 3.3 Export & Share
**Components:**
- `components/export/ExportButton.tsx` - Trigger export
- `components/export/ExportModal.tsx` - Format selection
- `components/share/ShareButton.tsx` - Create share link
- `components/share/ShareModal.tsx` - Manage share settings

**Features:**
- Export hooks to CSV/JSON
- Export analysis reports to PDF
- Create public share links
- Set expiration dates
- Track view counts

**API Routes:**
- `app/api/export/hooks/route.ts` - Export hooks
- `app/api/export/analysis/route.ts` - Export analysis
- `app/api/share/route.ts` - Create/manage shares
- `app/api/share/[token]/route.ts` - Public share access

### 3.4 Public Share Pages
**File:** `app/share/[token]/page.tsx`

**Features:**
- Public view of shared content
- No authentication required
- Branded with ViralForge
- CTA to sign up

---

## Phase 4: Integration Points

### 4.1 AI Usage Logging
**Modify:** `lib/openai/client.ts`

Add logging after each API call:
```typescript
await logAIUsage({
  userId,
  feature: 'hook_generation',
  model: 'gpt-4o-mini',
  inputTokens: response.usage?.prompt_tokens,
  outputTokens: response.usage?.completion_tokens,
  costUsd: calculateCost(response.usage)
});
```

### 4.2 Activity Logging Service
**Create:** `lib/services/activity-logger.ts`

```typescript
export async function logActivity(
  userId: string,
  action: string,
  metadata: Record<string, any>
) {
  // Insert into user_activity_log
}
```

### 4.3 Feature Flag Checks
**Create:** `lib/services/feature-flags.ts`

```typescript
export async function isFeatureEnabled(
  flagKey: string,
  userId: string,
  userPlan: string
): Promise<boolean> {
  // Check feature_flags table
}
```

---

## Implementation Order

### Week 1: Foundation
1. Create database tables and migrations
2. Set up admin layout and routing
3. Implement basic admin authentication check

### Week 2: Admin Core
4. Lifecycle Funnel Dashboard
5. Feature Flags management
6. AI Cost monitoring with logging integration

### Week 3: Admin Advanced
7. User Management & Overrides
8. Global Analytics
9. Notification system (admin side)

### Week 4: User Modules
10. Notification Center (user side)
11. Activity Log
12. Export functionality

### Week 5: Sharing & Polish
13. Share links system
14. Public share pages
15. Testing and refinement

---

## File Structure Summary

```
app/
├── [locale]/
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── dashboard/page.tsx
│   │       ├── feature-flags/page.tsx
│   │       ├── ai-costs/page.tsx
│   │       ├── analytics/page.tsx
│   │       ├── users/page.tsx
│   │       └── notifications/page.tsx
│   └── (app)/
│       └── account/
│           └── activity/page.tsx
├── share/
│   └── [token]/page.tsx
└── api/
    ├── admin/
    │   ├── lifecycle/route.ts
    │   ├── feature-flags/route.ts
    │   ├── ai-costs/route.ts
    │   ├── analytics/route.ts
    │   ├── users/route.ts
    │   └── notifications/route.ts
    ├── notifications/route.ts
    ├── activity/route.ts
    ├── export/
    │   ├── hooks/route.ts
    │   └── analysis/route.ts
    └── share/route.ts

components/
├── admin/
│   ├── AdminSidebar.tsx
│   ├── AdminHeader.tsx
│   ├── LifecycleFunnel.tsx
│   ├── FeatureFlagList.tsx
│   ├── AICostChart.tsx
│   ├── UserSearchTable.tsx
│   └── NotificationComposer.tsx
├── notifications/
│   ├── NotificationBell.tsx
│   ├── NotificationDropdown.tsx
│   └── NotificationItem.tsx
├── activity/
│   ├── ActivityTimeline.tsx
│   └── ActivityItem.tsx
├── export/
│   ├── ExportButton.tsx
│   └── ExportModal.tsx
└── share/
    ├── ShareButton.tsx
    └── ShareModal.tsx

lib/
└── services/
    ├── activity-logger.ts
    ├── feature-flags.ts
    └── ai-usage-logger.ts
```

---

## Notes

- All admin routes protected by `isAdmin` check using service role
- User modules respect RLS policies
- Bilingual support (TR/EN) for all new components
- Consistent with existing design system (Tailwind, shadcn/ui)
- Mobile-responsive admin panel
