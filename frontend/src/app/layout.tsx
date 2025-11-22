import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import SideNav from "@/components/SideNav";
import UpperNav from "@/components/UpperNav";

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
            <SideNav/>
            <main className="flex-1 flex flex-col">
              <UpperNav />
              <div className="flex-1 scrollbar-thin dark:scrollbar-thumb-gray-800 dark:scrollbar-track-gray-700 
                scrollbar-thumb-rounded-md dark:hover:scrollbar-thumb-gray-400 h-full p-6 bg-[#FCFBFC] dark:bg-gray-900 overflow-y-auto">
                {children}
              </div>
              <Toaster/>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
