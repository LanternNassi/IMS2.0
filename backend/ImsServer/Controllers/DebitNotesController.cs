using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.DebitNoteX;
using ImsServer.Models.PurchaseX;
using ImsServer.Models.SupplierX;
using ImsServer.Models.CustomerX;
using ImsServer.Models.SaleX;
using ImsServer.Models.FinancialAccountX;
using ImsServer.Models.PurchaseDebtX;
using ImsServer.Models.SalesDebtsTrackerX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DebitNotesController : ControllerBase
    {
        private readonly DBContext _db;

        public DebitNotesController(DBContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetDebitNotes(
            [FromQuery] Guid? supplierId,
            [FromQuery] Guid? customerId,
            [FromQuery] Guid? purchaseId,
            [FromQuery] Guid? saleId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] DebitNoteStatus? status,
            [FromQuery] DebitNoteReason? reason,
            [FromQuery] decimal? minAmount,
            [FromQuery] decimal? maxAmount,
            [FromQuery] bool includeMetadata = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.DebitNotes
                .Include(dn => dn.Supplier)
                .Include(dn => dn.Customer)
                .Include(dn => dn.ProcessedBy)
                .Include(dn => dn.Purchase)
                .Include(dn => dn.Sale)
                .Include(dn => dn.DebitNoteItems)
                .OrderByDescending(dn => dn.DebitNoteDate)
                .AsQueryable();

            // Apply filters
            if (supplierId.HasValue)
            {
                query = query.Where(dn => dn.SupplierId == supplierId.Value);
            }

            if (customerId.HasValue)
            {
                query = query.Where(dn => dn.CustomerId == customerId.Value);
            }

            if (purchaseId.HasValue)
            {
                query = query.Where(dn => dn.PurchaseId == purchaseId.Value);
            }

            if (saleId.HasValue)
            {
                query = query.Where(dn => dn.SaleId == saleId.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(dn => dn.DebitNoteDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(dn => dn.DebitNoteDate <= endDate.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(dn => dn.Status == status.Value);
            }

            if (reason.HasValue)
            {
                query = query.Where(dn => dn.Reason == reason.Value);
            }

            if (minAmount.HasValue)
            {
                query = query.Where(dn => dn.TotalAmount >= minAmount.Value);
            }

            if (maxAmount.HasValue)
            {
                query = query.Where(dn => dn.TotalAmount <= maxAmount.Value);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Validate and apply pagination
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : pageSize > 500 ? 500 : pageSize;

            var debitNotes = await query
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
                    DebitNotes = debitNotes
                });
            }

            // Calculate metadata
            var allDebitNotes = await query.ToListAsync();
            var metadata = new
            {
                TotalAmount = allDebitNotes.Sum(dn => dn.TotalAmount),
                TotalCount = allDebitNotes.Count,
                AppliedCount = allDebitNotes.Count(dn => dn.IsApplied),
                PendingCount = allDebitNotes.Count(dn => dn.Status == DebitNoteStatus.Pending),
                PaidCount = allDebitNotes.Count(dn => dn.Status == DebitNoteStatus.Paid),
                ByReason = allDebitNotes
                    .GroupBy(dn => dn.Reason)
                    .Select(g => new
                    {
                        Reason = g.Key.ToString(),
                        Count = g.Count(),
                        TotalAmount = g.Sum(dn => dn.TotalAmount)
                    })
                    .ToList(),
                ByStatus = allDebitNotes
                    .GroupBy(dn => dn.Status)
                    .Select(g => new
                    {
                        Status = g.Key.ToString(),
                        Count = g.Count(),
                        TotalAmount = g.Sum(dn => dn.TotalAmount)
                    })
                    .ToList()
            };

            return Ok(new
            {
                Pagination = paginationInfo,
                Metadata = metadata,
                DebitNotes = debitNotes
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDebitNote(Guid id)
        {
            var debitNote = await _db.DebitNotes
                .Include(dn => dn.Supplier)
                .Include(dn => dn.Customer)
                .Include(dn => dn.ProcessedBy)
                .Include(dn => dn.Purchase)
                    .ThenInclude(p => p != null ? p.Supplier : null)
                .Include(dn => dn.Sale)
                    .ThenInclude(s => s != null ? s.Customer : null)
                .Include(dn => dn.DebitNoteItems)
                .Include(dn => dn.LinkedFinancialAccount)
                .FirstOrDefaultAsync(dn => dn.Id == id && !dn.DeletedAt.HasValue);

            if (debitNote == null) return NotFound();

            return Ok(debitNote);
        }

        [HttpPost]
        public async Task<IActionResult> CreateDebitNote([FromBody] CreateDebitNoteDto dto)
        {
            if (dto == null) return BadRequest("Payload required");

            // Validate that either supplier or customer is provided (but not both)
            if (!dto.SupplierId.HasValue && !dto.CustomerId.HasValue)
            {
                return BadRequest("Either SupplierId or CustomerId must be provided.");
            }

            if (dto.SupplierId.HasValue && dto.CustomerId.HasValue)
            {
                return BadRequest("Cannot provide both SupplierId and CustomerId. Provide only one.");
            }

            // Validate supplier if provided
            if (dto.SupplierId.HasValue)
            {
                var supplier = await _db.Suppliers.FindAsync(dto.SupplierId.Value);
                if (supplier == null)
                {
                    return BadRequest("Supplier not found. Provide a valid SupplierId.");
                }
            }

            // Validate customer if provided
            if (dto.CustomerId.HasValue)
            {
                var customer = await _db.Customers.FindAsync(dto.CustomerId.Value);
                if (customer == null)
                {
                    return BadRequest("Customer not found. Provide a valid CustomerId.");
                }
            }

            // Validate user
            var user = await _db.Users.FindAsync(dto.ProcessedById);
            if (user == null)
            {
                return BadRequest("User not found. Provide a valid ProcessedById.");
            }

            // Validate purchase if provided (only for supplier debit notes)
            if (dto.PurchaseId.HasValue)
            {
                if (!dto.SupplierId.HasValue)
                {
                    return BadRequest("PurchaseId can only be provided for supplier debit notes.");
                }
                var purchase = await _db.Purchases.FindAsync(dto.PurchaseId.Value);
                if (purchase == null)
                {
                    return BadRequest("Purchase not found. Provide a valid PurchaseId or leave it null.");
                }
            }

            // Validate sale if provided (only for customer debit notes)
            if (dto.SaleId.HasValue)
            {
                if (!dto.CustomerId.HasValue)
                {
                    return BadRequest("SaleId can only be provided for customer debit notes.");
                }
                var sale = await _db.Sales.FindAsync(dto.SaleId.Value);
                if (sale == null)
                {
                    return BadRequest("Sale not found. Provide a valid SaleId or leave it null.");
                }
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                // Generate debit note number if not provided
                var debitNoteNumber = dto.DebitNoteNumber;
                if (string.IsNullOrWhiteSpace(debitNoteNumber))
                {
                    debitNoteNumber = await GenerateDebitNoteNumberAsync();
                }

                var debitNote = new DebitNote
                {
                    Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                    DebitNoteNumber = debitNoteNumber,
                    DebitNoteDate = dto.DebitNoteDate == default ? DateTime.UtcNow : dto.DebitNoteDate,
                    PurchaseId = dto.PurchaseId,
                    SaleId = dto.SaleId,
                    SupplierId = dto.SupplierId,
                    CustomerId = dto.CustomerId,
                    ProcessedById = dto.ProcessedById,
                    TotalAmount = dto.TotalAmount,
                    TaxAmount = dto.TaxAmount,
                    SubTotal = dto.SubTotal,
                    Reason = dto.Reason,
                    Description = dto.Description,
                    Notes = dto.Notes,
                    Status = DebitNoteStatus.Pending,
                    IsApplied = false,
                    LinkedFinancialAccountId = dto.LinkedFinancialAccountId
                };

                _db.DebitNotes.Add(debitNote);
                await _db.SaveChangesAsync();

                // Add debit note to purchase's collection if linked to a purchase
                if (dto.PurchaseId.HasValue)
                {
                    var purchase = await _db.Purchases
                        .Include(p => p.DebitNotes)
                        .FirstOrDefaultAsync(p => p.Id == dto.PurchaseId.Value);
                    
                    if (purchase != null)
                    {
                        purchase.DebitNotes ??= new List<DebitNote>();
                        purchase.DebitNotes.Add(debitNote);
                        await _db.SaveChangesAsync();
                    }
                }

                // Add debit note to sale's collection if linked to a sale
                if (dto.SaleId.HasValue)
                {
                    var sale = await _db.Sales
                        .Include(s => s.DebitNotes)
                        .FirstOrDefaultAsync(s => s.Id == dto.SaleId.Value);
                    
                    if (sale != null)
                    {
                        sale.DebitNotes ??= new List<DebitNote>();
                        sale.DebitNotes.Add(debitNote);
                        await _db.SaveChangesAsync();
                    }
                }

                // Add items
                foreach (var itemDto in dto.Items ?? Enumerable.Empty<CreateDebitNoteItemDto>())
                {
                    var item = new DebitNoteItem
                    {
                        Id = itemDto.Id == Guid.Empty ? Guid.NewGuid() : itemDto.Id,
                        DebitNoteId = debitNote.Id,
                        ProductVariationId = itemDto.ProductVariationId,
                        ProductName = itemDto.ProductName,
                        Description = itemDto.Description,
                        Quantity = itemDto.Quantity,
                        UnitPrice = itemDto.UnitPrice,
                        TotalPrice = itemDto.TotalPrice,
                        TaxAmount = itemDto.TaxAmount,
                        PurchaseItemId = itemDto.PurchaseItemId,
                        SaleItemId = itemDto.SaleItemId
                    };

                    _db.DebitNoteItems.Add(item);
                }

                await _db.SaveChangesAsync();

                // Apply to balance if requested
                string? applicationMessage = null;
                if (dto.ApplyToBalance)
                {
                    applicationMessage = await ApplyDebitNoteToBalanceAsync(debitNote.Id, dto.PurchaseId, dto.SaleId);
                }

                await tran.CommitAsync();

                // Reload with includes
                var createdDebitNote = await _db.DebitNotes
                    .Include(dn => dn.Supplier)
                    .Include(dn => dn.Customer)
                    .Include(dn => dn.ProcessedBy)
                    .Include(dn => dn.Purchase)
                    .Include(dn => dn.Sale)
                    .Include(dn => dn.DebitNoteItems)
                    .FirstOrDefaultAsync(dn => dn.Id == debitNote.Id);

                return CreatedAtAction(nameof(GetDebitNote), new { id = debitNote.Id }, new
                {
                    DebitNote = createdDebitNote,
                    ApplicationMessage = applicationMessage
                });
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = $"Error creating debit note: {ex.Message}", innerException = ex.InnerException?.Message });
            }
        }

        [HttpPost("{id}/Apply")]
        public async Task<IActionResult> ApplyDebitNote(Guid id, [FromBody] ApplyDebitNoteDto? dto = null)
        {
            var debitNote = await _db.DebitNotes
                .Include(dn => dn.Supplier)
                .Include(dn => dn.Customer)
                .Include(dn => dn.Purchase)
                .Include(dn => dn.Sale)
                .FirstOrDefaultAsync(dn => dn.Id == id && !dn.DeletedAt.HasValue);

            if (debitNote == null) return NotFound();

            if (debitNote.IsApplied)
            {
                return BadRequest("Debit note has already been applied.");
            }

            if (debitNote.Status == DebitNoteStatus.Cancelled)
            {
                return BadRequest("Cannot apply a cancelled debit note.");
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                var applicationMessage = await ApplyDebitNoteToBalanceAsync(debitNote.Id, dto?.PurchaseId, dto?.SaleId);

                await tran.CommitAsync();

                // Reload with includes
                var updatedDebitNote = await _db.DebitNotes
                    .Include(dn => dn.Supplier)
                    .Include(dn => dn.Customer)
                    .Include(dn => dn.ProcessedBy)
                    .Include(dn => dn.Purchase)
                    .Include(dn => dn.Sale)
                    .Include(dn => dn.DebitNoteItems)
                    .FirstOrDefaultAsync(dn => dn.Id == debitNote.Id);

                return Ok(new
                {
                    DebitNote = updatedDebitNote,
                    ApplicationMessage = applicationMessage
                });
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = $"Error applying debit note: {ex.Message}", innerException = ex.InnerException?.Message });
            }
        }

        [HttpPost("{id}/Pay")]
        public async Task<IActionResult> PayDebitNote(Guid id)
        {
            var debitNote = await _db.DebitNotes
                .Include(dn => dn.LinkedFinancialAccount)
                .FirstOrDefaultAsync(dn => dn.Id == id && !dn.DeletedAt.HasValue);

            if (debitNote == null) return NotFound();

            if (debitNote.Status == DebitNoteStatus.Paid)
            {
                return BadRequest("Debit note has already been paid.");
            }

            if (!debitNote.IsApplied)
            {
                return BadRequest("Debit note must be applied before it can be paid.");
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                // Update financial account if linked
                if (debitNote.LinkedFinancialAccountId.HasValue && debitNote.LinkedFinancialAccount != null)
                {
                    debitNote.LinkedFinancialAccount.Balance -= debitNote.TotalAmount;
                }

                debitNote.Status = DebitNoteStatus.Paid;

                await _db.SaveChangesAsync();
                await tran.CommitAsync();

                return Ok(debitNote);
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = $"Error paying debit note: {ex.Message}", innerException = ex.InnerException?.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDebitNote(Guid id, [FromBody] CreateDebitNoteDto dto)
        {
            var debitNote = await _db.DebitNotes
                .Include(dn => dn.DebitNoteItems)
                .FirstOrDefaultAsync(dn => dn.Id == id && !dn.DeletedAt.HasValue);

            if (debitNote == null) return NotFound();

            if (debitNote.IsApplied)
            {
                return BadRequest("Cannot update an applied debit note.");
            }

            if (debitNote.Status == DebitNoteStatus.Cancelled)
            {
                return BadRequest("Cannot update a cancelled debit note.");
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                // Update debit note properties
                debitNote.DebitNoteDate = dto.DebitNoteDate;
                debitNote.PurchaseId = dto.PurchaseId;
                debitNote.SaleId = dto.SaleId;
                debitNote.SupplierId = dto.SupplierId;
                debitNote.CustomerId = dto.CustomerId;
                debitNote.TotalAmount = dto.TotalAmount;
                debitNote.TaxAmount = dto.TaxAmount;
                debitNote.SubTotal = dto.SubTotal;
                debitNote.Reason = dto.Reason;
                debitNote.Description = dto.Description;
                debitNote.Notes = dto.Notes;
                debitNote.LinkedFinancialAccountId = dto.LinkedFinancialAccountId;

                // Remove existing items
                _db.DebitNoteItems.RemoveRange(debitNote.DebitNoteItems);

                // Add new items
                foreach (var itemDto in dto.Items ?? Enumerable.Empty<CreateDebitNoteItemDto>())
                {
                    var item = new DebitNoteItem
                    {
                        Id = itemDto.Id == Guid.Empty ? Guid.NewGuid() : itemDto.Id,
                        DebitNoteId = debitNote.Id,
                        ProductVariationId = itemDto.ProductVariationId,
                        ProductName = itemDto.ProductName,
                        Description = itemDto.Description,
                        Quantity = itemDto.Quantity,
                        UnitPrice = itemDto.UnitPrice,
                        TotalPrice = itemDto.TotalPrice,
                        TaxAmount = itemDto.TaxAmount,
                        PurchaseItemId = itemDto.PurchaseItemId,
                        SaleItemId = itemDto.SaleItemId
                    };

                    _db.DebitNoteItems.Add(item);
                }

                await _db.SaveChangesAsync();
                await tran.CommitAsync();

                // Reload with includes
                var updatedDebitNote = await _db.DebitNotes
                    .Include(dn => dn.Supplier)
                    .Include(dn => dn.Customer)
                    .Include(dn => dn.ProcessedBy)
                    .Include(dn => dn.Purchase)
                    .Include(dn => dn.Sale)
                    .Include(dn => dn.DebitNoteItems)
                    .FirstOrDefaultAsync(dn => dn.Id == debitNote.Id);

                return Ok(updatedDebitNote);
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = $"Error updating debit note: {ex.Message}", innerException = ex.InnerException?.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDebitNote(Guid id)
        {
            var debitNote = await _db.DebitNotes
                .FirstOrDefaultAsync(dn => dn.Id == id && !dn.DeletedAt.HasValue);

            if (debitNote == null) return NotFound();

            if (debitNote.IsApplied)
            {
                return BadRequest("Cannot delete an applied debit note. Cancel it instead.");
            }

            _db.SoftDelete(debitNote);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/Cancel")]
        public async Task<IActionResult> CancelDebitNote(Guid id)
        {
            var debitNote = await _db.DebitNotes
                .FirstOrDefaultAsync(dn => dn.Id == id && !dn.DeletedAt.HasValue);

            if (debitNote == null) return NotFound();

            if (debitNote.IsApplied)
            {
                return BadRequest("Cannot cancel an applied debit note.");
            }

            if (debitNote.Status == DebitNoteStatus.Cancelled)
            {
                return BadRequest("Debit note is already cancelled.");
            }

            debitNote.Status = DebitNoteStatus.Cancelled;
            await _db.SaveChangesAsync();

            return Ok(debitNote);
        }

        // Helper methods
        private async Task<string> GenerateDebitNoteNumberAsync()
        {
            var year = DateTime.UtcNow.Year;
            var lastNote = await _db.DebitNotes
                .Where(dn => dn.DebitNoteNumber.StartsWith($"DN-{year}-"))
                .OrderByDescending(dn => dn.DebitNoteNumber)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastNote != null)
            {
                var parts = lastNote.DebitNoteNumber.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out int lastNum))
                {
                    nextNumber = lastNum + 1;
                }
            }

            return $"DN-{year}-{nextNumber:D3}";
        }

        private async Task<string> ApplyDebitNoteToBalanceAsync(Guid debitNoteId, Guid? specificPurchaseId = null, Guid? specificSaleId = null)
        {
            var debitNote = await _db.DebitNotes
                .Include(dn => dn.Supplier)
                .Include(dn => dn.Customer)
                .Include(dn => dn.Purchase)
                .Include(dn => dn.Sale)
                .Include(dn => dn.LinkedFinancialAccount)
                .FirstOrDefaultAsync(dn => dn.Id == debitNoteId);

            if (debitNote == null) throw new Exception("Debit note not found");

            var debitAmount = debitNote.TotalAmount;
            var appliedPurchases = new List<(Guid PurchaseId, decimal Amount)>();
            var appliedSales = new List<(Guid SaleId, decimal Amount)>();
            var appliedPurchaseIds = new List<string>();
            var appliedSaleIds = new List<string>();

            // Handle supplier debit notes
            if (debitNote.SupplierId.HasValue)
            {
                // If linked to a specific purchase, apply to that purchase first
                if (specificPurchaseId.HasValue || debitNote.PurchaseId.HasValue)
                {
                    var purchaseId = specificPurchaseId ?? debitNote.PurchaseId.Value;
                    var purchase = await _db.Purchases
                        .Include(p => p.Supplier)
                        .FirstOrDefaultAsync(p => p.Id == purchaseId);

                    if (purchase != null && purchase.SupplierId == debitNote.SupplierId)
                    {
                        // Increase outstanding amount
                        purchase.OutstandingAmount += debitAmount;
                        purchase.GrandTotal += debitAmount;
                        purchase.TotalAmount += debitNote.SubTotal;
                        purchase.Tax += debitNote.TaxAmount;

                        appliedPurchases.Add((purchase.Id, debitAmount));
                        appliedPurchaseIds.Add(purchase.PurchaseNumber);

                        // Update IsPaid status
                        if (purchase.OutstandingAmount > 0)
                        {
                            purchase.IsPaid = false;
                            purchase.WasPartialPayment = true;
                        }

                        await _db.SaveChangesAsync();
                    }
                }
                else
                {
                    // Apply to existing outstanding purchases (FIFO - oldest first)
                    var outstandingPurchases = await _db.Purchases
                        .Where(p => p.SupplierId == debitNote.SupplierId &&
                                   p.OutstandingAmount > 0 &&
                                   !p.DeletedAt.HasValue)
                        .OrderBy(p => p.PurchaseDate)
                        .ToListAsync();

                    var remainingDebit = debitAmount;
                    foreach (var purchase in outstandingPurchases)
                    {
                        if (remainingDebit <= 0) break;

                        var appliedAmount = remainingDebit;
                        purchase.OutstandingAmount += appliedAmount;
                        purchase.GrandTotal += appliedAmount;
                        purchase.TotalAmount += debitNote.SubTotal;
                        purchase.Tax += debitNote.TaxAmount;
                        purchase.IsPaid = false;
                        purchase.WasPartialPayment = true;

                        appliedPurchases.Add((purchase.Id, appliedAmount));
                        appliedPurchaseIds.Add(purchase.PurchaseNumber);
                        remainingDebit -= appliedAmount;
                    }

                    if (outstandingPurchases.Any())
                    {
                        await _db.SaveChangesAsync();
                    }
                    // If no outstanding purchases exist, the debit note itself represents the additional amount owed
                    // This will be tracked in payables queries by including debit notes
                }
            }
            // Handle customer debit notes
            else if (debitNote.CustomerId.HasValue)
            {
                // If linked to a specific sale, apply to that sale first
                if (specificSaleId.HasValue || debitNote.SaleId.HasValue)
                {
                    var saleId = specificSaleId ?? debitNote.SaleId.Value;
                    var sale = await _db.Sales
                        .Include(s => s.Customer)
                        .FirstOrDefaultAsync(s => s.Id == saleId);

                    if (sale != null && sale.CustomerId == debitNote.CustomerId)
                    {
                        // Increase outstanding amount (customer owes more)
                        sale.OutstandingAmount = (sale.OutstandingAmount ?? 0) + debitAmount;
                        sale.IsPaid = false;
                        sale.WasPartialPayment = true;

                        appliedSales.Add((sale.Id, debitAmount));
                        appliedSaleIds.Add($"SA-{sale.Id.ToString().Substring(0, 8)}");

                        await _db.SaveChangesAsync();
                    }
                }
                else
                {
                    // Apply to existing outstanding sales (FIFO - oldest first)
                    var outstandingSales = await _db.Sales
                        .Where(s => s.CustomerId == debitNote.CustomerId &&
                                   s.OutstandingAmount.HasValue &&
                                   s.OutstandingAmount.Value > 0 &&
                                   !s.IsRefunded)
                        .OrderBy(s => s.SaleDate)
                        .ToListAsync();

                    var remainingDebit = debitAmount;
                    foreach (var sale in outstandingSales)
                    {
                        if (remainingDebit <= 0) break;

                        var appliedAmount = remainingDebit;
                        sale.OutstandingAmount = (sale.OutstandingAmount ?? 0) + appliedAmount;
                        sale.IsPaid = false;

                        appliedSales.Add((sale.Id, appliedAmount));
                        appliedSaleIds.Add($"SA-{sale.Id.ToString().Substring(0, 8)}");
                        remainingDebit -= appliedAmount;
                    }

                    if (outstandingSales.Any())
                    {
                        await _db.SaveChangesAsync();
                    }
                    // If no outstanding sales exist, the debit note itself represents the additional amount owed
                    // This will be tracked in receivables queries by including debit notes
                }
            }

            // Generate application message
            string applicationMessage;
            if (debitNote.SupplierId.HasValue)
            {
                // Supplier debit note
                if (appliedPurchases.Count == 0)
                {
                    // No pending debts - just added to payables
                    applicationMessage = $"Debit note amount ({debitNote.TotalAmount:N2}) added to supplier payables. Supplier has no pending debts to apply debit to.";
                }
                else
                {
                    // Applied to purchases
                    var totalApplied = appliedPurchases.Sum(p => p.Amount);
                    var purchaseIdsString = string.Join(", ", appliedPurchaseIds);
                    applicationMessage = $"Debit note amount ({totalApplied:N2}) applied to purchases: {purchaseIdsString}";
                }
            }
            else if (debitNote.CustomerId.HasValue)
            {
                // Customer debit note
                if (appliedSales.Count == 0)
                {
                    // No pending debts - just added to receivables
                    applicationMessage = $"Debit note amount ({debitNote.TotalAmount:N2}) added to customer receivables. Customer has no pending debts to apply debit to.";
                }
                else
                {
                    // Applied to sales
                    var totalApplied = appliedSales.Sum(s => s.Amount);
                    var saleIdsString = string.Join(", ", appliedSaleIds);
                    applicationMessage = $"Debit note amount ({totalApplied:N2}) applied to sales: {saleIdsString}";
                }
            }
            else
            {
                applicationMessage = $"Debit note amount ({debitNote.TotalAmount:N2}) recorded.";
            }

            // Update financial account if linked
            // For supplier debit notes: increases payables (doesn't change cash immediately)
            // For customer debit notes: increases receivables (doesn't change cash immediately)
            // The account balance change happens when the debit note is paid/received

            // Store application details
            debitNote.ApplicationMessage = applicationMessage;
            debitNote.AppliedToSalesIds = appliedSales.Count > 0 ? string.Join(",", appliedSaleIds) : null;
            debitNote.AppliedToPurchasesIds = appliedPurchases.Count > 0 ? string.Join(",", appliedPurchaseIds) : null;

            // Mark debit note as applied
            debitNote.IsApplied = true;
            debitNote.Status = DebitNoteStatus.Applied;
            await _db.SaveChangesAsync();

            return applicationMessage;
        }
    }
}

