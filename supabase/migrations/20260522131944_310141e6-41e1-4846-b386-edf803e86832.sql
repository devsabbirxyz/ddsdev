
-- ============================================
-- 1. ROLES SYSTEM (separate table for security)
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'seller', 'affiliate', 'customer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- 2. USERS (profile) linked to auth.users
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  preferred_language TEXT DEFAULT 'bn',
  preferred_theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default customer role on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. CATEGORIES
-- ============================================
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  icon_url TEXT,
  description TEXT,
  description_en TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. SELLERS
-- ============================================
CREATE TABLE public.sellers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_logo_url TEXT,
  store_cover_url TEXT,
  store_description TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  total_withdrawn DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. PRODUCTS
-- ============================================
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  title TEXT NOT NULL,
  title_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT CHECK (char_length(short_description) <= 100),
  short_description_en TEXT,
  long_description TEXT,
  long_description_en TEXT,
  regular_price DECIMAL(10,2),
  offer_price DECIMAL(10,2),
  delivery_type TEXT NOT NULL,
  delivery_content TEXT,
  subscription_input_label TEXT,
  subscription_input_label_en TEXT,
  is_variant BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  view_count INT DEFAULT 0,
  total_sales INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  video_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. PRODUCT IMAGES
CREATE TABLE public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PRODUCT VARIANTS
CREATE TABLE public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  label_en TEXT,
  regular_price DECIMAL(10,2) NOT NULL,
  offer_price DECIMAL(10,2),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. PRODUCT ACCOUNTS
CREATE TABLE public.product_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id),
  username TEXT,
  password TEXT,
  extra_info TEXT,
  is_sold BOOLEAN DEFAULT FALSE,
  order_id UUID,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. ORDERS
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id),
  product_id UUID REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  seller_id UUID REFERENCES public.sellers(id),
  affiliate_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  product_title TEXT NOT NULL,
  variant_label TEXT,
  quantity INT DEFAULT 1,
  regular_price DECIMAL(10,2),
  offer_price DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  coupon_code TEXT,
  payment_method TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending',
  delivery_status TEXT DEFAULT 'pending',
  customer_input TEXT,
  rejection_reason TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  seller_earning DECIMAL(10,2) DEFAULT 0,
  affiliate_commission DECIMAL(10,2) DEFAULT 0,
  delivery_content TEXT,
  is_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. CART
CREATE TABLE public.cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id),
  quantity INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

-- 11. WISHLIST
CREATE TABLE public.wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 12. REVIEWS
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 13-15. COUPONS
CREATE TABLE public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order DECIMAL(10,2) DEFAULT 0,
  max_uses INT,
  max_uses_per_user INT DEFAULT 1,
  used_count INT DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  applies_to TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.coupon_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  order_id UUID REFERENCES public.orders(id),
  discount_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.coupon_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  UNIQUE(coupon_id, product_id)
);
CREATE TABLE public.coupon_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  UNIQUE(coupon_id, category_id)
);

-- 16-18. AFFILIATES
CREATE TABLE public.affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  total_referrals INT DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  total_withdrawn DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.affiliate_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  referred_user_id UUID REFERENCES public.users(id),
  commission_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.affiliate_withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  account_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. SELLER WITHDRAWALS
CREATE TABLE public.seller_withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  account_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 20. PAYMENT METHODS
CREATE TABLE public.payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  account_type TEXT,
  send_type TEXT,
  account_number TEXT,
  instructions TEXT,
  instructions_en TEXT,
  api_key TEXT,
  has_automatic BOOLEAN DEFAULT FALSE,
  is_manual_active BOOLEAN DEFAULT TRUE,
  is_automatic_active BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO public.payment_methods (name, name_en, has_automatic, is_manual_active, sort_order) VALUES
  ('Bkash', 'Bkash', TRUE, TRUE, 1),
  ('Nagad', 'Nagad', FALSE, TRUE, 2),
  ('Rocket', 'Rocket', FALSE, TRUE, 3),
  ('Upay', 'Upay', FALSE, TRUE, 4);

