"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Store, Upload, MapPin, Phone } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { BackendlessService } from "@/lib/backendless"

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

export default function OnboardingPage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    merchantId: "",
    storeName: "",
    storeType: "",
    customStoreType: "",
    description: "",
    address: "",
    contactNumber: "",
    logo: null as File | null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/auth/signin")
      return
    }

    // If user has already completed onboarding, redirect to dashboard
    if (user.merchantId && user.storeName) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      storeType: value,
      customStoreType: value === "Other" ? prev.customStoreType : "",
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({
      ...prev,
      logo: file,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let logoUrl = ""

      // Upload logo if provided
      if (formData.logo) {
        try {
          const logoPath = `merchants/${formData.merchantId}/logo`
          logoUrl = await BackendlessService.uploadFile(formData.logo, logoPath)
        } catch (uploadError) {
          console.warn("Logo upload failed, continuing without logo:", uploadError)
        }
      }

      // Update user with merchant information
      await updateUser({
        merchantId: formData.merchantId,
        storeName: formData.storeName,
        storeType: formData.storeType === "Other" ? formData.customStoreType : formData.storeType,
        description: formData.description,
        address: formData.address,
        contactNumber: formData.contactNumber,
        logoUrl: logoUrl,
        storeOpen: true,
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to set up your store. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null
  }

  // Don't render if already completed onboarding (will redirect)
  if (user.merchantId && user.storeName) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Card className="border-pink-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Store className="h-8 w-8 text-pink-600" />
              <span className="text-2xl font-bold text-gray-900">Ayoo</span>
            </div>
            <CardTitle className="text-2xl text-gray-900">Set Up Your Store</CardTitle>
            <CardDescription>Let's get your merchant portal ready for business</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="merchantId">Merchant ID</Label>
                <Input
                  id="merchantId"
                  name="merchantId"
                  placeholder="Enter your unique merchant ID"
                  value={formData.merchantId}
                  onChange={handleInputChange}
                  required
                  className="border-pink-200 focus:border-pink-500"
                />
                <p className="text-sm text-gray-500">This will be your unique identifier in the system</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  name="storeName"
                  placeholder="e.g., Juan's Sari-sari Store"
                  value={formData.storeName}
                  onChange={handleInputChange}
                  required
                  className="border-pink-200 focus:border-pink-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeType">Store Type</Label>
                <Select onValueChange={handleSelectChange} required>
                  <SelectTrigger className="border-pink-200 focus:border-pink-500">
                    <SelectValue placeholder="Select your store type" />
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

              {formData.storeType === "Other" && (
                <div className="space-y-2">
                  <Label htmlFor="customStoreType">Custom Store Type</Label>
                  <Input
                    id="customStoreType"
                    name="customStoreType"
                    placeholder="Enter your custom store type"
                    value={formData.customStoreType}
                    onChange={handleInputChange}
                    required
                    className="border-pink-200 focus:border-pink-500"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Store Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Tell customers about your store..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="border-pink-200 focus:border-pink-500"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Full Address (Optional)
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="123 Main Street, Barangay, City, Province"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="border-pink-200 focus:border-pink-500"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Contact Number
                </Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  placeholder="+63 912 345 6789"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="border-pink-200 focus:border-pink-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">
                  <Upload className="inline h-4 w-4 mr-1" />
                  Store Logo (Optional)
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="border-pink-200 focus:border-pink-500"
                />
                <p className="text-sm text-gray-500">Upload your store logo (JPG, PNG, max 5MB)</p>
              </div>

              <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700" disabled={loading}>
                {loading ? "Setting Up Your Store..." : "Complete Setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
