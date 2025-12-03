-- =========================================================
-- 1. Roles enum & base user-related tables
-- =========================================================

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('customer', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Secondary user profile table (for public profile / reviews display)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
  ON public.user_profiles(user_id);

-- =========================================================
-- 2. Core product & commerce tables
-- =========================================================

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price_per_litre DECIMAL(10,2) NOT NULL,
  offer_price_per_litre DECIMAL(10,2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Variant & measurement configuration
  variant_enabled BOOLEAN NOT NULL DEFAULT false,
  variant_title TEXT,
  variant_values JSONB NOT NULL DEFAULT '[]'::jsonb,
  measurement_enabled BOOLEAN NOT NULL DEFAULT false,
  measurement_title TEXT,
  measurement_values TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.products.variant_enabled IS
  'Whether variant selection is enabled for this product';

COMMENT ON COLUMN public.products.variant_title IS
  'Title/label for variant (e.g., Color, Size)';

COMMENT ON COLUMN public.products.variant_values IS
  'JSON array of variant options including label and optional image URL';

COMMENT ON COLUMN public.products.measurement_enabled IS
  'Whether measurement selection is enabled for this product';

COMMENT ON COLUMN public.products.measurement_title IS
  'Title/label for measurement (e.g., Litre, Kg, Size)';

COMMENT ON COLUMN public.products.measurement_values IS
  'Array of measurement values (e.g., ["1L", "2L", "3L"])';

-- Coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cart items
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity_litres DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wishlist
CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  coupon_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  product_name TEXT NOT NULL,
  quantity_litres DECIMAL(10,2) NOT NULL,
  price_per_litre DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Shipments
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  tracking_number TEXT,
  carrier TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_transit', 'delivered')),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages (internal messaging)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product categories
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link products to categories
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL;

-- Extra product columns

-- litres_per_unit
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS litres_per_unit DECIMAL(10,2) NOT NULL DEFAULT 1.0;

COMMENT ON COLUMN public.products.litres_per_unit IS
  'Amount of litres contained in one unit of this product (e.g., 1.0 for 1L bottle, 0.5 for 500ml bottle)';

-- featured_in_offers
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS featured_in_offers BOOLEAN NOT NULL DEFAULT false;

-- keywords for search
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS keywords TEXT[];

COMMENT ON COLUMN public.products.keywords IS
  'Array of keywords/tags for product search and categorization';

-- Index for keywords
CREATE INDEX IF NOT EXISTS idx_products_keywords
  ON public.products
  USING GIN (keywords);

-- Add variant/measurement metadata to cart items
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS variant_selection JSONB,
  ADD COLUMN IF NOT EXISTS measurement_label TEXT,
  ADD COLUMN IF NOT EXISTS measurement_value TEXT;

COMMENT ON COLUMN public.cart_items.variant_selection IS 'Selected variant metadata (label, optional image URL)';
COMMENT ON COLUMN public.cart_items.measurement_label IS 'Display label for the selected measurement (e.g., Litre, Size)';
COMMENT ON COLUMN public.cart_items.measurement_value IS 'Selected measurement value (e.g., 1L, 500ml)';

-- Mirror the same metadata on order items so orders keep a snapshot
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_selection JSONB,
  ADD COLUMN IF NOT EXISTS measurement_label TEXT,
  ADD COLUMN IF NOT EXISTS measurement_value TEXT;

COMMENT ON COLUMN public.order_items.variant_selection IS 'Selected variant metadata (label, optional image URL)';
COMMENT ON COLUMN public.order_items.measurement_label IS 'Display label for the selected measurement';
COMMENT ON COLUMN public.order_items.measurement_value IS 'Selected measurement value';

-- Generated label from variant_selection
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS variant_selection_label TEXT
    GENERATED ALWAYS AS ((variant_selection ->> 'label')) STORED;

-- Allow multiple rows for same product with different variant/measurement
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_product_variant_measurement_key
  ON public.cart_items (
    user_id,
    product_id,
    (variant_selection->>'label'),
    measurement_value
  );

-- Optional per-measurement / per-variant prices
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS measurement_price NUMERIC DEFAULT NULL;

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS variant_price NUMERIC DEFAULT NULL;

-- Wishlist indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON public.wishlist(product_id);

-- =========================================================
-- 3. Enable Row Level Security (RLS)
-- =========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 4. RLS Policies
-- =========================================================

-- Profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view user profiles"
  ON public.user_profiles
  FOR SELECT
  USING (true);

-- Products
CREATE POLICY "Everyone can view active products"
  ON public.products
  FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
  ON public.products
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
  ON public.products
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Product categories
CREATE POLICY "Anyone can view active categories"
  ON public.product_categories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can insert categories"
  ON public.product_categories
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update categories"
  ON public.product_categories
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete categories"
  ON public.product_categories
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Coupons
CREATE POLICY "Everyone can view active coupons"
  ON public.coupons
  FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage coupons"
  ON public.coupons
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Cart items
CREATE POLICY "Users can view own cart"
  ON public.cart_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON public.cart_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON public.cart_items
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON public.cart_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Wishlist
CREATE POLICY "Users can view own wishlist"
  ON public.wishlist
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlist items"
  ON public.wishlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist items"
  ON public.wishlist
  FOR DELETE
  USING (auth.uid() = user_id);

-- Orders
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Order items
CREATE POLICY "Users can view own order items"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON public.order_items
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Reviews
CREATE POLICY "Everyone can view reviews"
  ON public.reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Shipments
CREATE POLICY "Users can view own shipments"
  ON public.shipments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE orders.id = shipments.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all shipments"
  ON public.shipments
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage shipments"
  ON public.shipments
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Messages
CREATE POLICY "Users can view own messages"
  ON public.messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages"
  ON public.messages
  FOR UPDATE
  USING (auth.uid() = recipient_id);

-- =========================================================
-- 5. Triggers & helper functions
-- =========================================================

-- New user handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign customer role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Order number generator
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_order_number TEXT;
BEGIN
  new_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                      LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN new_order_number;
END;
$$;

-- =========================================================
-- 6. Storage bucket & policies for product images
-- =========================================================

-- Ensure product-images bucket exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets 
        WHERE id = 'product-images'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'product-images', 
            'product-images', 
            true,
            5242880, -- 5MB
            ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        );
    END IF;
END $$;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- RLS policies for product images in storage.objects
CREATE POLICY "Anyone can view product images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
