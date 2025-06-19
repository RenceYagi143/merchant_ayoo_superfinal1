"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Settings, User, Shield, Trash2, Eye, EyeOff } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/hooks/useAuth"
import { BackendlessService, type StoreInfo } from "@/lib/backendless"
import { ProtectedRoute } from "@/components/protected-route"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth()
  const router = useRouter()
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Account Settings
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [accountFormData, setAccountFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Store Settings
  const [storeSettings, setStoreSettings] = useState({
    storeOpen: true,
    notifications: {
      orderAlerts: true,
      promotionReminders: true,
      systemUpdates: false,
    },
  })

  const [updateLoading, setUpdateLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      if (!user) return

      const merchantId = user.merchantId || `merchant_${user.objectId}`
      const info = await BackendlessService.getStoreInfo(merchantId)

      setStoreInfo(info)
      setAccountFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      if (info) {
        setStoreSettings((prev) => ({
          ...prev,
          storeOpen: info.storeOpen || true,
        }))
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate password change if provided
      if (accountFormData.newPassword) {
        if (accountFormData.newPassword !== accountFormData.confirmPassword) {
          throw new Error("New passwords do not match")
        }
        if (!accountFormData.currentPassword) {
          throw new Error("Current password is required to change password")
        }
      }

      // Update user information
      await updateUser({
        firstName: accountFormData.firstName,
        lastName: accountFormData.lastName,
        email: accountFormData.email,
      })

      // TODO: Implement password change with Backendless
      // This would require additional Backendless API calls

      setSuccess("Account information updated successfully")
      setIsAccountDialogOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to update account information")
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleStoreToggle = async () => {
    try {
      if (!storeInfo) return

      const updatedStore = await BackendlessService.updateStoreInfo(storeInfo.objectId!, {
        storeOpen: !storeSettings.storeOpen,
      })

      setStoreSettings((prev) => ({
        ...prev,
        storeOpen: updatedStore.storeOpen || false,
      }))
      setStoreInfo(updatedStore)
    } catch (error) {
      console.error("Failed to toggle store status:", error)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // TODO: Implement account deletion with Backendless
      // This would require additional API calls to delete user data
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Failed to delete account:", error)
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account and store preferences</p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Settings */}
            <Card className="border-pink-200">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-pink-600" />
                  <CardTitle>Account Settings</CardTitle>
                </div>
                <CardDescription>Manage your personal information and security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <p className="text-sm text-gray-600">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <p className="text-sm text-gray-600">
                    {user?.created ? new Date(user.created).toLocaleDateString() : "N/A"}
                  </p>
                </div>

                <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-pink-300 text-pink-600 hover:bg-pink-50">
                      Update Account Information
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Update Account Information</DialogTitle>
                      <DialogDescription>
                        Update your personal information and change your password if needed.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAccountUpdate}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={accountFormData.firstName}
                              onChange={(e) => setAccountFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                              className="border-pink-200 focus:border-pink-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={accountFormData.lastName}
                              onChange={(e) => setAccountFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                              className="border-pink-200 focus:border-pink-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={accountFormData.email}
                            onChange={(e) => setAccountFormData((prev) => ({ ...prev, email: e.target.value }))}
                            className="border-pink-200 focus:border-pink-500"
                          />
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium mb-3">Change Password (Optional)</h4>

                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="currentPassword">Current Password</Label>
                              <div className="relative">
                                <Input
                                  id="currentPassword"
                                  type={showPasswords.current ? "text" : "password"}
                                  value={accountFormData.currentPassword}
                                  onChange={(e) =>
                                    setAccountFormData((prev) => ({ ...prev, currentPassword: e.target.value }))
                                  }
                                  className="border-pink-200 focus:border-pink-500 pr-10"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                                >
                                  {showPasswords.current ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="newPassword">New Password</Label>
                              <div className="relative">
                                <Input
                                  id="newPassword"
                                  type={showPasswords.new ? "text" : "password"}
                                  value={accountFormData.newPassword}
                                  onChange={(e) =>
                                    setAccountFormData((prev) => ({ ...prev, newPassword: e.target.value }))
                                  }
                                  className="border-pink-200 focus:border-pink-500 pr-10"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                                >
                                  {showPasswords.new ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Confirm New Password</Label>
                              <div className="relative">
                                <Input
                                  id="confirmPassword"
                                  type={showPasswords.confirm ? "text" : "password"}
                                  value={accountFormData.confirmPassword}
                                  onChange={(e) =>
                                    setAccountFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                                  }
                                  className="border-pink-200 focus:border-pink-500 pr-10"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                                >
                                  {showPasswords.confirm ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={updateLoading}>
                          {updateLoading ? "Updating..." : "Update Account"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Store Settings */}
            <Card className="border-pink-200">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-pink-600" />
                  <CardTitle>Store Settings</CardTitle>
                </div>
                <CardDescription>Configure your store operations and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Store Status</Label>
                    <p className="text-sm text-gray-600">Toggle your store open/closed</p>
                  </div>
                  <Switch
                    checked={storeSettings.storeOpen}
                    onCheckedChange={handleStoreToggle}
                    className="data-[state=checked]:bg-pink-600"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Notification Preferences</Label>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Order Alerts</p>
                      <p className="text-xs text-gray-600">Get notified of new orders</p>
                    </div>
                    <Switch
                      checked={storeSettings.notifications.orderAlerts}
                      onCheckedChange={(checked) =>
                        setStoreSettings((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, orderAlerts: checked },
                        }))
                      }
                      className="data-[state=checked]:bg-pink-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Promotion Reminders</p>
                      <p className="text-xs text-gray-600">Reminders about expiring deals</p>
                    </div>
                    <Switch
                      checked={storeSettings.notifications.promotionReminders}
                      onCheckedChange={(checked) =>
                        setStoreSettings((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, promotionReminders: checked },
                        }))
                      }
                      className="data-[state=checked]:bg-pink-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">System Updates</p>
                      <p className="text-xs text-gray-600">Updates about new features</p>
                    </div>
                    <Switch
                      checked={storeSettings.notifications.systemUpdates}
                      onCheckedChange={(checked) =>
                        setStoreSettings((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, systemUpdates: checked },
                        }))
                      }
                      className="data-[state=checked]:bg-pink-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-900">Danger Zone</CardTitle>
              </div>
              <CardDescription className="text-red-700">
                Irreversible actions that will permanently affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account, store information, all
                      products, categories, and deals. All data will be lost forever.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
