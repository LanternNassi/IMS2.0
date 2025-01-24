
"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from "next/navigation";
import {useSessionStore} from '@/store/useSessionStore';

const navItems = [
    { label: "Dashboard", icon: "🏠", path: "/Dashboard" },
    { label: "Users", icon: "👥", path: "/Users" },
    { label: "Categories", icon: "📂", path: "/Categories" },
    { label: "Store Management", icon: "🏪", path: "/Stores" },
    { label: "Products", icon: "📦", path: "/Products" },
    { label: "Customers", icon: "🧑‍🤝‍🧑", path: "/Customers" },
    { label: "Suppliers", icon: "🚚", path: "/Suppliers" },
    { label: "Transactions", icon: "🔄", path: "/Transactions" },
    { label: "Purchases", icon: "🛍️", path: "/Purchases" },
    { label: "Sales", icon: "💵", path: "/Sales" },
    { label: "Analysis", icon: "📊", path: "/Analysis" },
    { label: "Debts", icon: "💳", path: "/Debts" },
    { label: "Expenditure", icon: "💸", path: "/Expenditure" },
    { label: "IMS Settings", icon: "⚙️", path: "/IMSSettings" },
];

const SideNav = () => {

    const {currentPage, setCurrentPage} = useSessionStore();
    const router = useRouter();

    return (
        <aside className="w-64 bg-primary dark:bg-primary-dark border-r border-gray-700 flex flex-col">
            <div className="p-4 text-center border-b border-gray-700">
                <h1 className="text-lg font-bold">User</h1>
                <p className="text-sm">Developed by Nessim</p>
            </div>
            <nav className="flex-1 overflow-y-auto">
                <ul className="space-y-1 p-2">
                    {navItems.map((item, index) => (
                        <li key={index}>
                            <a
                                onClick={() => {
                                    router.push(item.path)
                                    setCurrentPage(index)
                                }}
                                className={cn(
                                    "flex items-center space-x-3 p-2 rounded-md transition-colors",
                                    "hover:bg-gray-200 dark:hover:bg-gray-700",
                                    "cursor-pointer",
                                    currentPage === index ? "bg-gray-300 dark:bg-gray-600" : ""
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
    );
};

export default SideNav;