-- =============================================
-- HOOK TEMPLATES SEED DATA
-- 60 hooks per locale (TR and EN)
-- Spread across niches and tones
-- =============================================

-- TURKISH HOOKS
INSERT INTO public.hook_templates (locale, niche, tone, hook_text, tags) VALUES

-- FITNESS - TR
('tr', 'fitness', 'funny', 'Spor salonuna gidip sadece ayna karşısında selfie çekenlere özel bu video', ARRAY['gym', 'selfie', 'mizah']),
('tr', 'fitness', 'educational', 'Kilo vermek için cardio yapmana GEREK YOK - işte nedeni', ARRAY['cardio', 'kilo', 'bilgi']),
('tr', 'fitness', 'emotional', '3 ay önce aynaya bakamıyordum, şimdi ise...', ARRAY['dönüşüm', 'motivasyon']),
('tr', 'fitness', 'controversial', 'Personal trainerlar sana BUNU söylemiyor', ARRAY['pt', 'gizli', 'fitness']),
('tr', 'fitness', 'inspirational', 'Her gün 5 dakika bunu yap, hayatın değişsin', ARRAY['rutin', 'motivasyon']),

-- BEAUTY - TR
('tr', 'beauty', 'funny', 'Makyaj yaparken annemin odaya girme anı', ARRAY['makyaj', 'anne', 'komedi']),
('tr', 'beauty', 'educational', 'Foundation seçerken herkesin yaptığı 3 HATA', ARRAY['foundation', 'ipucu', 'makyaj']),
('tr', 'beauty', 'emotional', 'Sivilcelerim yüzünden yıllarca evden çıkamadım', ARRAY['cilt', 'hikaye', 'dönüşüm']),
('tr', 'beauty', 'controversial', 'Pahalı cilt bakım ürünleri PARA TUZAĞI - işte kanıtı', ARRAY['cilt', 'para', 'gerçek']),
('tr', 'beauty', 'inspirational', 'Doğal güzelliğini keşfetmek için sadece BUNU yap', ARRAY['doğal', 'güzellik', 'ipucu']),

-- ECOMMERCE - TR
('tr', 'ecommerce', 'funny', 'Online alışveriş bağımlılığım hakkında konuşmamız lazım', ARRAY['alışveriş', 'bağımlılık', 'komedi']),
('tr', 'ecommerce', 'educational', 'Trendyol''da gizli indirim kodları nasıl bulunur', ARRAY['trendyol', 'indirim', 'ipucu']),
('tr', 'ecommerce', 'emotional', 'Bu ürünü almak hayatımı değiştirdi - abartmıyorum', ARRAY['ürün', 'değişim', 'hikaye']),
('tr', 'ecommerce', 'controversial', 'Influencerların reklam verdiği ürünlerin GERÇEK yorumları', ARRAY['influencer', 'reklam', 'gerçek']),
('tr', 'ecommerce', 'inspirational', '100 TL altı bu ürünlerle evin bambaşka görünecek', ARRAY['ev', 'dekorasyon', 'bütçe']),

-- EDUCATION - TR
('tr', 'education', 'funny', 'Sınava 1 gün kala ders çalışma taktiklerim', ARRAY['sınav', 'son dakika', 'komedi']),
('tr', 'education', 'educational', 'Hafızanı 10 KAT güçlendiren teknik - bilim destekli', ARRAY['hafıza', 'teknik', 'bilim']),
('tr', 'education', 'emotional', 'YKS''de derece yaptım ama kimse bunu bilmiyor', ARRAY['yks', 'başarı', 'hikaye']),
('tr', 'education', 'controversial', 'Üniversite diplomanın DEĞERSIZ olmasının 5 nedeni', ARRAY['üniversite', 'diploma', 'tartışma']),
('tr', 'education', 'inspirational', 'Her gün 15 dakika bunu yap, 1 yılda hayatın değişsin', ARRAY['rutin', 'değişim', 'eğitim']),

