import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, MapPin, Truck, FileText, RotateCcw, Shield } from 'lucide-react';

export default function Policy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Policies & Information</h1>
          
          {/* Contact Us */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Get in Touch</h3>
                  <p className="text-muted-foreground mb-4">
                    Have questions or need assistance? We're here to help you with all your cooking oil needs.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>info@sriaarumuganoilmills.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>+91 74492 13304</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>
                        158Z-2/4, Vijayapuri Road, East Pandavarmangalam, Kovilpatti, Thoothukudi - 628501, India
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Business Hours</h3>
                  <div className="space-y-1 text-sm">
                    <p>Monday - Saturday: Open</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Legal Status:</span>
                <span className="font-medium">Partnership</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Established:</span>
                <span className="font-medium">2022</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proprietor:</span>
                <span className="font-medium">P.R. Maariappan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST No:</span>
                <span className="font-medium">33AEMFS3450E1Z5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST Reg. Date:</span>
                <span className="font-medium">17-08-2021</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Policy */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Delivery Areas</h3>
                <p className="text-muted-foreground">
                  We deliver across India with special care for our premium cooking oils. 
                  Delivery times vary by location and are typically 3-7 business days.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Shipping Charges</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Free shipping on orders above ₹500</li>
                  <li>Standard shipping: ₹50 for orders below ₹500</li>
                  <li>Express delivery: ₹100 (1-2 business days)</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Packaging</h3>
                <p className="text-muted-foreground">
                  All products are carefully packaged to prevent leakage and maintain quality. 
                  We use eco-friendly packaging materials whenever possible.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Terms and Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Acceptance of Terms</h3>
                <p className="text-muted-foreground">
                  By accessing and using OilMart, you accept and agree to be bound by the terms 
                  and provision of this agreement.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Product Information</h3>
                <p className="text-muted-foreground">
                  We strive to provide accurate product descriptions and images. However, 
                  we do not warrant that product descriptions or other content is accurate, 
                  complete, reliable, or error-free.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Pricing</h3>
                <p className="text-muted-foreground">
                  All prices are subject to change without notice. We reserve the right to 
                  modify or discontinue any product at any time without prior notice.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">User Accounts</h3>
                <p className="text-muted-foreground">
                  You are responsible for maintaining the confidentiality of your account 
                  and password. You agree to accept responsibility for all activities that 
                  occur under your account.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation and Refund */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Cancellation and Refund Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Order Cancellation</h3>
                <p className="text-muted-foreground">
                  You may cancel your order within 24 hours of placement, provided the order 
                  has not been shipped. Contact our customer service to initiate cancellation.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Returns</h3>
                <p className="text-muted-foreground">
                  We accept returns within 7 days of delivery for unopened products in 
                  original packaging. Return shipping costs are the responsibility of the customer.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Refunds</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Refunds will be processed within 5-7 business days</li>
                  <li>Refunds will be issued to the original payment method</li>
                  <li>Processing fees may apply for certain payment methods</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Damaged or Defective Products</h3>
                <p className="text-muted-foreground">
                  If you receive a damaged or defective product, please contact us immediately 
                  with photos. We will arrange for a replacement or full refund at no cost to you.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Policy */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Information We Collect</h3>
                <p className="text-muted-foreground">
                  We collect information you provide directly to us, such as when you create 
                  an account, make a purchase, or contact us for support.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">How We Use Your Information</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Process and fulfill your orders</li>
                  <li>Send you order confirmations and updates</li>
                  <li>Provide customer support</li>
                  <li>Improve our products and services</li>
                  <li>Send promotional communications (with your consent)</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Information Sharing</h3>
                <p className="text-muted-foreground">
                  We do not sell, trade, or otherwise transfer your personal information to 
                  third parties without your consent, except as described in this policy.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Data Security</h3>
                <p className="text-muted-foreground">
                  We implement appropriate security measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Your Rights</h3>
                <p className="text-muted-foreground">
                  You have the right to access, update, or delete your personal information. 
                  You may also opt out of promotional communications at any time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

