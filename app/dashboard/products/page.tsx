"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Package, Upload, Star, X } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import { BackendlessService, type Product, type Category } from "@/lib/backendless"
import { ProtectedRoute } from "@/components/protected-route"
import { useRouter } from "next/navigation"

interface ProductFormData {
  name: string
  description: string
  price: number
  categoryId: string
  available: boolean
  rating: number
  options: string
  addons: string
  tags: string
  image?: string
}

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Check if user needs to complete onboarding
  useEffect(() => {
    if (user === null) {
      // Still loading user
      return
    }

    if (user && !user.storeSetupCompleted) {
      router.push("/store-setup")
      return
    }

    if (user?.merchantId) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [user, router])

  const loadData = async () => {
    try {
      setError(null)
      if (!user?.merchantId) {
        setLoading(false)
        return
      }

      const [fetchedProducts, fetchedCategories] = await Promise.all([
        BackendlessService.getProducts(user.merchantId).catch(() => []),
        BackendlessService.getCategories(user.merchantId).catch(() => []),
      ])

      setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : [])
      setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : [])
    } catch (error) {
      console.error("Failed to load data:", error)
      setError("Failed to load products and categories")
      setProducts([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    categoryId: "",
    available: true,
    rating: 0,
    options: "",
    addons: "",
    tags: "",
    image: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      categoryId: "",
      available: true,
      rating: 0,
      options: "",
      addons: "",
      tags: "",
      image: "",
    })
    setEditingProduct(null)
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
      const imageUrl = await BackendlessService.uploadFile(
        file,
        `products/${user?.merchantId}/${Date.now()}_${file.name}`,
      )
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

    if (!user?.merchantId || saving) return

    try {
      setSaving(true)

      // Process arrays properly
      const processedOptions = formData.options
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      const processedAddons = formData.addons
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((addon) => ({ name: addon, price: 0 }))

      const processedTags = formData.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        merchantId: user.merchantId,
        categoryId: formData.categoryId,
        available: formData.available,
        rating: formData.rating,
        options: processedOptions,
        addons: processedAddons,
        tags: processedTags,
        image: formData.image || "",
      }

      if (editingProduct) {
        // Update existing product
        const updatedProduct = await BackendlessService.updateProduct(editingProduct.objectId!, productData)
        setProducts((prev) =>
          prev.map((product) => (product.objectId === editingProduct.objectId ? updatedProduct : product)),
        )
      } else {
        // Add new product
        const newProduct = await BackendlessService.saveProduct(productData)
        setProducts((prev) => [...prev, newProduct])
      }

      // Reset form and close dialog
      setFormData({
        name: "",
        description: "",
        price: 0,
        categoryId: "",
        available: true,
        rating: 0,
        options: "",
        addons: "",
        tags: "",
        image: "",
      })
      setEditingProduct(null)
      setIsDialogOpen(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("Failed to save product:", error)
      alert("Failed to save product. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price || 0,
      categoryId: product.categoryId || "",
      available: product.available ?? true,
      rating: product.rating || 0,
      options: Array.isArray(product.options) ? product.options.join(", ") : "",
      addons: Array.isArray(product.addons) ? product.addons.map((addon) => addon?.name || "").join(", ") : "",
      tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
      image: product.image || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (productId: string) => {
    if (!productId) return

    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      await BackendlessService.deleteProduct(productId)
      setProducts((prev) => prev.filter((product) => product.objectId !== productId))
    } catch (error) {
      console.error("Failed to delete product:", error)
      alert("Failed to delete product. Please try again.")
    }
  }

  const toggleProductAvailability = async (productId: string) => {
    if (!productId) return

    try {
      const product = products.find((p) => p.objectId === productId)
      if (!product) return

      const updatedProduct = await BackendlessService.updateProduct(productId, {
        available: !product.available,
      })

      setProducts((prev) => prev.map((p) => (p.objectId === productId ? updatedProduct : p)))
    } catch (error) {
      console.error("Failed to update product availability:", error)
    }
  }

  // Don't render if user hasn't completed onboarding
  if (user && !user.storeSetupCompleted) {
    return null // Will redirect to store setup
  }

  // Show loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package className="h-12 w-12 text-pink-300 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // Show error state
  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package className="h-12 w-12 text-red-300 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadData} className="bg-pink-600 hover:bg-pink-700">
                Try Again
              </Button>
            </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600">Manage your product catalog with pricing and details</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-pink-600 hover:bg-pink-700"
                  disabled={saving}
                  onClick={() => {
                    setEditingProduct(null)
                    setFormData({
                      name: "",
                      description: "",
                      price: 0,
                      categoryId: "",
                      available: true,
                      rating: 0,
                      options: "",
                      addons: "",
                      tags: "",
                      image: "",
                    })
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                    setIsDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                  <DialogDescription>
                    {editingProduct ? "Update the product information below." : "Create a new product for your store."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  {/* Keep all the existing form fields exactly as they are */}
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., Adobo Rice"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="border-pink-200 focus:border-pink-500"
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoryId">Category</Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
                        disabled={saving}
                      >
                        <SelectTrigger className="border-pink-200 focus:border-pink-500">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(categories) &&
                            categories.map((category) => (
                              <SelectItem key={category.objectId || category.name} value={category.objectId || ""}>
                                {category.name}
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
                        placeholder="Brief description of the product"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="border-pink-200 focus:border-pink-500"
                        rows={3}
                        disabled={saving}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₱)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          placeholder="0.00"
                          value={formData.price}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                          className="border-pink-200 focus:border-pink-500"
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rating">Rating (1-5)</Label>
                        <Input
                          id="rating"
                          name="rating"
                          type="number"
                          placeholder="4.5"
                          value={formData.rating}
                          onChange={handleInputChange}
                          min="0"
                          max="5"
                          step="0.1"
                          className="border-pink-200 focus:border-pink-500"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="options">Product Options (comma-separated)</Label>
                      <Input
                        id="options"
                        name="options"
                        placeholder="e.g., Small, Medium, Large"
                        value={formData.options}
                        onChange={handleInputChange}
                        className="border-pink-200 focus:border-pink-500"
                        disabled={saving}
                      />
                      <p className="text-xs text-gray-500">Size variations, flavors, etc.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="addons">Add-ons (comma-separated)</Label>
                      <Input
                        id="addons"
                        name="addons"
                        placeholder="e.g., Extra Rice, Fried Egg, Extra Sauce"
                        value={formData.addons}
                        onChange={handleInputChange}
                        className="border-pink-200 focus:border-pink-500"
                        disabled={saving}
                      />
                      <p className="text-xs text-gray-500">Optional extras customers can add</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        name="tags"
                        placeholder="e.g., bestseller, spicy, vegan"
                        value={formData.tags}
                        onChange={handleInputChange}
                        className="border-pink-200 focus:border-pink-500"
                        disabled={saving}
                      />
                      <p className="text-xs text-gray-500">Keywords to help categorize your product</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image">Product Image</Label>
                      {formData.image ? (
                        <div className="relative">
                          <div className="relative h-32 w-full rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={formData.image || "/placeholder.svg"}
                              alt="Product preview"
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
                            {uploading ? "Uploading..." : "Click to upload or drag and drop"}
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
                        id="available"
                        checked={formData.available}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, available: checked }))}
                        className="data-[state=checked]:bg-pink-600"
                        disabled={saving}
                      />
                      <Label htmlFor="available">Product is available</Label>
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
                          price: 0,
                          categoryId: "",
                          available: true,
                          rating: 0,
                          options: "",
                          addons: "",
                          tags: "",
                          image: "",
                        })
                        setEditingProduct(null)
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
                      {saving
                        ? "Saving..."
                        : uploading
                          ? "Uploading..."
                          : editingProduct
                            ? "Update Product"
                            : "Add Product"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(products) &&
              products.map((product) => {
                if (!product || !product.objectId) return null

                return (
                  <Card key={product.objectId} className="border-pink-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name || "Product"}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={product.available ? "default" : "secondary"}
                            className={product.available ? "bg-green-100 text-green-800" : ""}
                          >
                            {product.available ? "Available" : "Out of Stock"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{product.name || "Unnamed Product"}</CardTitle>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{product.rating || 0}</span>
                        </div>
                      </div>
                      <CardDescription>{product.description || "No description"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-pink-600">₱{product.price || 0}</span>
                          <Badge variant="outline" className="border-pink-300 text-pink-600">
                            {categories.find((c) => c.objectId === product.categoryId)?.name || "No Category"}
                          </Badge>
                        </div>

                        {Array.isArray(product.options) && product.options.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Options:</p>
                            <div className="flex flex-wrap gap-1">
                              {product.options.map((option, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {option}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {Array.isArray(product.addons) && product.addons.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Add-ons:</p>
                            <div className="flex flex-wrap gap-1">
                              {product.addons.map((addon, index) => (
                                <Badge key={index} variant="outline" className="text-xs border-blue-200 text-blue-600">
                                  {addon.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {Array.isArray(product.tags) && product.tags.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Tags:</p>
                            <div className="flex flex-wrap gap-1">
                              {product.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs border-pink-200 text-pink-600">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={product.available ?? true}
                            onCheckedChange={() => toggleProductAvailability(product.objectId!)}
                            className="data-[state=checked]:bg-pink-600"
                          />
                          <span className="text-sm text-gray-600">
                            {product.available ? "Available" : "Out of Stock"}
                          </span>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.objectId!)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>

          {/* Empty State */}
          {Array.isArray(products) && products.length === 0 && (
            <Card className="border-pink-200 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-pink-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 text-center mb-4">Add your first product to start building your catalog</p>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-pink-600 hover:bg-pink-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="border-pink-200 bg-pink-50">
            <CardHeader>
              <CardTitle className="text-pink-900">💡 Product Management Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-pink-800">
              <ul className="space-y-2 text-sm">
                <li>• High-quality images increase customer interest</li>
                <li>• Use clear, descriptive product names</li>
                <li>• Add options like sizes or flavors to give customers choices</li>
                <li>• Use tags to help customers find products easily</li>
                <li>• Keep pricing in Philippine Peso (₱) for local customers</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
