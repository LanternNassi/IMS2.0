
import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Toaster } from "@/components/ui/toaster"


export const metadata: Metadata = {
  title: "Inventory Management System",
  description: "Created by Nessim",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
        <div className="flex h-screen bg-primary dark:bg-primary-dark text-black dark:text-white">
        {/* Sidebar */}
        <aside className="w-64 bg-primary dark:bg-primary-dark border-r border-gray-700 flex flex-col">
          <div className="p-4 text-center border-b border-gray-700">
            <h1 className="text-lg font-bold">User</h1>
            <p className="text-sm">Developed by Nessim</p>
          </div>
          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-1 p-2">
                {[
                  { label: "Dashboard", icon: "🏠", path: "/Dashboard" },
                  { label: "Users", icon: "👤", path: "/Users" },
                  { label: "Categories", icon: "📊", path: "/Categories" },
                  { label: "Store Management", icon: "🏬", path: "/Stores" },
                  { label: "Products", icon: "📦", path: "/Products" },
                  { label: "Customers And Suppliers", icon: "👥", path: "/CustomersAndSuppliers" },
                  { label: "Transactions", icon: "🔄", path: "/Transactions" },
                  { label: "Purchases", icon: "🛒", path: "/Purchases" },
                  { label: "Sales", icon: "💰", path: "/Sales" },
                  { label: "Analysis", icon: "📈", path: "/Analysis" },
                  { label: "Debts", icon: "💸", path: "/Debts" },
                  { label: "Expenditure", icon: "🧾", path: "/Expenditure" },
                  { label: "IMS Settings", icon: "⚙️", path: "/IMSSettings" },
                ].map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.path}
                      className={cn(
                        "flex items-center space-x-3 p-2 rounded-md transition-colors",
                        "hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </a>
                  </li>
                ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Header */}
            <header className="flex flex-col text-white sm:flex-row justify-between items-center bg-primary dark:bg-primary-dark px-6 py-4 border-b border-gray-700 space-y-4 sm:space-y-0">
            <div className="space-x-2">
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">
              QUICK PRODUCTS
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">
              CUSTOM MESSAGE
              </button>
            </div>
            <div className="text-lg font-semibold text-black dark:text-white">Admin@enterprises</div>
            <div className="flex items-center space-x-4">
              <ThemeSwitcher/>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">
              AUDIT LOGS (4)
              </button>
            </div>
            </header>

          {/* Page Content */}
            <div className="flex-1 p-6 bg-[#FCFBFC] dark:bg-gray-900 overflow-y-auto">{children}</div>
            <Toaster />

        </main>

        </div>

        </ThemeProvider>
        
      </body>
    </html>
  )
}
