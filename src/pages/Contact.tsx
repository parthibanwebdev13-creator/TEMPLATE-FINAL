import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock, Building2 } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground">
              Get in touch with Sri Aarumugan Oil Mills. We're here to assist you.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 mb-12">

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Our Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Address</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      158Z-2/4, Vijayapuri Road<br />
                      East Pandavarmangalam<br />
                      Kovilpatti, Thoothukudi<br />
                      Tamil Nadu - 628501<br />
                      India
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-muted-foreground">info@sriaarumuganoilmills.com</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-muted-foreground">Contact us for inquiries</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Business Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium mb-2">Operating Days</p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Monday - Saturday: Open</p>
                        <p>Sunday: Closed</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Company Details</p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>GST No: 33AEMFS3450E1Z5</p>
                        <p>Legal Status: Partnership</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            <Card>
              <CardHeader>
                <CardTitle>Find Us on Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-96 bg-muted rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3942.7876544443284!2d77.8676!3d9.1716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMTAnMTcuOCJOIDc3wrA1MicwMy40IkU!5e0!3m2!1sen!2sin!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Sri Aarumugan Oil Mills Location"
                  ></iframe>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Vijayapuri Road, East Pandavarmangalam, Kovilpatti, Thoothukudi - 628501
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
