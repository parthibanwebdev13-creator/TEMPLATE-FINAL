-- Migration: Replace unique constraint on (user_id, product_id)
-- with a unique index that includes variant label and measurement_value.
-- This allows a user to have multiple cart rows for the same product
-- when they select different variants or different measurement options.

BEGIN;

-- Drop the old unique constraint that prevents multiple rows per user+product
ALTER TABLE IF EXISTS public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

-- Create a unique index that allows multiple rows for the same product
-- as long as the variant label or measurement differs.
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_product_variant_measurement_key
  ON public.cart_items (
    user_id,
    product_id,
    (variant_selection->>'label'),
    measurement_value
  );

COMMIT;
