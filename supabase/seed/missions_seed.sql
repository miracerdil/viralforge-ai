-- ============================================
-- Daily Missions Seed Data (TR & EN)
-- ============================================

-- Clear existing missions
TRUNCATE daily_missions CASCADE;

-- Turkish Missions
INSERT INTO daily_missions (locale, niche, mission_text, difficulty, xp_reward, is_pro_only) VALUES
-- Lifestyle
('tr', 'lifestyle', 'Bugün bir "günlük rutin" videosu çek ve ilk 3 saniyede soru sor', 'easy', 10, false),
('tr', 'lifestyle', 'Trending bir sesi kullanarak lifestyle içerik oluştur', 'easy', 10, false),
('tr', 'lifestyle', '3 farklı hook dene ve hangisinin daha iyi performans gösterdiğini analiz et', 'medium', 20, false),
('tr', 'lifestyle', 'Bir "before/after" formatında dönüşüm videosu çek', 'medium', 20, false),
('tr', 'lifestyle', 'Viral olan bir trendi kendi tarzınla yorumla', 'hard', 30, true),

-- Comedy
('tr', 'comedy', 'Güncel bir olayı komik bir şekilde yorumla', 'easy', 10, false),
('tr', 'comedy', 'POV formatında komedi içeriği oluştur', 'easy', 10, false),
('tr', 'comedy', 'Duet yapılabilir bir komedi içeriği paylaş', 'medium', 20, false),
('tr', 'comedy', 'Bir sketch videosu çek ve A/B test yap', 'medium', 20, false),
('tr', 'comedy', 'Seri formatında komedi içeriği başlat', 'hard', 30, true),

-- Education
('tr', 'education', 'Bir "biliyor muydun?" videosu çek', 'easy', 10, false),
('tr', 'education', '60 saniyede bir konuyu öğret', 'easy', 10, false),
('tr', 'education', 'Karmaşık bir konuyu basit şekilde açıkla', 'medium', 20, false),
('tr', 'education', 'Görsel infografik ile eğitim içeriği oluştur', 'medium', 20, false),
('tr', 'education', 'Mini kurs serisi başlat (3 bölümlük)', 'hard', 30, true),

-- Food
('tr', 'food', 'Hızlı ve kolay bir tarif videosu çek', 'easy', 10, false),
('tr', 'food', 'Yemek yapım sürecini ASMR tarzında kaydet', 'easy', 10, false),
('tr', 'food', 'Bir restoran incelemesi yap', 'medium', 20, false),
('tr', 'food', '5 dakikada yapılabilecek 3 tarif paylaş', 'medium', 20, false),
('tr', 'food', 'Viral yemek trendini dene ve yorumla', 'hard', 30, true),

-- Fitness
('tr', 'fitness', 'Evde yapılabilecek 5 egzersiz paylaş', 'easy', 10, false),
('tr', 'fitness', 'Motivasyon içerikli fitness videosu çek', 'easy', 10, false),
('tr', 'fitness', 'Egzersiz rutinini takipçilerinle paylaş', 'medium', 20, false),
('tr', 'fitness', 'Beslenme ipuçları videosu oluştur', 'medium', 20, false),
('tr', 'fitness', '30 günlük challenge başlat', 'hard', 30, true),

-- General
('tr', 'general', 'Bugün en az 1 video analizi yap', 'easy', 10, false),
('tr', 'general', 'Hook kütüphanesinden 3 hook dene', 'easy', 10, false),
('tr', 'general', 'Haftalık içerik planı oluştur', 'medium', 20, false),
('tr', 'general', 'A/B test ile en iyi hook u bul', 'medium', 20, false),
('tr', 'general', 'Niche analizi yap ve yeni format dene', 'hard', 30, true),

-- English Missions
-- Lifestyle
('en', 'lifestyle', 'Film a "daily routine" video and ask a question in the first 3 seconds', 'easy', 10, false),
('en', 'lifestyle', 'Create lifestyle content using a trending sound', 'easy', 10, false),
('en', 'lifestyle', 'Try 3 different hooks and analyze which performs better', 'medium', 20, false),
('en', 'lifestyle', 'Film a transformation video in "before/after" format', 'medium', 20, false),
('en', 'lifestyle', 'Put your own spin on a viral trend', 'hard', 30, true),

-- Comedy
('en', 'comedy', 'Create a funny take on a current event', 'easy', 10, false),
('en', 'comedy', 'Create comedy content in POV format', 'easy', 10, false),
('en', 'comedy', 'Post duet-able comedy content', 'medium', 20, false),
('en', 'comedy', 'Film a sketch video and A/B test it', 'medium', 20, false),
('en', 'comedy', 'Start a comedy content series', 'hard', 30, true),

-- Education
('en', 'education', 'Film a "did you know?" video', 'easy', 10, false),
('en', 'education', 'Teach something in 60 seconds', 'easy', 10, false),
('en', 'education', 'Explain a complex topic simply', 'medium', 20, false),
('en', 'education', 'Create educational content with visual infographics', 'medium', 20, false),
('en', 'education', 'Start a mini course series (3 parts)', 'hard', 30, true),

-- Food
('en', 'food', 'Film a quick and easy recipe video', 'easy', 10, false),
('en', 'food', 'Record cooking process ASMR style', 'easy', 10, false),
('en', 'food', 'Do a restaurant review', 'medium', 20, false),
('en', 'food', 'Share 3 recipes that can be made in 5 minutes', 'medium', 20, false),
('en', 'food', 'Try and review a viral food trend', 'hard', 30, true),

-- Fitness
('en', 'fitness', 'Share 5 exercises that can be done at home', 'easy', 10, false),
('en', 'fitness', 'Film a motivational fitness video', 'easy', 10, false),
('en', 'fitness', 'Share your workout routine with followers', 'medium', 20, false),
('en', 'fitness', 'Create a nutrition tips video', 'medium', 20, false),
('en', 'fitness', 'Start a 30-day challenge', 'hard', 30, true),

-- General
('en', 'general', 'Analyze at least 1 video today', 'easy', 10, false),
('en', 'general', 'Try 3 hooks from the hook library', 'easy', 10, false),
('en', 'general', 'Create a weekly content plan', 'medium', 20, false),
('en', 'general', 'Find the best hook using A/B test', 'medium', 20, false),
('en', 'general', 'Do a niche analysis and try a new format', 'hard', 30, true);
