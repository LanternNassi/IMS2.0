using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.CreditNoteX;
using ImsServer.Models.SaleX;
using ImsServer.Models.CustomerX;
using ImsServer.Models.FinancialAccountX;
using ImsServer.Models.SalesDebtsTrackerX;
using ImsServer.Models.ProductX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CreditNotesController : ControllerBase
    {
        private readonly DBContext _db;

        public CreditNotesController(DBContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetCreditNotes(
            [FromQuery] Guid? customerId,
            [FromQuery] Guid? saleId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] CreditNoteStatus? status,
            [FromQuery] CreditNoteReason? reason,
            [FromQuery] decimal? minAmount,
            [FromQuery] decimal? maxAmount,
            [FromQuery] bool includeMetadata = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.CreditNotes
                .Include(cn => cn.Customer)
                .Include(cn => cn.ProcessedBy)
                .Include(cn => cn.Sale)
                .Include(cn => cn.CreditNoteItems)
                .OrderByDescending(cn => cn.CreditNoteDate)
                .AsQueryable();

            // Apply filters
            if (customerId.HasValue)
            {
                query = query.Where(cn => cn.CustomerId == customerId.Value);
            }

            if (saleId.HasValue)
            {
                query = query.Where(cn => cn.SaleId == saleId.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(cn => cn.CreditNoteDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(cn => cn.CreditNoteDate <= endDate.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(cn => cn.Status == status.Value);
            }

            if (reason.HasValue)
            {
                query = query.Where(cn => cn.Reason == reason.Value);
            }

            if (minAmount.HasValue)
            {
                query = query.Where(cn => cn.TotalAmount >= minAmount.Value);
            }

            if (maxAmount.HasValue)
            {
                query = query.Where(cn => cn.TotalAmount <= maxAmount.Value);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Validate and apply pagination
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : pageSize > 500 ? 500 : pageSize;

            var creditNotes = await query
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
                    CreditNotes = creditNotes
                });
            }

            // Calculate metadata
            var allCreditNotes = await query.ToListAsync();
            var metadata = new
            {
                TotalAmount = allCreditNotes.Sum(cn => cn.TotalAmount),
                TotalCount = allCreditNotes.Count,
                AppliedCount = allCreditNotes.Count(cn => cn.IsApplied),
                PendingCount = allCreditNotes.Count(cn => cn.Status == CreditNoteStatus.Pending),
                RefundedCount = allCreditNotes.Count(cn => cn.Status == CreditNoteStatus.Refunded),
                ByReason = allCreditNotes
                    .GroupBy(cn => cn.Reason)
                    .Select(g => new
                    {
                        Reason = g.Key.ToString(),
                        Count = g.Count(),
                        TotalAmount = g.Sum(cn => cn.TotalAmount)
                    })
                    .ToList(),
                ByStatus = allCreditNotes
                    .GroupBy(cn => cn.Status)
                    .Select(g => new
                    {
                        Status = g.Key.ToString(),
                        Count = g.Count(),
                        TotalAmount = g.Sum(cn => cn.TotalAmount)
                    })
                    .ToList()
            };

            return Ok(new
            {
                Pagination = paginationInfo,
                Metadata = metadata,
                CreditNotes = creditNotes
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCreditNote(Guid id)
        {
            var creditNote = await _db.CreditNotes
                .Include(cn => cn.Customer)
                .Include(cn => cn.ProcessedBy)
                .Include(cn => cn.Sale)
                    .ThenInclude(s => s.Customer)
                .Include(cn => cn.CreditNoteItems)
                .Include(cn => cn.LinkedFinancialAccount)
                .FirstOrDefaultAsync(cn => cn.Id == id && !cn.DeletedAt.HasValue);

            if (creditNote == null) return NotFound();

            return Ok(creditNote);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCreditNote([FromBody] CreateCreditNoteDto dto)
        {
            if (dto == null) return BadRequest("Payload required");

            // Validate customer
            var customer = await _db.Customers.FindAsync(dto.CustomerId);
            if (customer == null)
            {
                return BadRequest("Customer not found. Provide a valid CustomerId.");
            }

            // Validate user
            var user = await _db.Users.FindAsync(dto.ProcessedById);
            if (user == null)
            {
                return BadRequest("User not found. Provide a valid ProcessedById.");
            }

            // Validate sale if provided
            if (dto.SaleId.HasValue)
            {
                var sale = await _db.Sales.FindAsync(dto.SaleId.Value);
                if (sale == null)
                {
                    return BadRequest("Sale not found. Provide a valid SaleId or leave it null.");
                }
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                // Generate credit note number if not provided
                var creditNoteNumber = dto.CreditNoteNumber;
                if (string.IsNullOrWhiteSpace(creditNoteNumber))
                {
                    creditNoteNumber = await GenerateCreditNoteNumberAsync();
                }

                var creditNote = new CreditNote
                {
                    Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                    CreditNoteNumber = creditNoteNumber,
                    CreditNoteDate = dto.CreditNoteDate == default ? DateTime.UtcNow : dto.CreditNoteDate,
                    SaleId = dto.SaleId,
                    CustomerId = dto.CustomerId,
                    ProcessedById = dto.ProcessedById,
                    TotalAmount = dto.TotalAmount,
                    TaxAmount = dto.TaxAmount,
                    SubTotal = dto.SubTotal,
                    Reason = dto.Reason,
                    Description = dto.Description,
                    Notes = dto.Notes,
                    Status = CreditNoteStatus.Pending,
                    IsApplied = false,
                    LinkedFinancialAccountId = dto.LinkedFinancialAccountId
                };

                _db.CreditNotes.Add(creditNote);
                await _db.SaveChangesAsync();

                // Add credit note to sale's collection if linked to a sale
                if (dto.SaleId.HasValue)
                {
                    var sale = await _db.Sales
                        .Include(s => s.CreditNotes)
                        .FirstOrDefaultAsync(s => s.Id == dto.SaleId.Value);

                    if (sale != null)
                    {
                        sale.CreditNotes ??= new List<CreditNote>();
                        sale.CreditNotes.Add(creditNote);
                        await _db.SaveChangesAsync();
                    }
                }

                // Add items
                foreach (var itemDto in dto.Items ?? Enumerable.Empty<CreateCreditNoteItemDto>())
                {
                    var item = new CreditNoteItem
                    {
                        Id = itemDto.Id == Guid.Empty ? Guid.NewGuid() : itemDto.Id,
                        CreditNoteId = creditNote.Id,
                        ProductVariationId = itemDto.ProductVariationId,
                        ProductName = itemDto.ProductName,
                        Description = itemDto.Description,
                        Quantity = itemDto.Quantity,
                        UnitPrice = itemDto.UnitPrice,
                        TotalPrice = itemDto.TotalPrice,
                        TaxAmount = itemDto.TaxAmount,
                        SaleItemId = itemDto.SaleItemId
                    };

                    _db.CreditNoteItems.Add(item);
                }

                await _db.SaveChangesAsync();

                // Apply to balance if requested
                string? applicationMessage = null;
                if (dto.ApplyToBalance)
                {
                    applicationMessage = await ApplyCreditNoteToBalanceAsync(creditNote.Id, dto.SaleId);
                }

                await tran.CommitAsync();

                // Reload with includes
                var createdCreditNote = await _db.CreditNotes
                    .Include(cn => cn.Customer)
                    .Include(cn => cn.ProcessedBy)
                    .Include(cn => cn.Sale)
                    .Include(cn => cn.CreditNoteItems)
                    .FirstOrDefaultAsync(cn => cn.Id == creditNote.Id);

                return CreatedAtAction(nameof(GetCreditNote), new { id = creditNote.Id }, new
                {
                    CreditNote = createdCreditNote,
                    ApplicationMessage = applicationMessage
                });
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = $"Error creating credit note: {ex.Message}", innerException = ex.InnerException?.Message });
            }
        }

        [HttpPost("{id}/Apply")]
        public async Task<IActionResult> ApplyCreditNote(Guid id, [FromBody] ApplyCreditNoteDto? dto = null)
        {
            var creditNote = await _db.CreditNotes
                .Include(cn => cn.Customer)
                .Include(cn => cn.Sale)
                .FirstOrDefaultAsync(cn => cn.Id == id && !cn.DeletedAt.HasValue);

            if (creditNote == null) return NotFound();

            if (creditNote.IsApplied)
            {
                return BadRequest("Credit note has already been applied.");
            }

            if (creditNote.Status == CreditNoteStatus.Cancelled)
            {
                return BadRequest("Cannot apply a cancelled credit note.");
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                var applicationMessage = await ApplyCreditNoteToBalanceAsync(creditNote.Id, dto?.SaleId);

                await tran.CommitAsync();

                // Reload with includes
                var updatedCreditNote = await _db.CreditNotes
                    .Include(cn => cn.Customer)
                    .Include(cn => cn.ProcessedBy)
                    .Include(cn => cn.Sale)
                    .Include(cn => cn.CreditNoteItems)
                    .FirstOrDefaultAsync(cn => cn.Id == creditNote.Id);

                return Ok(new
                {
                    CreditNote = updatedCreditNote,
                    ApplicationMessage = applicationMessage
                });
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = $"Error applying credit note: {ex.Message}", innerException = ex.InnerException?.Message });
            }
        }

        [HttpPost("{id}/Refund")]
        public async Task<IActionResult> RefundCreditNote(Guid id)
        {
            var creditNote = await _db.CreditNotes
                .Include(cn => cn.LinkedFinancialAccount)
                .FirstOrDefaultAsync(cn => cn.Id == id && !cn.DeletedAt.HasValue);

            if (creditNote == null) return NotFound();

            if (creditNote.Status == CreditNoteStatus.Refunded)
            {
                return BadRequest("Credit note has already been refunded.");
            }

            if (!creditNote.IsApplied)
            {
                return BadRequest("Credit note must be applied before it can be refunded.");
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                // Update financial account if linked
                if (creditNote.LinkedFinancialAccountId.HasValue && creditNote.LinkedFinancialAccount != null)
                {
                    creditNote.LinkedFinancialAccount.Balance -= creditNote.TotalAmount;
                }

                creditNote.Status = CreditNoteStatus.Refunded;

                await _db.SaveChangesAsync();
                await tran.CommitAsync();

                return Ok(creditNote);
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = $"Error refunding credit note: {ex.Message}", innerException = ex.InnerException?.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCreditNote(Guid id, [FromBody] CreateCreditNoteDto dto)
        {
            var creditNote = await _db.CreditNotes
                .Include(cn => cn.CreditNoteItems)
                .FirstOrDefaultAsync(cn => cn.Id == id && !cn.DeletedAt.HasValue);

            if (creditNote == null) return NotFound();

            if (creditNote.IsApplied)
            {
                return BadRequest("Cannot update an applied credit note.");
            }

            if (creditNote.Status == CreditNoteStatus.Cancelled)
            {
                return BadRequest("Cannot update a cancelled credit note.");
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                // Update credit note properties
                creditNote.CreditNoteDate = dto.CreditNoteDate;
                creditNote.SaleId = dto.SaleId;
                creditNote.CustomerId = dto.CustomerId;
                creditNote.TotalAmount = dto.TotalAmount;
                creditNote.TaxAmount = dto.TaxAmount;
                creditNote.SubTotal = dto.SubTotal;
                creditNote.Reason = dto.Reason;
                creditNote.Description = dto.Description;
                creditNote.Notes = dto.Notes;
                creditNote.LinkedFinancialAccountId = dto.LinkedFinancialAccountId;

                // Remove existing items
                _db.CreditNoteItems.RemoveRange(creditNote.CreditNoteItems);

                // Add new items
                foreach (var itemDto in dto.Items ?? Enumerable.Empty<CreateCreditNoteItemDto>())
                {
                    var item = new CreditNoteItem
                    {
                        Id = itemDto.Id == Guid.Empty ? Guid.NewGuid() : itemDto.Id,
                        CreditNoteId = creditNote.Id,
                        ProductVariationId = itemDto.ProductVariationId,
                        ProductName = itemDto.ProductName,
                        Description = itemDto.Description,
                        Quantity = itemDto.Quantity,
                        UnitPrice = itemDto.UnitPrice,
                        TotalPrice = itemDto.TotalPrice,
                        TaxAmount = itemDto.TaxAmount,
                        SaleItemId = itemDto.SaleItemId
                    };

                    _db.CreditNoteItems.Add(item);
                }

                await _db.SaveChangesAsync();
                await tran.CommitAsync();

                // Reload with includes
                var updatedCreditNote = await _db.CreditNotes
                    .Include(cn => cn.Customer)
                    .Include(cn => cn.ProcessedBy)
                    .Include(cn => cn.Sale)
                    .Include(cn => cn.CreditNoteItems)
                    .FirstOrDefaultAsync(cn => cn.Id == creditNote.Id);

                return Ok(updatedCreditNote);
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = $"Error updating credit note: {ex.Message}", innerException = ex.InnerException?.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCreditNote(Guid id)
        {
            var creditNote = await _db.CreditNotes
                .FirstOrDefaultAsync(cn => cn.Id == id && !cn.DeletedAt.HasValue);

            if (creditNote == null) return NotFound();

            if (creditNote.IsApplied)
            {
                return BadRequest("Cannot delete an applied credit note. Cancel it instead.");
            }

            _db.SoftDelete(creditNote);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/Cancel")]
        public async Task<IActionResult> CancelCreditNote(Guid id)
        {
            var creditNote = await _db.CreditNotes
                .FirstOrDefaultAsync(cn => cn.Id == id && !cn.DeletedAt.HasValue);

            if (creditNote == null) return NotFound();

            if (creditNote.IsApplied)
            {
                return BadRequest("Cannot cancel an applied credit note.");
            }

            if (creditNote.Status == CreditNoteStatus.Cancelled)
            {
                return BadRequest("Credit note is already cancelled.");
            }

            creditNote.Status = CreditNoteStatus.Cancelled;
            await _db.SaveChangesAsync();

            return Ok(creditNote);
        }

        // Helper methods
        private async Task<string> GenerateCreditNoteNumberAsync()
        {
            var year = DateTime.UtcNow.Year;
            var lastNote = await _db.CreditNotes
                .Where(cn => cn.CreditNoteNumber.StartsWith($"CN-{year}-"))
                .OrderByDescending(cn => cn.CreditNoteNumber)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastNote != null)
            {
                var parts = lastNote.CreditNoteNumber.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out int lastNum))
                {
                    nextNumber = lastNum + 1;
                }
            }

            return $"CN-{year}-{nextNumber:D3}";
        }

        private async Task<string> ApplyCreditNoteToBalanceAsync(Guid creditNoteId, Guid? specificSaleId = null)
        {
            var creditNote = await _db.CreditNotes
                .Include(cn => cn.Customer)
                .Include(cn => cn.Sale)
                .Include(cn => cn.LinkedFinancialAccount)
                .FirstOrDefaultAsync(cn => cn.Id == creditNoteId);

            if (creditNote == null) throw new Exception("Credit note not found");

            var creditAmount = creditNote.TotalAmount;
            var appliedSales = new List<(Guid SaleId, decimal Amount)>();
            var appliedSaleIds = new List<string>();

            // If linked to a specific sale, apply to that sale first
            if (specificSaleId.HasValue || creditNote.SaleId.HasValue)
            {
                var saleId = specificSaleId ?? creditNote.SaleId.Value;
                var sale = await _db.Sales
                    .Include(s => s.Customer)
                    .FirstOrDefaultAsync(s => s.Id == saleId);

                if (sale != null && sale.CustomerId == creditNote.CustomerId)
                {
                    var remainingCredit = creditAmount;

                    // Reduce outstanding amount
                    if (sale.OutstandingAmount.HasValue && sale.OutstandingAmount.Value > 0)
                    {
                        var reduction = Math.Min(remainingCredit, sale.OutstandingAmount.Value);
                        sale.OutstandingAmount = Math.Max(0, sale.OutstandingAmount.Value - reduction);
                        // sale.PaidAmount += reduction;
                        // sale.FinalAmount += reduction;
                        remainingCredit -= reduction;

                        appliedSales.Add((sale.Id, reduction));
                        appliedSaleIds.Add($"SA-{sale.Id.ToString().Substring(0, 8)}");

                        // Update IsPaid status
                        if (sale.OutstandingAmount <= 0)
                        {
                            sale.IsPaid = true;
                        }
                    }

                    await _db.SaveChangesAsync();
                    creditAmount = remainingCredit;
                }
            }

            // Apply remaining credit to other sales (FIFO - oldest first)
            if (creditAmount > 0)
            {
                var outstandingSales = await _db.Sales
                    .Where(s => s.CustomerId == creditNote.CustomerId &&
                               s.OutstandingAmount.HasValue &&
                               s.OutstandingAmount.Value > 0 &&
                               !s.IsRefunded)
                    .OrderBy(s => s.SaleDate)
                    .ToListAsync();

                foreach (var sale in outstandingSales)
                {
                    if (creditAmount <= 0) break;

                    if (sale.OutstandingAmount.HasValue && sale.OutstandingAmount.Value > 0)
                    {
                        var reduction = Math.Min(creditAmount, sale.OutstandingAmount.Value);
                        sale.OutstandingAmount = Math.Max(0, sale.OutstandingAmount.Value - reduction);
                        // sale.PaidAmount += reduction;
                        // sale.FinalAmount += reduction;
                        creditAmount -= reduction;

                        appliedSales.Add((sale.Id, reduction));
                        appliedSaleIds.Add($"SA-{sale.Id.ToString().Substring(0, 8)}");

                        // Update IsPaid status
                        if (sale.OutstandingAmount <= 0)
                        {
                            sale.IsPaid = true;
                        }
                    }
                }

                await _db.SaveChangesAsync();
            }

            // Generate application message
            string applicationMessage;
            if (appliedSales.Count == 0)
            {
                // No pending debts - just deducted from financial account
                if (creditNote.LinkedFinancialAccountId.HasValue)
                {
                    applicationMessage = $"Credit note amount ({creditNote.TotalAmount:N2}) deducted from financial account. Customer has no pending debts.";

                }
                else
                {
                    applicationMessage = $"Credit note amount ({creditNote.TotalAmount:N2}) recorded. Customer has no pending debts to apply credit to.";
                }


            }
            else
            {
                // Applied to sales
                var totalApplied = appliedSales.Sum(s => s.Amount);
                var saleIdsString = string.Join(", ", appliedSaleIds);
                applicationMessage = $"Credit note amount ({totalApplied:N2}) applied to sales: {saleIdsString}";
            }

            if (creditNote.Reason != CreditNoteReason.DamagedGoods)
            {
                // Readd stock if the reason is not damaged 
                var creditNoteItems = await _db.CreditNoteItems.Where(c => c.CreditNoteId == creditNoteId).ToListAsync();
                var sale = await _db.Sales.FindAsync(specificSaleId);

                decimal profitAcrrued = 0;


                foreach (var item in creditNoteItems)
                {

                    var saleItem = await _db.SalesItems.FindAsync(item.SaleItemId);

                    if (saleItem != null)
                    {
                        var productStorage = await _db.ProductStorages
                            .Include(p => p.ProductVariation)
                            .Where(p => p.Id == saleItem.ProductStorageId)
                            .FirstAsync();

                        if (productStorage != null)
                        {
                            productStorage.Quantity += item.Quantity;
                        }

                        // Remove the profit from the sale 
                        if (sale != null && productStorage != null)
                        {
                            // Calculate profit
                            var profit = (saleItem.UnitPrice - productStorage.ProductVariation.CostPrice) * item.Quantity;
                            sale.Profit -= profit;
                            profitAcrrued += profit;
                        }
                    }

                }

                creditNote.ProfitAccrued = profitAcrrued;

                await _db.SaveChangesAsync();

            }
            else
            {

                // Only remove the profit from the balance but dont add back to inventory 
                var creditNoteItems = await _db.CreditNoteItems.Where(c => c.CreditNoteId == creditNoteId).ToListAsync();
                var sale = await _db.Sales.FindAsync(specificSaleId);

                decimal profitAcrrued = 0;

                foreach (var item in creditNoteItems)
                {

                    var saleItem = await _db.SalesItems.FindAsync(item.SaleItemId);

                    if (saleItem != null)
                    {
                        var productStorage = await _db.ProductStorages
                            .Include(p => p.ProductVariation)
                            .Where(p => p.Id == saleItem.ProductStorageId)
                            .FirstAsync();

                        // Remove the profit from the sale 
                        if (sale != null && productStorage != null)
                        {
                            // Calculate profit
                            var profit = (saleItem.UnitPrice - productStorage.ProductVariation.CostPrice) * item.Quantity;
                            sale.Profit -= profit;
                            profitAcrrued += profit;
                        }
                    }

                }

                creditNote.ProfitAccrued = profitAcrrued;

                await _db.SaveChangesAsync();

            }


            // Update financial account if linked
            if (creditNote.LinkedFinancialAccountId.HasValue && creditNote.LinkedFinancialAccount != null)
            {
                creditNote.LinkedFinancialAccount.Balance -= creditAmount;
                await _db.SaveChangesAsync();
            }

            // Store application details
            creditNote.ApplicationMessage = applicationMessage;
            creditNote.AppliedToSalesIds = appliedSales.Count > 0 ? string.Join(",", appliedSaleIds) : null;

            // Mark credit note as applied
            creditNote.IsApplied = true;
            creditNote.Status = CreditNoteStatus.Applied;
            await _db.SaveChangesAsync();

            return applicationMessage;
        }
    }
}

