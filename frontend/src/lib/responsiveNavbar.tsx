"use client"

import React, { useState } from "react";
import { useSystemConfigStore } from "@/store/useSystemConfigStore";

export default function ResponsiveNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { config } = useSystemConfigStore();
  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-xl font-bold">{config?.organisationName || "Admin@enterprises"}</span>
          </div>

          {/* Hamburger Menu (Mobile) */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">
              PRODUCTS
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">
              CUSTOM MESSAGE
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">
              BATCH UPLOAD
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">
              QUICK FIXES (4)
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button className="block w-full px-4 py-2 text-left bg-blue-600 hover:bg-blue-700 rounded-md">
              PRODUCTS
            </button>
            <button className="block w-full px-4 py-2 text-left bg-blue-600 hover:bg-blue-700 rounded-md">
              CUSTOM MESSAGE
            </button>
            <button className="block w-full px-4 py-2 text-left bg-gray-700 hover:bg-gray-600 rounded-md">
              BATCH UPLOAD
            </button>
            <button className="block w-full px-4 py-2 text-left bg-gray-700 hover:bg-gray-600 rounded-md">
              QUICK FIXES (4)
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