-- MOTIVATION - TR
('tr', 'motivation', 'funny', 'Motivasyon videosu izleyip yataktan kalkmama anı', ARRAY['motivasyon', 'komedi', 'gerçek']),
('tr', 'motivation', 'educational', 'Başarılı insanların her sabah yaptığı 5 ŞEY', ARRAY['sabah', 'rutin', 'başarı']),
('tr', 'motivation', 'emotional', 'Herkes vazgeçmemi söylüyordu, ben ise...', ARRAY['azim', 'hikaye', 'başarı']),
('tr', 'motivation', 'controversial', 'Motivasyon kitapları ZAMAN KAYBI - işte nedeni', ARRAY['kitap', 'motivasyon', 'tartışma']),
('tr', 'motivation', 'inspirational', 'Bugün başla, yarın başkası olacaksın', ARRAY['başlangıç', 'değişim', 'motivasyon']),

-- FOOD - TR
('tr', 'food', 'funny', 'Diyet yapıyorum diyen ben gece 3''te buzdolabının önünde', ARRAY['diyet', 'gece', 'komedi']),
('tr', 'food', 'educational', 'Yemeklerin daha lezzetli olması için mutlaka BUNU yap', ARRAY['yemek', 'ipucu', 'lezzet']),
('tr', 'food', 'emotional', 'Annemin tarifiyle yaptım, tadı aynı olmadı...', ARRAY['anne', 'tarif', 'duygusal']),
('tr', 'food', 'controversial', 'Restoranların SAKLADIĞI mutfak sırları', ARRAY['restoran', 'sır', 'mutfak']),
('tr', 'food', 'inspirational', '5 dakikada yapılan bu yemek misafirlerini etkileyecek', ARRAY['hızlı', 'yemek', 'misafir']),

-- TRAVEL - TR
('tr', 'travel', 'funny', 'Tatilde Türk turist olduğunu belli eden 10 hareket', ARRAY['tatil', 'türk', 'komedi']),
('tr', 'travel', 'educational', 'Ucuz uçak bileti bulmanın GIZLI yöntemi', ARRAY['uçak', 'bilet', 'ipucu']),
('tr', 'travel', 'emotional', 'Bu yer beni ağlattı - ciddi söylüyorum', ARRAY['yer', 'duygusal', 'seyahat']),
('tr', 'travel', 'controversial', 'Turistlerin GİTMEMESİ gereken meşhur yerler', ARRAY['turist', 'yer', 'tartışma']),
('tr', 'travel', 'inspirational', '1000 TL ile yapabileceğin HAYALİNDEKİ tatil', ARRAY['bütçe', 'tatil', 'hayal']),

-- GAMING - TR
('tr', 'gaming', 'funny', 'Online oyunda Türk takım arkadaşı deneyimi', ARRAY['online', 'türk', 'komedi']),
('tr', 'gaming', 'educational', 'Pro oyuncuların kullandığı GIZLI ayarlar', ARRAY['pro', 'ayar', 'gaming']),
('tr', 'gaming', 'emotional', '10 yıl önce başladığım oyunu bugün bitirdim', ARRAY['oyun', 'nostalji', 'hikaye']),
('tr', 'gaming', 'controversial', 'Herkesin overrated dediği oyun aslında EFSANE', ARRAY['oyun', 'tartışma', 'overrated']),
('tr', 'gaming', 'inspirational', 'Oyun oynayarak para kazanmaya başladım - işte nasıl', ARRAY['para', 'gaming', 'kazanç']),

-- GENERAL - TR
('tr', 'general', 'funny', 'Türkiye''de yaşamanın günlük zorlukları bölüm 847', ARRAY['türkiye', 'günlük', 'komedi']),
('tr', 'general', 'educational', 'Herkesin bilmesi gereken hayat hileleri', ARRAY['hack', 'hayat', 'ipucu']),
('tr', 'general', 'emotional', 'Bunu izledikten sonra hayata bakış açın değişecek', ARRAY['hayat', 'değişim', 'duygusal']),
('tr', 'general', 'controversial', 'Toplumun YANLIŞ bulduğu ama DOĞRU olan şeyler', ARRAY['toplum', 'tartışma', 'gerçek']),
('tr', 'general', 'inspirational', 'Bugün yapacağın küçük değişiklik yarın büyük fark yaratacak', ARRAY['değişim', 'motivasyon', 'gelecek']),

