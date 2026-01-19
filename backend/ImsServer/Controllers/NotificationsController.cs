using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.ProductX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly DBContext _db;

        public NotificationsController(DBContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var utcNow = DateTime.Now;
            var notifications = new List<object>();

            // 1. Expiring products (within 30 days)
            var expiringProducts = await _db.ProductGenerics
                .Include(pg => pg.Product)
                .Where(pg => !pg.DeletedAt.HasValue &&
                           pg.ExpiryDate >= utcNow &&
                           pg.ExpiryDate <= utcNow.AddDays(30))
                .Select(pg => new
                {
                    pg.Id,
                    pg.Product.ProductName,
                    pg.ExpiryDate,
                    DaysUntilExpiry = (pg.ExpiryDate - utcNow).Days,
                    pg.BatchNumber
                })
                .OrderBy(pg => pg.ExpiryDate)
                .ToListAsync();

            foreach (var product in expiringProducts)
            {
                var severity = product.DaysUntilExpiry <= 7 ? "critical" : product.DaysUntilExpiry <= 14 ? "warning" : "info";
                notifications.Add(new
                {
                    id = Guid.NewGuid(),
                    type = "expiring_product",
                    title = $"Product Expiring: {product.ProductName}",
                    message = product.DaysUntilExpiry <= 0 
                        ? $"Expired {Math.Abs(product.DaysUntilExpiry)} day(s) ago"
                        : $"Expires in {product.DaysUntilExpiry} day(s)",
                    severity = severity,
                    timestamp = utcNow,
                    data = new
                    {
                        productId = product.Id,
                        productName = product.ProductName,
                        expiryDate = product.ExpiryDate,
                        batchNumber = product.BatchNumber,
                        daysUntilExpiry = product.DaysUntilExpiry
                    }
                });
            }

            // 2. Low stock products (at or below reorder level - time to restock)
            var lowStockProducts = await _db.ProductStorages
                .Include(ps => ps.ProductVariation)
                    .ThenInclude(pv => pv.Product)
                .Include(ps => ps.Store)
                .Where(ps => !ps.DeletedAt.HasValue &&
                            ps.Quantity <= ps.ReorderLevel &&
                            ps.Quantity > 0)
                .Select(ps => new
                {
                    ps.Id,
                    ProductName = ps.ProductVariation.Name,
                    ps.Quantity,
                    ps.ReorderLevel,
                    StoreName = ps.Store.Name
                })
                .OrderBy(ps => ps.Quantity)
                .ToListAsync();

            foreach (var product in lowStockProducts)
            {
                // Calculate how far below reorder level we are
                // If quantity is 25% or less of reorder level = critical
                // If quantity is 50% or less of reorder level = warning
                // Otherwise = info (just hit reorder level)
                var percentage = product.ReorderLevel > 0 
                    ? (product.Quantity / product.ReorderLevel) * 100 
                    : 0;
                var severity = percentage <= 25 ? "critical" : percentage <= 50 ? "warning" : "info";
                
                var restockMessage = product.Quantity == product.ReorderLevel
                    ? $"Stock at reorder level ({product.Quantity} units) - time to restock"
                    : product.Quantity < product.ReorderLevel
                    ? $"{product.Quantity} units remaining (below reorder level of {product.ReorderLevel}) - restock needed"
                    : $"{product.Quantity} units remaining (reorder level: {product.ReorderLevel})";
                
                notifications.Add(new
                {
                    id = Guid.NewGuid(),
                    type = "low_stock",
                    title = $"Low Stock Alert: {product.ProductName}",
                    message = $"{restockMessage} in {product.StoreName}",
                    severity = severity,
                    timestamp = utcNow,
                    data = new
                    {
                        productStorageId = product.Id,
                        productName = product.ProductName,
                        quantity = product.Quantity,
                        reorderLevel = product.ReorderLevel,
                        storeName = product.StoreName
                    }
                });
            }

            // 3. Out of stock products
            var outOfStockProducts = await _db.ProductStorages
                .Include(ps => ps.ProductVariation)
                    .ThenInclude(pv => pv.Product)
                .Include(ps => ps.Store)
                .Where(ps => !ps.DeletedAt.HasValue &&
                            ps.Quantity <= 0)
                .Select(ps => new
                {
                    ps.Id,
                    ProductName = ps.ProductVariation.Name,
                    StoreName = ps.Store.Name
                })
                .ToListAsync();

            foreach (var product in outOfStockProducts)
            {
                notifications.Add(new
                {
                    id = Guid.NewGuid(),
                    type = "out_of_stock",
                    title = $"Out of Stock: {product.ProductName}",
                    message = $"No units available in {product.StoreName}",
                    severity = "critical",
                    timestamp = utcNow,
                    data = new
                    {
                        productStorageId = product.Id,
                        productName = product.ProductName,
                        storeName = product.StoreName
                    }
                });
            }

            // 4. Pending sales (not completed)
            var pendingSales = await _db.Sales
                .Include(s => s.Customer)
                .Where(s => !s.DeletedAt.HasValue &&
                           !s.IsCompleted &&
                           s.AddedAt >= utcNow.AddDays(-7)) // Only last 7 days
                .CountAsync();

            if (pendingSales > 0)
            {
                notifications.Add(new
                {
                    id = Guid.NewGuid(),
                    type = "pending_sales",
                    title = "Pending Sales",
                    message = $"{pendingSales} sale(s) pending completion",
                    severity = "warning",
                    timestamp = utcNow,
                    data = new
                    {
                        count = pendingSales
                    }
                });
            }

            // 6. Unpaid sales (outstanding amounts)
            var unpaidSales = await _db.Sales
                .Where(s => !s.DeletedAt.HasValue &&
                           !s.IsRefunded &&
                           s.OutstandingAmount > 0 &&
                           s.AddedAt >= utcNow.AddDays(-30)) // Last 30 days
                .CountAsync();

            if (unpaidSales > 0)
            {
                var totalOutstanding = await _db.Sales
                    .Where(s => !s.DeletedAt.HasValue &&
                               !s.IsRefunded &&
                               s.OutstandingAmount > 0 &&
                               s.AddedAt >= utcNow.AddDays(-30))
                    .SumAsync(s => s.OutstandingAmount);

                notifications.Add(new
                {
                    id = Guid.NewGuid(),
                    type = "unpaid_sales",
                    title = "Unpaid Sales",
                    message = $"{unpaidSales} sale(s) with outstanding amount of UGX {totalOutstanding:N0}",
                    severity = "warning",
                    timestamp = utcNow,
                    data = new
                    {
                        count = unpaidSales,
                        totalOutstanding = totalOutstanding
                    }
                });
            }

            // Sort by severity (critical first, then warning, then info)
            var severityOrder = new Dictionary<string, int>
            {
                { "critical", 0 },
                { "warning", 1 },
                { "info", 2 }
            };

            var sortedNotifications = notifications
                .OrderBy(n => severityOrder.ContainsKey(((dynamic)n).severity.ToString()) ? severityOrder[((dynamic)n).severity.ToString()] : 3)
                .ThenByDescending(n => ((dynamic)n).timestamp)
                .ToList();

            var unreadCount = sortedNotifications.Count;

            return Ok(new
            {
                notifications = sortedNotifications,
                unreadCount = unreadCount,
                timestamp = utcNow
            });
        }

        [HttpGet("count")]
        public async Task<IActionResult> GetNotificationCount()
        {
            var utcNow = DateTime.Now;
            var count = 0;

            // Count expiring products
            count += await _db.ProductGenerics
                .Where(pg => !pg.DeletedAt.HasValue &&
                           pg.ExpiryDate >= utcNow &&
                           pg.ExpiryDate <= utcNow.AddDays(30))
                .CountAsync();

            // Count low stock products
            count += await _db.ProductStorages
                .Where(ps => !ps.DeletedAt.HasValue &&
                            ps.Quantity <= ps.ReorderLevel &&
                            ps.Quantity > 0)
                .CountAsync();

            // Count out of stock products
            count += await _db.ProductStorages
                .Where(ps => !ps.DeletedAt.HasValue &&
                            ps.Quantity <= 0)
                .CountAsync();

            // Count pending sales
            var pendingSales = await _db.Sales
                .Where(s => !s.DeletedAt.HasValue &&
                           !s.IsCompleted &&
                           s.AddedAt >= utcNow.AddDays(-7))
                .CountAsync();
            if (pendingSales > 0) count += 1;

            // Count unpaid sales
            var unpaidSales = await _db.Sales
                .Where(s => !s.DeletedAt.HasValue &&
                           !s.IsRefunded &&
                           s.OutstandingAmount > 0 &&
                           s.AddedAt >= utcNow.AddDays(-30))
                .CountAsync();
            if (unpaidSales > 0) count += 1;

            return Ok(new { count = count });
        }
    }
}

