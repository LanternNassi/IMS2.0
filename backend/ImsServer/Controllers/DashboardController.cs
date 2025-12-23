using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.SaleX;
using ImsServer.Models.PurchaseX;
using ImsServer.Models.ProductX;
using ImsServer.Models.CustomerX;
using ImsServer.Models.SupplierX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly DBContext _db;

        public DashboardController(DBContext db)
        {
            _db = db;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] string? dateRange = "thisMonth")
        {
            var (startDate, endDate) = GetDateRange(dateRange);
            
            // Total Revenue (from completed, non-refunded sales)
            var totalRevenue = await _db.Sales
                .Where(s => !s.DeletedAt.HasValue && 
                           !s.IsRefunded && 
                           s.IsCompleted &&
                           s.SaleDate >= startDate && 
                           s.SaleDate < endDate)
                .SumAsync(s => s.FinalAmount);

            // Total Products
            var totalProducts = await _db.Products
                .Where(p => !p.DeletedAt.HasValue && p.IsActive)
                .CountAsync();

            // Active Customers (customers with at least one sale in the period)
            var activeCustomers = await _db.Sales
                .Where(s => !s.DeletedAt.HasValue && 
                           s.CustomerId.HasValue &&
                           s.SaleDate >= startDate && 
                           s.SaleDate < endDate)
                .Select(s => s.CustomerId)
                .Distinct()
                .CountAsync();

            // Pending Orders (sales that are not completed)
            var pendingOrders = await _db.Sales
                .Where(s => !s.DeletedAt.HasValue && 
                           !s.IsCompleted &&
                           s.SaleDate >= startDate && 
                           s.SaleDate < endDate)
                .CountAsync();

            // Calculate previous period for comparison
            var periodDays = (endDate - startDate).Days;
            var previousStartDate = startDate.AddDays(-periodDays);
            var previousEndDate = startDate;

            var previousRevenue = await _db.Sales
                .Where(s => !s.DeletedAt.HasValue && 
                           !s.IsRefunded && 
                           s.IsCompleted &&
                           s.SaleDate >= previousStartDate && 
                           s.SaleDate < previousEndDate)
                .SumAsync(s => s.FinalAmount);

            var previousProducts = await _db.Products
                .Where(p => !p.DeletedAt.HasValue && p.IsActive)
                .CountAsync();

            var previousActiveCustomers = await _db.Sales
                .Where(s => !s.DeletedAt.HasValue && 
                           s.CustomerId.HasValue &&
                           s.SaleDate >= previousStartDate && 
                           s.SaleDate < previousEndDate)
                .Select(s => s.CustomerId)
                .Distinct()
                .CountAsync();

            var previousPendingOrders = await _db.Sales
                .Where(s => !s.DeletedAt.HasValue && 
                           !s.IsCompleted &&
                           s.SaleDate >= previousStartDate && 
                           s.SaleDate < previousEndDate)
                .CountAsync();

            // Calculate percentage changes
            var revenueChange = previousRevenue > 0 
                ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
                : 0;
            var productsChange = previousProducts > 0 
                ? ((totalProducts - previousProducts) / (double)previousProducts) * 100 
                : 0;
            var customersChange = previousActiveCustomers > 0 
                ? ((activeCustomers - previousActiveCustomers) / (double)previousActiveCustomers) * 100 
                : 0;
            var pendingOrdersChange = previousPendingOrders > 0 
                ? ((pendingOrders - previousPendingOrders) / (double)previousPendingOrders) * 100 
                : (previousPendingOrders == 0 && pendingOrders > 0 ? 100 : 0);

            return Ok(new
            {
                totalRevenue = Math.Round(totalRevenue, 2),
                totalProducts,
                activeCustomers,
                pendingOrders,
                revenueChange = Math.Round((decimal)revenueChange, 1),
                productsChange = Math.Round(productsChange, 1),
                customersChange = Math.Round(customersChange, 1),
                pendingOrdersChange = Math.Round(pendingOrdersChange, 1)
            });
        }

        [HttpGet("sales")]
        public async Task<IActionResult> GetSalesData([FromQuery] string? dateRange = "thisYear")
        {
            var (startDate, endDate) = GetDateRange(dateRange);
            
            var sales = await _db.Sales
                .Where(s => !s.DeletedAt.HasValue && 
                           !s.IsRefunded && 
                           s.IsCompleted &&
                           s.SaleDate >= startDate && 
                           s.SaleDate < endDate)
                .ToListAsync();

            // Group by month
            var monthlySales = sales
                .GroupBy(s => new { s.SaleDate.Year, s.SaleDate.Month })
                .Select(g => new
                {
                    name = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM"),
                    total = Math.Round(g.Sum(s => s.FinalAmount), 2)
                })
                .OrderBy(x => x.name)
                .ToList();

            // Top selling products
            var topProducts = await _db.SalesItems
                .Include(si => si.Sale)
                .Include(si => si.ProductVariation)
                    .ThenInclude(pv => pv.Product)
                .Where(si => !si.DeletedAt.HasValue && 
                            !si.Sale.DeletedAt.HasValue &&
                            !si.Sale.IsRefunded &&
                            si.Sale.IsCompleted &&
                            si.Sale.SaleDate >= startDate && 
                            si.Sale.SaleDate < endDate)
                .GroupBy(si => new
                {
                    si.ProductVariation.Name,
                    si.ProductVariation.RetailPrice
                })
                .Select(g => new
                {
                    name = g.Key.Name,
                    price = g.Key.RetailPrice,
                    unitsSold = g.Sum(si => si.Quantity),
                    totalRevenue = Math.Round(g.Sum(si => si.TotalPrice), 2)
                })
                .OrderByDescending(p => p.unitsSold)
                .Take(4)
                .ToListAsync();

            return Ok(new
            {
                monthlySales,
                topProducts
            });
        }

        [HttpGet("products")]
        public async Task<IActionResult> GetProductsData([FromQuery] string? dateRange = "thisMonth")
        {
            var (startDate, endDate) = GetDateRange(dateRange);

            // Product inventory by category (using Category if available, otherwise group by product)
            var productStorages = await _db.ProductStorages
                .Include(ps => ps.ProductVariation)
                    .ThenInclude(pv => pv.Product)
                .Include(ps => ps.Store)
                .Where(ps => !ps.DeletedAt.HasValue)
                .ToListAsync();

            // Group by product name (as category proxy)
            var inventoryByCategory = productStorages
                .GroupBy(ps => ps.ProductVariation.Product.ProductName)
                .Select(g => new
                {
                    name = g.Key,
                    stock = g.Sum(ps => ps.Quantity)
                })
                .OrderByDescending(x => x.stock)
                .Take(5)
                .ToList();

            // Product category distribution (using product count as proxy)
            var categoryDistribution = productStorages
                .GroupBy(ps => ps.ProductVariation.Product.ProductName)
                .Select(g => new
                {
                    name = g.Key,
                    value = g.Count()
                })
                .OrderByDescending(x => x.value)
                .Take(5)
                .ToList();

            // Calculate percentages
            var total = categoryDistribution.Sum(c => c.value);
            var categoryData = categoryDistribution.Select(c => new
            {
                name = c.name,
                value = total > 0 ? (int)Math.Round((c.value / (double)total) * 100) : 0
            }).ToList();

            return Ok(new
            {
                inventoryByCategory,
                categoryDistribution = categoryData
            });
        }

        [HttpGet("customers")]
        public async Task<IActionResult> GetCustomersData([FromQuery] string? dateRange = "thisMonth")
        {
            var (startDate, endDate) = GetDateRange(dateRange);

            // Get all sales with customers in the period
            var salesWithCustomers = await _db.Sales
                .Include(s => s.Customer)
                .Where(s => !s.DeletedAt.HasValue && 
                           s.CustomerId.HasValue &&
                           s.SaleDate >= startDate && 
                           s.SaleDate < endDate)
                .ToListAsync();

            // Get previous period for comparison
            var periodDays = (endDate - startDate).Days;
            var previousStartDate = startDate.AddDays(-periodDays);
            var previousEndDate = startDate;

            var previousSalesWithCustomers = await _db.Sales
                .Where(s => !s.DeletedAt.HasValue && 
                           s.CustomerId.HasValue &&
                           s.SaleDate >= previousStartDate && 
                           s.SaleDate < previousEndDate)
                .Select(s => s.CustomerId)
                .Distinct()
                .ToListAsync();

            // Identify new vs returning customers
            var customerIdsInPeriod = salesWithCustomers
                .Select(s => s.CustomerId.Value)
                .Distinct()
                .ToList();

            var newCustomers = customerIdsInPeriod
                .Where(cid => !previousSalesWithCustomers.Contains(cid))
                .Count();

            var returningCustomers = customerIdsInPeriod.Count - newCustomers;

            // Customer growth over time (monthly)
            // First, get the grouped data from database
            var monthlyCustomerGrowthData = await _db.Sales
                .Where(s => !s.DeletedAt.HasValue && 
                           s.CustomerId.HasValue &&
                           s.SaleDate >= startDate.AddMonths(-11) && 
                           s.SaleDate < endDate)
                .Select(s => new { s.SaleDate.Year, s.SaleDate.Month, s.CustomerId })
                .ToListAsync();

            // Then transform in memory
            var monthlyCustomerGrowth = monthlyCustomerGrowthData
                .GroupBy(s => new { s.Year, s.Month })
                .Select(g => new
                {
                    month = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM"),
                    customers = g.Select(s => s.CustomerId).Distinct().Count()
                })
                .OrderBy(x => x.month)
                .ToList();

            return Ok(new
            {
                customerTypes = new[]
                {
                    new { name = "New", value = newCustomers },
                    new { name = "Returning", value = returningCustomers }
                },
                monthlyGrowth = monthlyCustomerGrowth
            });
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactionsData([FromQuery] string? dateRange = "thisWeek")
        {
            var (startDate, endDate) = GetDateRange(dateRange);

            // Sales transactions
            var sales = await _db.Sales
                .Where(s => !s.DeletedAt.HasValue && 
                           !s.IsRefunded &&
                           s.SaleDate >= startDate && 
                           s.SaleDate < endDate)
                .ToListAsync();

            // Purchase transactions
            var purchases = await _db.Purchases
                .Where(p => !p.DeletedAt.HasValue &&
                           p.PurchaseDate >= startDate && 
                           p.PurchaseDate < endDate)
                .ToListAsync();

            // Group by day of week
            var salesByDay = sales
                .GroupBy(s => s.SaleDate.DayOfWeek)
                .ToDictionary(g => g.Key, g => g.Count());

            var purchasesByDay = purchases
                .GroupBy(p => p.PurchaseDate.DayOfWeek)
                .ToDictionary(g => g.Key, g => g.Count());

            var dayOfWeekMap = new Dictionary<DayOfWeek, string>
            {
                { DayOfWeek.Monday, "Mon" },
                { DayOfWeek.Tuesday, "Tue" },
                { DayOfWeek.Wednesday, "Wed" },
                { DayOfWeek.Thursday, "Thu" },
                { DayOfWeek.Friday, "Fri" },
                { DayOfWeek.Saturday, "Sat" },
                { DayOfWeek.Sunday, "Sun" }
            };

            var dayNames = new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, 
                                   DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday, DayOfWeek.Sunday };

            var transactionData = dayNames.Select(dayOfWeek => new
            {
                name = dayOfWeekMap[dayOfWeek],
                sales = salesByDay.ContainsKey(dayOfWeek) ? salesByDay[dayOfWeek] : 0,
                purchases = purchasesByDay.ContainsKey(dayOfWeek) ? purchasesByDay[dayOfWeek] : 0
            }).ToList();

            // Payment methods distribution
            var paymentMethods = sales
                .GroupBy(s => s.PaymentMethod)
                .Select(g => new
                {
                    name = g.Key.ToString(),
                    value = g.Count()
                })
                .ToList();

            var totalTransactions = sales.Count;
            var paymentMethodData = paymentMethods.Select(pm => new
            {
                name = pm.name,
                value = totalTransactions > 0 ? (int)Math.Round((pm.value / (double)totalTransactions) * 100) : 0
            }).ToList();

            return Ok(new
            {
                weeklyTransactions = transactionData,
                paymentMethods = paymentMethodData
            });
        }

        [HttpGet("suppliers")]
        public async Task<IActionResult> GetSuppliersData([FromQuery] string? dateRange = "thisMonth")
        {
            var (startDate, endDate) = GetDateRange(dateRange);

            // Get purchases grouped by supplier
            var purchasesBySupplier = await _db.Purchases
                .Include(p => p.Supplier)
                .Where(p => !p.DeletedAt.HasValue &&
                           p.PurchaseDate >= startDate && 
                           p.PurchaseDate < endDate)
                .GroupBy(p => new
                {
                    p.SupplierId,
                    p.Supplier.CompanyName
                })
                .Select(g => new
                {
                    name = g.Key.CompanyName,
                    value = g.Count(),
                    totalAmount = g.Sum(p => p.TotalAmount)
                })
                .OrderByDescending(x => x.totalAmount)
                .Take(4)
                .ToListAsync();

            // Calculate percentages
            var totalPurchases = purchasesBySupplier.Sum(s => s.value);
            var supplierData = purchasesBySupplier.Select(s => new
            {
                name = s.name,
                value = totalPurchases > 0 ? (int)Math.Round((s.value / (double)totalPurchases) * 100) : 0
            }).ToList();

            // Supplier performance (delivery time and quality - using purchase count as proxy)
            var supplierPerformance = purchasesBySupplier.Select(s => new
            {
                name = s.name,
                deliveryTime = 4.0 + (new Random().NextDouble() * 1.0), // Mock data
                quality = 4.0 + (new Random().NextDouble() * 1.0) // Mock data
            }).ToList();

            return Ok(new
            {
                topSuppliers = supplierData,
                supplierPerformance
            });
        }

        [HttpGet("recent-transactions")]
        public async Task<IActionResult> GetRecentTransactions([FromQuery] int limit = 5)
        {
            var recentSales = await _db.Sales
                .Include(s => s.Customer)
                .Where(s => !s.DeletedAt.HasValue)
                .OrderByDescending(s => s.SaleDate)
                .Take(limit)
                .Select(s => new
                {
                    id = s.Id,
                    type = "sale",
                    title = $"Order #{s.Id.ToString().Substring(0, 8)}",
                    amount = s.FinalAmount,
                    date = s.SaleDate,
                    customer = s.Customer != null ? s.Customer.Name : "Walk-in"
                })
                .ToListAsync();

            var recentPurchases = await _db.Purchases
                .Include(p => p.Supplier)
                .Where(p => !p.DeletedAt.HasValue)
                .OrderByDescending(p => p.PurchaseDate)
                .Take(limit)
                .Select(p => new
                {
                    id = p.Id,
                    type = "purchase",
                    title = $"Purchase #{p.PurchaseNumber}",
                    amount = p.TotalAmount,
                    date = p.PurchaseDate,
                    supplier = p.Supplier.CompanyName
                })
                .ToListAsync();

            var allTransactions = recentSales
                .Select(s => new
                {
                    s.id,
                    s.type,
                    s.title,
                    s.amount,
                    s.date,
                    description = s.customer
                })
                .Concat(recentPurchases.Select(p => new
                {
                    p.id,
                    p.type,
                    p.title,
                    p.amount,
                    p.date,
                    description = p.supplier
                }))
                .OrderByDescending(t => t.date)
                .Take(limit)
                .ToList();

            return Ok(allTransactions);
        }

        [HttpGet("inventory-alerts")]
        public async Task<IActionResult> GetInventoryAlerts()
        {
            var lowStockItems = await _db.ProductStorages
                .Include(ps => ps.ProductVariation)
                    .ThenInclude(pv => pv.Product)
                .Include(ps => ps.Store)
                .Where(ps => !ps.DeletedAt.HasValue && 
                            ps.Quantity <= ps.ReorderLevel &&
                            ps.Quantity > 0)
                .Select(ps => new
                {
                    productName = ps.ProductVariation.Name,
                    quantity = ps.Quantity,
                    reorderLevel = ps.ReorderLevel,
                    severity = ps.Quantity <= ps.ReorderLevel * 0.5m ? "critical" : "warning"
                })
                .OrderBy(ps => ps.quantity)
                .Take(5)
                .ToListAsync();

            var expiringItems = await _db.ProductGenerics
                .Include(pg => pg.Product)
                .Where(pg => !pg.DeletedAt.HasValue &&
                            pg.ExpiryDate >= DateTime.UtcNow &&
                            pg.ExpiryDate <= DateTime.UtcNow.AddDays(30))
                .Select(pg => new
                {
                    productName = pg.Product.ProductName,
                    expiryDate = pg.ExpiryDate,
                    daysUntilExpiry = (pg.ExpiryDate - DateTime.UtcNow).Days,
                    severity = (pg.ExpiryDate - DateTime.UtcNow).Days <= 7 ? "critical" : "warning"
                })
                .OrderBy(pg => pg.expiryDate)
                .Take(5)
                .ToListAsync();


            var alerts = lowStockItems
                .Select(item => new
                {
                    type = "low_stock",
                    productName = item.productName,
                    message = $"Low stock ({item.quantity} units)",
                    severity = item.severity
                })
                .Concat(expiringItems.Select(item => new
                {
                    type = "expiring",
                    productName = item.productName,
                    message = $"Expiring in {item.daysUntilExpiry} days",
                    severity = item.severity
                }))
                .Take(5)
                .ToList();

            return Ok(alerts);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllDashboardData([FromQuery] string? dateRange = "thisMonth")
        {
            // Execute sequentially to avoid DbContext concurrency issues
            var summaryResult = await GetSummary(dateRange) as OkObjectResult;
            var salesResult = await GetSalesData(dateRange) as OkObjectResult;
            var productsResult = await GetProductsData(dateRange) as OkObjectResult;
            var customersResult = await GetCustomersData(dateRange) as OkObjectResult;
            var transactionsResult = await GetTransactionsData("thisWeek") as OkObjectResult;
            var suppliersResult = await GetSuppliersData(dateRange) as OkObjectResult;
            var recentTransactionsResult = await GetRecentTransactions(5) as OkObjectResult;
            var inventoryAlertsResult = await GetInventoryAlerts() as OkObjectResult;

            return Ok(new
            {
                summary = summaryResult?.Value,
                sales = salesResult?.Value,
                products = productsResult?.Value,
                customers = customersResult?.Value,
                transactions = transactionsResult?.Value,
                suppliers = suppliersResult?.Value,
                recentTransactions = recentTransactionsResult?.Value,
                inventoryAlerts = inventoryAlertsResult?.Value
            });
        }

        private (DateTime startDate, DateTime endDate) GetDateRange(string dateRange)
        {
            var utcNow = DateTime.UtcNow;
            DateTime startDate;
            DateTime endDate;

            switch (dateRange?.ToLower())
            {
                case "today":
                    startDate = utcNow.Date;
                    endDate = startDate.AddDays(1);
                    break;
                case "yesterday":
                    startDate = utcNow.Date.AddDays(-1);
                    endDate = startDate.AddDays(1);
                    break;
                case "thisweek":
                    var daysUntilMonday = ((int)utcNow.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
                    startDate = utcNow.Date.AddDays(-daysUntilMonday);
                    endDate = startDate.AddDays(7);
                    break;
                case "thismonth":
                    startDate = new DateTime(utcNow.Year, utcNow.Month, 1);
                    endDate = startDate.AddMonths(1);
                    break;
                case "lastmonth":
                    startDate = new DateTime(utcNow.Year, utcNow.Month, 1).AddMonths(-1);
                    endDate = startDate.AddMonths(1);
                    break;
                case "thisyear":
                    startDate = new DateTime(utcNow.Year, 1, 1);
                    endDate = startDate.AddYears(1);
                    break;
                default:
                    startDate = new DateTime(utcNow.Year, utcNow.Month, 1);
                    endDate = startDate.AddMonths(1);
                    break;
            }

            return (startDate, endDate);
        }
    }
}

