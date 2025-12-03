# Image Upload Troubleshooting Guide

## Issues Fixed

1. **Enhanced Error Handling**: Added detailed error messages and console logging
2. **File Validation**: Added size (5MB max) and type validation (JPEG, PNG, WebP, GIF)
3. **Authentication Checks**: Verify user is logged in and has admin privileges
4. **Better UI Feedback**: Added loading states, file info display, and success indicators
5. **Improved File Naming**: Using timestamp + random string for unique filenames

## Common Issues and Solutions

### 1. Environment Variables Missing
**Problem**: Supabase URL and keys not configured
**Solution**: 
- Create a `.env` file in the project root
- Add your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### 2. Storage Bucket Not Created
**Problem**: `product-images` bucket doesn't exist
**Solution**: 
- Go to Supabase Dashboard → Storage
- Create a new bucket named `product-images`
- Set it to public

### 3. RLS Policies Issues
**Problem**: Upload fails due to Row Level Security policies
**Solution**: 
- Check that the migration `20251006080337_8932d2f2-b383-42eb-8393-08f820b0a0c6.sql` was applied
- Verify admin role is assigned to your user in `user_roles` table

### 4. Authentication Issues
**Problem**: User not authenticated or not admin
**Solution**:
- Ensure user is logged in
- Check `user_roles` table has entry with `role = 'admin'` for your user

## Testing Steps

1. **Check Console**: Open browser dev tools and look for error messages
2. **Verify Environment**: Check that Supabase connection is working
3. **Test File Upload**: Try uploading a small image file (< 1MB)
4. **Check Network Tab**: Look for failed requests to Supabase storage

## Debug Information

The updated code now logs:
- File details (name, size, type)
- Upload progress
- Success/failure messages
- Detailed error information

Check the browser console for these logs when testing.
