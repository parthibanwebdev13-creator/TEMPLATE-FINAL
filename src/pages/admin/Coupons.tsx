import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

export default function AdminCoupons() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [formData, setFormData] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '' });

  const { data: coupons } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createCouponMutation = useMutation({
    mutationFn: async () => {
      if (editingCoupon) {
        const { error } = await supabase.from('coupons').update({
          code: formData.code.toUpperCase(),
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value),
          min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        }).eq('id', editingCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons').insert({
          code: formData.code.toUpperCase(),
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value),
          min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingCoupon ? 'Coupon updated' : 'Coupon created');
      setIsDialogOpen(false);
      setEditingCoupon(null);
      setFormData({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', couponId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Coupon deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: coupon.min_order_amount?.toString() || '',
    });
    setIsDialogOpen(true);
  };

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

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Coupons</h1>
          <Button onClick={() => {
            setEditingCoupon(null);
            setFormData({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '' });
            setIsDialogOpen(true);
          }}>Add Coupon</Button>
        </div>

        <div className="grid gap-4">
          {coupons?.map((coupon) => (
            <Card key={coupon.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{coupon.code}</h3>
                  <p className="text-sm">
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`}
                  </p>
                  {coupon.min_order_amount && (
                    <p className="text-xs text-muted-foreground">Min order: ₹{coupon.min_order_amount}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(coupon)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this coupon?')) {
                        deleteCouponMutation.mutate(coupon.id);
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

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCoupon(null);
            setFormData({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '' });
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Code</Label>
                <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value</Label>
                <Input type="number" value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} />
              </div>
              <div>
                <Label>Min Order (₹)</Label>
                <Input type="number" value={formData.min_order_amount} onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })} />
              </div>
              <Button onClick={() => createCouponMutation.mutate()} className="w-full">
                {editingCoupon ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}