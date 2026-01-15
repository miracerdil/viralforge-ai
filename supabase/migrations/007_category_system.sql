-- ============================================
-- Category System V2 - Two-level selection
-- Category Group (creator/business) + Subcategory
-- ============================================

-- 1) Category Groups Table
CREATE TABLE IF NOT EXISTS category_groups (
  id TEXT PRIMARY KEY,
  label_tr TEXT NOT NULL,
  label_en TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed category groups
INSERT INTO category_groups (id, label_tr, label_en, sort_order) VALUES
  ('creator', 'İçerik Üretici', 'Creator', 1),
  ('business', 'İşletme', 'Business', 2)
ON CONFLICT (id) DO NOTHING;

-- 2) Categories Table (subcategories)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL REFERENCES category_groups(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  label_tr TEXT NOT NULL,
  label_en TEXT NOT NULL,
  description_tr TEXT,
  description_en TEXT,
  icon TEXT, -- optional icon name
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_categories_group_sort ON categories(group_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Seed CREATOR categories
INSERT INTO categories (group_id, slug, label_tr, label_en, description_tr, description_en, sort_order) VALUES
  ('creator', 'fitness', 'Fitness', 'Fitness', 'Spor, egzersiz ve sağlıklı yaşam içerikleri', 'Sports, exercise and healthy lifestyle content', 1),
  ('creator', 'beauty', 'Güzellik', 'Beauty', 'Makyaj, cilt bakımı ve güzellik ipuçları', 'Makeup, skincare and beauty tips', 2),
  ('creator', 'education', 'Eğitim', 'Education', 'Öğretici ve bilgilendirici içerikler', 'Educational and informative content', 3),
  ('creator', 'motivation', 'Motivasyon', 'Motivation', 'İlham verici ve motive edici içerikler', 'Inspirational and motivational content', 4),
  ('creator', 'gaming', 'Oyun', 'Gaming', 'Video oyunları ve oyun kültürü', 'Video games and gaming culture', 5),
  ('creator', 'lifestyle', 'Yaşam Tarzı', 'Lifestyle', 'Günlük yaşam, rutinler ve deneyimler', 'Daily life, routines and experiences', 6),
  ('creator', 'travel', 'Seyahat', 'Travel', 'Gezi, keşif ve seyahat deneyimleri', 'Travel, exploration and journey experiences', 7),
  ('creator', 'food', 'Yemek', 'Food', 'Yemek tarifleri ve mutfak içerikleri', 'Recipes and culinary content', 8),
  ('creator', 'finance', 'Finans', 'Finance', 'Yatırım, tasarruf ve finansal okuryazarlık', 'Investment, savings and financial literacy', 9),
  ('creator', 'tech', 'Teknoloji', 'Tech', 'Teknoloji incelemeleri ve dijital trendler', 'Tech reviews and digital trends', 10),
  ('creator', 'comedy', 'Komedi', 'Comedy', 'Eğlenceli ve komik içerikler', 'Fun and humorous content', 11),
  ('creator', 'music', 'Müzik', 'Music', 'Müzik, cover ve performans içerikleri', 'Music, covers and performance content', 12),
  ('creator', 'art', 'Sanat', 'Art', 'Sanat, çizim ve yaratıcı içerikler', 'Art, drawing and creative content', 13),
  ('creator', 'fashion', 'Moda', 'Fashion', 'Moda, stil ve giyim önerileri', 'Fashion, style and outfit ideas', 14),
  ('creator', 'parenting', 'Ebeveynlik', 'Parenting', 'Anne-baba ve çocuk içerikleri', 'Parent and child content', 15)
ON CONFLICT (slug) DO NOTHING;

-- Seed BUSINESS categories
INSERT INTO categories (group_id, slug, label_tr, label_en, description_tr, description_en, sort_order) VALUES
  ('business', 'cafe_restaurant', 'Kafe & Restoran', 'Cafe & Restaurant', 'Yeme-içme mekanları', 'Food and beverage venues', 1),
  ('business', 'barber_beauty', 'Kuaför & Güzellik', 'Barber & Beauty', 'Kuaför, güzellik salonu ve spa', 'Barber shops, beauty salons and spas', 2),
  ('business', 'gym_studio', 'Spor Salonu & Stüdyo', 'Gym & Studio', 'Fitness merkezleri ve spor stüdyoları', 'Fitness centers and sports studios', 3),
  ('business', 'clinic_dentist', 'Klinik & Diş Hekimi', 'Clinic & Dentist', 'Sağlık klinikleri ve diş hekimleri', 'Health clinics and dentists', 4),
  ('business', 'ecommerce', 'E-ticaret', 'E-commerce', 'Online mağazalar ve satış', 'Online stores and sales', 5),
  ('business', 'real_estate', 'Emlak', 'Real Estate', 'Gayrimenkul ve emlak danışmanlığı', 'Real estate and property consulting', 6),
  ('business', 'auto_dealer', 'Oto Galeri', 'Auto Dealer', 'Araç satış ve oto galeri', 'Vehicle sales and auto dealerships', 7),
  ('business', 'local_services', 'Yerel Hizmetler', 'Local Services', 'Tesisatçı, elektrikçi vb. yerel hizmetler', 'Plumber, electrician and local services', 8),
  ('business', 'education_center', 'Eğitim Merkezi', 'Education Center', 'Kurslar, dershaneler ve eğitim kurumları', 'Courses, tutoring and educational institutions', 9),
  ('business', 'hospitality_hotel', 'Otel & Konaklama', 'Hotel & Hospitality', 'Oteller, pansiyonlar ve konaklama', 'Hotels, guesthouses and accommodation', 10),
  ('business', 'event_venue', 'Etkinlik Mekanı', 'Event Venue', 'Düğün salonu, toplantı mekanları', 'Wedding halls, meeting venues', 11),
  ('business', 'corporate_brand', 'Kurumsal Marka', 'Corporate Brand', 'Şirketler ve kurumsal markalar', 'Companies and corporate brands', 12),
  ('business', 'legal_consulting', 'Hukuk & Danışmanlık', 'Legal & Consulting', 'Avukatlar ve danışmanlık firmaları', 'Lawyers and consulting firms', 13),
  ('business', 'pet_services', 'Evcil Hayvan', 'Pet Services', 'Veteriner, pet shop ve hayvan bakımı', 'Vet, pet shop and animal care', 14),
  ('business', 'photography', 'Fotoğrafçılık', 'Photography', 'Fotoğraf ve video prodüksiyon', 'Photo and video production', 15)
ON CONFLICT (slug) DO NOTHING;

-- 3) Add category columns to existing tables

-- Add to analyses table
ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS category_group TEXT NOT NULL DEFAULT 'creator',
  ADD COLUMN IF NOT EXISTS category_slug TEXT NOT NULL DEFAULT 'lifestyle';

-- Add to planner_requests table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'planner_requests') THEN
    ALTER TABLE planner_requests
      ADD COLUMN IF NOT EXISTS category_group TEXT NOT NULL DEFAULT 'creator',
      ADD COLUMN IF NOT EXISTS category_slug TEXT NOT NULL DEFAULT 'lifestyle';
  END IF;
