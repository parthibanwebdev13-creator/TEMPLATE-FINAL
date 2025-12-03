-- Migration: Add measurement_price column to cart_items
-- This ensures the measurement price is persisted on the cart row,
-- so prices don't change if product data is updated later.

ALTER TABLE public.cart_items
ADD COLUMN IF NOT EXISTS measurement_price numeric DEFAULT NULL;

ALTER TABLE public.cart_items
ADD COLUMN IF NOT EXISTS variant_price numeric DEFAULT NULL;
