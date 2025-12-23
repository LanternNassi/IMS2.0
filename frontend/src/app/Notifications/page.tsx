"use client"

import { useEffect } from "react"
import { Bell, Package, AlertTriangle, Info, XCircle, Calendar, ShoppingCart, CreditCard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNotificationsStore, type Notification } from "@/store/useNotificationsStore"
import { format } from "date-fns"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "expiring_product":
      return <Calendar className="h-5 w-5" />
    case "low_stock":
    case "out_of_stock":
      return <Package className="h-5 w-5" />
    case "overstocked":
      return <Info className="h-5 w-5" />
    case "pending_sales":
      return <ShoppingCart className="h-5 w-5" />
    case "unpaid_sales":
      return <CreditCard className="h-5 w-5" />
    default:
      return <Bell className="h-5 w-5" />
  }
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "destructive"
    case "warning":
      return "info"
    case "info":
      return "secondary"
    default:
      return "info"
  }
}

const getSeverityBgColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
    case "warning":
      return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
    case "info":
      return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    default:
      return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
  }
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchNotificationCount,
  } = useNotificationsStore()

  useEffect(() => {
    // Fetch notifications when component mounts
    fetchNotifications()
    
    // Also fetch count
    fetchNotificationCount()

    // Set up polling for count updates every minute
    const interval = setInterval(() => {
      fetchNotificationCount()
    }, 60000) // 1 minute

    return () => clearInterval(interval)
  }, [fetchNotifications, fetchNotificationCount])

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
      return format(date, "MMM d, yyyy 'at' h:mm a")
    } catch {
      return timestamp
    }
  }

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const type = notification.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(notification)
    return acc
  }, {} as Record<string, Notification[]>)

  return (
    <div className="min-h-screen dark:bg-gray-900">
      <div className="flex bg-background dark:bg-gray-950 text-foreground">
        <div className="flex flex-col flex-1">
          <main className="flex-1 overflow-auto p-6 bg-muted/40 dark:bg-gray-900">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Notifications</h1>
                  <p className="text-muted-foreground">
                    Stay updated with important alerts and system notifications
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    className="dark:bg-gray-800"
                    variant="outline"
                    onClick={() => {
                      fetchNotifications()
                      fetchNotificationCount()
                    }}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {error && (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      <p>{error}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {loading && notifications.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">Loading notifications...</div>
                  </CardContent>
                </Card>
              ) : notifications.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center gap-3 text-center py-8">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted dark:bg-gray-800">
                        <Bell className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">No notifications</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                          You're all caught up! No new notifications at this time.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedNotifications).map(([type, typeNotifications]) => (
                    <Card key={type} className={getSeverityBgColor(typeNotifications[0]?.severity || "info")}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getNotificationIcon(type)}
                            <CardTitle className="text-lg">
                              {typeNotifications[0]?.type === "expiring_product"
                                ? "Expiring Products"
                                : typeNotifications[0]?.type === "low_stock"
                                ? "Low Stock"
                                : typeNotifications[0]?.type === "out_of_stock"
                                ? "Out of Stock"
                                : typeNotifications[0]?.type === "overstocked"
                                ? "Overstocked Products"
                                : typeNotifications[0]?.type === "pending_sales"
                                ? "Pending Sales"
                                : typeNotifications[0]?.type === "unpaid_sales"
                                ? "Unpaid Sales"
                                : "Notifications"}
                          </CardTitle>
                          </div>
                          <Badge variant={getSeverityColor(typeNotifications[0]?.severity || "info") as any}>
                            {typeNotifications.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {typeNotifications.map((notification) => (
                            <div
                              key={notification.id}
                              className="flex items-start gap-3 p-3 rounded-lg bg-background/50 dark:bg-gray-900/50"
                            >
                              <div className="mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-medium text-sm">{notification.title}</p>
                                  <Badge
                                    variant={getSeverityColor(notification.severity) as any}
                                    className="text-xs"
                                  >
                                    {notification.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatTimestamp(notification.timestamp)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

