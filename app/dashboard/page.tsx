"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Store, Package, Tags, Percent, Settings, Eye, BarChart3 } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/hooks/useAuth"
import { BackendlessService } from "@/lib/backendless"
import { ProtectedRoute } from "@/components/protected-route"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [storeOpen, setStoreOpen] = useState(true)
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalProducts: 0,
    activeDeals: 0,
    storeViews: 0,
  })
  const [loading, setLoading] = useState(true)

  // Check if user needs to complete onboarding
  useEffect(() => {
    if (user && !user.storeSetupCompleted) {
      router.push("/store-setup")
      return
    }

    if (user?.merchantId) {
      loadStats()
    } else {
      // If no merchantId, set loading to false and show default stats
      setLoading(false)
    }
  }, [user, router])

  const loadStats = async () => {
    try {
      if (!user?.merchantId) {
        setLoading(false)
        return
      }

      const merchantStats = await BackendlessService.getMerchantStats(user.merchantId)
      setStats({
        totalCategories: merchantStats.totalCategories,
        totalProducts: merchantStats.totalProducts,
        activeDeals: merchantStats.activeDeals,
        storeViews: merchantStats.storeViews,
      })
    } catch (error) {
      console.error("Failed to load stats:", error)
      // Set default stats if loading fails
      setStats({
        totalCategories: 0,
        totalProducts: 0,
        activeDeals: 0,
        storeViews: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  // Don't render if user hasn't completed onboarding
  if (user && !user.storeSetupCompleted) {
    return null // Will redirect to store setup
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Store Status:</span>
                <Switch
                  checked={storeOpen}
                  onCheckedChange={setStoreOpen}
                  className="data-[state=checked]:bg-pink-600"
                />
                <Badge
                  variant={storeOpen ? "default" : "secondary"}
                  className={storeOpen ? "bg-green-100 text-green-800" : ""}
                >
                  {storeOpen ? "Open" : "Closed"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-pink-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Tags className="h-4 w-4 text-pink-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.totalCategories}</div>
                <p className="text-xs text-muted-foreground">Active product categories</p>
              </CardContent>
            </Card>

            <Card className="border-pink-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-pink-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">Total products listed</p>
              </CardContent>
            </Card>

            <Card className="border-pink-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
                <Percent className="h-4 w-4 text-pink-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.activeDeals}</div>
                <p className="text-xs text-muted-foreground">Limited-time offers</p>
              </CardContent>
            </Card>

            <Card className="border-pink-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Store Views</CardTitle>
                <Eye className="h-4 w-4 text-pink-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.storeViews}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-pink-200 hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/dashboard/store">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Store className="h-6 w-6 text-pink-600" />
                    <CardTitle>Store Information</CardTitle>
                  </div>
                  <CardDescription>Manage your store profile, logo, and business details</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-pink-300 text-pink-600 hover:bg-pink-50">
                    Manage Store
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="border-pink-200 hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/dashboard/categories">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Tags className="h-6 w-6 text-pink-600" />
                    <CardTitle>Categories</CardTitle>
                  </div>
                  <CardDescription>Organize your products into categories for better management</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-pink-300 text-pink-600 hover:bg-pink-50">
                    Manage Categories
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="border-pink-200 hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/dashboard/products">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Package className="h-6 w-6 text-pink-600" />
                    <CardTitle>Products</CardTitle>
                  </div>
                  <CardDescription>Add, edit, and manage your product catalog with pricing</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-pink-300 text-pink-600 hover:bg-pink-50">
                    Manage Products
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="border-pink-200 hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/dashboard/deals">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Percent className="h-6 w-6 text-pink-600" />
                    <CardTitle>Limited Deals</CardTitle>
                  </div>
                  <CardDescription>Create time-limited promotions and special offers</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-pink-300 text-pink-600 hover:bg-pink-50">
                    Manage Deals
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="border-pink-200 hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/dashboard/preview">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-6 w-6 text-pink-600" />
                    <CardTitle>Preview Store</CardTitle>
                  </div>
                  <CardDescription>See how your store looks to customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-pink-300 text-pink-600 hover:bg-pink-50">
                    Preview Store
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="border-pink-200 hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/dashboard/settings">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Settings className="h-6 w-6 text-pink-600" />
                    <CardTitle>Settings</CardTitle>
                  </div>
                  <CardDescription>Configure your account and store preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-pink-300 text-pink-600 hover:bg-pink-50">
                    Open Settings
                  </Button>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Welcome Message for New Users */}
          {stats.totalCategories === 0 && stats.totalProducts === 0 && !loading && (
            <Card className="border-pink-200 bg-pink-50">
              <CardHeader>
                <CardTitle className="text-pink-900">🎉 Welcome to Ayoo!</CardTitle>
              </CardHeader>
              <CardContent className="text-pink-800">
                <p className="mb-4">Your store is ready! Here's what you can do to get started:</p>
                <ul className="space-y-2 text-sm">
                  <li>• Create your first product category</li>
                  <li>• Add products to your catalog</li>
                  <li>• Set up limited-time deals</li>
                  <li>• Preview how your store looks to customers</li>
                </ul>
                <div className="mt-4">
                  <Link href="/dashboard/categories">
                    <Button className="bg-pink-600 hover:bg-pink-700">Create Your First Category</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-pink-600" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.totalCategories === 0 && stats.totalProducts === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No activity yet. Start by creating categories and adding products!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                      <span className="text-sm">Store setup completed successfully</span>
                    </div>
                    <span className="text-xs text-gray-500">Just now</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
