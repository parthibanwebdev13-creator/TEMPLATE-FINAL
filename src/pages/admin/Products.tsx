import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronRight, Upload, ArrowLeft, Pencil, Trash2, X } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { Badge } from '@/components/ui/badge';
import { VariantOption, MeasurementOption } from '@/types/products';
import type { Json } from '@/integrations/supabase/types';

type ProductFormState = {
  name: string;
  description: string;
  price_per_litre: string;
  offer_price_per_litre: string;
  stock_quantity: string;
  image_url: string;
  category_id: string;
  variant_enabled: boolean;
  variant_title: string;
  variant_values: VariantOption[];
  measurement_enabled: boolean;
  measurement_title: string;
  measurement_values: MeasurementOption[];
  is_active: boolean;
  featured_in_offers: boolean;
};

const createInitialFormState = (): ProductFormState => ({
  name: '',
  description: '',
  price_per_litre: '',
  offer_price_per_litre: '',
  stock_quantity: '',
  image_url: '',
  category_id: '',
  variant_enabled: false,
  variant_title: '',
  variant_values: [],
  measurement_enabled: false,
  measurement_title: '',
  measurement_values: [],
  is_active: true,
  featured_in_offers: false,
});

export default function AdminProducts() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [productImageUploading, setProductImageUploading] = useState(false);
  const [variantImageUploadingIndex, setVariantImageUploadingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductFormState>(createInitialFormState());
  const [variantValueInput, setVariantValueInput] = useState('');
  const [measurementValueInput, setMeasurementValueInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const variantImageInputsRef = useRef<Record<number, HTMLInputElement | null>>({});

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_categories (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

const normalizeVariantValues = (values: any): VariantOption[] => {
  if (!Array.isArray(values)) return [];

  const normalized: VariantOption[] = [];

  values.forEach((value) => {
    if (!value) return;

    let obj: any = value;

    // If it's a string, try to parse JSON first
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return;

      try {
        const parsed = JSON.parse(trimmed);
        obj = parsed;
      } catch {
        // Not JSON (just "M", "L", etc.) – use as label
        normalized.push({ label: trimmed });
        return;
      }
    }

    if (typeof obj === 'object') {
      const label = typeof obj.label === 'string' ? obj.label.trim() : '';
      if (!label) return;

      const imageUrl =
        typeof obj.image_url === 'string' && obj.image_url.length > 0
          ? obj.image_url
          : undefined;

      const price =
        typeof obj.price === 'number'
          ? obj.price
          : typeof obj.price === 'string' && obj.price !== ''
          ? parseFloat(obj.price)
          : undefined;

      const variant: VariantOption = { label };
      if (imageUrl) variant.image_url = imageUrl;
      if (typeof price === 'number' && !Number.isNaN(price)) {
        variant.price = price;
      }

      normalized.push(variant);
    }
  });

  return normalized;
};

const serializeVariantValues = (values: VariantOption[]): Json =>
  values.map((variant) => ({
    label: variant.label,
    image_url: variant.image_url ?? null,
    price: variant.price ?? null,
  })) as Json;

const normalizeMeasurementValues = (values: any): MeasurementOption[] => {
  if (!Array.isArray(values)) return [];

  const normalized: MeasurementOption[] = [];

  values.forEach((value) => {
    if (!value) return;

    let obj: any = value;

    // If it's a string, try to parse JSON first
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return;

      try {
        const parsed = JSON.parse(trimmed);
        obj = parsed;
      } catch {
        // Not JSON (just "M", "1L", etc.) – use as label
        normalized.push({ label: trimmed });
        return;
      }
    }

    if (typeof obj === 'object') {
      const label = typeof obj.label === 'string' ? obj.label.trim() : '';
      if (!label) return;

      const price =
        typeof obj.price === 'number'
          ? obj.price
          : typeof obj.price === 'string' && obj.price !== ''
          ? parseFloat(obj.price)
          : undefined;

      const measurement: MeasurementOption = { label };
      if (typeof price === 'number' && !Number.isNaN(price)) {
        measurement.price = price;
      }

      normalized.push(measurement);
    }
  });

  return normalized;
};

  const serializeMeasurementValues = (values: MeasurementOption[]): Json =>
    values.map((m) => ({ label: m.label, price: m.price ?? null })) as Json;

  const uploadImageToStorage = async (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be logged in to upload images');
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      throw new Error('Admin privileges required to upload images');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      if (uploadError.message.includes('bucket not found')) {
        throw new Error('Storage bucket not found. Please contact administrator to set up the product-images bucket.');
      } else if (uploadError.message.includes('permission denied')) {
        throw new Error('Permission denied. Please ensure you have admin privileges.');
      } else if (uploadError.message.includes('file size')) {
        throw new Error('File too large. Please choose a smaller image.');
      } else {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(filePath);

    return publicUrl;
  };

  const handleProductImageUpload = async (file: File) => {
    setProductImageUploading(true);
    try {
      const publicUrl = await uploadImageToStorage(file);
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload image';
      toast.error(errorMessage);
    } finally {
      setProductImageUploading(false);
    }
  };

  const handleVariantImageUpload = async (index: number, file: File) => {
    setVariantImageUploadingIndex(index);
    try {
      const publicUrl = await uploadImageToStorage(file);
      setFormData((prev) => {
        const updatedVariants = [...prev.variant_values];
        if (!updatedVariants[index]) {
          return prev;
        }
        updatedVariants[index] = {
          ...updatedVariants[index],
          image_url: publicUrl,
        };
        return { ...prev, variant_values: updatedVariants };
      });
      toast.success('Variant image updated');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload variant image';
      toast.error(errorMessage);
    } finally {
      setVariantImageUploadingIndex(null);
      const inputRef = variantImageInputsRef.current[index];
      if (inputRef) {
        inputRef.value = '';
      }
    }
  };

  const createProductMutation = useMutation({
    mutationFn: async () => {
      if (!formData.name || !formData.price_per_litre || !formData.stock_quantity) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.variant_enabled) {
        if (!formData.variant_title.trim()) {
          throw new Error('Please provide a title for the variant options');
        }
        if (formData.variant_values.length === 0) {
          throw new Error('Add at least one variant option with a label');
        }
      }

      if (formData.measurement_enabled) {
        if (!formData.measurement_title.trim()) {
          throw new Error('Please provide a title for the measurement options');
        }
        if (formData.measurement_values.length === 0) {
          throw new Error('Add at least one measurement option value');
        }
      }

      if (editingProduct) {
        const { error } = await supabase.from('products').update({
          name: formData.name,
          description: formData.description || null,
          image_url: formData.image_url || null,
          price_per_litre: parseFloat(formData.price_per_litre),
          offer_price_per_litre: formData.offer_price_per_litre ? parseFloat(formData.offer_price_per_litre) : null,
          stock_quantity: parseInt(formData.stock_quantity),
          category_id: formData.category_id || null,
          variant_enabled: formData.variant_enabled,
          variant_title: formData.variant_enabled && formData.variant_title ? formData.variant_title : null,
          variant_values:
            formData.variant_enabled && formData.variant_values.length > 0
              ? serializeVariantValues(formData.variant_values)
              : [],
          measurement_enabled: formData.measurement_enabled,
          measurement_title:
            formData.measurement_enabled && formData.measurement_title ? formData.measurement_title : null,
          measurement_values:
            formData.measurement_enabled && formData.measurement_values.length > 0
              ? serializeMeasurementValues(formData.measurement_values)
              : [],
          is_active: formData.is_active,
          featured_in_offers: formData.featured_in_offers,
        }).eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert({
          name: formData.name,
          description: formData.description || null,
          image_url: formData.image_url || null,
          price_per_litre: parseFloat(formData.price_per_litre),
          offer_price_per_litre: formData.offer_price_per_litre ? parseFloat(formData.offer_price_per_litre) : null,
          stock_quantity: parseInt(formData.stock_quantity),
          category_id: formData.category_id || null,
          variant_enabled: formData.variant_enabled,
          variant_title: formData.variant_enabled && formData.variant_title ? formData.variant_title : null,
          variant_values:
            formData.variant_enabled && formData.variant_values.length > 0
              ? serializeVariantValues(formData.variant_values)
              : [],
          measurement_enabled: formData.measurement_enabled,
          measurement_title:
            formData.measurement_enabled && formData.measurement_title ? formData.measurement_title : null,
          measurement_values:
            formData.measurement_enabled && formData.measurement_values.length > 0
              ? serializeMeasurementValues(formData.measurement_values)
              : [],
          is_active: formData.is_active,
          featured_in_offers: formData.featured_in_offers,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      setShowAddForm(false);
      setEditingProduct(null);
      setFormData(createInitialFormState());
      setVariantValueInput('');
      setMeasurementValueInput('');
      setImageFile(null);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save product');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price_per_litre: product.price_per_litre.toString(),
      offer_price_per_litre: product.offer_price_per_litre?.toString() || '',
      stock_quantity: product.stock_quantity.toString(),
      image_url: product.image_url || '',
      category_id: product.category_id || '',
      variant_enabled: Boolean(product.variant_enabled),
      variant_title: product.variant_title || '',
      variant_values: normalizeVariantValues(product.variant_values),
      measurement_enabled: Boolean(product.measurement_enabled),
      measurement_title: product.measurement_title || '',
      measurement_values: normalizeMeasurementValues(product.measurement_values),
      is_active: product.is_active,
      featured_in_offers: product.featured_in_offers || false,
    });
    setVariantValueInput('');
    setMeasurementValueInput('');
    setImageFile(null);
    setShowAddForm(true);
  };

  const handleVariantLabelChange = (index: number, label: string) => {
    setFormData((prev) => {
      const updated = [...prev.variant_values];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], label };
      return { ...prev, variant_values: updated };
    });
  };

  const handleVariantPriceChange = (index: number, priceStr: string) => {
    setFormData((prev) => {
      const updated = [...prev.variant_values];
      if (!updated[index]) return prev;
      const price = priceStr === '' ? undefined : parseFloat(priceStr);
      updated[index] = { ...updated[index], price: typeof price === 'number' && !Number.isNaN(price) ? price : undefined };
      return { ...prev, variant_values: updated };
    });
  };

  const addVariantValue = () => {
    const label = variantValueInput.trim();
    if (!label) return;
    if (formData.variant_values.some((variant) => variant.label.toLowerCase() === label.toLowerCase())) {
      toast.error('Variant already exists');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      variant_values: [...prev.variant_values, { label }],
    }));
    setVariantValueInput('');
  };

  const removeVariantValue = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variant_values: prev.variant_values.filter((_, i) => i !== index),
    }));
    delete variantImageInputsRef.current[index];
  };

  const handleMeasurementPriceChange = (index: number, priceStr: string) => {
    setFormData((prev) => {
      const updated = [...prev.measurement_values];
      if (!updated[index]) return prev;
      const price = priceStr === '' ? undefined : parseFloat(priceStr);
      updated[index] = { ...updated[index], price: typeof price === 'number' && !Number.isNaN(price) ? price : undefined };
      return { ...prev, measurement_values: updated };
    });
  };

  const clearVariantImage = (index: number) => {
    setFormData((prev) => {
      const updated = [...prev.variant_values];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], image_url: null };
      return { ...prev, variant_values: updated };
    });
  };

  const addMeasurementValue = () => {
    if (measurementValueInput.trim()) {
      setFormData({
        ...formData,
        measurement_values: [...formData.measurement_values, { label: measurementValueInput.trim() }],
      });
      setMeasurementValueInput('');
    }
  };

  const removeMeasurementValue = (index: number) => {
    setFormData({
      ...formData,
      measurement_values: formData.measurement_values.filter((_, i) => i !== index),
    });
  };


  if (!isAdmin) {
    navigate('/');
    return null;
  }

  if (showAddForm) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => {
              setShowAddForm(false);
              setEditingProduct(null);
              setFormData({
                name: '',
                description: '',
                price_per_litre: '',
                offer_price_per_litre: '',
                stock_quantity: '',
                image_url: '',
                category_id: '',
                variant_enabled: false,
                variant_title: '',
                variant_values: [],
                measurement_enabled: false,
                measurement_title: '',
                measurement_values: [],
                is_active: true,
                featured_in_offers: false,
              });
              setVariantValueInput('');
              setMeasurementValueInput('');
            }}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>

          <h1 className="text-3xl font-bold mb-8">{editingProduct ? 'Edit Product' : 'Add New Product'}</h1>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Left Column - Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Product Name <span className="text-destructive">*</span></Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="Enter product name" 
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Detailed product description" 
                    rows={4} 
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => {
                        const CategoryIcon = getCategoryIcon(category.name);
                        return (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4" />
                              {category.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {/* Variant Section */}
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Label>Variant</Label>
                    <Switch
                      checked={formData.variant_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, variant_enabled: checked })}
                    />
                  </div>
                  {formData.variant_enabled && (
                    <div className="space-y-4">
                      <div>
                        <Label>Variant Title (e.g., Color, Size)</Label>
                        <Input
                          value={formData.variant_title}
                          onChange={(e) => setFormData({ ...formData, variant_title: e.target.value })}
                          placeholder="Enter variant title (e.g., Color)"
                        />
                      </div>
                      <div>
                        <Label>Add Variant Options</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            value={variantValueInput}
                            onChange={(e) => setVariantValueInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addVariantValue();
                              }
                            }}
                            placeholder="Enter variant value (e.g., Red)"
                          />
                          <Button type="button" onClick={addVariantValue} size="sm">
                            Add Option
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Save the option label first, then upload an optional image/icon for that variant.
                        </p>
                      </div>
                      {formData.variant_values.length > 0 && (
                        <div className="space-y-3">
                          {formData.variant_values.map((variant, index) => (
                            <div key={`${variant.label}-${index}`} className="rounded-lg border p-3 space-y-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                                <div className="flex-1">
                                  <Label className="text-xs text-muted-foreground">Label</Label>
                                  <Input
                                    value={variant.label}
                                    onChange={(e) => handleVariantLabelChange(index, e.target.value)}
                                    placeholder="Variant label"
                                  />
                                </div>
                                <div className="w-40">
                                  <Label className="text-xs text-muted-foreground">Price (optional)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={variant.price?.toString() ?? ''}
                                    onChange={(e) => handleVariantPriceChange(index, e.target.value)}
                                    placeholder="e.g. 120.00"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive self-start"
                                  onClick={() => removeVariantValue(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex flex-wrap items-center gap-4">
                                {variant.image_url ? (
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={variant.image_url}
                                      alt={`${variant.label} preview`}
                                      className="h-16 w-16 rounded-md object-cover border"
                                    />
                                    <Button variant="outline" size="sm" onClick={() => clearVariantImage(index)}>
                                      Remove Image
                                    </Button>
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">No image uploaded yet</p>
                                )}
                                <div className="space-y-1">
                                  <Input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                    disabled={variantImageUploadingIndex === index}
                                    ref={(el) => {
                                      variantImageInputsRef.current[index] = el;
                                    }}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleVariantImageUpload(index, file);
                                      }
                                    }}
                                  />
                                  {variantImageUploadingIndex === index && (
                                    <p className="text-xs text-muted-foreground">Uploading...</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Measurement Section */}
                <div className="space-y-3 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Label>Measurement</Label>
                    <Switch 
                      checked={formData.measurement_enabled} 
                      onCheckedChange={(checked) => setFormData({ ...formData, measurement_enabled: checked })} 
                    />
                  </div>
                  {formData.measurement_enabled && (
                    <div className="space-y-3">
                      <div>
                        <Label>Measurement Title (e.g., Litre, Kg, Size)</Label>
                        <Input 
                          value={formData.measurement_title} 
                          onChange={(e) => setFormData({ ...formData, measurement_title: e.target.value })} 
                          placeholder="Enter measurement title (e.g., Litre)" 
                        />
                      </div>
                      <div>
                        <Label>Measurement Values</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={measurementValueInput} 
                            onChange={(e) => setMeasurementValueInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addMeasurementValue();
                              }
                            }}
                            placeholder="Enter measurement value (e.g., 1L)" 
                          />
                          <Button type="button" onClick={addMeasurementValue} size="sm">Add</Button>
                        </div>
                        {formData.measurement_values.length > 0 && (
                          <div className="flex flex-col gap-2 mt-2">
                            {formData.measurement_values.map((m, index) => (
                              <div key={`${m.label}-${index}`} className="flex items-center gap-2">
                                <div className="flex-1">
                                  <div className="text-xs text-muted-foreground">{formData.measurement_title && `${formData.measurement_title}: `}{m.label}</div>
                                </div>
                                <div className="w-40">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={m.price?.toString() ?? ''}
                                    onChange={(e) => handleMeasurementPriceChange(index, e.target.value)}
                                    placeholder="Price (optional)"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMeasurementValue(index)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Pricing & Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Price per Kg (₹) <span className="text-destructive">*</span></Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={formData.price_per_litre} 
                    onChange={(e) => setFormData({ ...formData, price_per_litre: e.target.value })} 
                    placeholder="130.00" 
                    required
                  />
                </div>
                <div>
                  <Label>Offer Price per Kg (₹)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={formData.offer_price_per_litre} 
                    onChange={(e) => setFormData({ ...formData, offer_price_per_litre: e.target.value })} 
                    placeholder="Optional discount price" 
                  />
                </div>
                <div>
                  <Label>Stock Quantity (Kg) <span className="text-destructive">*</span></Label>
                  <Input 
                    type="number" 
                    value={formData.stock_quantity} 
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} 
                    placeholder="150" 
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Media & Visibility */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Product Media & Visibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Product Image</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        setImageFile(file);
                        handleProductImageUpload(file);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {productImageUploading ? (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-sm text-primary">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">Upload Product Image</p>
                        <p className="text-xs text-muted-foreground mb-2">Max 5MB • JPEG, PNG, WebP, GIF</p>
                      </>
                    )}
                    <Input 
                      type="file" 
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          handleProductImageUpload(file);
                        }
                      }}
                      className="mt-2"
                      disabled={productImageUploading}
                      ref={fileInputRef}
                    />
                    {imageFile && !productImageUploading && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <p className="font-medium">Selected: {imageFile.name}</p>
                        <p className="text-muted-foreground">
                          {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                    {formData.image_url && (
                      <div className="mt-4">
                        <p className="text-sm text-green-600 mb-2">✓ Image uploaded successfully</p>
                        <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover rounded border" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Visible on Website</Label>
                    <Switch 
                      checked={formData.is_active} 
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Featured in Offers Section</Label>
                    <Switch 
                      checked={formData.featured_in_offers} 
                      onCheckedChange={(checked) => setFormData({ ...formData, featured_in_offers: checked })} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => createProductMutation.mutate()} 
              size="lg" 
              disabled={createProductMutation.isPending || productImageUploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {createProductMutation.isPending ? 'Saving...' : (editingProduct ? 'Update Product' : 'Save Product')}
            </Button>
            <Button 
              variant="destructive" 
              size="lg" 
              onClick={() => setShowAddForm(false)}
              disabled={createProductMutation.isPending || productImageUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Products</h1>
          <Button onClick={() => setShowAddForm(true)}>Add Product</Button>
        </div>

        <div className="grid gap-4">
          {products?.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded" />
                  )}
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ₹{product.price_per_litre}/kg | Stock: {product.stock_quantity}kg
                    </p>
                    {product.product_categories && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Category:</span>
                        {(() => {
                          const CategoryIcon = getCategoryIcon(product.product_categories.name);
                          return (
                            <div className="flex items-center gap-1">
                              <CategoryIcon className="h-3 w-3" />
                              <span>{product.product_categories.name}</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this product?')) {
                        deleteProductMutation.mutate(product.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}