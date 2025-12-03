import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';

const checkoutSchema = z.object({
  address: z.string().min(10, 'Address must be at least 10 characters'),
  couponCode: z.string().optional(),
});

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [address, setAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const { data: cartItems } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('cart_items')
        .select(`*, products (*)`)
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const subtotal = cartItems?.reduce((sum, item) => {
    // Use stored variant_price and measurement_price from cart item
    const variantPrice = typeof item.variant_price === 'number' ? item.variant_price : item.variant_selection?.price;
    const measurementPrice = typeof item.measurement_price === 'number' ? item.measurement_price : undefined;
    const price = (typeof variantPrice === 'number' || typeof measurementPrice === 'number')
      ? ((variantPrice ?? 0) + (measurementPrice ?? 0))
      : (item.products?.offer_price_per_litre ?? item.products?.price_per_litre ?? 0);
    return sum + price * item.quantity_litres;
  }, 0) || 0;

  const discount = appliedCoupon
    ? appliedCoupon.discount_type === 'percentage'
      ? Math.min(
          (subtotal * appliedCoupon.discount_value) / 100,
          appliedCoupon.max_discount_amount || Infinity
        )
      : appliedCoupon.discount_value
    : 0;

  const total = subtotal - discount;

  // Create a pending order and items in Supabase before initiating payment
  const createSupabaseOrder = async () => {
    if (!user || !cartItems?.length) throw new Error('Cart is empty');
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        total_amount: subtotal,
        discount_amount: discount,
        final_amount: total,
        coupon_code: appliedCoupon?.code,
        shipping_address: address,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = cartItems.map((item) => {
      const variantPrice = typeof item.variant_price === 'number' ? item.variant_price : item.variant_selection?.price;
      const measurementPrice = typeof item.measurement_price === 'number' ? item.measurement_price : undefined;
      const pricePerLitre = (typeof variantPrice === 'number' || typeof measurementPrice === 'number')
        ? ((variantPrice ?? 0) + (measurementPrice ?? 0))
        : (item.products?.offer_price_per_litre ?? item.products?.price_per_litre ?? 0);
      return {
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.products?.name || '',
        quantity_litres: item.quantity_litres,
        price_per_litre: pricePerLitre,
        total_price: pricePerLitre * item.quantity_litres,
        variant_selection: item.variant_selection || null,
        measurement_label: item.measurement_label || item.products?.measurement_title || null,
        measurement_value: item.measurement_value || null,
      };
    });

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;
    return order;
  };

  const applyCouponMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Invalid coupon code');

      if (data.min_order_amount && subtotal < data.min_order_amount) {
        throw new Error(`Minimum order amount is ₹${data.min_order_amount}`);
      }

      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        throw new Error('Coupon has expired');
      }

      return data;
    },
    onSuccess: (data) => {
      setAppliedCoupon(data);
      toast.success('Coupon applied successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please login');

      try {
        checkoutSchema.parse({ address });
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(error.errors[0].message);
        }
      }

      if (!cartItems || cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Create pending order and items
      const order = await createSupabaseOrder();

      // For UPI/QR: show instructions and keep payment_status pending. Users will pay via UPI and share reference.
      // Optionally, you could prompt users to upload UPI reference/txn id on next screen.

      return order;
    },
    onSuccess: (order) => {
      toast.success('Order created. Proceed to pay.');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      navigate(`/payment?orderId=${order.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Checkout
          </h1>
          <p className="text-muted-foreground">Complete your order securely</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-primary/10 shadow-md">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-primary/10">
                <CardTitle className="text-xl">📍 Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your complete shipping address"
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-primary/10 shadow-md">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-primary/10">
                <CardTitle className="text-xl">🎟️ Apply Coupon</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    disabled={!!appliedCoupon}
                    className="shadow-sm"
                  />
                  {!appliedCoupon ? (
                    <Button
                      onClick={() => applyCouponMutation.mutate()}
                      disabled={!couponCode || applyCouponMutation.isPending}
                      className="shadow-md"
                    >
                      Apply
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode('');
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4 border border-primary/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-primary/10">
                <CardTitle className="text-xl">📋 Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>✨ Discount</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-6">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">₹{total.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full py-6 text-lg shadow-md hover:shadow-lg transition-shadow"
                    size="lg"
                    onClick={() => placeOrderMutation.mutate()}
                    disabled={placeOrderMutation.isPending}
                  >
                    {placeOrderMutation.isPending ? 'Creating Order...' : 'Proceed to Pay'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}