import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cartItems } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity_litres: quantity })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item removed');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
    },
  });

  const total = cartItems?.reduce((sum, item) => {
    const product = item.products;
    if (!product) return sum;

    // Use stored prices on cart item (set at add-to-cart time)
    const variantPrice = typeof item.variant_price === 'number' ? item.variant_price : item.variant_selection?.price;
    const measurementPrice = typeof item.measurement_price === 'number' ? item.measurement_price : undefined;

    // If either price exists, use their sum. Otherwise fall back to product price.
    const price = (typeof variantPrice === 'number' || typeof measurementPrice === 'number')
      ? ((variantPrice ?? 0) + (measurementPrice ?? 0))
      : (product.offer_price_per_litre ?? product.price_per_litre ?? 0);

    return sum + price * item.quantity_litres;
  }, 0) || 0;

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Shopping Cart
          </h1>
          <p className="text-muted-foreground">Manage your items and proceed to checkout</p>
        </div>

        {cartItems && cartItems.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const product = item.products;
                if (!product) return null;

                // Use stored prices from cart item (set at add-to-cart time)
                const variantPrice = typeof item.variant_price === 'number' ? item.variant_price : item.variant_selection?.price;
                const measurementPrice = typeof item.measurement_price === 'number' ? item.measurement_price : undefined;

                const price = (typeof variantPrice === 'number' || typeof measurementPrice === 'number')
                  ? ((variantPrice ?? 0) + (measurementPrice ?? 0))
                  : (product.offer_price_per_litre ?? product.price_per_litre);

                return (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow border border-primary/10">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <img
                          src={product.image_url || '/placeholder.svg'}
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded-lg shadow-md"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">{product.name}</h3>
                          <p className="text-primary font-bold mb-2 text-lg">
                            ₹{price.toFixed(2)} / litre
                          </p>
                          {(item.variant_selection?.label || item.measurement_value) && (
                            <div className="text-xs text-muted-foreground space-y-1 mb-3 bg-muted/50 p-2 rounded">
                              {item.variant_selection?.label && (
                                <div>
                                  Variant: <span className="font-medium">{item.variant_selection.label}</span>
                                </div>
                              )}
                              {item.measurement_value && (
                                <div>
                                  {(item.measurement_label || product.measurement_title || 'Measurement') + ':'}{' '}
                                  <span className="font-medium">
                                    {(() => {
                                      // measurement_value may be a JSON string like '{"label":"M","price":100}'
                                      try {
                                        if (typeof item.measurement_value === 'string') {
                                          const trimmed = item.measurement_value.trim();
                                          if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.includes('label')) {
                                            const parsed = JSON.parse(trimmed);
                                            if (parsed && parsed.label) return parsed.label;
                                          }
                                        }
                                      } catch (e) {}
                                      return item.measurement_value;
                                    })()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantityMutation.mutate({
                                  id: item.id,
                                  quantity: Math.max(1, item.quantity_litres - 1),
                                })
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity_litres}
                              onChange={(e) =>
                                updateQuantityMutation.mutate({
                                  id: item.id,
                                  quantity: Math.max(1, parseFloat(e.target.value) || 1),
                                })
                              }
                              className="w-20 text-center"
                              min="1"
                              step="0.5"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantityMutation.mutate({
                                  id: item.id,
                                  quantity: item.quantity_litres + 1,
                                })
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold mb-2">
                            ₹{(price * item.quantity_litres).toFixed(2)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItemMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div>
              <Card className="sticky top-4 border border-primary/10 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Order Summary</h2>
                  <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold text-lg">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-4">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold text-primary">₹{total.toFixed(2)}</span>
                    </div>
                    <Button
                      className="w-full text-lg py-6 shadow-md hover:shadow-lg transition-shadow"
                      size="lg"
                      onClick={() => navigate('/checkout')}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-6">
              <p className="text-3xl mb-2">🛒</p>
              <p className="text-muted-foreground text-lg mb-4">Your cart is empty</p>
            </div>
            <Button size="lg" onClick={() => navigate('/')}>Continue Shopping</Button>
          </div>
        )}
      </div>
    </div>
  );
}