-- Additional TR hooks to reach 60
('tr', 'fitness', 'funny', 'İlk kez spor salonuna giden herkes bunu yaşamıştır', ARRAY['gym', 'ilk', 'komedi']),
('tr', 'fitness', 'educational', 'Evde 10 dakikada yapabileceğin FULL BODY antrenman', ARRAY['ev', 'antrenman', 'fullbody']),
('tr', 'beauty', 'funny', 'Online siparişte gelen makyaj vs beklentim', ARRAY['online', 'beklenti', 'komedi']),
('tr', 'beauty', 'educational', 'Cilt tipine göre DOĞRU nemlendirici seçimi', ARRAY['cilt', 'nemlendirici', 'ipucu']),
('tr', 'ecommerce', 'funny', 'Kargo takip sayfasını yenilemekten parmağım yoruldu', ARRAY['kargo', 'takip', 'komedi']),
('tr', 'ecommerce', 'educational', 'Online alışverişte DOLANDIRILMAMAK için ipuçları', ARRAY['güvenlik', 'alışveriş', 'ipucu']),
('tr', 'education', 'funny', 'Derste uyumamak için geliştirdiğim teknikler', ARRAY['ders', 'uyku', 'komedi']),
('tr', 'education', 'educational', 'Çalışırken konsantrasyonu MAKSIMUMA çıkarma yöntemi', ARRAY['konsantrasyon', 'çalışma', 'teknik']),
('tr', 'motivation', 'funny', '6 kere denedim 6 kere başarısız oldum, 7. de...', ARRAY['deneme', 'başarısızlık', 'mizah']),
('tr', 'motivation', 'educational', 'Erteleme alışkanlığını YENMEK için 3 bilimsel yöntem', ARRAY['erteleme', 'bilim', 'yöntem']),
('tr', 'food', 'funny', 'Tarifi birebir uyguladım ama sonuç...', ARRAY['tarif', 'fail', 'komedi']),
('tr', 'food', 'educational', 'Profesyonel şeflerin kullandığı TEMEL teknikler', ARRAY['şef', 'teknik', 'profesyonel']),
('tr', 'travel', 'funny', 'Havalimanında Türk ailesi starter pack', ARRAY['havalimanı', 'aile', 'komedi']),
('tr', 'travel', 'educational', 'Valize maksimum eşya sığdırma tekniği', ARRAY['valiz', 'paketleme', 'ipucu']),
('tr', 'gaming', 'funny', 'Anne kapıyı kilitleme bu sefer gerçekten önemli', ARRAY['anne', 'gaming', 'komedi']),
('tr', 'gaming', 'educational', 'Yeni başlayanlar için en iyi ÜCRETSIZ oyunlar', ARRAY['ücretsiz', 'başlangıç', 'oyun']),
('tr', 'general', 'funny', 'Pazartesi motivasyonum vs Cuma motivasyonum', ARRAY['pazartesi', 'cuma', 'komedi']),
('tr', 'general', 'educational', 'Zamanı daha VERIMLI kullanmanın 5 yolu', ARRAY['zaman', 'verimlilik', 'ipucu']),
('tr', 'general', 'emotional', 'Bu mesajı 5 yıl önce alsaydım her şey farklı olurdu', ARRAY['geçmiş', 'mesaj', 'duygusal']),
('tr', 'general', 'controversial', 'Herkes yapıyor ama YANLIŞ olan 5 şey', ARRAY['yanlış', 'doğru', 'tartışma']),

-- ENGLISH HOOKS
-- FITNESS - EN
('en', 'fitness', 'funny', 'POV: You went to the gym for the first time this year', ARRAY['gym', 'first time', 'comedy']),
('en', 'fitness', 'educational', 'You DON''T need cardio to lose weight - here''s why', ARRAY['cardio', 'weight loss', 'tips']),
('en', 'fitness', 'emotional', '3 months ago I couldn''t look in the mirror, now...', ARRAY['transformation', 'motivation']),
('en', 'fitness', 'controversial', 'Personal trainers are NOT telling you this', ARRAY['pt', 'secret', 'fitness']),
('en', 'fitness', 'inspirational', 'Do this for 5 minutes every day, change your life', ARRAY['routine', 'motivation']),

