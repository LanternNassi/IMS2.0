using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.SaleX;
using ImsServer.Models.ProductX;
using ImsServer.Models.CustomerX;

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
            [FromQuery] bool includeMetadata = false)
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

            var sales = await query.ToListAsync();

            if (!includeMetadata)
            {
                return Ok(sales);
            }

            // Calculate metadata
            var metadata = new
            {
                TotalAmount = sales.Sum(s => s.TotalAmount),
                PaidAmount = sales.Sum(s => s.PaidAmount),
                FinalAmount = sales.Sum(s => s.FinalAmount),
                TotalProfit = sales.Sum(s => s.Profit),
                OutstandingAmount = sales.Sum(s => s.OutstandingAmount),
                PaidSales = sales.Count(s => s.IsPaid),
                CompletedSales = sales.Count(s => s.IsCompleted),
                TotalSales = sales.Count,
                // CustomerBreakdown = sales
                //     .GroupBy(s => new { s.CustomerId, s.Customer.Name })
                //     .Select(g => new
                //     {
                //         CustomerId = g.Key.CustomerId,
                //         CustomerName = g.Key.Name,
                //         Count = g.Count(),
                //         TotalAmount = g.Sum(s => s.TotalAmount),
                //         PaidAmount = g.Sum(s => s.PaidAmount),
                //         FinalAmount = g.Sum(s => s.FinalAmount)
                //     })
                //     .OrderByDescending(c => c.Count)
                //     .ToList(),
                PaymentMethodBreakdown = sales
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

        [HttpPost]
        public async Task<IActionResult> CreateSale([FromBody] CreateSaleDto dto)
        {
            if (dto == null) return BadRequest("Payload required");

            // Validate customer
            var customer = await _db.Customers.FindAsync(dto.CustomerId);
            if (customer == null)
            {
                return BadRequest("Customer not found. Provide a valid CustomerId.");
            }

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
                    OutstandingAmount = dto.OutstandingAmount ?? 0,
                    Discount = dto.Discount,
                    FinalAmount = dto.FinalAmount,
                    Profit = 0, // Will calculate from items
                    IsPaid = dto.IsPaid,
                    IsRefunded = false,
                    IsTaken = dto.IsTaken,
                    PaymentMethod = dto.PaymentMethod,
                    IsCompleted = dto.IsCompleted
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
