import Backendless from "backendless"

// Backendless configuration
export const BACKENDLESS_CONFIG = {
  subdomain: "zanyearthquake-us.backendless.app",
  apiUrl: "https://api.backendless.com",
  applicationId: "40D3A552-10A5-49D7-A2BF-B1874CC8C4D4",
  jsApiKey: "D4E028B1-2152-4D4D-AE04-A8772BC8DD18",
  restApiKey: "6F2A6296-0B6A-4D91-A9A1-27A90AE900E2",
}

// Initialize Backendless
Backendless.serverURL = BACKENDLESS_CONFIG.apiUrl
Backendless.initApp(BACKENDLESS_CONFIG.applicationId, BACKENDLESS_CONFIG.jsApiKey)

// Types for our data models
export interface MerchantUser extends Backendless.User {
  merchantId?: string
  firstName?: string
  lastName?: string
  storeName?: string
  storeType?: string
  description?: string
  address?: string
  contactNumber?: string
  logoUrl?: string
  storeOpen?: boolean
  storeSetupCompleted?: boolean // Add this flag
  createdAt?: Date
  updatedAt?: Date
}

export interface Category {
  objectId?: string
  merchantId: string
  name: string
  description?: string
  enabled: boolean
  sortOrder?: number
  createdAt?: Date
  updatedAt?: Date
  ownerId?: string
}

export interface Product {
  objectId?: string
  merchantId: string
  categoryId: string
  name: string
  description?: string
  price: number
  image?: string
  rating?: number
  available: boolean
  options?: string[]
  addons?: { name: string; price: number }[]
  tags?: string[]
  sortOrder?: number
  createdAt?: Date
  updatedAt?: Date
  ownerId?: string
}

export interface Deal {
  objectId?: string
  merchantId: string
  name: string
  description?: string
  dealType: string
  startDate: Date
  endDate: Date
  active: boolean
  image?: string
  productIds?: string[]
  categoryIds?: string[]
  discountValue?: number
  createdAt?: Date
  updatedAt?: Date
  ownerId?: string
}

// Add new interface for Store Info
export interface StoreInfo {
  objectId?: string
  merchantId: string
  storeName: string
  storeType: string
  description?: string
  address?: string
  contactNumber?: string
  logoUrl?: string
  storeOpen?: boolean
  createdAt?: Date
  updatedAt?: Date
  ownerId?: string
}

// Backendless Service Class
export class BackendlessService {
  // Initialize Backendless and create tables if they don't exist
  static async initialize() {
    try {
      console.log("Backendless initialized successfully")
      await this.ensureTablesExist()
      return true
    } catch (error) {
      console.error("Failed to initialize Backendless:", error)
      throw error
    }
  }

