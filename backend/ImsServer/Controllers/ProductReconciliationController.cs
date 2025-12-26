using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.ProductX;
using ImsServer.Models.SaleX;
using ImsServer.Models.PurchaseX;
using ImsServer.Models.CapitalAccountX;
using ImsServer.Models.FinancialAccountX;
using AutoMapper;
using System.Text.RegularExpressions;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductReconciliationController : ControllerBase
    {
        private readonly DBContext _db;
        private readonly IMapper _mapper;
        private const string RECONCILIATION_TAG = "[RECONCILIATION]";

        public ProductReconciliationController(DBContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [HttpPost("reconcile")]
        public async Task<IActionResult> ReconcileProduct([FromBody] CreateReconciliationDto dto)
        {
            if (dto == null) return BadRequest("Payload required");

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                // Get the product storage
                var productStorage = await _db.ProductStorages
                    .Include(ps => ps.ProductVariation)
                    .Include(ps => ps.Store)
                    .Include(ps => ps.ProductGeneric)
                        .ThenInclude(pg => pg.Supplier)
                    .FirstOrDefaultAsync(ps => ps.Id == dto.ProductStorageId);

                if (productStorage == null)
                {
                    return BadRequest("Product storage not found");
                }

                var quantityBefore = productStorage.Quantity;
                var quantityDifference = dto.NewQuantity - quantityBefore;

                // Validate user
                var user = await _db.Users.FindAsync(dto.CreatedById);
                if (user == null)
                {
                    return BadRequest("User not found");
                }

                // Create audit trail entry
                var auditTrail = new ProductAuditTrail
                {
                    Id = Guid.NewGuid(),
                    ProductVariationId = productStorage.ProductVariationId,
                    ProductStorageId = productStorage.Id,
                    QuantityBefore = quantityBefore,
                    QuantityAfter = dto.NewQuantity,
                    Reason = dto.Reason,
                    Notes = dto.Notes,
                    CreatedById = dto.CreatedById
                };

                // Update the storage quantity
                productStorage.Quantity = dto.NewQuantity;

                Guid? saleId = null;
                Guid? purchaseId = null;
                Guid? capitalAccountId = null;

                if (quantityDifference < 0)
                {
                    // Quantity reduced - create sale and withdrawal
                    var quantityLost = Math.Abs(quantityDifference);
                    var costPrice = productStorage.ProductVariation.CostPrice;
                    var totalCost = quantityLost * costPrice;

                    // Create a sale for the lost stock
                    var reconciliationSale = new Sale
                    {
                        Id = Guid.NewGuid(),
                        CustomerId = null, // No customer for reconciliation
                        ProcessedById = dto.CreatedById,
                        SaleDate = DateTime.UtcNow,
                        TotalAmount = totalCost,
                        PaidAmount = 0, // No payment received for lost stock
                        ChangeAmount = 0,
                        OutstandingAmount = 0,
                        Discount = 0,
                        FinalAmount = totalCost,
                        Profit = 0, // No profit on lost stock
                        IsPaid = false,
                        IsRefunded = false,
                        IsTaken = false,
                        PaymentMethod = PaymentMethod.OTHER,
                        IsCompleted = true,
                        WasPartialPayment = false,
                        LinkedFinancialAccountId = null,
                        Notes = $"{RECONCILIATION_TAG} Stock reconciliation - {dto.Reason}. {dto.Notes ?? ""}"
                    };

                    _db.Sales.Add(reconciliationSale);

                    // Create sale item
                    var saleItem = new SalesItem
                    {
                        Id = Guid.NewGuid(),
                        SaleId = reconciliationSale.Id,
                        ProductVariationId = productStorage.ProductVariationId,
                        ProductStorageId = productStorage.Id,
                        Quantity = quantityLost,
                        UnitPrice = costPrice,
                        TotalPrice = totalCost,
                        ProfitMargin = 0
                    };

                    _db.SalesItems.Add(saleItem);
                    saleId = reconciliationSale.Id;

                    // Get default financial account or first available
                    var defaultAccount = await _db.FinancialAccounts
                        .Where(fa => fa.IsDefault && fa.IsActive)
                        .FirstOrDefaultAsync() 
                        ?? await _db.FinancialAccounts
                            .Where(fa => fa.IsActive)
                            .FirstOrDefaultAsync();

                    if (defaultAccount != null)
                    {
                        // Create capital account withdrawal
                        var withdrawal = new CapitalAccount
                        {
                            Id = Guid.NewGuid(),
                            OwnerId = dto.CreatedById,
                            Type = TransactionType.WITHDRAWAL,
                            Amount = totalCost,
                            TransactionDate = DateTime.UtcNow,
                            Description = $"{RECONCILIATION_TAG} Stock reconciliation withdrawal - {dto.Reason}. Product: {productStorage.ProductVariation.Name}, Quantity: {quantityLost}. {dto.Notes ?? ""}",
                            ReferenceNumber = $"RECON-{DateTime.UtcNow:yyyyMMddHHmmss}",
                            LinkedFinancialAccountId = defaultAccount.Id
                        };

                        _db.CapitalAccounts.Add(withdrawal);
                        capitalAccountId = withdrawal.Id;

                        // Deduct from financial account
                        defaultAccount.Balance -= totalCost;
                    }

                    auditTrail.ReconciliationSaleId = saleId;
                    auditTrail.ReconciliationCapitalAccountId = capitalAccountId;
                }
                else if (quantityDifference > 0)
                {
                    // Quantity increased - create purchase and investment
                    var quantityGained = quantityDifference;
                    var costPrice = productStorage.ProductVariation.CostPrice;
                    var totalCost = quantityGained * costPrice;

                    // Get default financial account or first available
                    var defaultAccount = await _db.FinancialAccounts
                        .Where(fa => fa.IsDefault && fa.IsActive)
                        .FirstOrDefaultAsync()
                        ?? await _db.FinancialAccounts
                            .Where(fa => fa.IsActive)
                            .FirstOrDefaultAsync();

                    if (defaultAccount == null)
                    {
                        await tran.RollbackAsync();
                        return BadRequest("No active financial account found. Please create a financial account first.");
                    }

                    // Create capital account investment
                    var investment = new CapitalAccount
                    {
                        Id = Guid.NewGuid(),
                        OwnerId = dto.CreatedById,
                        Type = TransactionType.ADDITIONAL_INVESTMENT,
                        Amount = totalCost,
                        TransactionDate = DateTime.UtcNow,
                        Description = $"{RECONCILIATION_TAG} Stock reconciliation investment - {dto.Reason}. Product: {productStorage.ProductVariation.Name}, Quantity: {quantityGained}. {dto.Notes ?? ""}",
                        ReferenceNumber = $"RECON-{DateTime.UtcNow:yyyyMMddHHmmss}",
                        LinkedFinancialAccountId = defaultAccount.Id
                    };

                    _db.CapitalAccounts.Add(investment);
                    capitalAccountId = investment.Id;

                    // Add to financial account
                    defaultAccount.Balance += totalCost;

                    // Get supplier from product generic or create default supplier
                    var supplier = productStorage.ProductGeneric?.Supplier;
                    if (supplier == null)
                    {
                        supplier = await _db.Suppliers
                            .Where(s => s.CompanyName == "Default Supplier")
                            .FirstOrDefaultAsync();

                        if (supplier == null)
                        {
                            await tran.RollbackAsync();
                            return BadRequest("No supplier found. Please ensure product has a supplier.");
                        }
                    }

                    // Create purchase for the gained stock
                    var reconciliationPurchase = new Purchase
                    {
                        Id = Guid.NewGuid(),
                        PurchaseNumber = $"RECON-{DateTime.UtcNow:yyyyMMddHHmmss}",
                        PurchaseDate = DateTime.UtcNow,
                        SupplierId = supplier.Id,
                        ProcessedBy = dto.CreatedById,
                        TotalAmount = totalCost,
                        Tax = 0,
                        GrandTotal = totalCost,
                        Notes = $"{RECONCILIATION_TAG} Stock reconciliation - {dto.Reason}. {dto.Notes ?? ""}",
                        IsPaid = true,
                        WasPartialPayment = false,
                        LinkedFinancialAccountId = defaultAccount.Id,
                        PaidAmount = totalCost,
                        OutstandingAmount = 0
                    };

                    _db.Purchases.Add(reconciliationPurchase);

                    // Create purchase item
                    var purchaseItem = new PurchaseItem
                    {
                        Id = Guid.NewGuid(),
                        PurchaseId = reconciliationPurchase.Id,
                        ProductVariationId = productStorage.ProductVariationId,
                        ProductGenericId = productStorage.ProductGenericId,
                        Quantity = quantityGained,
                        CostPrice = costPrice,
                        TotalPrice = totalCost,
                        IsAllocated = true // Mark as allocated since it's going to existing storage
                    };

                    _db.PurchaseItems.Add(purchaseItem);
                    purchaseId = reconciliationPurchase.Id;

                    // Deduct from financial account (payment for purchase)
                    defaultAccount.Balance -= totalCost;

                    auditTrail.ReconciliationPurchaseId = purchaseId;
                    auditTrail.ReconciliationCapitalAccountId = capitalAccountId;
                }

                // Save audit trail
                _db.ProductAuditTrails.Add(auditTrail);

                await _db.SaveChangesAsync();
                await tran.CommitAsync();

                // Return audit trail with related data
                var savedAuditTrail = await _db.ProductAuditTrails
                    .Include(pat => pat.ProductVariation)
                    .Include(pat => pat.ProductStorage)
                        .ThenInclude(ps => ps.Store)
                    .Include(pat => pat.CreatedBy)
                    .FirstOrDefaultAsync(pat => pat.Id == auditTrail.Id);

                var dtoResult = new ProductAuditTrailDto
                {
                    Id = savedAuditTrail.Id,
                    ProductVariationId = savedAuditTrail.ProductVariationId,
                    ProductStorageId = savedAuditTrail.ProductStorageId,
                    QuantityBefore = savedAuditTrail.QuantityBefore,
                    QuantityAfter = savedAuditTrail.QuantityAfter,
                    Reason = savedAuditTrail.Reason,
                    Notes = savedAuditTrail.Notes,
                    CreatedById = savedAuditTrail.CreatedById,
                    CreatedAt = savedAuditTrail.AddedAt,
                    ReconciliationSaleId = savedAuditTrail.ReconciliationSaleId,
                    ReconciliationPurchaseId = savedAuditTrail.ReconciliationPurchaseId,
                    ReconciliationCapitalAccountId = savedAuditTrail.ReconciliationCapitalAccountId,
                    ProductVariationName = savedAuditTrail.ProductVariation.Name,
                    StoreName = savedAuditTrail.ProductStorage.Store.Name,
                    CreatedByName = savedAuditTrail.CreatedBy.Username
                };

                return CreatedAtAction(nameof(GetAuditTrail), new { id = savedAuditTrail.Id }, dtoResult);
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = ex.Message, innerException = ex.InnerException?.Message });
            }
        }

        [HttpGet("audit-trail/{id}")]
        public async Task<IActionResult> GetAuditTrail(Guid id)
        {
            var auditTrail = await _db.ProductAuditTrails
                .Include(pat => pat.ProductVariation)
                .Include(pat => pat.ProductStorage)
                    .ThenInclude(ps => ps.Store)
                .Include(pat => pat.CreatedBy)
                .FirstOrDefaultAsync(pat => pat.Id == id);

            if (auditTrail == null)
            {
                return NotFound();
            }

            var dto = new ProductAuditTrailDto
            {
                Id = auditTrail.Id,
                ProductVariationId = auditTrail.ProductVariationId,
                ProductStorageId = auditTrail.ProductStorageId,
                QuantityBefore = auditTrail.QuantityBefore,
                QuantityAfter = auditTrail.QuantityAfter,
                Reason = auditTrail.Reason,
                Notes = auditTrail.Notes,
                CreatedById = auditTrail.CreatedById,
                CreatedAt = auditTrail.AddedAt,
                ReconciliationSaleId = auditTrail.ReconciliationSaleId,
                ReconciliationPurchaseId = auditTrail.ReconciliationPurchaseId,
                ReconciliationCapitalAccountId = auditTrail.ReconciliationCapitalAccountId,
                ProductVariationName = auditTrail.ProductVariation.Name,
                StoreName = auditTrail.ProductStorage.Store.Name,
                CreatedByName = auditTrail.CreatedBy.Username
            };

            return Ok(dto);
        }

        [HttpGet("audit-trail")]
        public async Task<IActionResult> GetAuditTrails(
            [FromQuery] Guid? productStorageId = null,
            [FromQuery] Guid? productVariationId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.ProductAuditTrails
                .Include(pat => pat.ProductVariation)
                .Include(pat => pat.ProductStorage)
                    .ThenInclude(ps => ps.Store)
                .Include(pat => pat.CreatedBy)
                .AsQueryable();

            if (productStorageId.HasValue)
            {
                query = query.Where(pat => pat.ProductStorageId == productStorageId.Value);
            }

            if (productVariationId.HasValue)
            {
                query = query.Where(pat => pat.ProductVariationId == productVariationId.Value);
            }

            var totalCount = await query.CountAsync();
            var auditTrails = await query
                .OrderByDescending(pat => pat.AddedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var dtos = auditTrails.Select(pat => new ProductAuditTrailDto
            {
                Id = pat.Id,
                ProductVariationId = pat.ProductVariationId,
                ProductStorageId = pat.ProductStorageId,
                QuantityBefore = pat.QuantityBefore,
                QuantityAfter = pat.QuantityAfter,
                Reason = pat.Reason,
                Notes = pat.Notes,
                CreatedById = pat.CreatedById,
                CreatedAt = pat.AddedAt,
                ReconciliationSaleId = pat.ReconciliationSaleId,
                ReconciliationPurchaseId = pat.ReconciliationPurchaseId,
                ReconciliationCapitalAccountId = pat.ReconciliationCapitalAccountId,
                ProductVariationName = pat.ProductVariation.Name,
                StoreName = pat.ProductStorage.Store.Name,
                CreatedByName = pat.CreatedBy.Username
            }).ToList();

            return Ok(new
            {
                data = dtos,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
    }
}