-- BEAUTY - EN
('en', 'beauty', 'funny', 'When mom walks in while you''re doing your makeup', ARRAY['makeup', 'mom', 'comedy']),
('en', 'beauty', 'educational', '3 MISTAKES everyone makes when choosing foundation', ARRAY['foundation', 'tips', 'makeup']),
('en', 'beauty', 'emotional', 'I couldn''t leave my house for years because of my acne', ARRAY['skin', 'story', 'transformation']),
('en', 'beauty', 'controversial', 'Expensive skincare products are a SCAM - here''s proof', ARRAY['skincare', 'money', 'truth']),
('en', 'beauty', 'inspirational', 'Discover your natural beauty with just THIS', ARRAY['natural', 'beauty', 'tips']),

-- ECOMMERCE - EN
('en', 'ecommerce', 'funny', 'We need to talk about my online shopping addiction', ARRAY['shopping', 'addiction', 'comedy']),
('en', 'ecommerce', 'educational', 'How to find HIDDEN discount codes on Amazon', ARRAY['amazon', 'discount', 'tips']),
('en', 'ecommerce', 'emotional', 'This product changed my life - not exaggerating', ARRAY['product', 'change', 'story']),
('en', 'ecommerce', 'controversial', 'REAL reviews of products influencers promote', ARRAY['influencer', 'ad', 'truth']),
('en', 'ecommerce', 'inspirational', 'Transform your home with these items under $20', ARRAY['home', 'decor', 'budget']),

-- EDUCATION - EN
('en', 'education', 'funny', 'My study tactics 1 day before the exam', ARRAY['exam', 'last minute', 'comedy']),
('en', 'education', 'educational', 'This technique will 10X your memory - backed by science', ARRAY['memory', 'technique', 'science']),
('en', 'education', 'emotional', 'I graduated top of my class but nobody knows this', ARRAY['graduation', 'success', 'story']),
('en', 'education', 'controversial', '5 reasons your college degree is WORTHLESS', ARRAY['college', 'degree', 'debate']),
('en', 'education', 'inspirational', 'Do this 15 minutes daily, transform your life in 1 year', ARRAY['routine', 'change', 'education']),

-- MOTIVATION - EN
('en', 'motivation', 'funny', 'Me watching motivation videos vs me getting out of bed', ARRAY['motivation', 'comedy', 'real']),
('en', 'motivation', 'educational', '5 THINGS successful people do every morning', ARRAY['morning', 'routine', 'success']),
('en', 'motivation', 'emotional', 'Everyone told me to give up, but I...', ARRAY['perseverance', 'story', 'success']),
('en', 'motivation', 'controversial', 'Self-help books are a WASTE OF TIME - here''s why', ARRAY['books', 'motivation', 'debate']),
('en', 'motivation', 'inspirational', 'Start today, become someone else tomorrow', ARRAY['start', 'change', 'motivation']),

-- FOOD - EN
('en', 'food', 'funny', 'Me on a diet vs me at 3am in front of the fridge', ARRAY['diet', 'night', 'comedy']),
('en', 'food', 'educational', 'Do THIS to make your food taste 10x better', ARRAY['cooking', 'tips', 'flavor']),
('en', 'food', 'emotional', 'I made mom''s recipe but it didn''t taste the same...', ARRAY['mom', 'recipe', 'emotional']),
('en', 'food', 'controversial', 'Restaurant SECRETS they don''t want you to know', ARRAY['restaurant', 'secret', 'kitchen']),
('en', 'food', 'inspirational', 'This 5-minute meal will impress all your guests', ARRAY['quick', 'meal', 'guests']),

-- TRAVEL - EN
('en', 'travel', 'funny', '10 ways to spot a tourist at the airport', ARRAY['tourist', 'airport', 'comedy']),
('en', 'travel', 'educational', 'The SECRET method to find cheap flights', ARRAY['flights', 'tickets', 'tips']),
('en', 'travel', 'emotional', 'This place made me cry - I''m serious', ARRAY['place', 'emotional', 'travel']),
('en', 'travel', 'controversial', 'Famous places tourists should NEVER visit', ARRAY['tourist', 'places', 'debate']),
('en', 'travel', 'inspirational', 'Your DREAM vacation for under $500', ARRAY['budget', 'vacation', 'dream']),

