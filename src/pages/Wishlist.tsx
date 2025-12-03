import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

export default function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: wishlistItems, refetch } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('wishlist')
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
            ❤️ My Wishlist
          </h1>
          <p className="text-muted-foreground">Products you've saved for later</p>
        </div>

        {wishlistItems && wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {wishlistItems.map((item) =>
              item.products ? (
                <ProductCard key={item.id} product={item.products} onUpdate={refetch} />
              ) : null
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">💔</p>
            <p className="text-muted-foreground text-xl mb-4">Your wishlist is empty</p>
            <p className="text-muted-foreground mb-6">Start adding your favorite products!</p>
          </div>
        )}
      </div>
    </div>
  );
}