-- 21-22. BLOG
CREATE TABLE public.blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  thumbnail_url TEXT,
  short_description TEXT CHECK (char_length(short_description) <= 150),
  short_description_en TEXT,
  content TEXT,
  content_en TEXT,
  category_id UUID REFERENCES public.blog_categories(id),
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 23-24. FAQ
CREATE TABLE public.faq_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO public.faq_categories (name, name_en, sort_order) VALUES
  ('পেমেন্ট সম্পর্কিত', 'Payment Related', 1),
  ('ডেলিভারি সম্পর্কিত', 'Delivery Related', 2),
  ('একাউন্ট সম্পর্কিত', 'Account Related', 3),
  ('প্রোডাক্ট সম্পর্কিত', 'Product Related', 4),
  ('অন্যান্য', 'Others', 5);
CREATE TABLE public.faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.faq_categories(id),
  question TEXT NOT NULL,
  question_en TEXT,
  answer TEXT NOT NULL,
  answer_en TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 25. NEWSLETTER
CREATE TABLE public.newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- 26. NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_en TEXT,
  message TEXT,
  message_en TEXT,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 27-28. SUPPORT
CREATE TABLE public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id),
  message TEXT NOT NULL,
  image_url TEXT,
  is_admin_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 29-30. HERO & OFFER SLIDES
CREATE TABLE public.hero_slides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.offer_slides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.review_slides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 32. COUNTDOWN TIMERS
CREATE TABLE public.countdown_timers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 33. POPUP
CREATE TABLE public.popup_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  heading TEXT,
  heading_en TEXT,
  sub_text TEXT,
  sub_text_en TEXT,
  image_url TEXT,
  coupon_code TEXT,
  button_text TEXT DEFAULT 'এখনই Shop করুন',
  button_text_en TEXT DEFAULT 'Shop Now',
  button_link TEXT DEFAULT '/shop',
  show_timer BOOLEAN DEFAULT TRUE,
  timer_minutes INT DEFAULT 30,
  show_delay_seconds INT DEFAULT 5,
  repeat_after_days INT DEFAULT 3,
  is_active BOOLEAN DEFAULT FALSE,
  show_on TEXT DEFAULT 'all',
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO public.popup_settings (heading, sub_text) VALUES
  ('🎉 বিশেষ অফার!', 'প্রথম অর্ডারে বিশেষ ছাড় পাচ্ছেন!');

