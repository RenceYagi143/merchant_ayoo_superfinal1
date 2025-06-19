"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Store, Edit, Upload, MapPin, Phone, Clock } from "lucide-react"
import Image from "next/image"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/hooks/useAuth"
import { BackendlessService, type StoreInfo } from "@/lib/backendless"
import { ProtectedRoute } from "@/components/protected-route"
import { useRouter } from "next/navigation"

const STORE_TYPES = [
  "Food & Restaurant",
  "Grocery Store",
  "Pharmacy",
  "Sari-sari Store",
  "Bakery",
  "Coffee Shop",
  "Retail Store",
  "Other",
]

export default function StoreInfoPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    storeName: "",
    storeType: "",
    description: "",
    address: "",
    contactNumber: "",
    storeOpen: true,
    logo: null as File | null,
  })
  const [updateLoading, setUpdateLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) {
      loadStoreInfo()
    }
  }, [user])

  const loadStoreInfo = async () => {
    try {
      if (!user) return

      const merchantId = user.merchantId || `merchant_${user.objectId}`
      const info = await BackendlessService.getStoreInfo(merchantId)

      if (!info) {
        // No store info found, redirect to setup
        router.push("/store-setup")
        return
      }

      setStoreInfo(info)
      setEditFormData({
        storeName: info.storeName,
        storeType: info.storeType,
        description: info.description || "",
        address: info.address || "",
        contactNumber: info.contactNumber || "",
        storeOpen: info.storeOpen || true,
        logo: null,
      })
    } catch (error) {
      console.error("Failed to load store info:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setEditFormData((prev) => ({
      ...prev,
      logo: file,
    }))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateLoading(true)
    setError("")

    try {
      if (!storeInfo || !user) return

      const merchantId = user.merchantId || `merchant_${user.objectId}`
      let logoUrl = storeInfo.logoUrl

      // Upload new logo if provided
      if (editFormData.logo) {
        try {
          const logoPath = `merchants/${merchantId}/logo`
          logoUrl = await BackendlessService.uploadFile(editFormData.logo, logoPath)
        } catch (uploadError) {
          console.warn("Logo upload failed:", uploadError)
        }
      }

      // Update store information
      const updatedStore = await BackendlessService.updateStoreInfo(storeInfo.objectId!, {
        storeName: editFormData.storeName,
        storeType: editFormData.storeType,
        description: editFormData.description,
        address: editFormData.address,
        contactNumber: editFormData.contactNumber,
        storeOpen: editFormData.storeOpen,
        logoUrl: logoUrl,
      })

      setStoreInfo(updatedStore)
      setIsEditDialogOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to update store information")
    } finally {
      setUpdateLoading(false)
    }
  }

  const toggleStoreStatus = async () => {
    try {
      if (!storeInfo) return

      const updatedStore = await BackendlessService.updateStoreInfo(storeInfo.objectId!, {
        storeOpen: !storeInfo.storeOpen,
      })

      setStoreInfo(updatedStore)
    } catch (error) {
      console.error("Failed to toggle store status:", error)
    }
  }

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

  if (!storeInfo) {
    return null // Will redirect to setup
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Store Information</h1>
              <p className="text-gray-600">Manage your store profile and business details</p>
            </div>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-pink-600 hover:bg-pink-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Info
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Store Information</DialogTitle>
                  <DialogDescription>Update your store details and business information.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdate}>
                  <div className="grid gap-4 py-4">
                    {error && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input
                        id="storeName"
                        name="storeName"
                        value={editFormData.storeName}
                        onChange={handleInputChange}
                        required
                        className="border-pink-200 focus:border-pink-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storeType">Store Type</Label>
                      <Select
                        value={editFormData.storeType}
                        onValueChange={(value) => setEditFormData((prev) => ({ ...prev, storeType: value }))}
                      >
                        <SelectTrigger className="border-pink-200 focus:border-pink-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STORE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={editFormData.description}
                        onChange={handleInputChange}
                        className="border-pink-200 focus:border-pink-500"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        name="address"
                        value={editFormData.address}
                        onChange={handleInputChange}
                        className="border-pink-200 focus:border-pink-500"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact Number</Label>
                      <Input
                        id="contactNumber"
                        name="contactNumber"
                        value={editFormData.contactNumber}
                        onChange={handleInputChange}
                        className="border-pink-200 focus:border-pink-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logo">Update Logo</Label>
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="border-pink-200 focus:border-pink-500"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="storeOpen"
                        checked={editFormData.storeOpen}
                        onCheckedChange={(checked) => setEditFormData((prev) => ({ ...prev, storeOpen: checked }))}
                        className="data-[state=checked]:bg-pink-600"
                      />
                      <Label htmlFor="storeOpen">Store is open</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={updateLoading}>
                      {updateLoading ? "Updating..." : "Update Store"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Store Info Display */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info Card */}
            <Card className="lg:col-span-2 border-pink-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Store className="h-6 w-6 text-pink-600" />
                    <CardTitle className="text-xl">{storeInfo.storeName}</CardTitle>
                  </div>
                  <Badge
                    variant={storeInfo.storeOpen ? "default" : "secondary"}
                    className={storeInfo.storeOpen ? "bg-green-100 text-green-800" : ""}
                  >
                    {storeInfo.storeOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
                <CardDescription>{storeInfo.storeType}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{storeInfo.description || "No description provided"}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Address
                    </h4>
                    <p className="text-gray-600 text-sm">{storeInfo.address || "No address provided"}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Contact Number
                    </h4>
                    <p className="text-gray-600 text-sm">{storeInfo.contactNumber || "No contact number provided"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Store Status
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={storeInfo.storeOpen}
                      onCheckedChange={toggleStoreStatus}
                      className="data-[state=checked]:bg-pink-600"
                    />
                    <span className="text-sm text-gray-600">
                      {storeInfo.storeOpen ? "Currently accepting orders" : "Currently closed"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logo Card */}
            <Card className="border-pink-200">
              <CardHeader>
                <CardTitle>Store Logo</CardTitle>
                <CardDescription>Your store's visual identity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 mb-4">
                  <Image
                    src={storeInfo.logoUrl || "/placeholder.svg"}
                    alt={`${storeInfo.storeName} logo`}
                    fill
                    className="object-cover"
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full border-pink-300 text-pink-600 hover:bg-pink-50"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Update Logo
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Store Stats */}
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle>Store Statistics</CardTitle>
              <CardDescription>Overview of your store performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">
                    {new Date(storeInfo.createdAt!).toLocaleDateString()}
                  </div>
                  <p className="text-sm text-gray-600">Store Created</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">
                    {new Date(storeInfo.updatedAt!).toLocaleDateString()}
                  </div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">{storeInfo.storeOpen ? "✓" : "✗"}</div>
                  <p className="text-sm text-gray-600">Status</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">ID</div>
                  <p className="text-sm text-gray-600 truncate">{storeInfo.merchantId}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
