"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"
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
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/useAuthStore"
import { useNotificationsStore } from "@/store/useNotificationsStore"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/Dashboard", roles: ['admin', 'normal'] },
  { 
    label: "Accounts", 
    icon: User, 
    path: "/Accounts",
    roles: ['admin'],
    subItems: [
      { label: "Capital Account", icon: CreditCard, path: "/Accounts/capital" },
      { label: "Financial Account", icon: Wallet, path: "/Accounts/financial" },
      { label: "Transactions", icon: ArrowLeftRight, path: "/Accounts/transactions" },
    ]
  },
  
  { label: "Users", icon: Users, path: "/Users", roles: ['admin'] },
  { label: "Categories", icon: FolderOpen, path: "/Categories", roles: ['admin'] },
  { label: "Store Management", icon: Store, path: "/Stores", roles: ['admin'] },
  { label: "Products", icon: Package, path: "/Products", roles: ['admin', 'normal'] },
  { label: "Customers", icon: UserCheck, path: "/Customers", roles: ['admin', 'normal'] },
  { label: "Suppliers", icon: Truck, path: "/Suppliers", roles: ['admin', 'normal'] },
  { label: "Business Assets", icon: FolderOpen, path: "/Assets", roles: ['admin'] },
  {
    label: "Financial Reports", icon: BarChart3, path: "/Reports", roles: ['admin'],
  },
  { label: "Purchases", icon: ShoppingBag, path: "/Purchases", roles: ['admin'] },
  { label: "Sales", icon: Receipt, path: "/Sales", roles: ['admin', 'normal'] },
  { label: "Product Analysis", icon: BarChart3, path: "/Analysis", roles: ['admin'] },
  { 
    label: "Debts",
    icon: CreditCard,
    path: "/Debts",
    roles: ['admin', 'normal'],
    subItems: [
        { label: "Payables", icon: CreditCard, path: "/Debts/Payables" },
        { label: "Receivables", icon: CreditCard, path: "/Debts/Receivables" },
    ]
 },
  { label: "Expenditure", icon: Wallet, path: "/Expenditure", roles: ['admin', 'normal'] },
]

const bottomNavItems = [
  { label: "Notifications", icon: Bell, path: "/Notifications", roles: ['admin', 'normal'] },
  { label: "Settings", icon: Settings, path: "/Settings", roles: ['admin'] },
  { label: "Support", icon: HelpCircle, path: "/Support", roles: ['admin', 'normal'] },
]

interface SideNavProps {
  defaultCollapsed?: boolean
}

const SideNav = ({ defaultCollapsed = false }: SideNavProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const router = useRouter()
  const pathname = usePathname()

  const { user} = useAuthStore()
  const { unreadCount, startPolling, stopPolling } = useNotificationsStore()

  const userRole = user?.role || 'normal'
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole))
  const filteredBottomNavItems = bottomNavItems.filter(item => item.roles.includes(userRole))

  // Start polling for notifications when component mounts
  useEffect(() => {
    startPolling()
    return () => {
      stopPolling()
    }
  }, [startPolling, stopPolling])

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
    notificationCount = 0,
  }: {
    item: (typeof navItems)[0] | (typeof bottomNavItems)[0]
    index: number
    isActive: boolean
    notificationCount?: number
  }) => {
    const Icon = item.icon
    const hasSubItems = 'subItems' in item && item.subItems && item.subItems.length > 0
    const isExpanded = expandedItems.includes(index)

    const content = (
      <div>
        <button
          onClick={() => {
            if (hasSubItems) {
              toggleExpanded(index)
            } else {
              router.push(item.path)
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
              {item.path === "/Notifications" && notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-auto h-5 min-w-5 px-1.5 flex items-center justify-center text-xs"
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </Badge>
              )}
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
            {'subItems' in item && item.subItems?.map((subItem: any, subIndex: number) => (
              <button
                key={subIndex}
                onClick={() => {
                  router.push(subItem.path)
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
            {'subItems' in item && item.subItems?.map((subItem: any, subIndex: number) => (
              <DropdownMenuItem
                key={subIndex}
                onClick={() => {
                  router.push(subItem.path)
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
          <TooltipTrigger asChild>
            <div className="relative">
              {content}
              {item.path === "/Notifications" && notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center text-xs"
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium text-gray-900 dark:bg-gray-800 dark:text-white">
            {item.label}
            {item.path === "/Notifications" && notificationCount > 0 && ` (${notificationCount})`}
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
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.username || "Guest"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || "guest@example.com"}</p>
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
              <DropdownMenuItem onClick={()=>{
                useAuthStore.getState().logout()
              }} className="cursor-pointer text-red-600 dark:text-red-400 dark:focus:bg-gray-800">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {filteredNavItems.map((item, index) => (
            <NavItem key={index} item={item} index={index} isActive={pathname === item.path || (item.subItems ? item.subItems.some(sub => pathname === sub.path) : false)} />
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-1">
          {/* Bottom Nav Items */}
          {filteredBottomNavItems.map((item, index) => (
            <NavItem
              key={`bottom-${index}`}
              item={item}
              index={navItems.length + index}
              isActive={pathname === item.path}
              notificationCount={item.path === "/Notifications" ? unreadCount : 0}
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
