"use client"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Store,
  Package,
  UserCheck,
  Truck,
  ArrowLeftRight,
  ShoppingBag,
  Receipt,
  BarChart3,
  CreditCard,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Bell,
  HelpCircle,
  User,
  ChevronDown
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/Dashboard" },
  { 
    label: "Accounts", 
    icon: User, 
    path: "/Accounts",
    subItems: [
      { label: "Capital Account", icon: CreditCard, path: "/Accounts/capital" },
      { label: "Financial Account", icon: Wallet, path: "/Accounts/financial" },
      { label: "Transactions", icon: ArrowLeftRight, path: "/Accounts/transactions" },
    ]
  },
  
  { label: "Users", icon: Users, path: "/Users" },
  { label: "Categories", icon: FolderOpen, path: "/Categories" },
  { label: "Store Management", icon: Store, path: "/Stores" },
  { label: "Products", icon: Package, path: "/Products" },
  { label: "Customers", icon: UserCheck, path: "/Customers" },
  { label: "Suppliers", icon: Truck, path: "/Suppliers" },
  { label: "Business Assets", icon: FolderOpen, path: "/Assets" },
  {
    label: "Financial Reports", icon: BarChart3, path: "/Reports",
  },
  { label: "Purchases", icon: ShoppingBag, path: "/Purchases" },
  { label: "Sales", icon: Receipt, path: "/Sales" },
  { label: "Product Analysis", icon: BarChart3, path: "/Analysis" },
  { 
    label: "Debts",
    icon: CreditCard,
    path: "/Debts",
    subItems: [
        { label: "Payables", icon: CreditCard, path: "/Debts/Payables" },
        { label: "Receivables", icon: CreditCard, path: "/Debts/Receivables" },
    ]
 },
  { label: "Expenditure", icon: Wallet, path: "/Expenditure" },
]

const bottomNavItems = [
  { label: "Notifications", icon: Bell, path: "/Notifications" },
  { label: "Settings", icon: Settings, path: "/IMSSettings" },
  { label: "Support", icon: HelpCircle, path: "/Support" },
]

interface SideNavProps {
  defaultCollapsed?: boolean
}

const SideNav = ({ defaultCollapsed = false }: SideNavProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [currentPage, setCurrentPage] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const router = useRouter()

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const NavItem = ({
    item,
    index,
    isActive,
  }: {
    item: (typeof navItems)[0]
    index: number
    isActive: boolean
  }) => {
    const Icon = item.icon
    const hasSubItems = item.subItems && item.subItems.length > 0
    const isExpanded = expandedItems.includes(index)

    const content = (
      <div>
        <button
          onClick={() => {
            if (hasSubItems) {
              toggleExpanded(index)
            } else {
              router.push(item.path)
              setCurrentPage(index)
            }
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            "group relative",
            isActive
              ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground font-medium"
              : "text-gray-600 dark:text-gray-400",
            isCollapsed && "justify-center px-2",
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5 flex-shrink-0 transition-colors",
              isActive
                ? "text-primary dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200",
            )}
          />
          {!isCollapsed && (
            <>
              <span className="text-sm truncate flex-1 text-left">{item.label}</span>
              {hasSubItems && (
                <ChevronDown 
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              )}
            </>
          )}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary dark:bg-blue-400 rounded-r-full" />
          )}
        </button>

        {/* Sub Items */}
        {hasSubItems && !isCollapsed && isExpanded && (
          <div className="ml-8 mt-1 space-y-1">
            {item.subItems!.map((subItem, subIndex) => (
              <button
                key={subIndex}
                onClick={() => {
                  router.push(subItem.path)
                  setCurrentPage(index)
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "text-sm text-gray-600 dark:text-gray-400",
                  "hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                {subItem.icon && <subItem.icon className="w-4 h-4 mr-2" />}
                <span className="truncate">{subItem.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )

    if (isCollapsed && hasSubItems) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "group relative justify-center px-2",
                isActive
                  ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground font-medium"
                  : "text-gray-600 dark:text-gray-400",
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-primary dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200",
                )}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" className="dark:bg-gray-900 dark:border-gray-800">
            <DropdownMenuLabel className="dark:text-white">{item.label}</DropdownMenuLabel>
            <DropdownMenuSeparator className="dark:bg-gray-800" />
            {item.subItems!.map((subItem, subIndex) => (
              <DropdownMenuItem
                key={subIndex}
                onClick={() => {
                  router.push(subItem.path)
                  setCurrentPage(index)
                }}
                className="cursor-pointer dark:text-gray-300 dark:focus:bg-gray-800"
              >
                {subItem.icon && <subItem.icon className="w-4 h-4 mr-2" />}
                {subItem.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium text-gray-900 dark:bg-gray-800 dark:text-white">
            {item.label}
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "h-screen flex flex-col border-r transition-all duration-300 ease-in-out",
          "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800",
          isCollapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* User Profile Section */}
        <div className={cn("p-4 border-b border-gray-200 dark:border-gray-800", isCollapsed && "px-2")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                  isCollapsed && "justify-center p-1",
                )}
              >
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src="/placeholder-user.png" />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">DS</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Daniel Smith</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">daniel@gmail.com</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isCollapsed ? "center" : "start"}
              className="w-56 dark:bg-gray-900 dark:border-gray-800"
            >
              <DropdownMenuLabel className="dark:text-white">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-gray-800" />
              <DropdownMenuItem className="cursor-pointer dark:text-gray-300 dark:focus:bg-gray-800">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer dark:text-gray-300 dark:focus:bg-gray-800">
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer dark:text-gray-300 dark:focus:bg-gray-800">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dark:bg-gray-800" />
              <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 dark:focus:bg-gray-800">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {navItems.map((item, index) => (
            <NavItem key={index} item={item} index={index} isActive={currentPage === index} />
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-1">
          {/* Bottom Nav Items */}
          {bottomNavItems.map((item, index) => (
            <NavItem
              key={`bottom-${index}`}
              item={item}
              index={navItems.length + index}
              isActive={currentPage === navItems.length + index}
            />
          ))}

          <Separator className="my-3 dark:bg-gray-800" />

          {/* Theme Toggle */}
          <div
            className={cn(
              "flex items-center rounded-lg p-1 bg-gray-100 dark:bg-gray-800",
              isCollapsed && "flex-col gap-1",
            )}
          >
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isDarkMode) toggleTheme()
                  }}
                  className={cn(
                    "flex-1 gap-2 transition-all",
                    !isDarkMode
                      ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
                    isCollapsed && "w-full px-2",
                  )}
                >
                  <Sun className="w-4 h-4" />
                  {!isCollapsed && <span className="text-xs">Light</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="bg-gray-900 dark:bg-gray-800 text-white border-gray-700">
                  Light Mode
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!isDarkMode) toggleTheme()
                  }}
                  className={cn(
                    "flex-1 gap-2 transition-all",
                    isDarkMode ? "bg-gray-700 shadow-sm text-white" : "text-gray-500 hover:text-gray-700",
                    isCollapsed && "w-full px-2",
                  )}
                >
                  <Moon className="w-4 h-4" />
                  {!isCollapsed && <span className="text-xs">Dark</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="bg-gray-900 dark:bg-gray-800 text-white border-gray-700">
                  Dark Mode
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Collapse Toggle */}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  "w-full mt-2 text-gray-500 dark:text-gray-400",
                  "hover:text-gray-700 dark:hover:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    <span className="text-xs">Collapse</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="bg-gray-900 dark:bg-gray-800 text-white border-gray-700">
                Expand Sidebar
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}

export default SideNav
