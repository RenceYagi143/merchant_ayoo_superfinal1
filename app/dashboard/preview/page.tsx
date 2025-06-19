"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Store, Star, Clock, MapPin, Phone, Plus, Minus } from "lucide-react"
import Image from "next/image"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/hooks/useAuth"
import { BackendlessService, type StoreInfo, type Category, type Product, type Deal } from "@/lib/backendless"
import { ProtectedRoute } from "@/components/protected-route"

export default function PreviewStorePage() {
  const { user } = useAuth()
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    if (user) {
      loadStoreData()
    }
  }, [user])

  const loadStoreData = async () => {
    try {
      if (!user) return

      const merchantId = user.merchantId || `merchant_${user.objectId}`

      const [storeData, categoriesData, productsData, dealsData] = await Promise.all([
        BackendlessService.getStoreInfo(merchantId),
        BackendlessService.getCategories(merchantId),
        BackendlessService.getProducts(merchantId),
        BackendlessService.getDeals(merchantId),
      ])

      setStoreInfo(storeData)
      setCategories(categoriesData.filter((cat) => cat.enabled))
      setProducts(productsData.filter((prod) => prod.available))
      setDeals(
        dealsData.filter(
          (deal) => deal.active && new Date(deal.startDate) <= new Date() && new Date(deal.endDate) >= new Date(),
        ),
      )
    } catch (error) {
      console.error("Failed to load store data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts =
    selectedCategory === "all" ? products : products.filter((product) => product.categoryId === selectedCategory)

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Store Preview</h1>
              <p className="text-gray-600">See how your store appears to customers</p>
            </div>
            <Badge variant="outline" className="border-pink-300 text-pink-600">
              Customer View
            </Badge>
          </div>

          {/* Store Preview */}
          <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {/* Store Header */}
            <div className="relative h-32 bg-gradient-to-r from-pink-500 to-rose-500">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-full bg-white p-1">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <Image
                        src={storeInfo?.logoUrl || "/placeholder.svg"}
                        alt={storeInfo?.storeName || "Store"}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="text-white">
                    <h2 className="text-lg font-bold">{storeInfo?.storeName || "Your Store"}</h2>
                    <p className="text-sm opacity-90">{storeInfo?.storeType || "Store"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Info */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">4.5</span>
                  <span className="text-sm text-gray-500">(120 reviews)</span>
                </div>
                <Badge
                  variant={storeInfo?.storeOpen ? "default" : "secondary"}
                  className={storeInfo?.storeOpen ? "bg-green-100 text-green-800" : ""}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {storeInfo?.storeOpen ? "Open" : "Closed"}
                </Badge>
              </div>

              {storeInfo?.description && <p className="text-sm text-gray-600 mb-3">{storeInfo.description}</p>}

              <div className="space-y-1 text-xs text-gray-500">
                {storeInfo?.address && (
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{storeInfo.address}</span>
                  </div>
                )}
                {storeInfo?.contactNumber && (
                  <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    <span>{storeInfo.contactNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Active Deals */}
            {deals.length > 0 && (
              <div className="p-4 bg-pink-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-pink-900 mb-2">🔥 Limited Deals</h3>
                <div className="space-y-2">
                  {deals.slice(0, 2).map((deal) => (
                    <div key={deal.objectId} className="bg-white rounded-lg p-2 border border-pink-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{deal.name}</p>
                          <p className="text-xs text-gray-600">{deal.dealType}</p>
                        </div>
                        <Badge variant="outline" className="border-pink-300 text-pink-600 text-xs">
                          {deal.dealType.includes("Percentage")
                            ? `${deal.discountValue}% OFF`
                            : `₱${deal.discountValue} OFF`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex space-x-2 overflow-x-auto">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className={
                    selectedCategory === "all" ? "bg-pink-600 hover:bg-pink-700" : "border-pink-300 text-pink-600"
                  }
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.objectId}
                    variant={selectedCategory === category.objectId ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.objectId!)}
                    className={
                      selectedCategory === category.objectId
                        ? "bg-pink-600 hover:bg-pink-700"
                        : "border-pink-300 text-pink-600"
                    }
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Products */}
            <div className="max-h-96 overflow-y-auto">
              {filteredProducts.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <div key={product.objectId} className="p-4 hover:bg-gray-50">
                      <div className="flex space-x-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                              {product.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                              )}
                              <div className="flex items-center mt-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium ml-1">{product.rating}</span>
                              </div>
                              {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {product.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-sm font-bold text-pink-600">₱{product.price}</p>
                              <div className="flex items-center space-x-1 mt-1">
                                <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-xs px-2">1</span>
                                <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Store className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No products available</p>
                  <p className="text-xs">Add products to see them here</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 text-center">
              <p className="text-xs text-gray-500">Powered by Ayoo Merchant Portal</p>
            </div>
          </div>

          {/* Preview Info */}
          <Card className="border-pink-200 bg-pink-50">
            <CardHeader>
              <CardTitle className="text-pink-900">📱 Customer Experience Preview</CardTitle>
            </CardHeader>
            <CardContent className="text-pink-800">
              <ul className="space-y-2 text-sm">
                <li>• This is how your store appears to customers on mobile</li>
                <li>• Only enabled categories and available products are shown</li>
                <li>• Active deals are prominently displayed at the top</li>
                <li>• Customers can browse by category and add items to cart</li>
                <li>• Store status (open/closed) affects customer ordering</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