  // Ensure required tables exist
  static async ensureTablesExist() {
    try {
      // Try to create tables - Backendless will ignore if they already exist
      const sampleCategory = {
        merchantId: "sample",
        name: "Sample Category",
        description: "This is a sample category",
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const sampleProduct = {
        merchantId: "sample",
        categoryId: "sample",
        name: "Sample Product",
        description: "This is a sample product",
        price: 0,
        available: true,
        rating: 0,
        options: [],
        addons: [],
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const sampleDeal = {
        merchantId: "sample",
        name: "Sample Deal",
        description: "This is a sample deal",
        dealType: "discount",
        startDate: new Date(),
        endDate: new Date(),
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Add this sample StoreInfo object after the existing sample objects
      const sampleStoreInfo = {
        merchantId: "sample",
        storeName: "Sample Store",
        storeType: "Sample Type",
        description: "This is a sample store",
        address: "Sample Address",
        contactNumber: "Sample Contact",
        logoUrl: "",
        storeOpen: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Create sample records to ensure tables exist
      await Promise.allSettled([
        Backendless.Data.of("Categories").save(sampleCategory),
        Backendless.Data.of("Products").save(sampleProduct),
        Backendless.Data.of("Deals").save(sampleDeal),
        Backendless.Data.of("StoreInfo").save(sampleStoreInfo), // Add this line
      ])

      // Delete the sample records
      const queryBuilder = Backendless.DataQueryBuilder.create()
      queryBuilder.setWhereClause("merchantId = 'sample'")

      await Promise.allSettled([
        Backendless.Data.of("Categories")
          .find(queryBuilder)
          .then((results) => {
            return Promise.all(results.map((item: any) => Backendless.Data.of("Categories").remove(item)))
          }),
        Backendless.Data.of("Products")
          .find(queryBuilder)
          .then((results) => {
            return Promise.all(results.map((item: any) => Backendless.Data.of("Products").remove(item)))
          }),
        Backendless.Data.of("Deals")
          .find(queryBuilder)
          .then((results) => {
            return Promise.all(results.map((item: any) => Backendless.Data.of("Deals").remove(item)))
          }),
        Backendless.Data.of("StoreInfo") // Add this cleanup
          .find(queryBuilder)
          .then((results) => {
            return Promise.all(results.map((item: any) => Backendless.Data.of("StoreInfo").remove(item)))
          }),
      ])

      console.log("Tables ensured to exist")
    } catch (error) {
      console.warn("Could not ensure tables exist:", error)
      // Don't throw error here as tables might already exist
    }
  }

  // Authentication Methods
  static async registerUser(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }): Promise<MerchantUser> {
    try {
      const user = new Backendless.User()
      user.email = userData.email
      user.password = userData.password
      user.firstName = userData.firstName
      user.lastName = userData.lastName

      const registeredUser = await Backendless.UserService.register(user)
      return registeredUser as MerchantUser
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    }
  }

  static async loginUser(email: string, password: string): Promise<MerchantUser> {
    try {
      const user = await Backendless.UserService.login(email, password, true)
      return user as MerchantUser
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  static async logoutUser(): Promise<void> {
    try {
      await Backendless.UserService.logout()
    } catch (error) {
      console.error("Logout failed:", error)
      throw error
    }
  }

  static async getCurrentUser(): Promise<MerchantUser | null> {
    try {
      const user = await Backendless.UserService.getCurrentUser()
      return user as MerchantUser
    } catch (error) {
      return null
    }
  }

  static async updateUser(userData: Partial<MerchantUser>): Promise<MerchantUser> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) throw new Error("No user logged in")

      Object.assign(currentUser, userData)
      const updatedUser = await Backendless.UserService.update(currentUser)
      return updatedUser as MerchantUser
    } catch (error) {
      console.error("User update failed:", error)
      throw error
    }
  }

  // File Storage Methods
  static async uploadFile(file: File, path: string): Promise<string> {
    try {
      const uploadedFile = await Backendless.Files.upload(file, path, true)
      return uploadedFile.fileURL
    } catch (error) {
      console.error("File upload failed:", error)
      throw error
    }
  }

  static async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileName = fileUrl.split("/").pop()
      if (fileName) {
        await Backendless.Files.remove(fileName)
      }
    } catch (error) {
      console.error("File deletion failed:", error)
      throw error
    }
  }

