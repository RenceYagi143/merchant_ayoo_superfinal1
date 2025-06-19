"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Percent, Calendar, Upload, X } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import { BackendlessService, type Deal } from "@/lib/backendless"
import { ProtectedRoute } from "@/components/protected-route"
import { useRouter } from "next/navigation"

const DEAL_TYPES = [
  "Percentage Discount",
  "Fixed Amount Discount",
  "Buy 1 Take 1",
  "Free Delivery",
  "Bundle Deal",
  "Other",
]

interface DealFormData {
  name: string
  description: string
  dealType: string
  discountValue: number
  startDate: string
  endDate: string
  active: boolean
  image?: string
}

export default function DealsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<DealFormData>({
    name: "",
    description: "",
    dealType: "",
    discountValue: 0,
    startDate: "",
    endDate: "",
    active: true,
    image: "",
  })

  useEffect(() => {
    if (user) {
      loadDeals()
    }
  }, [user])

  const loadDeals = async () => {
    try {
      if (!user) return

      const merchantId = user.merchantId || `merchant_${user.objectId}`
      const fetchedDeals = await BackendlessService.getDeals(merchantId)
      setDeals(fetchedDeals || [])
    } catch (error) {
      console.error("Failed to load deals:", error)
      setDeals([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      dealType: "",
      discountValue: 0,
      startDate: "",
      endDate: "",
      active: true,
      image: "",
    })
    setEditingDeal(null)
    setIsDialogOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === "number" ? Number.parseFloat(e.target.value) || 0 : e.target.value
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    try {
      setUploading(true)
      const imageUrl = await BackendlessService.uploadFile(file, `deals/${user?.merchantId}/${Date.now()}_${file.name}`)
      setFormData((prev) => ({ ...prev, image: imageUrl }))
    } catch (error) {
      console.error("Failed to upload image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || saving) return

    try {
      setSaving(true)
      const merchantId = user.merchantId || `merchant_${user.objectId}`

      const dealData = {
        ...formData,
        merchantId: merchantId,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        image: formData.image || "",
      }

      if (editingDeal) {
        const updatedDeal = await BackendlessService.updateDeal(editingDeal.objectId!, dealData)
        setDeals((prev) => prev.map((deal) => (deal.objectId === editingDeal.objectId ? updatedDeal : deal)))
      } else {
        const newDeal = await BackendlessService.saveDeal(dealData)
        setDeals((prev) => [...prev, newDeal])
      }

      // Reset form and close dialog
      setFormData({
        name: "",
        description: "",
        dealType: "",
        discountValue: 0,
        startDate: "",
        endDate: "",
        active: true,
        image: "",
      })
      setEditingDeal(null)
      setIsDialogOpen(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("Failed to save deal:", error)
      alert("Failed to save deal. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal)
    setFormData({
      name: deal.name,
      description: deal.description || "",
      dealType: deal.dealType,
      discountValue: deal.discountValue || 0,
      startDate: new Date(deal.startDate).toISOString().split("T")[0],
      endDate: new Date(deal.endDate).toISOString().split("T")[0],
      active: deal.active,
      image: deal.image || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (dealId: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return

    try {
      await BackendlessService.deleteDeal(dealId)
      setDeals((prev) => prev.filter((deal) => deal.objectId !== dealId))
    } catch (error) {
      console.error("Failed to delete deal:", error)
      alert("Failed to delete deal. Please try again.")
    }
  }

  const toggleDealStatus = async (dealId: string) => {
    try {
      const deal = deals.find((d) => d.objectId === dealId)
      if (!deal) return

      const updatedDeal = await BackendlessService.updateDeal(dealId, {
        active: !deal.active,
      })

      setDeals((prev) => prev.map((d) => (d.objectId === dealId ? updatedDeal : d)))
    } catch (error) {
      console.error("Failed to update deal status:", error)
    }
  }

  const isExpired = (endDate: Date) => new Date(endDate) < new Date()
  const isActive = (deal: Deal) => deal.active && new Date(deal.startDate) <= new Date() && !isExpired(deal.endDate)

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Limited Deals</h1>
              <p className="text-gray-600">Create and manage time-limited promotions for your customers</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-pink-600 hover:bg-pink-700"
                  disabled={saving}
                  onClick={() => {
                    setEditingDeal(null)
                    setFormData({
                      name: "",
                      description: "",
                      dealType: "",
                      discountValue: 0,
                      startDate: "",
                      endDate: "",
                      active: true,
                      image: "",
                    })
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                    setIsDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingDeal ? "Edit Deal" : "Create New Deal"}</DialogTitle>
                  <DialogDescription>
                    {editingDeal
                      ? "Update the deal information below."
                      : "Create a limited-time promotion for your customers."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  {/* Keep all existing form fields */}
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Deal Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., Buy 1 Take 1 Beverages"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="border-pink-200 focus:border-pink-500"
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dealType">Deal Type</Label>
                      <Select
                        value={formData.dealType}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, dealType: value }))}
                        disabled={saving}
                      >
                        <SelectTrigger className="border-pink-200 focus:border-pink-500">
                          <SelectValue placeholder="Select deal type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEAL_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discountValue">Discount Value</Label>
                      <Input
                        id="discountValue"
                        name="discountValue"
                        type="number"
                        placeholder="e.g., 20 (for 20% or ₱20)"
                        value={formData.discountValue}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="border-pink-200 focus:border-pink-500"
                        disabled={saving}
                      />
                      <p className="text-xs text-gray-500">
                        For percentage discounts, enter the percentage (e.g., 20 for 20%). For fixed amounts, enter the
                        peso amount.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe the deal details..."
                        value={formData.description}
                        onChange={handleInputChange}
                        className="border-pink-200 focus:border-pink-500"
                        rows={3}
                        disabled={saving}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          required
                          className="border-pink-200 focus:border-pink-500"
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          name="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={handleInputChange}
                          required
                          className="border-pink-200 focus:border-pink-500"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image">Deal Image/Poster</Label>
                      {formData.image ? (
                        <div className="relative">
                          <div className="relative h-32 w-full rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={formData.image || "/placeholder.svg"}
                              alt="Deal poster preview"
                              fill
                              className="object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={removeImage}
                              disabled={saving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="border-2 border-dashed border-pink-200 rounded-lg p-4 text-center cursor-pointer hover:border-pink-300 transition-colors"
                          onClick={() => !uploading && !saving && fileInputRef.current?.click()}
                        >
                          <Upload className="h-8 w-8 text-pink-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            {uploading ? "Uploading..." : "Click to upload deal poster"}
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading || saving}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
                        className="data-[state=checked]:bg-pink-600"
                        disabled={saving}
                      />
                      <Label htmlFor="active">Deal is active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          name: "",
                          description: "",
                          dealType: "",
                          discountValue: 0,
                          startDate: "",
                          endDate: "",
                          active: true,
                          image: "",
                        })
                        setEditingDeal(null)
                        setIsDialogOpen(false)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                      }}
                      disabled={saving || uploading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={saving || uploading}>
                      {saving ? "Saving..." : uploading ? "Uploading..." : editingDeal ? "Update Deal" : "Create Deal"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Deals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <Card key={deal.objectId} className="border-pink-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  {deal.image && (
                    <div className="relative h-32 mb-4 rounded-lg overflow-hidden bg-gray-100">
                      <Image src={deal.image || "/placeholder.svg"} alt={deal.name} fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Percent className="h-5 w-5 text-pink-600" />
                      <CardTitle className="text-lg">{deal.name}</CardTitle>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant={isActive(deal) ? "default" : isExpired(deal.endDate) ? "destructive" : "secondary"}
                        className={
                          isActive(deal)
                            ? "bg-green-100 text-green-800"
                            : isExpired(deal.endDate)
                              ? "bg-red-100 text-red-800"
                              : ""
                        }
                      >
                        {isActive(deal) ? "Active" : isExpired(deal.endDate) ? "Expired" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{deal.dealType}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">{deal.description}</p>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-pink-600">
                        {deal.dealType.includes("Percentage") ? `${deal.discountValue}%` : `₱${deal.discountValue}`}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Start:
                        </span>
                        <span>{new Date(deal.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          End:
                        </span>
                        <span>{new Date(deal.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={deal.active}
                        onCheckedChange={() => toggleDealStatus(deal.objectId!)}
                        className="data-[state=checked]:bg-pink-600"
                        disabled={isExpired(deal.endDate)}
                      />
                      <span className="text-sm text-gray-600">{deal.active ? "Active" : "Inactive"}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(deal)}
                        className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(deal.objectId!)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {deals.length === 0 && !loading && (
            <Card className="border-pink-200 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Percent className="h-12 w-12 text-pink-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deals yet</h3>
                <p className="text-gray-600 text-center mb-4">
                  Create your first limited-time deal to attract more customers
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-pink-600 hover:bg-pink-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Deal
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="border-pink-200 bg-pink-50">
            <CardHeader>
              <CardTitle className="text-pink-900">💡 Deal Management Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-pink-800">
              <ul className="space-y-2 text-sm">
                <li>• Set realistic start and end dates for your promotions</li>
                <li>• Use clear, attractive deal names that customers will understand</li>
                <li>• Upload eye-catching posters to make your deals more appealing</li>
                <li>• Monitor deal performance and adjust as needed</li>
                <li>• Popular deals: Buy 1 Take 1, Free Delivery, Percentage Discounts</li>
                <li>• Expired deals are automatically deactivated</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