-- GAMING - EN
('en', 'gaming', 'funny', 'Playing online games with random teammates be like', ARRAY['online', 'teammates', 'comedy']),
('en', 'gaming', 'educational', 'SECRET settings pro players use', ARRAY['pro', 'settings', 'gaming']),
('en', 'gaming', 'emotional', 'I finally finished the game I started 10 years ago', ARRAY['game', 'nostalgia', 'story']),
('en', 'gaming', 'controversial', 'The ''overrated'' game everyone hates is actually AMAZING', ARRAY['game', 'debate', 'overrated']),
('en', 'gaming', 'inspirational', 'How I started making money from gaming', ARRAY['money', 'gaming', 'income']),

-- GENERAL - EN
('en', 'general', 'funny', 'Daily struggles of being an adult episode 847', ARRAY['adult', 'daily', 'comedy']),
('en', 'general', 'educational', 'Life hacks everyone needs to know', ARRAY['hack', 'life', 'tips']),
('en', 'general', 'emotional', 'After watching this your perspective on life will change', ARRAY['life', 'change', 'emotional']),
('en', 'general', 'controversial', 'Things society thinks are WRONG but are actually RIGHT', ARRAY['society', 'debate', 'truth']),
('en', 'general', 'inspirational', 'Small change today, big difference tomorrow', ARRAY['change', 'motivation', 'future']),

-- Additional EN hooks to reach 60
('en', 'fitness', 'funny', 'Everyone who goes to the gym for the first time does this', ARRAY['gym', 'first', 'comedy']),
('en', 'fitness', 'educational', '10-minute FULL BODY workout you can do at home', ARRAY['home', 'workout', 'fullbody']),
('en', 'beauty', 'funny', 'Online order makeup vs my expectations', ARRAY['online', 'expectations', 'comedy']),
('en', 'beauty', 'educational', 'How to choose the RIGHT moisturizer for your skin type', ARRAY['skin', 'moisturizer', 'tips']),
('en', 'ecommerce', 'funny', 'My finger is tired from refreshing the tracking page', ARRAY['tracking', 'shipping', 'comedy']),
('en', 'ecommerce', 'educational', 'Tips to AVOID getting scammed when shopping online', ARRAY['security', 'shopping', 'tips']),
('en', 'education', 'funny', 'Techniques I developed to not fall asleep in class', ARRAY['class', 'sleep', 'comedy']),
('en', 'education', 'educational', 'How to MAXIMIZE concentration while studying', ARRAY['concentration', 'study', 'technique']),
('en', 'motivation', 'funny', 'Failed 6 times, on the 7th try...', ARRAY['failure', 'trying', 'humor']),
('en', 'motivation', 'educational', '3 scientific methods to BEAT procrastination', ARRAY['procrastination', 'science', 'method']),
('en', 'food', 'funny', 'I followed the recipe exactly but the result...', ARRAY['recipe', 'fail', 'comedy']),
('en', 'food', 'educational', 'BASIC techniques professional chefs use', ARRAY['chef', 'technique', 'professional']),
('en', 'travel', 'funny', 'Tourist family at the airport starter pack', ARRAY['airport', 'family', 'comedy']),
('en', 'travel', 'educational', 'The technique to fit MAXIMUM stuff in your suitcase', ARRAY['suitcase', 'packing', 'tips']),
('en', 'gaming', 'funny', 'Mom don''t open the door this is actually important', ARRAY['mom', 'gaming', 'comedy']),
('en', 'gaming', 'educational', 'Best FREE games for beginners', ARRAY['free', 'beginner', 'games']),
('en', 'general', 'funny', 'Monday motivation vs Friday motivation', ARRAY['monday', 'friday', 'comedy']),
('en', 'general', 'educational', '5 ways to use your time more EFFECTIVELY', ARRAY['time', 'productivity', 'tips']),
('en', 'general', 'emotional', 'If I had received this message 5 years ago everything would be different', ARRAY['past', 'message', 'emotional']),
('en', 'general', 'controversial', '5 things everyone does but are WRONG', ARRAY['wrong', 'right', 'debate']);