-- 34. DEVELOPER PAGE
CREATE TABLE public.developer_page (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  bio TEXT,
  bio_en TEXT,
  profile_image_url TEXT,
  facebook_url TEXT,
  facebook_active BOOLEAN DEFAULT TRUE,
  instagram_url TEXT,
  instagram_active BOOLEAN DEFAULT TRUE,
  whatsapp_number TEXT,
  whatsapp_active BOOLEAN DEFAULT TRUE,
  telegram_url TEXT,
  telegram_active BOOLEAN DEFAULT TRUE,
  youtube_url TEXT,
  youtube_active BOOLEAN DEFAULT TRUE,
  contact_button_text TEXT DEFAULT 'আমার সাথে যোগাযোগ করুন',
  contact_button_link TEXT,
  show_blue_tick BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO public.developer_page (name, bio) VALUES
  ('Dev Sabbir', 'বাংলাদেশের ডিজিটাল প্রোডাক্ট এক্সপার্ট');

-- 35. PAGES
CREATE TABLE public.pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_en TEXT,
  content TEXT,
  content_en TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO public.pages (slug, title, title_en) VALUES
  ('about', 'আমাদের সম্পর্কে', 'About Us'),
  ('privacy-policy', 'প্রাইভেসি পলিসি', 'Privacy Policy'),
  ('refund-policy', 'রিফান্ড পলিসি', 'Refund Policy'),
  ('terms-conditions', 'নিয়ম ও শর্তাবলী', 'Terms & Conditions');

-- 36. PRODUCT VIEW LOGS
CREATE TABLE public.product_view_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  ip_address TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 37. EMAIL TEMPLATES
CREATE TABLE public.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO public.email_templates (template_key, name, subject, body, variables) VALUES
  ('order_confirmation', 'অর্ডার কনফার্মেশন', 'অর্ডার কনফার্মেশন - {{order_number}}', '<h1>ধন্যবাদ {{customer_name}}!</h1><p>আপনার অর্ডার সম্পন্ন হয়েছে।</p><p>অর্ডার ID: {{order_number}}</p><p>প্রোডাক্ট: {{product_title}}</p><p>মোট: {{total_price}}</p>', '{{customer_name}}, {{order_number}}, {{product_title}}, {{total_price}}'),
  ('payment_approved', 'পেমেন্ট Approve', 'পেমেন্ট Approve - {{order_number}}', '<h1>{{customer_name}}, পেমেন্ট Approve হয়েছে!</h1><p>অর্ডার ID: {{order_number}}</p><p>ডেলিভারি: {{delivery_content}}</p>', '{{customer_name}}, {{order_number}}, {{delivery_content}}'),
  ('payment_rejected', 'পেমেন্ট Reject', 'পেমেন্ট Reject - {{order_number}}', '<h1>{{customer_name}}, দুঃখিত!</h1><p>আপনার পেমেন্ট Reject হয়েছে।</p><p>কারণ: {{rejection_reason}}</p>', '{{customer_name}}, {{order_number}}, {{rejection_reason}}'),
  ('welcome', 'ওয়েলকাম', 'স্বাগতম {{customer_name}}!', '<h1>স্বাগতম {{customer_name}}!</h1><p>DDS-Digital এ যোগ দেওয়ার জন্য ধন্যবাদ।</p>', '{{customer_name}}, {{login_link}}'),
  ('password_reset', 'পাসওয়ার্ড রিসেট', 'পাসওয়ার্ড রিসেট লিংক', '<h1>পাসওয়ার্ড রিসেট</h1><p>এই লিংকে ক্লিক করুন: {{reset_link}}</p>', '{{customer_name}}, {{reset_link}}'),
  ('affiliate_approved', 'অ্যাফিলিয়েট Approve', 'অ্যাফিলিয়েট Approve হয়েছে!', '<h1>অভিনন্দন {{name}}!</h1><p>রেফারেল লিংক: {{referral_link}}</p>', '{{name}}, {{referral_link}}, {{commission_rate}}'),
  ('withdrawal_confirmed', 'উইথড্র কনফার্মেশন', 'উইথড্র সম্পন্ন', '<h1>{{name}}, উইথড্র সম্পন্ন!</h1><p>পরিমাণ: {{amount}}</p>', '{{name}}, {{amount}}, {{payment_method}}'),
  ('newsletter', 'Newsletter', '{{subject}}', '{{content}}', '{{subject}}, {{content}}, {{unsubscribe_link}}');

-- 38. SITE SETTINGS
CREATE TABLE public.site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  group_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO public.site_settings (key, value, group_name) VALUES
  ('site_name', 'DDS-Digital', 'general'),
  ('site_tagline', 'বাংলাদেশের #১ ডিজিটাল প্রোডাক্ট সেলিং সিস্টেম', 'general'),
  ('site_tagline_en', 'Bangladesh''s Number 1 Digital Product Selling System', 'general'),
  ('site_logo', '', 'general'),
  ('site_favicon', '', 'general'),
  ('site_email', '', 'general'),
  ('site_phone', '', 'general'),
  ('currency_symbol', '৳', 'general'),
  ('default_language', 'bn', 'general'),
  ('default_theme', 'dark', 'general'),
  ('maintenance_mode', 'false', 'general'),
  ('maintenance_message', 'সাইট মেইনটেন্যান্সে আছে, শীঘ্রই আসছি!', 'general'),
  ('facebook_url', '', 'social'),
  ('instagram_url', '', 'social'),
  ('whatsapp_number', '', 'social'),
  ('telegram_url', '', 'social'),
  ('youtube_url', '', 'social'),
  ('meta_title', 'DDS-Digital — Bangladesh Number 1 Digital Product Selling System', 'seo'),
  ('meta_description', 'বাংলাদেশের ১ নম্বর ডিজিটাল প্রোডাক্ট মার্কেটপ্লেস। সাবস্ক্রিপশন, অ্যাকাউন্ট, সফটওয়্যার সব কিছু এক জায়গায়।', 'seo'),
  ('meta_keywords', 'digital product, bangladesh, dds, dev sabbir soft', 'seo'),
  ('og_image', '', 'seo'),
  ('google_analytics_id', '', 'seo'),
  ('facebook_pixel_id', '', 'seo'),
  ('google_search_console', '', 'seo'),
  ('manual_order_confirm_time', '১-২ ঘন্টা', 'payment'),
  ('sender_name', 'DDS-Digital', 'email'),
  ('sender_email', '', 'email'),
  ('affiliate_commission_rate', '10', 'affiliate'),
  ('affiliate_min_withdrawal', '500', 'affiliate'),
  ('seller_commission_rate', '15', 'seller'),
  ('seller_min_withdrawal', '500', 'seller'),
  ('tawkto_id', '', 'chat'),
  ('facebook_page_id', '', 'chat'),
  ('whatsapp_chat_active', 'true', 'chat'),
  ('pwa_enabled', 'true', 'pwa'),
  ('pwa_app_name', 'DDS-Digital', 'pwa'),
  ('pwa_app_icon', '', 'pwa'),
  ('pwa_splash_screen', '', 'pwa'),
  ('announcement_enabled', 'false', 'announcement'),
  ('announcement_text', '', 'announcement'),
  ('announcement_link', '', 'announcement'),
  ('announcement_scrolling', 'true', 'announcement');

-- 39. HOMEPAGE SECTIONS
CREATE TABLE public.homepage_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT UNIQUE NOT NULL,
  section_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO public.homepage_sections (section_key, section_name, is_active, settings, sort_order) VALUES
  ('announcement_bar', 'Announcement Bar', FALSE, '{"text": "", "link": "", "scrolling": true}', 1),
  ('hero_slider', 'Hero Section', TRUE, '{"auto_slide": true, "slide_interval": 5, "heading": "বাংলাদেশের #১ ডিজিটাল মার্কেটপ্লেস", "subtitle": ""}', 2),
  ('trust_bar', 'Trust Bar', TRUE, '{}', 3),
  ('featured_products', 'Featured Products', TRUE, '{"heading": "Featured Products"}', 4),
  ('special_offer', 'Special Offer Banner', TRUE, '{"auto_slide": true, "slide_interval": 5, "button_text": "Meet the Developer", "button_link": "/developer"}', 5),
  ('how_to_buy', 'How to Buy', TRUE, '{"heading": "How to Buy", "video_url": ""}', 6),
  ('customer_reviews', 'Customer Reviews', TRUE, '{"heading": "REVIEWS", "subheading": "What Our Clients Say About Us?"}', 7),
  ('newsletter', 'Newsletter', TRUE, '{"heading": "Join our list and receive offers, gifts & resources"}', 8),
  ('blog_section', 'Blog Section', TRUE, '{"heading": "Latest Blog Posts"}', 9);

-- 40-41. APPLICATIONS
CREATE TABLE public.seller_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  store_name TEXT NOT NULL,
  store_description TEXT,
  product_types TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.affiliate_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  reason TEXT,
  social_links TEXT,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 42. OFFER BANNER TIMER
CREATE TABLE public.offer_banner_timer (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  end_message TEXT DEFAULT 'অফার শেষ হয়ে গেছে',
  end_message_en TEXT DEFAULT 'Offer has ended',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 43. PWA NOTIFICATIONS
CREATE TABLE public.pwa_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  sent_to TEXT DEFAULT 'all',
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 44. RECENTLY VIEWED
CREATE TABLE public.recently_viewed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_seller ON public.products(seller_id);
CREATE INDEX idx_products_featured ON public.products(is_featured);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_seller ON public.orders(seller_id);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_cart_user ON public.cart(user_id);
CREATE INDEX idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX idx_affiliates_code ON public.affiliates(referral_code);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- ============================================
-- RLS POLICIES
-- (RLS auto-enabled on all new tables via event trigger)
-- ============================================

-- user_roles: only admins can manage; users can read own
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- users (profile)
CREATE POLICY "Users view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins view all users" ON public.users FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all users" ON public.users FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public view seller/affiliate names" ON public.users FOR SELECT USING (true);

-- categories (public read, admin write)
CREATE POLICY "Public view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- sellers (public read approved, sellers manage own, admin all)
CREATE POLICY "Public view approved sellers" ON public.sellers FOR SELECT USING (status = 'approved');
CREATE POLICY "Sellers view own store" ON public.sellers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sellers update own store" ON public.sellers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Sellers insert own store" ON public.sellers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage sellers" ON public.sellers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- products (public read approved+active, sellers manage own, admin all)
CREATE POLICY "Public view active products" ON public.products FOR SELECT USING (is_active = true AND status = 'approved');
CREATE POLICY "Sellers manage own products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.sellers WHERE sellers.id = products.seller_id AND sellers.user_id = auth.uid())
);
CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- product_images (public read)
CREATE POLICY "Public view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Sellers manage own product images" ON public.product_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.products p JOIN public.sellers s ON s.id = p.seller_id
          WHERE p.id = product_images.product_id AND s.user_id = auth.uid())
);
CREATE POLICY "Admins manage product images" ON public.product_images FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- product_variants (public read)
CREATE POLICY "Public view variants" ON public.product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "Sellers manage own variants" ON public.product_variants FOR ALL USING (
  EXISTS (SELECT 1 FROM public.products p JOIN public.sellers s ON s.id = p.seller_id
          WHERE p.id = product_variants.product_id AND s.user_id = auth.uid())
);
CREATE POLICY "Admins manage variants" ON public.product_variants FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- product_accounts (admin only — sensitive credentials)
CREATE POLICY "Admins manage product accounts" ON public.product_accounts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- orders
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sellers view own orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sellers WHERE sellers.id = orders.seller_id AND sellers.user_id = auth.uid())
);
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- cart, wishlist
CREATE POLICY "Users manage own cart" ON public.cart FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id);

