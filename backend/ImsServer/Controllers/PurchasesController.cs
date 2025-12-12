using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.PurchaseX;
using ImsServer.Models.ProductX;
using ImsServer.Models.StoreX;
using ImsServer.Models.SupplierX;

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
                    IsPaid = dto.IsPaid,
                    PaidAmount = dto.PaidAmount,
                    ProcessedBy = dto.ProcessedBy
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
    }
}
