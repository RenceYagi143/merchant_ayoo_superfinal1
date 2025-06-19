"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Edit, Trash2, Tags } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/hooks/useAuth"
import { BackendlessService, type Category } from "@/lib/backendless"
import { ProtectedRoute } from "@/components/protected-route"

interface CategoryFormData {
  name: string
  description: string
  enabled: boolean
}

export default function CategoriesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Check if user needs to complete onboarding
  useEffect(() => {
    if (user && !user.storeSetupCompleted) {
      router.push("/store-setup")
      return
    }

    if (user?.merchantId) {
      loadCategories()
    }
  }, [user, router])

  const loadCategories = async () => {
    try {
      if (!user?.merchantId) return

      const fetchedCategories = await BackendlessService.getCategories(user.merchantId)
      setCategories(fetchedCategories || [])
    } catch (error) {
      console.error("Failed to load categories:", error)
      setCategories([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    enabled: true,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", enabled: true })
    setEditingCategory(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.merchantId || saving) return

    try {
      setSaving(true)

      if (editingCategory) {
        // Update existing category
        const updatedCategory = await BackendlessService.updateCategory(editingCategory.objectId!, formData)
        setCategories((prev) => prev.map((cat) => (cat.objectId === editingCategory.objectId ? updatedCategory : cat)))
      } else {
        // Add new category
        const newCategory = await BackendlessService.saveCategory({
          ...formData,
          merchantId: user.merchantId,
        })
        setCategories((prev) => [...prev, newCategory])
      }

      // Reset form and close dialog
      setFormData({ name: "", description: "", enabled: true })
      setEditingCategory(null)
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Failed to save category:", error)
      alert("Failed to save category. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      enabled: category.enabled,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      await BackendlessService.deleteCategory(categoryId)
      setCategories((prev) => prev.filter((cat) => cat.objectId !== categoryId))
    } catch (error) {
      console.error("Failed to delete category:", error)
      alert("Failed to delete category. Please try again.")
    }
  }

  const toggleCategoryStatus = async (categoryId: string) => {
    try {
      const category = categories.find((cat) => cat.objectId === categoryId)
      if (!category) return

      const updatedCategory = await BackendlessService.updateCategory(categoryId, {
        enabled: !category.enabled,
      })

      setCategories((prev) => prev.map((cat) => (cat.objectId === categoryId ? updatedCategory : cat)))
    } catch (error) {
      console.error("Failed to update category status:", error)
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
              <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
              <p className="text-gray-600">Organize your products into categories for better management</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-pink-600 hover:bg-pink-700"
                  disabled={saving}
                  onClick={() => {
                    setEditingCategory(null)
                    setFormData({ name: "", description: "", enabled: true })
                    setIsDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                  <DialogDescription>
                    {editingCategory
                      ? "Update the category information below."
                      : "Create a new category to organize your products."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Category Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., Best Sellers"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="border-pink-200 focus:border-pink-500"
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Brief description of this category"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="border-pink-200 focus:border-pink-500"
                        rows={3}
                        disabled={saving}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        checked={formData.enabled}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, enabled: checked }))}
                        className="data-[state=checked]:bg-pink-600"
                        disabled={saving}
                      />
                      <Label htmlFor="enabled">Enable this category</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false)
                        setEditingCategory(null)
                        setFormData({ name: "", description: "", enabled: true })
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={saving}>
                      {saving ? "Saving..." : editingCategory ? "Update Category" : "Add Category"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card key={category.objectId} className="border-pink-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tags className="h-5 w-5 text-pink-600" />
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                    <Badge
                      variant={category.enabled ? "default" : "secondary"}
                      className={category.enabled ? "bg-green-100 text-green-800" : ""}
                    >
                      {category.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>{category.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Products:</span>
                      <span className="font-medium">0</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={category.enabled}
                        onCheckedChange={() => toggleCategoryStatus(category.objectId!)}
                        className="data-[state=checked]:bg-pink-600"
                      />
                      <span className="text-sm text-gray-600">{category.enabled ? "Enabled" : "Disabled"}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.objectId!)}
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
          {categories.length === 0 && !loading && (
            <Card className="border-pink-200 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tags className="h-12 w-12 text-pink-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                <p className="text-gray-600 text-center mb-4">
                  Create your first category to start organizing your products
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-pink-600 hover:bg-pink-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Category
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="border-pink-200 bg-pink-50">
            <CardHeader>
              <CardTitle className="text-pink-900">💡 Category Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-pink-800">
              <ul className="space-y-2 text-sm">
                <li>• Categories help customers find products easily</li>
                <li>• You must create at least one category before adding products</li>
                <li>• Disabled categories won't show to customers but products remain saved</li>
                <li>• Popular categories: Best Sellers, Beverages, Snacks, Rice Meals</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