-- reviews
CREATE POLICY "Public view active reviews" ON public.reviews FOR SELECT USING (is_active = true);
CREATE POLICY "Users create own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- coupons (public read active, admin manage)
CREATE POLICY "Public view active coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own coupon usage" ON public.coupon_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage coupon usage" ON public.coupon_usage FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public view coupon products" ON public.coupon_products FOR SELECT USING (true);
CREATE POLICY "Admins manage coupon products" ON public.coupon_products FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public view coupon categories" ON public.coupon_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage coupon categories" ON public.coupon_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- affiliates
CREATE POLICY "Affiliates view own" ON public.affiliates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Affiliates insert own" ON public.affiliates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage affiliates" ON public.affiliates FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Affiliates view own referrals" ON public.affiliate_referrals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_referrals.affiliate_id AND user_id = auth.uid())
);
CREATE POLICY "Admins manage referrals" ON public.affiliate_referrals FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Affiliates view own withdrawals" ON public.affiliate_withdrawals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_withdrawals.affiliate_id AND user_id = auth.uid())
);
CREATE POLICY "Affiliates create own withdrawals" ON public.affiliate_withdrawals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_withdrawals.affiliate_id AND user_id = auth.uid())
);
CREATE POLICY "Admins manage affiliate withdrawals" ON public.affiliate_withdrawals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- seller_withdrawals
CREATE POLICY "Sellers view own withdrawals" ON public.seller_withdrawals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sellers WHERE id = seller_withdrawals.seller_id AND user_id = auth.uid())
);
CREATE POLICY "Sellers create own withdrawals" ON public.seller_withdrawals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.sellers WHERE id = seller_withdrawals.seller_id AND user_id = auth.uid())
);
CREATE POLICY "Admins manage seller withdrawals" ON public.seller_withdrawals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- payment_methods (public read non-sensitive; admin manage)
CREATE POLICY "Public view payment methods" ON public.payment_methods FOR SELECT USING (is_manual_active = true OR is_automatic_active = true);
CREATE POLICY "Admins manage payment methods" ON public.payment_methods FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- blog
CREATE POLICY "Public view blog categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage blog categories" ON public.blog_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public view published posts" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage blog posts" ON public.blog_posts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- faq
CREATE POLICY "Public view faq categories" ON public.faq_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage faq categories" ON public.faq_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public view active faqs" ON public.faqs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage faqs" ON public.faqs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- newsletter
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view subscribers" ON public.newsletter_subscribers FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage subscribers" ON public.newsletter_subscribers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- support tickets
CREATE POLICY "Users view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own tickets" ON public.support_tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage tickets" ON public.support_tickets FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own ticket messages" ON public.ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_messages.ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Users create messages on own tickets" ON public.ticket_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_messages.ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Admins manage ticket messages" ON public.ticket_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- hero/offer/review slides (public read active)
CREATE POLICY "Public view active hero slides" ON public.hero_slides FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage hero slides" ON public.hero_slides FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public view active offer slides" ON public.offer_slides FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage offer slides" ON public.offer_slides FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public view active review slides" ON public.review_slides FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage review slides" ON public.review_slides FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- timers
CREATE POLICY "Public view active timers" ON public.countdown_timers FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage timers" ON public.countdown_timers FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public view banner timer" ON public.offer_banner_timer FOR SELECT USING (true);
CREATE POLICY "Admins manage banner timer" ON public.offer_banner_timer FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- popup
CREATE POLICY "Public view active popup" ON public.popup_settings FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage popup" ON public.popup_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- developer page
CREATE POLICY "Public view developer page" ON public.developer_page FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage developer page" ON public.developer_page FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- pages
CREATE POLICY "Public view active pages" ON public.pages FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage pages" ON public.pages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- product view logs (insert by anyone, view by admin)
CREATE POLICY "Anyone can log view" ON public.product_view_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view logs" ON public.product_view_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- email templates (admin only)
CREATE POLICY "Admins manage email templates" ON public.email_templates FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- site settings (public read; admin write)
CREATE POLICY "Public view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- homepage sections (public read; admin write)
CREATE POLICY "Public view homepage sections" ON public.homepage_sections FOR SELECT USING (true);
CREATE POLICY "Admins manage homepage sections" ON public.homepage_sections FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- applications
CREATE POLICY "Users view own seller app" ON public.seller_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own seller app" ON public.seller_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage seller apps" ON public.seller_applications FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own affiliate app" ON public.affiliate_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own affiliate app" ON public.affiliate_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage affiliate apps" ON public.affiliate_applications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- pwa notifications
CREATE POLICY "Public view sent pwa notifications" ON public.pwa_notifications FOR SELECT USING (status = 'sent');
CREATE POLICY "Admins manage pwa notifications" ON public.pwa_notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- recently viewed
CREATE POLICY "Users manage own recently viewed" ON public.recently_viewed FOR ALL USING (auth.uid() = user_id);
