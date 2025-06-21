import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/AuthContext"

export const metadata: Metadata = {
  title: "Ayoo Merchant Dashboard",
  description: "Manage your store, products, and orders!",
  generator: "Ayoo Dev Tools",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
