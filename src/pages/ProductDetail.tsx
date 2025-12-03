import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Heart, Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import ProductCard from '@/components/ProductCard';
import { VariantOption, MeasurementOption } from '@/types/products';

/* -------------------------
 PARSE VARIANT OPTIONS
-------------------------- */

const parseVariantOptions = (values: any): VariantOption[] => {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => {
      if (!value) return null;

      if (typeof value === 'string') {
        const label = value.trim();
        return label ? { label } : null;
      }

      if (typeof value === 'object') {
        const label = typeof value.label === 'string' ? value.label.trim() : '';
        if (!label) return null;

        const image_url =
          typeof value.image_url === 'string' && value.image_url.length > 0
            ? value.image_url
            : null;

        const price =
          typeof value.price === 'number'
            ? value.price
            : typeof value.price === 'string' && value.price !== ''
            ? parseFloat(value.price)
            : null;

        return price !== null && !Number.isNaN(price)
          ? { label, image_url, price }
          : { label, image_url };
      }

      return null;
    })
    .filter((value): value is VariantOption => Boolean(value));
};

/* -------------------------
 PRODUCT DETAIL PAGE
-------------------------- */

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(null);
  const [selectedMeasurement, setSelectedMeasurement] = useState<MeasurementOption | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);

  /* -------------------------
   FETCH PRODUCT
  -------------------------- */

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          product_categories (
            id,
            name,
            slug
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  /* -------------------------
   FETCH REVIEWS WITH USER PROFILES
  -------------------------- */

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`id, rating, comment, created_at, user_id`)
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map((r) => r.user_id);

        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const profileMap: Record<string, string> = {};
        profiles?.forEach((p) => {
          profileMap[p.user_id] = p.full_name;
        });

        return data.map((r) => ({
          ...r,
          full_name: profileMap[r.user_id],
        }));
      }

      return data;
    },
  });

  /* -------------------------
   RELATED PRODUCTS
  -------------------------- */

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.category_id, id],
    queryFn: async () => {
      if (!product?.category_id || !id) return [];

      const { data: sameCategory, error: catError } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .neq('id', id)
        .limit(6)
        .order('created_at', { ascending: false });

      if (catError) throw catError;

      let related = sameCategory || [];

      if (related.length < 6) {
        const { data: others, error: otherError } = await supabase
          .from('products')
          .select('*')
          .neq('category_id', product.category_id)
          .eq('is_active', true)
          .neq('id', id)
          .limit(6 - related.length)
          .order('created_at', { ascending: false });

        if (otherError) throw otherError;

        related = [...related, ...(others || [])];
      }

      return related.slice(0, 6);
    },
    enabled: !!product?.category_id && !!id,
  });

  /* -------------------------
   MEMO: VARIANTS & MEASUREMENTS
  -------------------------- */

  const variantOptions = useMemo(
    () => parseVariantOptions(product?.variant_values),
    [product?.variant_values]
  );

  const hasVariants = Boolean(product?.variant_enabled && variantOptions.length > 0);

  const measurementValues = useMemo<MeasurementOption[]>(() => {
    const raw = Array.isArray(product?.measurement_values)
      ? product.measurement_values
      : [];

    return raw
      .map((v: any) => {
        if (!v) return null;

        if (typeof v === 'string') {
          const trimmed = v.trim();
          if (!trimmed) return null;

          // JSON string form
          if (
            (trimmed.startsWith('{') || trimmed.startsWith('[')) &&
            trimmed.includes('label')
          ) {
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed && parsed.label) {
                const m: MeasurementOption = { label: parsed.label };
                if (parsed.price) m.price = Number(parsed.price);
                return m;
              }
            } catch {}
          }

          return { label: trimmed } as MeasurementOption;
        }

        if (typeof v === 'object') {
          const label = v.label || '';
          if (!label) return null;

          const price =
            typeof v.price === 'number'
              ? v.price
              : typeof v.price === 'string' && v.price !== ''
              ? parseFloat(v.price)
              : undefined;

          const m: MeasurementOption = { label };
          if (price !== undefined && !Number.isNaN(price)) m.price = price;
          return m;
        }

        return null;
      })
      .filter((v): v is MeasurementOption => Boolean(v));
  }, [product?.measurement_values]);

  const hasMeasurements = Boolean(product?.measurement_enabled && measurementValues.length > 0);

  /* -------------------------
   INITIAL IMAGE / VARIANT / MEASUREMENT
  -------------------------- */

  useEffect(() => {
    if (product) {
      setActiveImageUrl(product.image_url || null);
      setSelectedVariant(null);
      setSelectedMeasurement(null);
    }
  }, [product]);

  /* -------------------------
   CHECK WISHLIST
  -------------------------- */

  useEffect(() => {
    if (user && id) checkWishlist();
  }, [user, id]);

  const checkWishlist = async () => {
    try {
      const { data } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user?.id)
        .eq('product_id', id)
        .maybeSingle();

      setIsWishlisted(!!data);
    } catch {
      setIsWishlisted(false);
    }
  };

  /* -------------------------
   HANDLE VARIANT DEFAULT
  -------------------------- */

  useEffect(() => {
    if (!hasVariants) {
      setSelectedVariant(null);
      return;
    }

    setSelectedVariant((prev) => {
      if (prev && variantOptions.some((v) => v.label === prev.label)) return prev;
      return variantOptions[0] || null;
    });
  }, [hasVariants, variantOptions]);

  /* -------------------------
   HANDLE MEASUREMENT DEFAULT
  -------------------------- */

  useEffect(() => {
    if (!hasMeasurements) {
      setSelectedMeasurement(null);
      return;
    }

    setSelectedMeasurement((prev) => {
      if (prev && measurementValues.some((m) => m.label === prev.label)) return prev;
      return measurementValues[0] || null;
    });
  }, [hasMeasurements, measurementValues]);

  /* -------------------------
   SELECT VARIANT / MEASUREMENT
  -------------------------- */

  const handleSelectVariant = (option: VariantOption) => {
    setSelectedVariant(option);
    if (option.image_url) setActiveImageUrl(option.image_url);
    else setActiveImageUrl(product?.image_url || null);
  };

  const handleSelectMeasurement = (m: MeasurementOption) => {
    setSelectedMeasurement(m);
  };

  /* -------------------------
   TOGGLE WISHLIST
  -------------------------- */

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error('Please login to save to wishlist');
      navigate('/auth');
      return;
    }

    setIsLoadingWishlist(true);

    try {
      if (isWishlisted) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);

        toast.success('Removed from wishlist');
        setIsWishlisted(false);
      } else {
        await supabase.from('wishlist').insert({
          user_id: user.id,
          product_id: id,
        });

        toast.success('Added to wishlist');
        setIsWishlisted(true);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  /* -------------------------
   ADD TO CART
  -------------------------- */

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please login');
      if (!product) throw new Error('Product not found');

      if (hasVariants && !selectedVariant)
        throw new Error(`Please select a ${product.variant_title}`);
      if (hasMeasurements && !selectedMeasurement)
        throw new Error(`Please select a ${product.measurement_title}`);

      const variantPayload = selectedVariant
        ? {
            label: selectedVariant.label,
            image_url: selectedVariant.image_url ?? null,
            price: selectedVariant.price ?? null,
          }
        : null;

      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', id);

      const match = (existing || []).find((item: any) => {
        const itemVar = item?.variant_selection?.label ?? null;
        const currVar = selectedVariant?.label ?? null;

        const itemMeas =
          typeof item?.measurement_value === 'string'
            ? item.measurement_value
            : item?.measurement_value?.label ?? null;

        const currMeas = selectedMeasurement?.label ?? null;

        return itemVar === currVar && itemMeas === currMeas;
      });

      if (match) {
        await supabase
          .from('cart_items')
          .update({
            quantity_litres: match.quantity_litres + quantity,
          })
          .eq('id', match.id);
      } else {
        await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: id,
          quantity_litres: quantity,
          variant_selection: variantPayload,
          variant_price: selectedVariant?.price ?? null,
          measurement_label: product.measurement_title || null,
          measurement_value: selectedMeasurement?.label ?? null,
          measurement_price: selectedMeasurement?.price ?? null,
        });
      }
    },
    onSuccess: () => {
      toast.success('Added to cart');
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  /* -------------------------
   ADD REVIEW
  -------------------------- */

  const addReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please login');
      if (!rating) throw new Error('Please select a rating');
      if (!comment.trim()) throw new Error('Please write a comment');

      await supabase.from('reviews').insert({
        product_id: id,
        user_id: user.id,
        rating,
        comment: comment.trim(),
      });
    },
    onSuccess: () => {
      toast.success('Review added');
      setComment('');
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
    },
    onError: (err: any) => {
      if (err.code === '23505') toast.error('You already reviewed this product');
      else toast.error(err.message);
    },
  });

  /* -------------------------
   DELETE REVIEW
  -------------------------- */

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user) throw new Error('Please login');

      await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      toast.success('Review deleted');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  /* -------------------------
   LOADING STATE
  -------------------------- */

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  /* -------------------------
   EFFECTIVE PRICE
  -------------------------- */

  const vPrice =
    typeof selectedVariant?.price === 'number' &&
    !Number.isNaN(selectedVariant.price)
      ? selectedVariant.price
      : 0;

  const mPrice =
    typeof selectedMeasurement?.price === 'number' &&
    !Number.isNaN(selectedMeasurement.price)
      ? selectedMeasurement.price
      : 0;

  const effectivePrice =
    vPrice || mPrice
      ? vPrice + mPrice
      : product.offer_price_per_litre ?? product.price_per_litre;

  const hasDiscount = effectivePrice < product.price_per_litre;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.price_per_litre - effectivePrice) / product.price_per_litre) * 100
      )
    : 0;

  const averageRating =
    reviews?.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  const displayImage = activeImageUrl || product.image_url || '/placeholder.svg';

  const selectionMissing =
    (hasVariants && !selectedVariant) ||
    (hasMeasurements && !selectedMeasurement);

  /* -------------------------
    JSX RETURN
  -------------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-10 mb-16">
          {/* Image */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 shadow-lg hover:shadow-xl transition-shadow">
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ">
                {product.name}
              </h1>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(averageRating)
                          ? 'fill-primary text-primary'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({reviews?.length || 0} reviews)
                </span>
              </div>

              {hasDiscount && (
                <Badge className="bg-gradient-to-r from-destructive to-red-600 text-white">
                  🔥 {discountPercentage}% OFF
                </Badge>
              )}
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-5 rounded-xl border border-primary/10">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">
                  ₹{effectivePrice.toFixed(2)}
                </span>
                <span className="text-lg text-muted-foreground">/litre</span>
              </div>

              {hasDiscount && (
                <span className="line-through text-lg text-muted-foreground">
                  ₹{product.price_per_litre.toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-muted-foreground text-lg">{product.description}</p>

            {/* Variants */}
            {hasVariants && (
              <div>
                <p className="font-semibold">{product.variant_title}:</p>
                <div className="flex flex-wrap gap-3 mt-2">
                  {variantOptions.map((opt) => {
                    const isSelected = selectedVariant?.label === opt.label;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => handleSelectVariant(opt)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-muted-foreground/30 hover:border-primary/60'
                        }`}
                      >
                        {opt.image_url && (
                          <img
                            src={opt.image_url}
                            className="h-6 w-6 rounded-full"
                          />
                        )}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Measurements */}
            {hasMeasurements && (
              <div>
                <p className="font-semibold">{product.measurement_title}:</p>
                <div className="flex gap-2 flex-wrap mt-2">
                  {measurementValues.map((m) => {
                    const isSelected = selectedMeasurement?.label === m.label;
                    return (
                      <button
                        key={m.label}
                        onClick={() => handleSelectMeasurement(m)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-muted-foreground/30 hover:border-primary/60'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="font-semibold">Quantity (litres):</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-20 text-center"
                />

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                className="flex-1"
                size="lg"
                onClick={() => addToCartMutation.mutate()}
                disabled={
                  product.stock_quantity === 0 ||
                  addToCartMutation.isPending ||
                  selectionMissing
                }
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleWishlistToggle}
                disabled={isLoadingWishlist}
              >
                <Heart
                  className={`h-5 w-5 ${
                    isWishlisted ? 'fill-red-500 text-red-500' : ''
                  }`}
                />
              </Button>
            </div>

            <div className="text-2xl font-bold">
              Total: ₹{(effectivePrice * quantity).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} compact />
                ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Customer Reviews</h2>

          {user && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Write a Review</h3>
                <div className="space-y-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setRating(s)}>
                        <Star
                          className={`h-6 w-6 ${
                            s <= rating ? 'fill-primary text-primary' : 'text-muted'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience..."
                  />

                  <Button onClick={() => addReviewMutation.mutate()}>
                    Submit Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {reviews?.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="font-semibold">{r.full_name || 'Anonymous'}</p>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < r.rating ? 'fill-primary text-primary' : 'text-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>

                      {user?.id === r.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReviewMutation.mutate(r.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="text-muted-foreground">{r.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
