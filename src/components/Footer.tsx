import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/oil-drop.svg" alt="Sri Aarumugan Oil Mills" className="h-6 w-6" />
              <span className="text-xl font-semibold">Sri Aarumugan Oil Mills</span>
            </div>
            <p className="text-muted-foreground">
              Premium manufacturer of cold-pressed sesame oil and quality seeds since 2022. Tradition meets purity.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" aria-label="Facebook" className="h-9 w-9 rounded-full bg-background border flex items-center justify-center hover:bg-muted transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Instagram" className="h-9 w-9 rounded-full bg-background border flex items-center justify-center hover:bg-muted transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Twitter" className="h-9 w-9 rounded-full bg-background border flex items-center justify-center hover:bg-muted transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/products" className="hover:text-foreground transition-colors">Our Products</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Custom Orders</Link></li>
              <li><Link to="/policy" className="hover:text-foreground transition-colors">Delivery Info</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Care</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3"><MapPin className="h-4 w-4 mt-1" /><span>158Z-2/4, Vijayapuri Road, East Pandavarmangalam, Kovilpatti, Thoothukudi - 628501, Tamil Nadu, India</span></li>
              <li className="flex items-center gap-3"><Phone className="h-4 w-4" /><span>Contact us for inquiries</span></li>
              <li className="flex items-center gap-3"><Mail className="h-4 w-4" /><span>info@sriaarumuganoilmills.com</span></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Sri Aarumugan Oil Mills. All rights reserved. GST: 33AEMFS3450E1Z5
        </div>
      </div>
    </footer>
  );
}



