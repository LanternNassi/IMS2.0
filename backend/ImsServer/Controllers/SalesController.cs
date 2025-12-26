using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.SaleX;
using ImsServer.Models.ProductX;
using ImsServer.Models.CustomerX;
using ImsServer.Models.SalesDebtsTrackerX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalesController : ControllerBase
    {
        private readonly DBContext _db;

        public SalesController(DBContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetSales(
            [FromQuery] DateTime? startSaleDate,
            [FromQuery] DateTime? endSaleDate,
            [FromQuery] Guid? customerId,
            [FromQuery] Guid? processedById,
            [FromQuery] decimal? maxTotalAmount,
            [FromQuery] decimal? minTotalAmount,
            [FromQuery] bool? isPaid,
            [FromQuery] bool? isRefunded,
            [FromQuery] bool? isTaken,
            [FromQuery] bool? isCompleted,
            [FromQuery] PaymentMethod? paymentMethod,
            [FromQuery] bool includeMetadata = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.Sales
                .Include(s => s.Customer)
                .Include(s => s.ProcessedBy)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.ProductVariation)
                .OrderByDescending(s => s.SaleDate)
                .AsQueryable();

            // Apply filters
            if (startSaleDate.HasValue)
            {
                query = query.Where(s => s.SaleDate >= startSaleDate.Value);
            }

            if (endSaleDate.HasValue)
            {
                query = query.Where(s => s.SaleDate <= endSaleDate.Value);
            }

            if (customerId.HasValue)
            {
                query = query.Where(s => s.CustomerId == customerId.Value);
            }

            if (processedById.HasValue)
            {
                query = query.Where(s => s.ProcessedById == processedById.Value);
            }

            if (maxTotalAmount.HasValue)
            {
                query = query.Where(s => s.TotalAmount <= maxTotalAmount.Value);
            }

            if (minTotalAmount.HasValue)
            {
                query = query.Where(s => s.TotalAmount >= minTotalAmount.Value);
            }

            if (isPaid.HasValue)
            {
                query = query.Where(s => s.IsPaid == isPaid.Value);
            }

            if (isRefunded.HasValue)
            {
                query = query.Where(s => s.IsRefunded == isRefunded.Value);
            }

            if (isTaken.HasValue)
            {
                query = query.Where(s => s.IsTaken == isTaken.Value);
            }

            if (isCompleted.HasValue)
            {
                query = query.Where(s => s.IsCompleted == isCompleted.Value);
            }

            if (paymentMethod.HasValue)
            {
                query = query.Where(s => s.PaymentMethod == paymentMethod.Value);
            }

            // Filter out reconciliation sales by default (sales with [RECONCILIATION] tag in Notes)
            query = query.Where(s => s.Notes == null || !s.Notes.Contains("[RECONCILIATION]"));

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Validate and apply pagination
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : pageSize > 500 ? 500 : pageSize;

            var sales = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var paginationInfo = new
            {
                CurrentPage = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasPreviousPage = page > 1,
                HasNextPage = page < totalPages
            };

            if (!includeMetadata)
            {
                return Ok(new
                {
                    Pagination = paginationInfo,
                    Sales = sales
                });
            }

            // Calculate metadata (using all filtered data, not just current page)
            var allSales = await query.ToListAsync();
            var metadata = new
            {
                TotalAmount = allSales.Sum(s => s.TotalAmount),
                PaidAmount = allSales.Sum(s => s.PaidAmount),
                FinalAmount = allSales.Sum(s => s.FinalAmount),
                TotalProfit = allSales.Sum(s => s.Profit),
                OutstandingAmount = allSales.Sum(s => s.OutstandingAmount),
                PaidSales = allSales.Count(s => s.IsPaid),
                CompletedSales = allSales.Count(s => s.IsCompleted),
                TotalSales = allSales.Count,
                PaymentMethodBreakdown = allSales
                    .GroupBy(s => s.PaymentMethod)
                    .Select(g => new
                    {
                        PaymentMethod = g.Key.ToString(),
                        Count = g.Count(),
                        TotalAmount = g.Sum(s => s.TotalAmount)
                    })
                    .ToList()
            };

            return Ok(new
            {
                Pagination = paginationInfo,
                Metadata = metadata,
                Sales = sales
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSale(Guid id)
        {
            var sale = await _db.Sales
                .Include(s => s.Customer)
                .Include(s => s.ProcessedBy)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.ProductVariation)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.ProductStorage)
                        .ThenInclude(ps => ps.ProductGeneric)
                .FirstOrDefaultAsync(s => s.Id == id && !s.DeletedAt.HasValue);

            if (sale == null) return NotFound();

            return Ok(sale);
        }

        [HttpGet("SalePrefix/{idPrefix}")]
        public async Task<IActionResult> GetSalePrefix(string idPrefix)
        {
            // Ensure the prefix is valid (optional validation)
            if (string.IsNullOrWhiteSpace(idPrefix) || idPrefix.Length < 8)
            {
                return BadRequest("ID prefix must be at least 8 characters");
            }

            var sale = _db.Sales
                .Where(s => !s.DeletedAt.HasValue)
                .Include(s => s.Customer)
                .Include(s => s.ProcessedBy)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.ProductVariation)
                .Include(s => s.SaleItems)
                .AsEnumerable() // Switch to client-side evaluation
                .FirstOrDefault(s => s.Id.ToString().StartsWith(idPrefix, StringComparison.OrdinalIgnoreCase));

            if (sale == null) return NotFound();

            var processedSale = new
            {
                sale.Id,
                sale.Customer,
                sale.ProcessedBy,
                sale.SaleDate,
                sale.TotalAmount,
                sale.PaidAmount,
                sale.ChangeAmount,
                sale.OutstandingAmount,
                sale.Discount,
                sale.FinalAmount,
                sale.Profit,
                sale.IsPaid,
                sale.IsRefunded,
                sale.IsTaken,
                sale.PaymentMethod,
                sale.IsCompleted,
                SaleItems = sale.SaleItems.Select(si => new
                {
                    id = si.ProductVariationId,
                    productName = si.ProductVariation.Name,
                    quantity = si.Quantity,
                    basePrice = si.UnitPrice,
                    totalPrice = si.TotalPrice
                }).ToList()
            };

            return Ok(processedSale);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSale([FromBody] CreateSaleDto dto)
        {
            if (dto == null) return BadRequest("Payload required");

            // Validate customer
            // var customer = await _db.Customers.FindAsync(dto.CustomerId);
            // if (customer == null)
            // {
            //     return BadRequest("Customer not found. Provide a valid CustomerId.");
            // }

            // Validate user (ProcessedBy) if provided
            if (dto.ProcessedById.HasValue && dto.ProcessedById.Value != Guid.Empty)
            {
                var user = await _db.Users.FindAsync(dto.ProcessedById.Value);
                if (user == null)
                {
                    return BadRequest("User not found. Provide a valid ProcessedBy user ID.");
                }
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                var sale = new Sale
                {
                    Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                    CustomerId = dto.CustomerId,
                    ProcessedById = dto.ProcessedById,
                    SaleDate = dto.SaleDate == default ? DateTime.UtcNow : dto.SaleDate,
                    TotalAmount = dto.TotalAmount,
                    PaidAmount = dto.PaidAmount,
                    ChangeAmount = dto.ChangeAmount,
                    OutstandingAmount = dto.TotalAmount - dto.PaidAmount,
                    Discount = dto.Discount,
                    FinalAmount = dto.FinalAmount,
                    Profit = 0, // Will calculate from items
                    IsPaid = dto.PaidAmount >= dto.TotalAmount,
                    IsRefunded = false,
                    IsTaken = dto.IsTaken,
                    PaymentMethod = dto.PaymentMethod,
                    LinkedFinancialAccountId = dto.LinkedFinancialAccountId,
                    IsCompleted = dto.IsCompleted,
                    WasPartialPayment = dto.PaidAmount < dto.TotalAmount // Mark if it was a debt initially
                };

                _db.Sales.Add(sale);

                decimal totalProfit = 0;

                // Process items
                foreach (var it in dto.Items ?? Enumerable.Empty<CreateSaleItemDto>())
                {
                    // Validate product variation
                    ProductVariation variation = null;

                    if (it.ProductVariationId != Guid.Empty)
                    {
                        variation = await _db.ProductVariations.FindAsync(it.ProductVariationId);
                    }
                    else if (it.ProductId != Guid.Empty)
                    {
                        variation = await _db.ProductVariations
                            .FirstOrDefaultAsync(v => v.ProductId == it.ProductId);
                    }

                    if (variation == null)
                    {
                        await tran.RollbackAsync();
                        return BadRequest($"Product variation not found for item {it.Id}");
                    }

                    // Find the oldest product storage for this variation and store
                    // Order by ProductGeneric's Id (ascending) to get oldest first
                    var productStorage = await _db.ProductStorages
                        .Include(ps => ps.ProductGeneric)
                        .Where(ps =>
                            ps.ProductVariationId == variation.Id &&
                            ps.StorageId == it.StorageId &&
                            ps.Quantity >= it.Quantity)
                        .OrderBy(ps => ps.ProductGeneric.Id) // Oldest generic first
                        .FirstOrDefaultAsync();

                    if (productStorage == null)
                    {
                        await tran.RollbackAsync();
                        return BadRequest($"Insufficient stock for product variation {variation.Id} in store {it.StorageId}. Required: {it.Quantity}");
                    }

                    // Deduct quantity from storage
                    productStorage.Quantity -= it.Quantity;

                    // Calculate profit (assuming we have cost price in ProductStorage or ProductGeneric)
                    // For now, we'll use a simple calculation or you can extend the model
                    decimal itemProfit = 0;
                    // If you have cost price available, calculate: (BasePrice - CostPrice) * Quantity
                    // itemProfit = (it.BasePrice - costPrice) * it.Quantity;
                    itemProfit = (it.BasePrice - variation.CostPrice) * it.Quantity;

                    totalProfit += itemProfit;

                    var saleItem = new SalesItem
                    {
                        Id = it.Id == Guid.Empty ? Guid.NewGuid() : it.Id,
                        SaleId = sale.Id,
                        ProductVariationId = variation.Id,
                        ProductStorageId = productStorage.Id,
                        Quantity = it.Quantity,
                        UnitPrice = it.BasePrice,
                        TotalPrice = it.TotalPrice,
                        ProfitMargin = itemProfit
                    };

                    _db.SalesItems.Add(saleItem);
                }

                // Update sale profit
                sale.Profit = totalProfit;

                // Update balance of linked financial account if provided
                if (dto.LinkedFinancialAccountId.HasValue)
                {
                    var account = await _db.FinancialAccounts
                        .FirstOrDefaultAsync(fa => fa.Id == dto.LinkedFinancialAccountId.Value);

                    if (account == null)
                    {
                        await tran.RollbackAsync();
                        return BadRequest("Linked financial account not found. Provide a valid LinkedFinancialAccountId.");
                    }

                    // Update account balance based on payment method
                    if (dto.PaidAmount >= 0)
                    {
                        account.Balance += dto.PaidAmount;
                    }
                }

                // If sale started as partial payment, record the initial payment in the tracker
                // so dated cash-in events are consistent for reporting.
                if (dto.PaidAmount > 0 && dto.PaidAmount < dto.TotalAmount)
                {
                    var initialPayment = new SalesDebtsTracker
                    {
                        Id = Guid.NewGuid(),
                        SaleId = sale.Id,
                        PaidAmount = dto.PaidAmount,
                        DebtType = DebtType.Receivable,
                        PaymentMethod = dto.PaymentMethod,
                        LinkedFinancialAccountId = dto.LinkedFinancialAccountId,
                        Description = string.IsNullOrWhiteSpace(dto.Notes) ? "Initial payment at sale creation" : dto.Notes
                    };

                    _db.SalesDebtsTrackers.Add(initialPayment);
                }

                await _db.SaveChangesAsync();
                await tran.CommitAsync();

                return CreatedAtAction(nameof(GetSale), new { id = sale.Id }, sale);
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = ex.Message, innerException = ex.InnerException?.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSale(Guid id, [FromBody] UpdateSaleDto dto)
        {
            var sale = await _db.Sales
                .Include(s => s.SaleItems)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sale == null) return NotFound();

            sale.IsPaid = dto.IsPaid;
            sale.PaidAmount = dto.PaidAmount;
            sale.OutstandingAmount = dto.OutstandingAmount;
            sale.IsCompleted = dto.IsCompleted;
            sale.IsTaken = dto.IsTaken;
            sale.IsRefunded = dto.IsRefunded;

            await _db.SaveChangesAsync();

            return Ok(sale);
        }

        [HttpPut("Complete/{id}")]
        public async Task<IActionResult> CompleteSale(Guid id)
        {
            var sale = await _db.Sales.FindAsync(id);

            if (sale == null) return NotFound();

            sale.IsCompleted = true;
            sale.IsTaken = true;

            await _db.SaveChangesAsync();

            return Ok(sale);
        }

        [HttpPut("Refund/{id}")]
        public async Task<IActionResult> RefundSale(Guid id)
        {
            var sale = await _db.Sales
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.ProductStorage)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sale == null) return NotFound();

            if (sale.IsRefunded)
            {
                return BadRequest("Sale has already been refunded.");
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                // Return stock to storage
                foreach (var item in sale.SaleItems)
                {
                    var storage = item.ProductStorage;
                    if (storage != null)
                    {
                        storage.Quantity += item.Quantity;
                    }
                }

                // Withdraw amounts from linked financial account if applicable
                if (sale.LinkedFinancialAccountId.HasValue)
                {
                    var account = await _db.FinancialAccounts
                        .FirstOrDefaultAsync(fa => fa.Id == sale.LinkedFinancialAccountId.Value);

                    if (account != null)
                    {
                        account.Balance -= sale.PaidAmount;
                    }
                }

                sale.IsRefunded = true;
                sale.OutstandingAmount = 0;
                sale.PaidAmount = 0;

                await _db.SaveChangesAsync();
                await tran.CommitAsync();

                return Ok(sale);
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet("Receivables")]
        public async Task<IActionResult> GetDebtors(
            [FromQuery] Guid? customerId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] decimal? minOutstanding,
            [FromQuery] decimal? maxOutstanding,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.Sales
                .Include(s => s.Customer)
                .Include(s => s.ProcessedBy)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.ProductVariation)
                .Where(s => !s.DeletedAt.HasValue && s.WasPartialPayment)
                .OrderByDescending(s => s.SaleDate)
                .AsQueryable();

            // Apply filters
            if (customerId.HasValue)
            {
                query = query.Where(s => s.CustomerId == customerId.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(s => s.SaleDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(s => s.SaleDate <= endDate.Value);
            }

            // Calculate actual outstanding amount (TotalAmount - PaidAmount)
            var allDebtors = await query.ToListAsync();

            // Apply amount filters on calculated outstanding
            if (minOutstanding.HasValue)
            {
                allDebtors = allDebtors.Where(s => (s.TotalAmount - s.PaidAmount) >= minOutstanding.Value).ToList();
            }

            if (maxOutstanding.HasValue)
            {
                allDebtors = allDebtors.Where(s => (s.TotalAmount - s.PaidAmount) <= maxOutstanding.Value).ToList();
            }

            // Get total count before pagination
            var totalCount = allDebtors.Count;

            // Validate and apply pagination
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : pageSize > 500 ? 500 : pageSize;

            var debtors = allDebtors
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var paginationInfo = new
            {
                CurrentPage = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasPreviousPage = page > 1,
                HasNextPage = page < totalPages
            };

            // Calculate comprehensive metadata (using all filtered data, not just current page)
            var totalOutstanding = allDebtors.Sum(s => s.TotalAmount - s.PaidAmount);
            var totalDebt = allDebtors.Sum(s => s.TotalAmount);
            var totalPaidSoFar = allDebtors.Sum(s => s.PaidAmount);

            // Top 5 customers with most outstanding debt
            var topDebtors = allDebtors
                .GroupBy(s => new { s.CustomerId, s.Customer.Name, s.Customer.Phone, s.Customer.Address })
                .Select(g => new
                {
                    CustomerId = g.Key.CustomerId,
                    CustomerName = g.Key.Name,
                    CustomerPhone = g.Key.Phone,
                    CustomerAddress = g.Key.Address,
                    TotalSales = g.Count(),
                    TotalDebt = g.Sum(s => s.TotalAmount),
                    TotalPaid = g.Sum(s => s.PaidAmount),
                    OutstandingAmount = g.Sum(s => s.TotalAmount - s.PaidAmount),
                    OldestDebtDate = g.Min(s => s.SaleDate),
                    MostRecentDebtDate = g.Max(s => s.SaleDate),
                    AverageDebtPerSale = g.Average(s => s.TotalAmount - s.PaidAmount)
                })
                .OrderByDescending(c => c.OutstandingAmount)
                .Take(5)
                .ToList();

            // Time series: Group by date (daily)
            var timeSeries = allDebtors
                .GroupBy(s => s.SaleDate.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    SalesCount = g.Count(),
                    TotalDebt = g.Sum(s => s.TotalAmount),
                    TotalPaid = g.Sum(s => s.PaidAmount),
                    OutstandingAmount = g.Sum(s => s.TotalAmount - s.PaidAmount),
                    AverageOutstanding = g.Average(s => s.TotalAmount - s.PaidAmount)
                })
                .OrderBy(t => t.Date)
                .ToList();

            // Age analysis: Categorize debts by age
            var today = DateTime.UtcNow;
            var ageAnalysis = new
            {
                Current_0_30Days = allDebtors
                    .Where(s => (today - s.SaleDate).TotalDays <= 30)
                    .Sum(s => s.TotalAmount - s.PaidAmount),
                Days_31_60 = allDebtors
                    .Where(s => (today - s.SaleDate).TotalDays > 30 && (today - s.SaleDate).TotalDays <= 60)
                    .Sum(s => s.TotalAmount - s.PaidAmount),
                Days_61_90 = allDebtors
                    .Where(s => (today - s.SaleDate).TotalDays > 60 && (today - s.SaleDate).TotalDays <= 90)
                    .Sum(s => s.TotalAmount - s.PaidAmount),
                Days_91_180 = allDebtors
                    .Where(s => (today - s.SaleDate).TotalDays > 90 && (today - s.SaleDate).TotalDays <= 180)
                    .Sum(s => s.TotalAmount - s.PaidAmount),
                Over_180Days = allDebtors
                    .Where(s => (today - s.SaleDate).TotalDays > 180)
                    .Sum(s => s.TotalAmount - s.PaidAmount)
            };

            // Payment rate analysis
            var paymentRate = totalDebt > 0 ? (totalPaidSoFar / totalDebt) * 100 : 0;

            // Collection efficiency
            var avgDaysToPay = allDebtors
                .Where(s => s.PaidAmount > 0)
                .Select(s => (today - s.SaleDate).TotalDays)
                .DefaultIfEmpty(0)
                .Average();

            var metadata = new
            {
                Summary = new
                {
                    TotalOutstandingAmount = totalOutstanding,
                    TotalDebtValue = totalDebt,
                    TotalPaidAmount = totalPaidSoFar,
                    PaymentRate = Math.Round(paymentRate, 2),
                    TotalDebtorSales = allDebtors.Count,
                    UniqueDebtors = allDebtors.Select(s => s.CustomerId).Distinct().Count(),
                    AverageOutstandingPerSale = allDebtors.Any() ? Math.Round(totalOutstanding / allDebtors.Count, 2) : 0,
                    AverageDaysOutstanding = Math.Round(avgDaysToPay, 0)
                },
                TopDebtors = topDebtors,
                AgeAnalysis = ageAnalysis,
                TimeSeries = timeSeries,
                RiskCategories = new
                {
                    HighRisk_Over90Days = allDebtors
                        .Where(s => (today - s.SaleDate).TotalDays > 90)
                        .Select(s => new
                        {
                            SaleId = s.Id,
                            CustomerId = s.CustomerId,
                            CustomerName = s.Customer.Name,
                            OutstandingAmount = s.TotalAmount - s.PaidAmount,
                            DaysOverdue = Math.Round((today - s.SaleDate).TotalDays, 0),
                            SaleDate = s.SaleDate
                        })
                        .OrderByDescending(s => s.DaysOverdue)
                        .ToList(),
                    MediumRisk_31_90Days = allDebtors
                        .Where(s => (today - s.SaleDate).TotalDays > 30 && (today - s.SaleDate).TotalDays <= 90)
                        .Count(),
                    LowRisk_0_30Days = allDebtors
                        .Where(s => (today - s.SaleDate).TotalDays <= 30)
                        .Count()
                }
            };

            return Ok(new
            {
                Pagination = paginationInfo,
                Metadata = metadata,
                Debtors = debtors
            });
        }

        [HttpGet("ProductAnalysis")]
        public async Task<IActionResult> GetProductAnalysis(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] Guid? productId,
            [FromQuery] Guid? productVariationId,
            [FromQuery] Guid? customerId,
            [FromQuery] string? customerName,
            [FromQuery] decimal? minQuantity,
            [FromQuery] decimal? maxQuantity,
            [FromQuery] decimal? minTotalPrice,
            [FromQuery] decimal? maxTotalPrice,
            [FromQuery] bool? includeUnpaid = true
        )
        {
            var query = _db.SalesItems
                .Include(si => si.Sale)
                    .ThenInclude(s => s.Customer)
                .Include(si => si.ProductVariation)
                    .ThenInclude(pv => pv.Product)
                .Include(si => si.ProductStorage)
                    .ThenInclude(ps => ps.ProductGeneric)
                .Where(si => !si.DeletedAt.HasValue && !si.Sale.DeletedAt.HasValue && (includeUnpaid == true || si.Sale.IsPaid))
                .OrderByDescending(si => si.Sale.SaleDate)
                .AsQueryable();

            // Apply filters
            if (startDate.HasValue)
            {
                query = query.Where(si => si.Sale.SaleDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(si => si.Sale.SaleDate <= endDate.Value);
            }

            if (productId.HasValue)
            {
                query = query.Where(si => si.ProductVariation.ProductId == productId.Value);
            }

            if (productVariationId.HasValue)
            {
                query = query.Where(si => si.ProductVariationId == productVariationId.Value);
            }

            if (customerId.HasValue)
            {
                query = query.Where(si => si.Sale.CustomerId == customerId.Value);
            }

            if (!string.IsNullOrEmpty(customerName))
            {
                query = query.Where(si => si.Sale.Customer != null && si.Sale.Customer.Name.Contains(customerName));
            }

            if (minQuantity.HasValue)
            {
                query = query.Where(si => si.Quantity >= minQuantity.Value);
            }

            if (maxQuantity.HasValue)
            {
                query = query.Where(si => si.Quantity <= maxQuantity.Value);
            }

            if (minTotalPrice.HasValue)
            {
                query = query.Where(si => si.TotalPrice >= minTotalPrice.Value);
            }

            if (maxTotalPrice.HasValue)
            {
                query = query.Where(si => si.TotalPrice <= maxTotalPrice.Value);
            }

            var salesItems = await query.ToListAsync();

            // Product-level aggregation
            var productSummary = salesItems
                .GroupBy(si => new
                {
                    ProductId = si.ProductVariation.ProductId,
                    ProductName = si.ProductVariation.Product.ProductName,
                    ProductCode = si.ProductVariation.Product.Id
                })
                .Select(g => new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    ProductCode = g.Key.ProductCode,
                    TotalQuantitySold = g.Sum(si => si.Quantity),
                    TotalSales = g.Sum(si => si.TotalPrice),
                    TotalProfit = g.Sum(si => si.ProfitMargin),
                    TransactionCount = g.Count(),
                    // UniqueCustomers = g.Select(si => si.Sale.CustomerId).Distinct().Count(),
                    UniqueCustomers = g.Where(si => si.Sale.CustomerId.HasValue)
                           .Select(si => si.Sale.CustomerId)
                           .Distinct()
                           .Count(),
                    AverageUnitPrice = Math.Round(g.Average(si => si.UnitPrice), 2),
                    AverageQuantityPerTransaction = Math.Round(g.Average(si => si.Quantity), 2),
                    MostRecentSale = g.Max(si => si.Sale.SaleDate),
                    OldestSale = g.Min(si => si.Sale.SaleDate),
                    // Top 3 variations for this product
                    TopVariations = g.GroupBy(si => new
                    {
                        si.ProductVariationId,
                        si.ProductVariation.Name,
                        si.ProductVariation.UnitSize,
                        si.ProductVariation.UnitofMeasure
                    })
                    .Select(vg => new
                    {
                        VariationId = vg.Key.ProductVariationId,
                        VariationName = vg.Key.Name,
                        UnitSize = vg.Key.UnitSize,
                        UnitOfMeasure = vg.Key.UnitofMeasure,
                        QuantitySold = vg.Sum(si => si.Quantity),
                        Sales = vg.Sum(si => si.TotalPrice)
                    })
                    .OrderByDescending(v => v.QuantitySold)
                    .Take(3)
                    .ToList()
                })
                .OrderByDescending(p => p.TotalSales)
                .ToList();

            // Variation-level aggregation
            var variationSummary = salesItems
                .GroupBy(si => new
                {
                    si.ProductVariationId,
                    VariationName = si.ProductVariation.Name,
                    ProductName = si.ProductVariation.Product.ProductName,
                    si.ProductVariation.UnitSize,
                    si.ProductVariation.UnitofMeasure,
                    si.ProductVariation.RetailPrice,
                    si.ProductVariation.CostPrice
                })
                .Select(g => new
                {
                    ProductVariationId = g.Key.ProductVariationId,
                    ProductName = g.Key.ProductName,
                    VariationName = g.Key.VariationName,
                    UnitSize = g.Key.UnitSize,
                    UnitOfMeasure = g.Key.UnitofMeasure,
                    RetailPrice = g.Key.RetailPrice,
                    CostPrice = g.Key.CostPrice,
                    TotalQuantitySold = g.Sum(si => si.Quantity),
                    TotalSales = g.Sum(si => si.TotalPrice),
                    TotalProfit = g.Sum(si => si.ProfitMargin),
                    TransactionCount = g.Count(),
                    AverageUnitPrice = Math.Round(g.Average(si => si.UnitPrice), 2),
                    ProfitMarginPercentage = Math.Round((g.Sum(si => si.ProfitMargin) / g.Sum(si => si.TotalPrice)) * 100, 2)
                })
                .OrderByDescending(v => v.TotalSales)
                .ToList();

            // Customer-level aggregation (top customers for filtered products)
            var customerSummary = salesItems
                .Where(si => si.Sale.Customer != null) // Only include sales with customers
                .GroupBy(si => new
                {
                    si.Sale.CustomerId,
                    CustomerName = si.Sale.Customer.Name,
                    CustomerPhone = si.Sale.Customer.Phone,
                    CustomerType = si.Sale.Customer.CustomerType
                })
                .Select(g => new
                {
                    CustomerId = g.Key.CustomerId,
                    CustomerName = g.Key.CustomerName,
                    CustomerPhone = g.Key.CustomerPhone,
                    CustomerType = g.Key.CustomerType,
                    TotalQuantityPurchased = g.Sum(si => si.Quantity),
                    TotalSpent = g.Sum(si => si.TotalPrice),
                    TransactionCount = g.Count(),
                    UniqueProducts = g.Select(si => si.ProductVariation.ProductId).Distinct().Count(),
                    AverageTransactionValue = Math.Round(g.Average(si => si.TotalPrice), 2),
                    LastPurchaseDate = g.Max(si => si.Sale.SaleDate),
                    FirstPurchaseDate = g.Min(si => si.Sale.SaleDate)
                })
                .OrderByDescending(c => c.TotalSpent)
                .Take(10)
                .ToList();

            // Time series analysis (daily aggregation)
            var timeSeries = salesItems
                .GroupBy(si => si.Sale.SaleDate.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    TotalQuantitySold = g.Sum(si => si.Quantity),
                    TotalSales = g.Sum(si => si.TotalPrice),
                    TotalProfit = g.Sum(si => si.ProfitMargin),
                    TransactionCount = g.Count(),
                    UniqueProducts = g.Select(si => si.ProductVariation.ProductId).Distinct().Count(),
                    AverageSaleValue = Math.Round(g.Average(si => si.TotalPrice), 2)
                })
                .OrderBy(t => t.Date)
                .ToList();

            // Overall summary
            var overallSummary = new
            {
                TotalQuantitySold = salesItems.Sum(si => si.Quantity),
                TotalSalesRevenue = salesItems.Sum(si => si.TotalPrice),
                TotalProfit = salesItems.Sum(si => si.ProfitMargin),
                TotalTransactions = salesItems.Count,
                UniqueProducts = salesItems.Select(si => si.ProductVariation.ProductId).Distinct().Count(),
                UniqueVariations = salesItems.Select(si => si.ProductVariationId).Distinct().Count(),
                // UniqueCustomers = salesItems.Select(si => si.Sale.CustomerId).Distinct().Count(),
                UniqueCustomers = salesItems.Where(si => si.Sale.CustomerId.HasValue)
                                 .Select(si => si.Sale.CustomerId)
                                 .Distinct()
                                 .Count(),
                AverageTransactionValue = salesItems.Any() ? Math.Round(salesItems.Average(si => si.TotalPrice), 2) : 0,
                AverageQuantityPerTransaction = salesItems.Any() ? Math.Round(salesItems.Average(si => si.Quantity), 2) : 0,
                OverallProfitMargin = salesItems.Sum(si => si.TotalPrice) > 0
                    ? Math.Round((salesItems.Sum(si => si.ProfitMargin) / salesItems.Sum(si => si.TotalPrice)) * 100, 2)
                    : 0,
                DateRange = new
                {
                    StartDate = salesItems.Any() ? salesItems.Min(si => si.Sale.SaleDate) : (DateTime?)null,
                    EndDate = salesItems.Any() ? salesItems.Max(si => si.Sale.SaleDate) : (DateTime?)null
                }
            };

            // Top performing products (by quantity)
            var topByQuantity = productSummary
                .OrderByDescending(p => p.TotalQuantitySold)
                .Take(5)
                .ToList();

            // Top performing products (by sales revenue)
            var topByRevenue = productSummary
                .OrderByDescending(p => p.TotalSales)
                .Take(5)
                .ToList();

            // Top performing products (by profit)
            var topByProfit = productSummary
                .OrderByDescending(p => p.TotalProfit)
                .Take(5)
                .ToList();

            var metadata = new
            {
                OverallSummary = overallSummary,
                ProductSummary = productSummary,
                VariationSummary = variationSummary,
                CustomerSummary = customerSummary,
                TimeSeries = timeSeries,
                TopPerformers = new
                {
                    ByQuantity = topByQuantity,
                    ByRevenue = topByRevenue,
                    ByProfit = topByProfit
                },
                Filters = new
                {
                    Applied = new
                    {
                        StartDate = startDate,
                        EndDate = endDate,
                        ProductId = productId,
                        ProductVariationId = productVariationId,
                        CustomerId = customerId,
                        CustomerName = customerName,
                        MinQuantity = minQuantity,
                        MaxQuantity = maxQuantity
                    }
                }
            };

            return Ok(new
            {
                Metadata = metadata,
                SalesItems = salesItems.Select(si => new
                {
                    si.Id,
                    si.SaleId,
                    si.ProductVariationId,
                    si.Quantity,
                    si.UnitPrice,
                    si.TotalPrice,
                    si.ProfitMargin,
                    Sale = new
                    {
                        si.Sale.Id,
                        si.Sale.SaleDate,
                        si.Sale.TotalAmount,
                        si.Sale.PaymentMethod,
                        Customer = si.Sale.Customer != null ? new
                        {
                            Id = si.Sale.Customer.Id,
                            Name = si.Sale.Customer.Name,
                            Phone = si.Sale.Customer.Phone,
                            CustomerType = si.Sale.Customer.CustomerType
                        } : null
                    },
                    Product = new
                    {
                        Id = si.ProductVariation.Product.Id,
                        Name = si.ProductVariation.Product.ProductName,
                        Code = si.ProductVariation.Product.Id,
                    },
                    ProductVariation = new
                    {
                        si.ProductVariation.Id,
                        si.ProductVariation.Name,
                        si.ProductVariation.UnitSize,
                        si.ProductVariation.UnitofMeasure,
                        si.ProductVariation.RetailPrice,
                        si.ProductVariation.CostPrice
                    }
                }).ToList()
            });
        }

        [HttpGet("Invoice/{id}")]
        public async Task<IActionResult> GetInvoice(Guid id)
        {
            var sale = await _db.Sales
                .Include(s => s.Customer)
                .Include(s => s.ProcessedBy)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.ProductVariation)
                        .ThenInclude(pv => pv.Product)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.ProductStorage)
                        .ThenInclude(ps => ps.ProductGeneric)
                .FirstOrDefaultAsync(s => s.Id == id);

            // Load the payments made towards this sale
            var payments = await _db.SalesDebtsTrackers
                .Where(dt => dt.SaleId == id && !dt.DeletedAt.HasValue)
                .ToListAsync();

            if (!sale.WasPartialPayment)
            {
                return BadRequest("Invoice generation is only available for sales with partial payments.");
            }

            if (sale == null) return NotFound();

            // Prepare invoice data
            var invoiceData = new
            {
                Sale = new
                {
                    sale.Id,
                    sale.SaleDate,
                    sale.TotalAmount,
                    sale.PaidAmount,
                    sale.OutstandingAmount,
                    sale.FinalAmount,
                    sale.ChangeAmount,
                    sale.PaymentMethod,
                    sale.IsPaid,
                    sale.IsCompleted,
                    sale.IsTaken,
                    sale.IsRefunded
                },
                Customer = sale.Customer,
                ProcessedBy = sale.ProcessedBy,
                Items = sale.SaleItems.Select(si => new
                {
                    si.Id,
                    si.Quantity,
                    si.UnitPrice,
                    si.TotalPrice,
                    Product = new
                    {
                        si.ProductVariation.Product.Id,
                        si.ProductVariation.Product.ProductName,
                    },
                    Variation = new
                    {
                        si.ProductVariation.Id,
                        si.ProductVariation.Name,
                        si.ProductVariation.UnitSize,
                        si.ProductVariation.UnitofMeasure
                    },
                    Generic = new
                    {
                        si.ProductStorage.ProductGeneric.Id,
                        si.ProductStorage.ProductGeneric.BatchNumber,
                        si.ProductStorage.ProductGeneric.ExpiryDate
                    }
                }).ToList(),
                payments = payments.Select(p => new
                {
                    p.Id,
                    p.PaidAmount,
                    p.DebtType,
                    p.PaymentMethod,
                    p.LinkedFinancialAccountId,
                    p.Description,
                    p.AddedAt
                }).ToList()
            };

            return Ok(invoiceData);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSale(Guid id)
        {
            var sale = await _db.Sales.FindAsync(id);

            if (sale == null) return NotFound();

            _db.SoftDelete(sale);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