  // Category Methods
  static async saveCategory(categoryData: Omit<Category, "objectId" | "createdAt" | "updatedAt">): Promise<Category> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) throw new Error("No user logged in")

      const category = {
        ...categoryData,
        ownerId: currentUser.objectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const savedCategory = await Backendless.Data.of("Categories").save(category)
      return savedCategory as Category
    } catch (error) {
      console.error("Category save failed:", error)
      throw error
    }
  }

  static async updateCategory(categoryId: string, categoryData: Partial<Category>): Promise<Category> {
    try {
      const updateData = {
        ...categoryData,
        objectId: categoryId,
        updatedAt: new Date(),
      }

      const updatedCategory = await Backendless.Data.of("Categories").save(updateData)
      return updatedCategory as Category
    } catch (error) {
      console.error("Category update failed:", error)
      throw error
    }
  }

  static async getCategories(merchantId: string): Promise<Category[]> {
    try {
      const queryBuilder = Backendless.DataQueryBuilder.create()
      queryBuilder.setWhereClause(`merchantId = '${merchantId}'`)
      queryBuilder.setSortBy(["sortOrder ASC", "createdAt ASC"])

      const categories = await Backendless.Data.of("Categories").find(queryBuilder)
      return categories as Category[]
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      // Return empty array if table doesn't exist or other error
      return []
    }
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      await Backendless.Data.of("Categories").remove({ objectId: categoryId })
    } catch (error) {
      console.error("Category deletion failed:", error)
      throw error
    }
  }

  // Product Methods
  static async saveProduct(productData: Omit<Product, "objectId" | "createdAt" | "updatedAt">): Promise<Product> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) throw new Error("No user logged in")

      const product = {
        ...productData,
        ownerId: currentUser.objectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const savedProduct = await Backendless.Data.of("Products").save(product)
      return savedProduct as Product
    } catch (error) {
      console.error("Product save failed:", error)
      throw error
    }
  }

  static async updateProduct(productId: string, productData: Partial<Product>): Promise<Product> {
    try {
      const updateData = {
        ...productData,
        objectId: productId,
        updatedAt: new Date(),
      }

      const updatedProduct = await Backendless.Data.of("Products").save(updateData)
      return updatedProduct as Product
    } catch (error) {
      console.error("Product update failed:", error)
      throw error
    }
  }

  static async getProducts(merchantId: string, categoryId?: string): Promise<Product[]> {
    try {
      const queryBuilder = Backendless.DataQueryBuilder.create()

      let whereClause = `merchantId = '${merchantId}'`
      if (categoryId) {
        whereClause += ` AND categoryId = '${categoryId}'`
      }

      queryBuilder.setWhereClause(whereClause)
      queryBuilder.setSortBy(["sortOrder ASC", "createdAt ASC"])

      const products = await Backendless.Data.of("Products").find(queryBuilder)
      return products as Product[]
    } catch (error) {
      console.error("Failed to fetch products:", error)
      // Return empty array if table doesn't exist or other error
      return []
    }
  }

  static async deleteProduct(productId: string): Promise<void> {
    try {
      await Backendless.Data.of("Products").remove({ objectId: productId })
    } catch (error) {
      console.error("Product deletion failed:", error)
      throw error
    }
  }

  // Deal Methods
  static async saveDeal(dealData: Omit<Deal, "objectId" | "createdAt" | "updatedAt">): Promise<Deal> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) throw new Error("No user logged in")

      const deal = {
        ...dealData,
        ownerId: currentUser.objectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const savedDeal = await Backendless.Data.of("Deals").save(deal)
      return savedDeal as Deal
    } catch (error) {
      console.error("Deal save failed:", error)
      throw error
    }
  }

  static async updateDeal(dealId: string, dealData: Partial<Deal>): Promise<Deal> {
    try {
      const updateData = {
        ...dealData,
        objectId: dealId,
        updatedAt: new Date(),
      }

      const updatedDeal = await Backendless.Data.of("Deals").save(updateData)
      return updatedDeal as Deal
    } catch (error) {
      console.error("Deal update failed:", error)
      throw error
    }
  }

  static async getDeals(merchantId: string): Promise<Deal[]> {
    try {
      const queryBuilder = Backendless.DataQueryBuilder.create()
      queryBuilder.setWhereClause(`merchantId = '${merchantId}'`)
      queryBuilder.setSortBy(["createdAt DESC"])

      const deals = await Backendless.Data.of("Deals").find(queryBuilder)
      return deals as Deal[]
    } catch (error) {
      console.error("Failed to fetch deals:", error)
      // Return empty array if table doesn't exist or other error
      return []
    }
  }

  static async deleteDeal(dealId: string): Promise<void> {
    try {
      await Backendless.Data.of("Deals").remove({ objectId: dealId })
    } catch (error) {
      console.error("Deal deletion failed:", error)
      throw error
    }
  }

  // Analytics Methods
  static async getMerchantStats(merchantId: string): Promise<{
    totalCategories: number
    totalProducts: number
    activeDeals: number
    storeViews: number
  }> {
    try {
      const [categories, products, deals] = await Promise.all([
        this.getCategories(merchantId),
        this.getProducts(merchantId),
        this.getDeals(merchantId),
      ])

      const activeDeals = deals.filter(
        (deal) => deal.active && new Date(deal.startDate) <= new Date() && new Date(deal.endDate) >= new Date(),
      ).length

      return {
        totalCategories: categories.length,
        totalProducts: products.length,
        activeDeals,
        storeViews: Math.floor(Math.random() * 500) + 100, // Mock data for now
      }
    } catch (error) {
      console.error("Failed to fetch merchant stats:", error)
      // Return default stats if there's an error
      return {
        totalCategories: 0,
        totalProducts: 0,
        activeDeals: 0,
        storeViews: 0,
      }
    }
  }

  // Add store info methods to BackendlessService class
  static async saveStoreInfo(storeData: Omit<StoreInfo, "objectId" | "createdAt" | "updatedAt">): Promise<StoreInfo> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) throw new Error("No user logged in")

      const storeInfo = {
        ...storeData,
        ownerId: currentUser.objectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const savedStore = await Backendless.Data.of("StoreInfo").save(storeInfo)
      return savedStore as StoreInfo
    } catch (error) {
      console.error("Store info save failed:", error)
      throw error
    }
  }

  static async updateStoreInfo(storeId: string, storeData: Partial<StoreInfo>): Promise<StoreInfo> {
    try {
      const updateData = {
        ...storeData,
        objectId: storeId,
        updatedAt: new Date(),
      }

      const updatedStore = await Backendless.Data.of("StoreInfo").save(updateData)
      return updatedStore as StoreInfo
    } catch (error) {
      console.error("Store info update failed:", error)
      throw error
    }
  }

  static async getStoreInfo(merchantId: string): Promise<StoreInfo | null> {
    try {
      const queryBuilder = Backendless.DataQueryBuilder.create()
      queryBuilder.setWhereClause(`merchantId = '${merchantId}'`)

      const stores = await Backendless.Data.of("StoreInfo").find(queryBuilder)
      return stores.length > 0 ? (stores[0] as StoreInfo) : null
    } catch (error) {
      console.error("Failed to fetch store info:", error)
      return null
    }
  }
}

// Initialize Backendless when the module loads
BackendlessService.initialize().catch(console.error)
