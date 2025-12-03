import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Products() {
  const [query, setQuery] = useState('');

  const { data: products, refetch, isFetching } = useQuery({
    queryKey: ['products', query],
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (query.trim()) {
        q = q.ilike('name', `%${query.trim()}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Navbar />
      
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent py-16 border-b border-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Our Premium Collection
            </h1>
            <p className="text-lg text-muted-foreground">
              🌾 Discover the finest selection of cold-pressed cooking oils for your kitchen
            </p>
          </div>
        </div>
      </section>

      {/* Search + Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-10">
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="🔍 Search products by name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 text-base shadow-md border-primary/20"
              />
              <Button 
                variant="default" 
                onClick={() => refetch()} 
                disabled={isFetching}
                className="px-8 mt-1 shadow-md hover:shadow-lg transition-shadow"
              >
                {isFetching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onUpdate={refetch} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-muted-foreground text-xl">No products available at the moment.</p>
              <p className="text-muted-foreground text-sm mt-2">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
