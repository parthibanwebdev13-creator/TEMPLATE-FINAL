import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Factory, Users, Award, Shield, FileCheck } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Sri Aarumugan Oil Mills</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Premium manufacturer of cold-pressed sesame oil, sesame seeds, and cotton seed cake since 2022
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Factory className="h-6 w-6 text-primary" />
                  Our Story
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Established in 2022, Sri Aarumugan Oil Mills is a partnership firm dedicated to manufacturing
                  premium quality cold-pressed oils and seeds. Located in Kovilpatti, Thoothukudi district of
                  Tamil Nadu, we blend traditional oil extraction methods with modern quality standards.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Under the leadership of our proprietor P.R. Maariappan, we have built a reputation for
                  delivering authentic, pure products that honor our heritage while meeting contemporary health
                  and quality expectations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Award className="h-6 w-6 text-primary" />
                  Our Products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  We specialize in three core product categories:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-1 shrink-0" />
                    <div>
                      <strong className="block">Gingelly Oil (Sesame Oil)</strong>
                      <span className="text-muted-foreground">
                        Available in 1 Ltr & 500ml pouches, and 1 Ltr, 500ml & 200ml PET bottles under the Arumugan brand
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-1 shrink-0" />
                    <div>
                      <strong className="block">Sesame Seeds</strong>
                      <span className="text-muted-foreground">
                        Premium quality sesame seeds for various culinary and industrial applications
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-1 shrink-0" />
                    <div>
                      <strong className="block">Cotton Seed Cake</strong>
                      <span className="text-muted-foreground">
                        High-quality cotton seed cake for agricultural and livestock use
                      </span>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <FileCheck className="h-6 w-6 text-primary" />
                  Company Fact Sheet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Legal Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Legal Status:</span>
                        <span className="font-medium">Partnership</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Established:</span>
                        <span className="font-medium">2022</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GST No:</span>
                        <span className="font-medium">33AEMFS3450E1Z5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GST Reg. Date:</span>
                        <span className="font-medium">17-08-2021</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Business Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nature of Business:</span>
                        <span className="font-medium">Manufacturer, Retail</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Employees:</span>
                        <span className="font-medium">Upto 10 People</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Annual Turnover:</span>
                        <span className="font-medium">1.5 - 5 Cr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Proprietor:</span>
                        <span className="font-medium">P.R. Maariappan</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Users className="h-6 w-6 text-primary" />
                  Our Commitment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  At Sri Aarumugan Oil Mills, we are committed to preserving the traditional methods of
                  oil extraction while ensuring the highest standards of hygiene and quality. Our cold-pressed
                  oils retain natural nutrients and authentic flavors.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We believe in transparency, quality, and customer satisfaction. Every product that leaves
                  our facility carries our promise of purity and excellence.
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


