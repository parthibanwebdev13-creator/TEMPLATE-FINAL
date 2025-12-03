import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Payment() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get('orderId');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  const orderLabel = order?.discount_amount ? `Order: ${order.order_number || order.id} - ${order.discount_amount}` : order?.order_number || order?.id || 'Order';
  const amount = Number(order?.final_amount || 0).toFixed(2);
  const upiId = '7449213304@pthdfc';
  const upiPayeeName = 'MerchantName';
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiPayeeName)}&tn=${encodeURIComponent(orderLabel)}&am=${encodeURIComponent(amount)}&cu=INR`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiDeepLink)}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="container mx-auto px-4 py-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {order ? `Order: ${order.order_number || order.id}` : 'Loading order details...'}
            </p>
          </div>
          <Badge variant="secondary" className="text-yellow-700 bg-yellow-100 border border-yellow-300">
            Pending Payment
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scan & Pay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="rounded-xl p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-primary/5 to-transparent border w-full sm:w-auto">
                    <img src={qrSrc} alt="UPI QR" className="w-56 h-56 object-contain" />
                  </div>
                  <div className="w-full space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border rounded-md">
                        <div className="text-xs text-muted-foreground">Amount</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-semibold text-lg">₹{amount}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(String(amount))}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 border rounded-md">
                        <div className="text-xs text-muted-foreground">Order</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-medium truncate max-w-[140px]">{orderLabel}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(String(orderLabel))}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="text-sm text-muted-foreground">
                      Pay using any UPI app by scanning the QR, then complete the payment in your app.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pay via UPI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Tap to open your UPI app with the amount and order pre-filled.
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    window.location.href = upiDeepLink;
                  }}
                >
                  Pay ₹{amount} via UPI
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-1/3" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Order</span>
                        <span className="font-medium">{orderLabel}</span>
                      </div>
                      {order?.discount_amount ? (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-₹{Number(order?.discount_amount).toFixed(2)}</span>
                        </div>
                      ) : null}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">₹{amount}</span>
                      </div>
                    </div>
                  </>
                )}
                <Button className="w-full" size="lg" onClick={() => navigate(`/payment/confirm?orderId=${orderId}`)}>
                  I Have Paid
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


