
import type { Metadata } from "next";
import "./globals.css";
// import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Toaster } from "@/components/ui/toaster"
import SideNav from "@/components/SideNav";

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
        <SideNav/>
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
