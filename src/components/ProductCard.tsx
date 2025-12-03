import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    image_url: string | null;
    price_per_litre: number;
    offer_price_per_litre: number | null;
    stock_quantity: number;
    litres_per_unit?: number | null;
  };
  onUpdate?: () => void;
  compact?: boolean;
}

export default function ProductCard({ product, onUpdate, compact = false }: ProductCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);

  // Check if product is in wishlist
  useEffect(() => {
    if (user && !compact) {
      checkWishlist();
    }
  }, [user, product.id, compact]);

  const checkWishlist = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user?.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Wishlist check error:', error);
      }
      setIsWishlisted(!!data);
    } catch (error) {
      console.error('Wishlist check error:', error);
      setIsWishlisted(false);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Wishlist toggle clicked - Current state:', isWishlisted, 'User:', user?.id);
    
    if (!user) {
      toast.error('Please login to save to wishlist');
      navigate('/auth');
      return;
    }

    setIsLoadingWishlist(true);
    try {
      if (isWishlisted) {
        // Remove from wishlist
        console.log('Removing from wishlist');
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
        console.log('Removed from wishlist successfully');
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        // Add to wishlist
        console.log('Adding to wishlist');
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: product.id,
          });

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Added to wishlist successfully');
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
      
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Wishlist error:', error);
      setIsWishlisted(!isWishlisted); // Revert state on error
      toast.error(error.message || 'Failed to update wishlist');
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  if (compact) {
    return (
      <div
        className="w-full aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover"
          title={product.name}
        />
      </div>
    );
  }

  return (
    <Card
      className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[var(--shadow-hover)]"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
          onClick={() => navigate(`/product/${product.id}`)}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 hover:bg-background z-10"
          onClick={handleWishlistToggle}
          disabled={isLoadingWishlist}
        >
          <Heart
            className={`h-5 w-5 transition-all ${
              isWishlisted ? 'fill-destructive text-destructive' : 'text-muted-foreground'
            }`}
          />
        </Button>
      </div>
      <CardContent className="p-4 cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
        <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
      </CardContent>
    </Card>
  );
}