END $$;

-- Add to weekly_plans table
ALTER TABLE weekly_plans
  ADD COLUMN IF NOT EXISTS category_group TEXT NOT NULL DEFAULT 'creator',
  ADD COLUMN IF NOT EXISTS category_slug TEXT NOT NULL DEFAULT 'lifestyle';

-- Add to hook_templates table
ALTER TABLE hook_templates
  ADD COLUMN IF NOT EXISTS category_group TEXT NOT NULL DEFAULT 'creator',
  ADD COLUMN IF NOT EXISTS category_slug TEXT NOT NULL DEFAULT 'lifestyle';

-- 4) Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_analyses_category ON analyses(category_group, category_slug);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_category ON weekly_plans(category_group, category_slug);
CREATE INDEX IF NOT EXISTS idx_hook_templates_category ON hook_templates(category_group, category_slug);

-- 5) RLS Policies for category tables

ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Category groups readable by authenticated users
DROP POLICY IF EXISTS "Category groups readable by authenticated" ON category_groups;
CREATE POLICY "Category groups readable by authenticated"
  ON category_groups FOR SELECT
  TO authenticated
  USING (true);

-- Categories readable by authenticated users
DROP POLICY IF EXISTS "Categories readable by authenticated" ON categories;
CREATE POLICY "Categories readable by authenticated"
  ON categories FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admin can manage categories (via service role, no policy needed)

-- 6) Update existing niche values to category_slug where applicable
-- Map old niche values to new category slugs (only if niche column exists)

-- For hook_templates that have niche column
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hook_templates' AND column_name = 'niche') THEN
    UPDATE hook_templates
    SET category_slug = niche
    WHERE niche IS NOT NULL
      AND niche IN ('fitness', 'beauty', 'education', 'motivation', 'gaming', 'lifestyle', 'travel', 'food', 'tech', 'comedy')
      AND category_slug = 'lifestyle';
  END IF;
END $$;

-- For planner_requests that have niche column (migrate to category_slug)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planner_requests' AND column_name = 'niche') THEN
    UPDATE planner_requests
    SET category_slug = niche
    WHERE niche IS NOT NULL
      AND niche IN ('fitness', 'beauty', 'education', 'motivation', 'gaming', 'lifestyle', 'travel', 'food', 'tech', 'comedy')
      AND category_slug = 'lifestyle';
  END IF;
END $$;
