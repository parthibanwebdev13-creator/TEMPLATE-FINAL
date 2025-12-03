import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentConfirmation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const [utr, setUtr] = useState('');
  const [sending, setSending] = useState(false);
  const [canComplete, setCanComplete] = useState(false);

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  // WhatsApp requires number without + prefix
  const waNumber = '917449213304';
  const formattedItems = useMemo(() => {
    if (!order?.order_items?.length) return '';
    return order.order_items
      .map((it: any) => {
        const variantPart = it.variant_selection?.label ? ` [${it.variant_selection.label}]` : '';
        const measurementPart = it.measurement_value
          ? ` (${(it.measurement_label || 'Measurement')}: ${it.measurement_value})`
          : '';
        return `- ${it.product_name}${variantPart}${measurementPart} × ${Number(it.quantity_litres)} — ₹${Number(
          it.total_price,
        ).toFixed(2)}`;
      })
      .join('\n');
  }, [order]);

  const message = useMemo(() => {
    const orderLabel = order?.order_number || order?.id || '';
    const address = order?.shipping_address || '';
    const lines = [
      '✅ Order Confirmation',
      '',
      `🧾 Transaction ID: ${utr || ''}`,
      '',
      `🆔 Order ID: ${orderLabel}`,
      '',
      '📦 Items:',
      formattedItems,
      '',
      '🚚 Delivery Details:',
      `Address: ${address}`,
      '',
      '🎉 Thank you for shopping with us',
    ];
    return lines.join('\n');
  }, [order, utr, formattedItems]);

  const waLink = useMemo(() => {
    const url = new URL(`https://wa.me/${waNumber}`);
    url.searchParams.set('text', message);
    return url.toString();
  }, [message]);

  useEffect(() => {
    if (!sending) return;
    const timer = setTimeout(() => setCanComplete(true), 3000);
    return () => clearTimeout(timer);
  }, [sending]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      // Clear user's cart
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      navigate('/');
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="container mx-auto px-4 py-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment Confirmation</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {order ? `Order: ${order.order_number || order.id}` : 'Loading order details...'}
            </p>
          </div>
          <Badge variant="secondary" className="text-blue-700 bg-blue-100 border border-blue-300">
            Awaiting Confirmation
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enter Transaction (UTR) Number</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="Enter UTR / Transaction ID"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(utr)}
                    disabled={!utr}
                  >
                    Copy UTR
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      window.open(waLink, '_blank');
                      setSending(true);
                    }}
                    disabled={!utr || sending}
                  >
                    {sending ? 'Opening WhatsApp…' : 'Send Confirmation via WhatsApp'}
                  </Button>
                  <Button
                    className="w-full"
                    size="lg"
                    variant={canComplete ? 'default' : 'secondary'}
                    disabled={!canComplete || completeMutation.isPending}
                    onClick={() => completeMutation.mutate()}
                  >
                    {completeMutation.isPending ? 'Completing…' : canComplete ? 'Completed' : 'Waiting…'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-md border bg-muted/30">
                  <pre className="whitespace-pre-wrap text-sm leading-6">{message}</pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


