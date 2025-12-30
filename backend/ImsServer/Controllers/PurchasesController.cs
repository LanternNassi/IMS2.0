using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.PurchaseX;
using ImsServer.Models.ProductX;
using ImsServer.Models.StoreX;
using ImsServer.Models.SupplierX;
using ImsServer.Models.PurchaseDebtX;
using ImsServer.Models.FinancialAccountX;


namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PurchasesController : ControllerBase
    {
        private readonly DBContext _db;

        public PurchasesController(DBContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetPurchases(
            [FromQuery] string? purchaseNumber,
            [FromQuery] DateTime? startPurchaseDate,
            [FromQuery] DateTime? endPurchaseDate,
            [FromQuery] Guid? supplierId,
            [FromQuery] Guid? processedBy,
            [FromQuery] decimal? maxTotalAmount,
            [FromQuery] decimal? minTotalAmount,
            [FromQuery] bool? isPaid,
            [FromQuery] bool includeMetadata = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.Purchases
                .Include(p => p.Supplier)
                .Include(p => p.PurchaseItems)
                    .ThenInclude(pi => pi.ProductVariation)
                .OrderByDescending(p => p.PurchaseDate)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(purchaseNumber))
            {
                query = query.Where(p => p.PurchaseNumber.Contains(purchaseNumber));
            }

            if (startPurchaseDate.HasValue)
            {
                query = query.Where(p => p.PurchaseDate >= startPurchaseDate.Value);
            }

            if (endPurchaseDate.HasValue)
            {
                query = query.Where(p => p.PurchaseDate <= endPurchaseDate.Value);
            }

            if (supplierId.HasValue)
            {
                query = query.Where(p => p.SupplierId == supplierId.Value);
            }

            if (processedBy.HasValue)
            {
                query = query.Where(p => p.ProcessedBy == processedBy.Value);
            }

            if (maxTotalAmount.HasValue)
            {
                query = query.Where(p => p.TotalAmount <= maxTotalAmount.Value);
            }

            if (minTotalAmount.HasValue)
            {
                query = query.Where(p => p.TotalAmount >= minTotalAmount.Value);
            }

            if (isPaid.HasValue)
            {
                query = query.Where(p => p.IsPaid == isPaid.Value);
            }

            // Filter out reconciliation purchases by default (purchases with [RECONCILIATION] tag in Notes)
            query = query.Where(p => p.Notes == null || !p.Notes.Contains("[RECONCILIATION]"));

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Validate and apply pagination
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : pageSize > 500 ? 500 : pageSize;

            var purchases = await query
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
                    Purchases = purchases
                });
            }

            // Calculate metadata (using all filtered data, not just current page)
            var allPurchases = await query.ToListAsync();
            var metadata = new
            {
                TotalAmount = allPurchases.Sum(p => p.TotalAmount),
                PaidAmount = allPurchases.Sum(p => p.PaidAmount),
                GrandTotal = allPurchases.Sum(p => p.GrandTotal),
                PaidPurchases = allPurchases.Count(p => p.IsPaid),
                TotalPurchases = allPurchases.Count,
                SupplierBreakdown = allPurchases
                    .GroupBy(p => new { p.SupplierId, p.Supplier.CompanyName })
                    .Select(g => new
                    {
                        SupplierId = g.Key.SupplierId,
                        SupplierName = g.Key.CompanyName,
                        Count = g.Count(),
                        TotalAmount = g.Sum(p => p.TotalAmount),
                        PaidAmount = g.Sum(p => p.PaidAmount),
                        GrandTotal = g.Sum(p => p.GrandTotal)
                    })
                    .OrderByDescending(s => s.Count)
                    .ToList()
            };

            return Ok(new
            {
                Pagination = paginationInfo,
                Metadata = metadata,
                Purchases = purchases
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPurchase(Guid id)
        {
            var purchase = await _db.Purchases
                .Include(p => p.Supplier)
                .Include(p => p.PurchaseItems)
                    .ThenInclude(pi => pi.ProductVariation)
                .Include(p => p.PurchaseItems)
                    .ThenInclude(pi => pi.ProductGeneric)
                .FirstOrDefaultAsync(p => p.Id == id && !p.DeletedAt.HasValue);

            if (purchase == null) return NotFound();

            return Ok(purchase);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePurchase([FromBody] CreatePurchaseDto dto)
        {
            if (dto == null) return BadRequest("payload required");

            // Validate supplier
            var supplier = await _db.Suppliers.FindAsync(dto.SupplierId);
            if (supplier == null)
            {
                return BadRequest("Supplier not found. Provide a valid SupplierId.");
            }

            // Validate user (ProcessedBy)
            if (dto.ProcessedBy == Guid.Empty)
            {
                return BadRequest("ProcessedBy user ID is required.");
            }

            var user = await _db.Users.FindAsync(dto.ProcessedBy);
            if (user == null)
            {
                return BadRequest("User not found. Provide a valid ProcessedBy user ID.");
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                AccountType? linkedAccountType = null;

                var purchase = new Purchase
                {
                    Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                    PurchaseNumber = dto.PurchaseNumber ?? Guid.NewGuid().ToString(),
                    PurchaseDate = dto.PurchaseDate == default ? DateTime.UtcNow : dto.PurchaseDate,
                    SupplierId = dto.SupplierId,
                    TotalAmount = dto.TotalAmount,
                    Tax = dto.Tax,
                    GrandTotal = dto.GrandTotal,
                    Notes = dto.Notes,
                    IsPaid = dto.PaidAmount >= dto.GrandTotal,
                    WasPartialPayment = dto.PaidAmount >= 0 && dto.PaidAmount < dto.GrandTotal,
                    LinkedFinancialAccountId = dto.LinkedFinancialAccountId,
                    PaidAmount = dto.PaidAmount,
                    OutstandingAmount = dto.GrandTotal - dto.PaidAmount,
                    ProcessedBy = dto.ProcessedBy,
                };

                _db.Purchases.Add(purchase);

                // process items
                foreach (var it in dto.Items ?? Enumerable.Empty<CreatePurchaseItemDto>())
                {
                    ProductVariation variation = null;

                    if (it.ProductVariationId != Guid.Empty)
                    {
                        variation = await _db.ProductVariations.FindAsync(it.ProductVariationId);
                    }
                    else if (it.ProductId != Guid.Empty)
                    {
                        variation = await _db.ProductVariations.FirstOrDefaultAsync(v => v.ProductId == it.ProductId);
                    }

                    if (variation == null)
                    {
                        // Skip or return error - we'll return error to inform client
                        await tran.RollbackAsync();
                        return BadRequest($"Product variation not found for item {it.Id}");
                    }

                    Guid? genericId = null;

                    // check if the product generic is provided and also exists
                    if (it.ProductGenericId.HasValue)
                    {
                        var existingGeneric = await _db.ProductGenerics
                            .FirstOrDefaultAsync(pg => pg.Id == it.ProductGenericId.Value);
                        if (existingGeneric != null)
                        {
                            genericId = existingGeneric.Id;
                            // Skip creating new generic
                            // continue;
                        }
                    }

                    if (it.HasGeneric && genericId == null)
                    {

                        // Load the product to establish the relationship
                        var product = await _db.Products
                            .Include(p => p.ProductGenerics)
                            .FirstOrDefaultAsync(p => p.Id == variation.ProductId);


                        if (product == null)
                        {
                            await tran.RollbackAsync();
                            return BadRequest($"Product not found for variation {it.ProductVariationId}");
                        }

                        if (genericId == null)
                        {
                            var generic = new ProductGeneric
                            {
                                // Id = Guid.NewGuid(),
                                ProductId = variation.ProductId,
                                ExpiryDate = it.ExpiryDateValue ?? DateTime.MinValue,
                                ManufactureDate = it.ManufactureDateValue ?? DateTime.MinValue,
                                BatchNumber = it.BatchNumber,
                                SupplierId = dto.SupplierId
                            };

                            // Add through the product's collection to auto-fill back relationship
                            product.ProductGenerics ??= new List<ProductGeneric>();
                            product.ProductGenerics.Add(generic);

                            // Save the generic first before creating purchase item
                            await _db.SaveChangesAsync();

                            genericId = generic.Id;
                        }


                    }


                    var purchaseItem = new PurchaseItem
                    {
                        Id = it.Id == Guid.Empty ? Guid.NewGuid() : it.Id,
                        PurchaseId = purchase.Id,
                        ProductVariationId = variation.Id,
                        ProductGenericId = genericId,
                        Quantity = it.Quantity,
                        CostPrice = it.BaseCostPrice,
                        TotalPrice = it.TotalPrice,
                        IsAllocated = false
                    };

                    _db.PurchaseItems.Add(purchaseItem);
                }

                // Update balance on Linked Financial Account if provided
                if (dto.LinkedFinancialAccountId.HasValue)
                {
                    var account = await _db.FinancialAccounts.FindAsync(dto.LinkedFinancialAccountId.Value);
                    if (account == null)
                    {
                        await tran.RollbackAsync();
                        return BadRequest("Linked financial account not found.");
                    }

                    linkedAccountType = account.Type;
                    
                    // Update account balance
                    if (dto.PaidAmount >= 0){
                        account.Balance -= purchase.PaidAmount;
                    }
                }

                // If purchase started as partial payment, record the initial payment in the tracker
                // so dated cash-out events are consistent for reporting.
                if (dto.PaidAmount > 0 && dto.PaidAmount < dto.GrandTotal)
                {
                    PaymentMethod inferredPaymentMethod = PaymentMethod.OTHER;

                    inferredPaymentMethod = linkedAccountType switch
                    {
                        AccountType.CASH => PaymentMethod.CASH,
                        AccountType.BANK => PaymentMethod.BANK_TRANSFER,
                        AccountType.MOBILE_MONEY => PaymentMethod.MOBILE_MONEY,
                        AccountType.SAVINGS => PaymentMethod.SAVINGS,
                        _ => PaymentMethod.OTHER
                    };

                    var initialPayment = new PurchaseDebtTracker
                    {
                        Id = Guid.NewGuid(),
                        PurchaseId = purchase.Id,
                        PaidAmount = dto.PaidAmount,
                        PaymentMethod = inferredPaymentMethod,
                        PaymentDate = purchase.PurchaseDate,
                        Description = string.IsNullOrWhiteSpace(dto.Notes) ? "Initial payment at purchase creation" : dto.Notes,
                        ReceivedById = dto.ProcessedBy,
                        LinkedFinancialAccountId = dto.LinkedFinancialAccountId
                    };

                    _db.PurchaseDebtTrackers.Add(initialPayment);
                }

                await _db.SaveChangesAsync();
                await tran.CommitAsync();

                return CreatedAtAction(nameof(GetPurchase), new { id = purchase.Id }, purchase);
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePurchase(Guid id, [FromBody] UpdatePurchaseDto dto)
        {
            var purchase = await _db.Purchases.Include(p => p.PurchaseItems).FirstOrDefaultAsync(p => p.Id == id);
            if (purchase == null) return NotFound();

            purchase.Notes = dto.Notes ?? purchase.Notes;
            purchase.IsPaid = dto.IsPaid;
            purchase.PaidAmount = dto.PaidAmount;
            purchase.TotalAmount = dto.TotalAmount;

            await _db.SaveChangesAsync();

            return Ok(purchase);
        }

        

        [HttpPut("Allocate/{id}")]
        public async Task<IActionResult> AllocatePurchaseItems(Guid id)
        {
            var purchase = await _db.Purchases
                 .Include(p => p.PurchaseItems)
                 .FirstOrDefaultAsync(p => p.Id == id);

            if (purchase == null) return NotFound();

            foreach (var item in purchase.PurchaseItems)
            {
                item.IsAllocated = true;
            }

            await _db.SaveChangesAsync();

            return Ok(purchase);
        }

        [HttpGet("Payables")]
        public async Task<IActionResult> GetPayables(
            [FromQuery] Guid? supplierId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] decimal? minOutstanding,
            [FromQuery] decimal? maxOutstanding,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.Purchases
                .Include(p => p.Supplier)
                .Include(p => p.PurchaseItems)
                    .ThenInclude(pi => pi.ProductVariation)
                .Where(p => !p.DeletedAt.HasValue && p.WasPartialPayment)
                .OrderByDescending(p => p.PurchaseDate)
                .AsQueryable();

            if (supplierId.HasValue)
                query = query.Where(p => p.SupplierId == supplierId.Value);
            if (startDate.HasValue)
                query = query.Where(p => p.PurchaseDate >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(p => p.PurchaseDate <= endDate.Value);

            var allPayables = await query.ToListAsync();

            if (minOutstanding.HasValue)
                allPayables = allPayables.Where(p => (p.GrandTotal - p.PaidAmount) >= minOutstanding.Value).ToList();
            if (maxOutstanding.HasValue)
                allPayables = allPayables.Where(p => (p.GrandTotal - p.PaidAmount) <= maxOutstanding.Value).ToList();

            var totalCount = allPayables.Count;
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : pageSize > 500 ? 500 : pageSize;
            var payables = allPayables
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
            var totalOutstanding = allPayables.Sum(p => p.GrandTotal - p.PaidAmount);
            var totalDebt = allPayables.Sum(p => p.GrandTotal);
            var totalPaidSoFar = allPayables.Sum(p => p.PaidAmount);
            var topSuppliers = allPayables
                .GroupBy(p => new { p.SupplierId, p.Supplier.CompanyName, p.Supplier.ContactPerson, p.Supplier.PhoneNumber })
                .Select(g => new
                {
                    SupplierId = g.Key.SupplierId,
                    SupplierName = g.Key.CompanyName,
                    ContactName = g.Key.ContactPerson,
                    SupplierPhone = g.Key.PhoneNumber,
                    TotalPurchases = g.Count(),
                    TotalDebt = g.Sum(p => p.GrandTotal),
                    TotalPaid = g.Sum(p => p.PaidAmount),
                    OutstandingAmount = g.Sum(p => p.GrandTotal - p.PaidAmount),
                    OldestDebtDate = g.Min(p => p.PurchaseDate),
                    MostRecentDebtDate = g.Max(p => p.PurchaseDate),
                    AverageDebtPerPurchase = g.Average(p => p.GrandTotal - p.PaidAmount)
                })
                .OrderByDescending(s => s.OutstandingAmount)
                .Take(5)
                .ToList();
            var timeSeries = allPayables
                .GroupBy(p => p.PurchaseDate.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    PurchasesCount = g.Count(),
                    TotalDebt = g.Sum(p => p.GrandTotal),
                    TotalPaid = g.Sum(p => p.PaidAmount),
                    OutstandingAmount = g.Sum(p => p.GrandTotal - p.PaidAmount),
                    AverageOutstanding = g.Average(p => p.GrandTotal - p.PaidAmount)
                })
                .OrderBy(t => t.Date)
                .ToList();
            var today = DateTime.UtcNow;
            var ageAnalysis = new
            {
                Current_0_30Days = allPayables
                    .Where(p => (today - p.PurchaseDate).TotalDays <= 30)
                    .Sum(p => p.GrandTotal - p.PaidAmount),
                Days_31_60 = allPayables
                    .Where(p => (today - p.PurchaseDate).TotalDays > 30 && (today - p.PurchaseDate).TotalDays <= 60)
                    .Sum(p => p.GrandTotal - p.PaidAmount),
                Days_61_90 = allPayables
                    .Where(p => (today - p.PurchaseDate).TotalDays > 60 && (today - p.PurchaseDate).TotalDays <= 90)
                    .Sum(p => p.GrandTotal - p.PaidAmount),
                Days_91_180 = allPayables
                    .Where(p => (today - p.PurchaseDate).TotalDays > 90 && (today - p.PurchaseDate).TotalDays <= 180)
                    .Sum(p => p.GrandTotal - p.PaidAmount),
                Over_180Days = allPayables
                    .Where(p => (today - p.PurchaseDate).TotalDays > 180)
                    .Sum(p => p.GrandTotal - p.PaidAmount)
            };
            var paymentRate = totalDebt > 0 ? (totalPaidSoFar / totalDebt) * 100 : 0;
            var avgDaysToPay = allPayables
                .Where(p => p.PaidAmount > 0)
                .Select(p => (today - p.PurchaseDate).TotalDays)
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
                    TotalPayablePurchases = allPayables.Count,
                    UniqueSuppliers = allPayables.Select(p => p.SupplierId).Distinct().Count(),
                    AverageOutstandingPerPurchase = allPayables.Any() ? Math.Round(totalOutstanding / allPayables.Count, 2) : 0,
                    AverageDaysOutstanding = Math.Round(avgDaysToPay, 0)
                },
                TopSuppliers = topSuppliers,
                AgeAnalysis = ageAnalysis,
                TimeSeries = timeSeries,
                RiskCategories = new
                {
                    HighRisk_Over90Days = allPayables
                        .Where(p => (today - p.PurchaseDate).TotalDays > 90)
                        .Select(p => new
                        {
                            PurchaseId = p.Id,
                            SupplierId = p.SupplierId,
                            SupplierName = p.Supplier.CompanyName,
                            OutstandingAmount = p.GrandTotal - p.PaidAmount,
                            DaysOverdue = Math.Round((today - p.PurchaseDate).TotalDays, 0),
                            PurchaseDate = p.PurchaseDate
                        })
                        .OrderByDescending(p => p.DaysOverdue)
                        .ToList(),
                    MediumRisk_31_90Days = allPayables
                        .Where(p => (today - p.PurchaseDate).TotalDays > 30 && (today - p.PurchaseDate).TotalDays <= 90)
                        .Count(),
                    LowRisk_0_30Days = allPayables
                        .Where(p => (today - p.PurchaseDate).TotalDays <= 30)
                        .Count()
                }
            };
            return Ok(new
            {
                Pagination = paginationInfo,
                Metadata = metadata,
                Payables = payables
            });
        }

        [HttpPost("ImportSupplierDebts")]
        public async Task<IActionResult> ImportSupplierDebts([FromBody] List<ImportSupplierDebtDto> debts)
        {
            if (debts == null || debts.Count == 0)
            {
                return BadRequest("No debt records provided");
            }

            var results = new List<ImportResult>();
            
            // Get first available user for ProcessedBy
            var defaultUser = await _db.Users.FirstOrDefaultAsync();
            if (defaultUser == null)
            {
                return BadRequest("No users found in the system. Please create a user first.");
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                foreach (var debtDto in debts)
                {
                    try
                    {
                        // Validate required fields
                        if (string.IsNullOrWhiteSpace(debtDto.SupplierName))
                        {
                            results.Add(new ImportResult
                            {
                                SupplierName = debtDto.SupplierName ?? "Unknown",
                                Success = false,
                                Message = "SupplierName is required"
                            });
                            continue;
                        }

                        if (debtDto.GrandTotal <= 0)
                        {
                            results.Add(new ImportResult
                            {
                                SupplierName = debtDto.SupplierName,
                                Success = false,
                                Message = "GrandTotal must be greater than 0"
                            });
                            continue;
                        }

                        // Calculate outstanding amount if not provided
                        var outstandingAmount = debtDto.OutstandingAmount ?? (debtDto.GrandTotal - (debtDto.PaidAmount ?? 0));
                        if (outstandingAmount < 0) outstandingAmount = 0;

                        // Find or create supplier
                        Supplier? supplier = await _db.Suppliers
                            .FirstOrDefaultAsync(s => s.CompanyName.ToLower().Trim() == debtDto.SupplierName.ToLower().Trim());

                        if (supplier == null)
                        {
                            // Create new supplier (AddedBy/LastUpdatedBy will be set automatically by DBContext)
                            supplier = new Supplier
                            {
                                Id = Guid.NewGuid(),
                                CompanyName = debtDto.SupplierName.Trim(),
                                ContactPerson = debtDto.ContactPerson,
                                EmailAddress = debtDto.EmailAddress,
                                PhoneNumber = debtDto.PhoneNumber ?? "",
                                Address = debtDto.Address ?? "",
                                TIN = debtDto.TIN,
                                MoreInfo = debtDto.MoreInfo,
                                Status = "Active"
                            };
                            _db.Suppliers.Add(supplier);
                            await _db.SaveChangesAsync(); // Save supplier first
                        }
                        else
                        {
                            // Update supplier info if provided and different
                            bool updated = false;
                            if (!string.IsNullOrWhiteSpace(debtDto.Address) && supplier.Address != debtDto.Address)
                            {
                                supplier.Address = debtDto.Address;
                                updated = true;
                            }
                            if (!string.IsNullOrWhiteSpace(debtDto.PhoneNumber) && supplier.PhoneNumber != debtDto.PhoneNumber)
                            {
                                supplier.PhoneNumber = debtDto.PhoneNumber;
                                updated = true;
                            }
                            if (!string.IsNullOrWhiteSpace(debtDto.EmailAddress) && supplier.EmailAddress != debtDto.EmailAddress)
                            {
                                supplier.EmailAddress = debtDto.EmailAddress;
                                updated = true;
                            }
                            if (!string.IsNullOrWhiteSpace(debtDto.ContactPerson) && supplier.ContactPerson != debtDto.ContactPerson)
                            {
                                supplier.ContactPerson = debtDto.ContactPerson;
                                updated = true;
                            }
                            if (updated)
                            {
                                // UpdatedAt/LastUpdatedBy will be set automatically by DBContext
                                await _db.SaveChangesAsync();
                            }
                        }

                        // Parse purchase date
                        DateTime purchaseDate;
                        if (debtDto.PurchaseDate == default)
                        {
                            purchaseDate = DateTime.UtcNow;
                        }
                        else
                        {
                            purchaseDate = debtDto.PurchaseDate;
                        }

                        // Calculate amounts
                        var totalAmount = debtDto.TotalAmount ?? debtDto.GrandTotal;
                        var tax = debtDto.Tax ?? 0;
                        var grandTotal = debtDto.GrandTotal;
                        var paidAmount = debtDto.PaidAmount ?? 0;
                        var isPaid = paidAmount >= grandTotal;

                        // Create purchase without items (AddedBy/LastUpdatedBy will be set automatically by DBContext)
                        var purchase = new Purchase
                        {
                            Id = Guid.NewGuid(),
                            PurchaseNumber = debtDto.PurchaseNumber ?? Guid.NewGuid().ToString(),
                            PurchaseDate = purchaseDate,
                            SupplierId = supplier.Id,
                            ProcessedBy = defaultUser.Id,
                            TotalAmount = totalAmount,
                            Tax = tax,
                            GrandTotal = grandTotal,
                            PaidAmount = paidAmount,
                            OutstandingAmount = outstandingAmount,
                            IsPaid = isPaid,
                            WasPartialPayment = paidAmount > 0 && paidAmount < grandTotal,
                            LinkedFinancialAccountId = null,
                            Notes = debtDto.Notes ?? "Imported from external system"
                        };

                        _db.Purchases.Add(purchase);

                        // If there was an initial payment, record it in the debt tracker
                        if (paidAmount > 0 && paidAmount < grandTotal)
                        {
                            var initialPayment = new PurchaseDebtTracker
                            {
                                Id = Guid.NewGuid(),
                                PurchaseId = purchase.Id,
                                PaidAmount = paidAmount,
                                PaymentMethod = PaymentMethod.OTHER,
                                PaymentDate = purchaseDate,
                                Description = debtDto.Notes ?? "Initial payment at import",
                                ReceivedById = defaultUser.Id,
                                LinkedFinancialAccountId = null
                            };

                            _db.PurchaseDebtTrackers.Add(initialPayment);
                        }

                        await _db.SaveChangesAsync();

                        results.Add(new ImportResult
                        {
                            SupplierName = debtDto.SupplierName,
                            PurchaseId = purchase.Id,
                            Success = true,
                            Message = "Successfully imported"
                        });
                    }
                    catch (Exception ex)
                    {
                        results.Add(new ImportResult
                        {
                            SupplierName = debtDto.SupplierName ?? "Unknown",
                            Success = false,
                            Message = $"Error: {ex.Message}"
                        });
                    }
                }

                await tran.CommitAsync();

                var successCount = results.Count(r => r.Success);
                var failureCount = results.Count(r => !r.Success);

                return Ok(new
                {
                    TotalProcessed = debts.Count,
                    SuccessCount = successCount,
                    FailureCount = failureCount,
                    Results = results
                });
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = $"Import failed: {ex.Message}", innerException = ex.InnerException?.Message });
            }
        }
    }

    // DTOs for import
    public class ImportSupplierDebtDto
    {
        public string SupplierName { get; set; } = string.Empty;
        public DateTime PurchaseDate { get; set; }
        public decimal GrandTotal { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? Tax { get; set; }
        public decimal? PaidAmount { get; set; }
        public decimal? OutstandingAmount { get; set; }
        public string? PurchaseNumber { get; set; }
        public string? ContactPerson { get; set; }
        public string? EmailAddress { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? TIN { get; set; }
        public string? MoreInfo { get; set; }
        public string? Notes { get; set; }
    }

    
}
