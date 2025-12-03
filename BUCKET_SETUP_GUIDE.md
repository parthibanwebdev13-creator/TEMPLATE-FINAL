# Fix "Bucket Not Found" Error

## Quick Fix (Supabase Dashboard)

1. **Go to Supabase Dashboard**
   - Open [supabase.com](https://supabase.com)
   - Sign in and select your project

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Click "Create a new bucket"

3. **Create the Bucket**
   - **Name**: `product-images`
   - **Public**: ✅ Yes (check this box)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp,image/gif`

4. **Save the Bucket**
   - Click "Create bucket"

## Alternative: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Apply the migration
supabase db push

# Or reset and apply all migrations
supabase db reset
```

## Verify the Fix

1. **Check Bucket Exists**
   - Go to Storage in Supabase Dashboard
   - You should see `product-images` in the list

2. **Test Upload**
   - Try uploading an image in your admin panel
   - Check browser console for any remaining errors

## Manual SQL (if needed)

If the above doesn't work, run this SQL in your Supabase SQL Editor:

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images', 
    'product-images', 
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Create policies
CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'));
```

## Troubleshooting

- **Still getting "bucket not found"**: Wait a few minutes after creating the bucket
- **Permission denied**: Check that your user has admin role in `user_roles` table
- **File type errors**: Ensure the bucket allows the image types you're uploading
