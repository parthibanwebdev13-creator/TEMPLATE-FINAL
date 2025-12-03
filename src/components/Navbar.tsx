import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut, LayoutDashboard, Shield, House, Package, Info, Phone, FileText, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: cartCount } = useQuery({
    queryKey: ['cart-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count || 0;
    },
    enabled: !!user,
  });

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/oil-drop.svg" alt="Sri Aarumugan Oil Mills" className="w-10 h-10" />
            <span className="hidden md:inline text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Sri Aarumugan Oil Mills
            </span>
          </Link>

          {/* Navigation Tabs (desktop only) */}
          {(user) && (
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className={cn(
                  "gap-2",
                  location.pathname === '/' && "bg-accent"
                )}
              >
                <House className="h-4 w-4" />
                Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/products')}
                className={cn(
                  "gap-2",
                  location.pathname === '/products' && "bg-accent"
                )}
              >
                <Package className="h-4 w-4" />
                Products
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/about')}
                className={cn(
                  "gap-2",
                  location.pathname === '/about' && "bg-accent"
                )}
              >
                <Info className="h-4 w-4" />
                About Us
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/contact')}
                className={cn(
                  "gap-2",
                  location.pathname === '/contact' && "bg-accent"
                )}
              >
                <Phone className="h-4 w-4" />
                Contact Us
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/policy')}
                className={cn(
                  "gap-2",
                  location.pathname === '/policy' && "bg-accent"
                )}
              >
                <FileText className="h-4 w-4" />
                Policy
              </Button>
            </div>
          )}

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/wishlist')}
                  className="relative"
                >
                  <Heart className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/cart')}
                  className="relative"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden md:flex">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-popover">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/')}> 
                      <House className="mr-2 h-4 w-4" />
                      Home
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/about')}>
                      <Info className="mr-2 h-4 w-4" />
                      About Us
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/contact')}>
                      <Phone className="mr-2 h-4 w-4" />
                      Contact Us
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/policy')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Policy
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {/* Hide products shortcut on mobile; available in menu */}
                <Button
                  variant="ghost"
                  onClick={() => navigate('/products')}
                  className={cn(
                    "gap-2 hidden md:flex",
                    location.pathname === '/products' && "bg-accent"
                  )}
                >
                  <Package className="h-4 w-4" />
                  Products
                </Button>
                <Button variant="outline" onClick={() => navigate('/auth')}>
                  Login
                </Button>
                <Button variant="default" onClick={() => navigate('/auth?tab=signup')} className="hidden md:flex">
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile menu trigger (rightmost) */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-2 mt-8">
                  {user && (
                    <Button variant="ghost" className="justify-start gap-2" onClick={() => navigate('/profile')}> 
                      <User className="h-4 w-4" /> My Profile
                    </Button>
                  )}
                  <Button variant="ghost" className="justify-start gap-2" onClick={() => navigate('/')}> 
                    <House className="h-4 w-4" /> Home
                  </Button>
                  <Button variant="ghost" className="justify-start gap-2" onClick={() => navigate('/products')}> 
                    <Package className="h-4 w-4" /> Products
                  </Button>
                  <Button variant="ghost" className="justify-start gap-2" onClick={() => navigate('/about')}> 
                    <Info className="h-4 w-4" /> About Us
                  </Button>
                  <Button variant="ghost" className="justify-start gap-2" onClick={() => navigate('/contact')}> 
                    <Phone className="h-4 w-4" /> Contact Us
                  </Button>
                  <Button variant="ghost" className="justify-start gap-2" onClick={() => navigate('/policy')}> 
                    <FileText className="h-4 w-4" /> Policy
                  </Button>
                  <Button variant="ghost" className="justify-start gap-2" onClick={() => navigate('/orders')}> 
                    <ShoppingCart className="h-4 w-4" /> My Orders
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" className="justify-start gap-2" onClick={() => navigate('/admin')}> 
                      <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                    </Button>
                  )}
                  {user && (
                    <Button variant="destructive" className="justify-start gap-2 mt-2" onClick={signOut}> 
                      <LogOut className="h-4 w-4" /> Logout
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}