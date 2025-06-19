import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, Users, ShoppingBag, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-pink-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Store className="h-8 w-8 text-pink-600" />
            <h1 className="text-2xl font-bold text-gray-900">Ayoo Merchant Portal</h1>
          </div>
          <div className="space-x-4">
            <Link href="/auth/signin">
              <Button variant="outline" className="border-pink-300 text-pink-600 hover:bg-pink-50">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-pink-600 hover:bg-pink-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Manage Your Store with <span className="text-pink-600">Ayoo</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          The complete merchant portal for restaurants, grocery stores, and small businesses in the Philippines. Manage
          products, categories, deals, and more - all in one place.
        </p>
        <Link href="/auth/signup">
          <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-lg px-8 py-3">
            Start Managing Your Store
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything You Need to Manage Your Business
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-pink-200 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Store className="h-12 w-12 text-pink-600 mx-auto mb-4" />
              <CardTitle className="text-pink-900">Store Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Set up your store profile, upload logos, and manage your business information
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-pink-200 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <ShoppingBag className="h-12 w-12 text-pink-600 mx-auto mb-4" />
              <CardTitle className="text-pink-900">Product Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Organize products by categories, add images, pricing, and manage inventory
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-pink-200 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <TrendingUp className="h-12 w-12 text-pink-600 mx-auto mb-4" />
              <CardTitle className="text-pink-900">Limited Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create time-limited promotions, discounts, and special offers for your customers
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-pink-200 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-pink-600 mx-auto mb-4" />
              <CardTitle className="text-pink-900">Customer Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Preview how your store looks to customers and manage your online presence
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-pink-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of Filipino merchants already using Ayoo to grow their business
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="bg-white text-pink-600 hover:bg-gray-100">
              Create Your Store Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Store className="h-6 w-6 text-pink-400" />
            <span className="text-lg font-semibold">Ayoo Merchant Portal</span>
          </div>
          <p className="text-gray-400">Empowering Filipino businesses with modern store management tools</p>
        </div>
      </footer>
    </div>
  )
}
