import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Eye, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function AdminOrders() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      
      // Fetch profiles for all orders
      const userIds = [...new Set(ordersData?.map(o => o.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);
      
      // Map profiles to orders
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
      const ordersWithProfiles = ordersData?.map(order => ({
        ...order,
        profile: profilesMap.get(order.user_id)
      }));
      
      return ordersWithProfiles;
    },
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const q = query.toLowerCase();
    return orders.filter((o: any) => {
      const hay = `${o.order_number} ${o.profile?.email || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [orders, query]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to update status'),
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, payment_status }: { id: string; payment_status: string }) => {
      const { error } = await supabase.from('orders').update({ payment_status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Payment status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to update payment status'),
  });

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <h1 className="text-3xl font-bold">Manage Orders</h1>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order # or email"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Order #{order.order_number}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{order.payment_status}</Badge>
                    <Badge>{order.status}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                  <p><span className="text-muted-foreground">Customer:</span> {order.profile?.email || 'N/A'}</p>
                  <p><span className="text-muted-foreground">Total:</span> ₹{order.final_amount}</p>
                  <p><span className="text-muted-foreground">Items:</span> {order.order_items?.length}</p>
                  <p><span className="text-muted-foreground">Created:</span> {new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Items
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateStatus.mutate({ id: order.id, status: 'processing' })}
                    disabled={updateStatus.isPending}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Processing
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateStatus.mutate({ id: order.id, status: 'shipped' })}
                    disabled={updateStatus.isPending}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Shipped
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateStatus.mutate({ id: order.id, status: 'delivered' })}
                    disabled={updateStatus.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Delivered
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => updateStatus.mutate({ id: order.id, status: 'cancelled' })}
                    disabled={updateStatus.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => updatePayment.mutate({ id: order.id, payment_status: 'paid' })}
                    disabled={updatePayment.isPending}
                  >
                    Mark Paid
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePayment.mutate({ id: order.id, payment_status: 'refunded' })}
                    disabled={updatePayment.isPending}
                  >
                    Refund
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order Items for #{selectedOrder?.order_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {selectedOrder?.order_items?.map((it: any) => (
                <div key={it.id} className="flex items-center justify-between text-sm">
                  <div className="truncate">
                    <span className="font-medium">{it.product_name}</span>
                    <span className="text-muted-foreground ml-2">
                      x {it.quantity_litres}L
                      {it.variant_selection?.label ? ` • ${it.variant_selection.label}` : ''}
                      {it.measurement_value
                        ? ` • ${(it.measurement_label || 'Measurement')}: ${it.measurement_value}`
                        : ''}
                    </span>
                  </div>
                  <div>₹{it.total_price}</div>
                </div>
              ))}
              {!selectedOrder?.order_items?.length && (
                <p className="text-muted-foreground">No items</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}