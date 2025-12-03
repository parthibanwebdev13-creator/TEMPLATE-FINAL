# Storage Setup Instructions

## Step 1: Create Environment Variables

First, you need to create a `.env` file with your Supabase credentials:

1. **Create a `.env` file** in the project root (same folder as `package.json`)

2. **Get your Supabase credentials**:
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to **Settings** → **API**
   - Copy the **Project URL** and **anon public** key

3. **Add to `.env` file**:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

## Step 2: Create the Storage Bucket

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Click **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Fill in the details:
   - **Name**: `product-images`
   - **Public**: ✅ Yes (check this box)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp,image/gif`
5. Click **Create bucket**

### Option B: Using the Setup Script

After creating the `.env` file, run:

```bash
npm run setup-storage
```

## Step 3: Verify Setup

1. **Check the bucket exists**:
   - Go to Storage in Supabase Dashboard
   - You should see `product-images` in the list

2. **Test image upload**:
   - Go to your admin panel
   - Try uploading an image
   - Check browser console for any errors

## Troubleshooting

### "Invalid supabaseUrl" Error
- Make sure your `.env` file has the correct format
- Check that the URL starts with `https://`
- Ensure there are no extra spaces or quotes

### "Bucket not found" Error
- The bucket wasn't created successfully
- Try creating it manually in the Supabase Dashboard
- Check that the bucket name is exactly `product-images`

### "Permission denied" Error
- Check that your user has admin role in the `user_roles` table
- Verify the RLS policies are set up correctly

## Quick Test

Once everything is set up, you can test by:

1. Going to your admin products page
2. Clicking "Add Product"
3. Trying to upload an image
4. The upload should work with a success message
