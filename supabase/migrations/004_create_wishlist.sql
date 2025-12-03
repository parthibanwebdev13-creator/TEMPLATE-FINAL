-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own wishlist
CREATE POLICY "Users can view their own wishlist" ON public.wishlist
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert into their wishlist
CREATE POLICY "Users can insert into their own wishlist" ON public.wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete from their wishlist
CREATE POLICY "Users can delete from their own wishlist" ON public.wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX idx_wishlist_product_id ON public.wishlist(product_id);
