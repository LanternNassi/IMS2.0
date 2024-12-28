
import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";


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
                { label: "Dashboard", icon: "🏠" },
                { label: "Users", icon: "👤" },
                { label: "Categories", icon: "📊" },
                { label: "Store Management", icon: "🏬" },
                { label: "Products", icon: "📦" },
                { label: "Customers And Suppliers", icon: "👥" },
                { label: "Transactions", icon: "🔄" },
                { label: "Purchases", icon: "🛒" },
                { label: "Sales", icon: "💰" },
                { label: "Analysis", icon: "📈" },
                { label: "Debts", icon: "💸" },
                { label: "Expenditure", icon: "🧾" },
                { label: "IMS Settings", icon: "⚙️" },
                ].map((item, index) => (
                <li key={index}>
                  <a
                  href="/Users"
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
        </main>

        </div>

        </ThemeProvider>
        
      </body>
    </html>
  )
}
