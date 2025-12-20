using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.PurchaseDebtX;
using ImsServer.Models.SaleX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PurchaseDebtsTrackerController : ControllerBase
    {
        private readonly DBContext _db;

        public PurchaseDebtsTrackerController(DBContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetPurchaseDebtPayments(
            [FromQuery] Guid? purchaseId,
            [FromQuery] Guid? supplierId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] PaymentMethod? paymentMethod,
            [FromQuery] bool includeMetadata = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.PurchaseDebtTrackers
                .Include(pdt => pdt.Purchase)
                    .ThenInclude(p => p.Supplier)
                .OrderByDescending(pdt => pdt.PaymentDate)
                .AsQueryable();

            // Apply filters
            if (purchaseId.HasValue)
            {
                query = query.Where(pdt => pdt.PurchaseId == purchaseId.Value);
            }

            if (supplierId.HasValue)
            {
                query = query.Where(pdt => pdt.Purchase.SupplierId == supplierId.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(pdt => pdt.PaymentDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(pdt => pdt.PaymentDate <= endDate.Value);
            }

            if (paymentMethod.HasValue)
            {
                query = query.Where(pdt => pdt.PaymentMethod == paymentMethod.Value);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Validate and apply pagination
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : pageSize > 500 ? 500 : pageSize;

            var payments = await query
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
                    PurchaseDebtPayments = payments
                });
            }

            // Calculate metadata (using all filtered data)
            var allPayments = await query.ToListAsync();
            var metadata = new
            {
                TotalPaid = allPayments.Sum(pdt => pdt.PaidAmount),
                TotalPayments = allPayments.Count,
                PaymentMethodBreakdown = allPayments
                    .GroupBy(pdt => pdt.PaymentMethod)
                    .Select(g => new
                    {
                        PaymentMethod = g.Key.ToString(),
                        Count = g.Count(),
                        TotalAmount = g.Sum(pdt => pdt.PaidAmount)
                    })
                    .ToList(),
                SupplierBreakdown = allPayments
                    .GroupBy(pdt => new { pdt.Purchase.SupplierId, pdt.Purchase.Supplier.CompanyName })
                    .Select(g => new
                    {
                        SupplierId = g.Key.SupplierId,
                        SupplierName = g.Key.CompanyName,
                        TotalPaid = g.Sum(pdt => pdt.PaidAmount),
                        PaymentCount = g.Count()
                    })
                    .OrderByDescending(s => s.TotalPaid)
                    .ToList()
            };

            return Ok(new
            {
                Pagination = paginationInfo,
                Metadata = metadata,
                PurchaseDebtPayments = payments
            });
        }

        [HttpGet("ByPurchase/{purchaseId}")]
        public async Task<IActionResult> GetPaymentsByPurchase(Guid purchaseId)
        {
            var purchase = await _db.Purchases
                .Include(p => p.Supplier)
                .FirstOrDefaultAsync(p => p.Id == purchaseId);

            if (purchase == null) return NotFound("Purchase not found");

            var payments = await _db.PurchaseDebtTrackers
                .Where(pdt => pdt.PurchaseId == purchaseId)
                .OrderByDescending(pdt => pdt.PaymentDate)
                .ToListAsync();

            var totalPaid = payments.Sum(pdt => pdt.PaidAmount);
            var remainingBalance = purchase.GrandTotal- purchase.PaidAmount;

            return Ok(new
            {
                Purchase = new
                {
                    purchase.Id,
                    purchase.PurchaseNumber,
                    purchase.PurchaseDate,
                    purchase.GrandTotal,
                    purchase.PaidAmount,
                    purchase.OutstandingAmount,
                    purchase.IsPaid,
                    Supplier = new
                    {
                        purchase.Supplier.Id,
                        purchase.Supplier.CompanyName,
                        purchase.Supplier.PhoneNumber
                    }
                },
                Summary = new
                {
                    TotalPaidViaPayments = totalPaid,
                    RemainingBalance = remainingBalance,
                    PaymentCount = payments.Count
                },
                Payments = payments
            });
        }

        [HttpPost]
        public async Task<IActionResult> RecordPurchaseDebtPayment([FromBody] CreatePurchaseDebtPaymentDto dto)
        {
            if (dto == null) return BadRequest("Payload required");

            var purchase = await _db.Purchases.FindAsync(dto.PurchaseId);

            if (purchase == null)
            {
                return BadRequest("Purchase not found");
            }

            // Calculate remaining balance
            var remainingBalance = purchase.GrandTotal - purchase.PaidAmount;

            if (dto.PaidAmount > remainingBalance)
            {
                return BadRequest($"Payment amount ({dto.PaidAmount}) exceeds remaining balance ({remainingBalance})");
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                var payment = new PurchaseDebtTracker
                {
                    Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                    PurchaseId = dto.PurchaseId,
                    PaidAmount = dto.PaidAmount,
                    PaymentMethod = dto.PaymentMethod,
                    PaymentDate = dto.PaymentDate == default ? DateTime.UtcNow : dto.PaymentDate,
                    Description = dto.Description,
                    ReceivedById = dto.ReceivedById,
                    LinkedFinancialAccountId = dto.LinkedFinancialAccountId
                };

                _db.PurchaseDebtTrackers.Add(payment);

                // Update purchase paid amount
                purchase.PaidAmount += dto.PaidAmount;
                purchase.OutstandingAmount = purchase.GrandTotal - purchase.PaidAmount;

                // Update linked financial account if provided
                if (dto.LinkedFinancialAccountId.HasValue)
                {
                    var account = await _db.FinancialAccounts
                        .FirstOrDefaultAsync(fa => fa.Id == dto.LinkedFinancialAccountId.Value);

                    if (account != null)
                    {
                        account.Balance -= dto.PaidAmount;
                    }
                }

                // Mark as paid if fully settled
                if (purchase.PaidAmount >= purchase.GrandTotal)
                {
                    purchase.IsPaid = true;
                    purchase.OutstandingAmount = 0;
                }

                await _db.SaveChangesAsync();
                await tran.CommitAsync();

                // Reload with navigation properties
                var savedPayment = await _db.PurchaseDebtTrackers
                    .Include(pdt => pdt.Purchase)
                        .ThenInclude(p => p.Supplier)
                    .FirstOrDefaultAsync(pdt => pdt.Id == payment.Id);

                return CreatedAtAction(nameof(GetPaymentsByPurchase), new { purchaseId = dto.PurchaseId }, savedPayment);
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = ex.Message, innerException = ex.InnerException?.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePurchaseDebtPayment(Guid id, [FromBody] UpdatePurchaseDebtPaymentDto dto)
        {
            var payment = await _db.PurchaseDebtTrackers
                .Include(pdt => pdt.Purchase)
                .FirstOrDefaultAsync(pdt => pdt.Id == id);

            if (payment == null) return NotFound();

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                var oldAmount = payment.PaidAmount;

                // Update payment fields
                if (dto.PaidAmount.HasValue)
                {
                    var amountDifference = dto.PaidAmount.Value - oldAmount;
                    var newPurchasePaidAmount = payment.Purchase.PaidAmount + amountDifference;

                    if (newPurchasePaidAmount > payment.Purchase.GrandTotal)
                    {
                        return BadRequest("Updated payment amount would exceed purchase total");
                    }

                    payment.PaidAmount = dto.PaidAmount.Value;
                    payment.Purchase.PaidAmount = newPurchasePaidAmount;
                    payment.Purchase.OutstandingAmount = payment.Purchase.GrandTotal - newPurchasePaidAmount;
                    payment.Purchase.IsPaid = newPurchasePaidAmount >= payment.Purchase.GrandTotal;


                    // Update linked financial account if applicable
                    if (payment.LinkedFinancialAccountId.HasValue)
                    {
                        var account = await _db.FinancialAccounts
                            .FirstOrDefaultAsync(fa => fa.Id == payment.LinkedFinancialAccountId.Value);

                        if (account != null)
                        {
                            account.Balance -= amountDifference;
                        }
                    }
                }

                if (dto.PaymentMethod.HasValue) payment.PaymentMethod = dto.PaymentMethod.Value;
                if (dto.PaymentDate.HasValue) payment.PaymentDate = dto.PaymentDate.Value;
                if (dto.Description != null) payment.Description = dto.Description;

                await _db.SaveChangesAsync();
                await tran.CommitAsync();

                return Ok(payment);
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = ex.Message, innerException = ex.InnerException?.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePurchaseDebtPayment(Guid id)
        {
            var payment = await _db.PurchaseDebtTrackers
                .Include(pdt => pdt.Purchase)
                .FirstOrDefaultAsync(pdt => pdt.Id == id);

            if (payment == null) return NotFound();

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                // Reverse the payment from purchase
                payment.Purchase.PaidAmount -= payment.PaidAmount;
                payment.Purchase.OutstandingAmount = payment.Purchase.GrandTotal - payment.Purchase.PaidAmount;
                payment.Purchase.IsPaid = payment.Purchase.PaidAmount >= payment.Purchase.GrandTotal;

                // Update linked financial account if applicable
                if (payment.LinkedFinancialAccountId.HasValue)
                {
                    var account = await _db.FinancialAccounts
                        .FirstOrDefaultAsync(fa => fa.Id == payment.LinkedFinancialAccountId.Value);

                    if (account != null)
                    {
                        account.Balance -= payment.PaidAmount;
                    }
                }

                _db.SoftDelete(payment);
                await _db.SaveChangesAsync();
                await tran.CommitAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, ex.Message);
            }
        }
    }
}
