using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.SalesDebtsTrackerX;
using ImsServer.Models.SaleX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalesDebtsTrackerController : ControllerBase
    {
        private readonly DBContext _db;

        public SalesDebtsTrackerController(DBContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetDebtPayments(
            [FromQuery] Guid? saleId,
            [FromQuery] Guid? customerId,
            [FromQuery] DebtType? debtType,
            [FromQuery] PaymentMethod? paymentMethod,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] decimal? minAmount,
            [FromQuery] decimal? maxAmount,
            [FromQuery] bool includeMetadata = false)
        {
            var query = _db.SalesDebtsTrackers
                .Include(d => d.Sale)
                    .ThenInclude(s => s.Customer)
                .Include(d => d.Sale)
                    .ThenInclude(s => s.CreditNotes)
                .Where(d => !d.DeletedAt.HasValue)
                .OrderByDescending(d => d.AddedAt)
                .AsQueryable();

            // Apply filters
            if (saleId.HasValue)
            {
                query = query.Where(d => d.SaleId == saleId.Value);
            }

            if (customerId.HasValue)
            {
                query = query.Where(d => d.Sale.CustomerId == customerId.Value);
            }

            if (debtType.HasValue)
            {
                query = query.Where(d => d.DebtType == debtType.Value);
            }

            if (paymentMethod.HasValue)
            {
                query = query.Where(d => d.PaymentMethod == paymentMethod.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(d => d.AddedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(d => d.AddedAt <= endDate.Value);
            }

            if (minAmount.HasValue)
            {
                query = query.Where(d => d.PaidAmount >= minAmount.Value);
            }

            if (maxAmount.HasValue)
            {
                query = query.Where(d => d.PaidAmount <= maxAmount.Value);
            }

            var payments = await query.ToListAsync();

            if (!includeMetadata)
            {
                return Ok(payments);
            }

            // Calculate metadata
            var metadata = new
            {
                TotalPaid = payments.Sum(p => p.PaidAmount),
                TotalPayments = payments.Count,
                AveragePayment = payments.Any() ? Math.Round(payments.Average(p => p.PaidAmount), 2) : 0,
                PaymentsByMethod = payments
                    .GroupBy(p => p.PaymentMethod)
                    .Select(g => new
                    {
                        PaymentMethod = g.Key.ToString(),
                        Count = g.Count(),
                        TotalAmount = g.Sum(p => p.PaidAmount)
                    })
                    .ToList(),
                PaymentsByDebtType = payments
                    .GroupBy(p => p.DebtType)
                    .Select(g => new
                    {
                        DebtType = g.Key.ToString(),
                        Count = g.Count(),
                        TotalAmount = g.Sum(p => p.PaidAmount)
                    })
                    .ToList(),
                TopCustomerPayments = payments
                    .GroupBy(p => new { p.Sale.CustomerId, p.Sale.Customer.Name })
                    .Select(g => new
                    {
                        CustomerId = g.Key.CustomerId,
                        CustomerName = g.Key.Name,
                        TotalPayments = g.Count(),
                        TotalPaid = g.Sum(p => p.PaidAmount)
                    })
                    .OrderByDescending(c => c.TotalPaid)
                    .Take(10)
                    .ToList(),
                TimeSeries = payments
                    .GroupBy(p => p.AddedAt.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        PaymentCount = g.Count(),
                        TotalPaid = g.Sum(p => p.PaidAmount)
                    })
                    .OrderBy(t => t.Date)
                    .ToList()
            };

            return Ok(new
            {
                Metadata = metadata,
                Payments = payments
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDebtPayment(Guid id)
        {
            var payment = await _db.SalesDebtsTrackers
                .Include(d => d.Sale)
                    .ThenInclude(s => s.Customer)
                .Include(d => d.Sale)
                    .ThenInclude(s => s.CreditNotes)
                .FirstOrDefaultAsync(d => d.Id == id && !d.DeletedAt.HasValue);

            if (payment == null) return NotFound();

            return Ok(payment);
        }

        [HttpGet("BySale/{saleId}")]
        public async Task<IActionResult> GetPaymentsBySale(Guid saleId)
        {
            var sale = await _db.Sales
                .Include(s => s.Customer)
                .Include(s => s.CreditNotes)
                .Include(s => s.DebitNotes)
                .FirstOrDefaultAsync(s => s.Id == saleId);

            if (sale == null) return NotFound("Sale not found");

            var payments = await _db.SalesDebtsTrackers
                .Where(d => d.SaleId == saleId && !d.DeletedAt.HasValue)
                .Select((d) => new
                {
                    d.Id,
                    d.PaidAmount,
                    d.DebtType,
                    d.PaymentMethod,
                    d.Description,
                    d.AddedAt
                })
                .OrderByDescending(d => d.AddedAt)
                .ToListAsync();

            var totalPaid = payments.Sum(p => p.PaidAmount);
            
            // Calculate credit notes total (reduces what customer owes)
            var totalCreditNotes = sale.CreditNotes?.Where(cn => cn.IsApplied).Sum(cn => cn.TotalAmount) ?? 0;
            
            // Calculate debit notes total (increases what customer owes)
            var totalDebitNotes = sale.DebitNotes?.Where(dn => dn.IsApplied).Sum(dn => dn.TotalAmount) ?? 0;
            
            // Remaining balance = Total - Paid - CreditNotes + DebitNotes
            var remainingBalance = sale.TotalAmount - sale.PaidAmount - totalCreditNotes + totalDebitNotes;

            return Ok(new
            {
                Sale = new
                {
                    sale.Id,
                    sale.SaleDate,
                    sale.TotalAmount,
                    sale.PaidAmount,
                    RemainingBalance = remainingBalance,
                    sale.IsPaid,
                    creditNotes = sale.CreditNotes.Select(cn => new
                    {
                        cn.Id,
                        cn.CreditNoteNumber,
                        cn.TotalAmount,
                        cn.CreditNoteDate,
                        cn.IsApplied
                    }).ToList(),
                    debitNotes = sale.DebitNotes.Select(dn => new
                    {
                        dn.Id,
                        dn.DebitNoteNumber,
                        dn.TotalAmount,
                        dn.DebitNoteDate,
                        dn.IsApplied
                    }).ToList(),
                    Customer = new
                    {
                        sale.Customer.Id,
                        sale.Customer.Name,
                        sale.Customer.Phone
                    }
                },
                PaymentHistory = payments,
                Summary = new
                {
                    TotalPayments = payments.Count,
                    TotalPaidViaTracker = totalPaid,
                    TotalCreditNotes = totalCreditNotes,
                    TotalDebitNotes = totalDebitNotes,
                    RemainingBalance = remainingBalance
                }
            });
        }

        [HttpPost]
        public async Task<IActionResult> RecordDebtPayment([FromBody] CreateSalesDebtsTrackerDto dto)
        {
            if (dto == null) return BadRequest("Payload required");

            // Validate sale exists
            var sale = await _db.Sales.FindAsync(dto.SaleId);
            if (sale == null)
            {
                return BadRequest("Sale not found. Provide a valid SaleId.");
            }

            // Check if sale is already fully paid
            if (sale.IsPaid)
            {
                return BadRequest("Sale is already fully paid.");
            }

            // Validate payment amount
            if (dto.PaidAmount > sale.OutstandingAmount)
            {
                return BadRequest($"Payment amount ({dto.PaidAmount}) exceeds remaining balance ({sale.OutstandingAmount}).");
            }

            if (dto.PaidAmount <= 0)
            {
                return BadRequest("Payment amount must be greater than zero.");
            }

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                // Create debt payment record
                var payment = new SalesDebtsTracker
                {
                    Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                    PaidAmount = dto.PaidAmount,
                    Description = dto.Description,
                    DebtType = dto.DebtType,
                    SaleId = dto.SaleId,
                    PaymentMethod = dto.PaymentMethod,
                    LinkedFinancialAccountId = dto.LinkedFinancialAccountId
                };

                _db.SalesDebtsTrackers.Add(payment);

                // Update sale paid amount
                sale.PaidAmount += dto.PaidAmount;
                sale.FinalAmount += dto.PaidAmount;
                sale.OutstandingAmount -= dto.PaidAmount;

                // Update the linked account balance if applicable
                if (dto.LinkedFinancialAccountId.HasValue)
                {
                    var account = await _db.FinancialAccounts
                        .FirstOrDefaultAsync(fa => fa.Id == dto.LinkedFinancialAccountId.Value);

                    if (account != null)
                    {
                        account.Balance += dto.PaidAmount;
                    }
                }

                // Mark sale as paid if fully paid
                if (sale.OutstandingAmount <= 0)
                {
                    sale.IsPaid = true;
                    // sale.OutstandingAmount = 0;
                }

                await _db.SaveChangesAsync();
                await tran.CommitAsync();

                // Reload with sale details
                var created = await _db.SalesDebtsTrackers
                    .Include(d => d.Sale)
                        .ThenInclude(s => s.Customer)
                    .Include(d => d.Sale)
                        .ThenInclude(s => s.CreditNotes)
                    .FirstOrDefaultAsync(d => d.Id == payment.Id);

                return CreatedAtAction(nameof(GetDebtPayment), new { id = payment.Id }, created);
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = ex.Message, innerException = ex.InnerException?.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDebtPayment(Guid id, [FromBody] UpdateSalesDebtsTrackerDto dto)
        {
            var payment = await _db.SalesDebtsTrackers
                .Include(d => d.Sale)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (payment == null) return NotFound();

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                // If amount is being changed, adjust sale's paid amount
                if (dto.PaidAmount.HasValue && dto.PaidAmount.Value != payment.PaidAmount)
                {
                    var difference = dto.PaidAmount.Value - payment.PaidAmount;
                    
                    // Validate new total doesn't exceed sale amount
                    if (payment.Sale.PaidAmount + difference > payment.Sale.TotalAmount)
                    {
                        return BadRequest("Updated payment amount would exceed sale total.");
                    }

                    payment.Sale.PaidAmount += difference;
                    payment.Sale.OutstandingAmount = payment.Sale.TotalAmount - payment.Sale.PaidAmount;
                    payment.Sale.IsPaid = payment.Sale.PaidAmount >= payment.Sale.TotalAmount;



                    payment.PaidAmount = dto.PaidAmount.Value;

                    // If linked account is changed, adjust balances accordingly
                    if (dto.LinkedFinancialAccountId.HasValue && dto.LinkedFinancialAccountId != payment.LinkedFinancialAccountId)
                    {
                        // Deduct from old account
                        if (payment.LinkedFinancialAccountId.HasValue)
                        {
                            var oldAccount = await _db.FinancialAccounts
                                .FirstOrDefaultAsync(fa => fa.Id == payment.LinkedFinancialAccountId.Value);
                            if (oldAccount != null)
                            {
                                oldAccount.Balance -= payment.PaidAmount;
                            }
                        }

                        // Add to new account
                        var newAccount = await _db.FinancialAccounts
                            .FirstOrDefaultAsync(fa => fa.Id == dto.LinkedFinancialAccountId.Value);
                        if (newAccount != null)
                        {
                            newAccount.Balance += payment.PaidAmount;
                        }

                        payment.LinkedFinancialAccountId = dto.LinkedFinancialAccountId;
                    }
                }

                if (dto.Description != null)
                {
                    payment.Description = dto.Description;
                }

                if (dto.PaymentMethod.HasValue)
                {
                    payment.PaymentMethod = dto.PaymentMethod.Value;
                }

                await _db.SaveChangesAsync();
                await tran.CommitAsync();

                // Reload with sale details
                var updated = await _db.SalesDebtsTrackers
                    .Include(d => d.Sale)
                        .ThenInclude(s => s.Customer)
                    .Include(d => d.Sale)
                        .ThenInclude(s => s.CreditNotes)
                    .FirstOrDefaultAsync(d => d.Id == id);

                return Ok(updated);
            }
            catch (Exception ex)
            {
                await tran.RollbackAsync();
                return StatusCode(500, new { message = ex.Message, innerException = ex.InnerException?.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDebtPayment(Guid id)
        {
            var payment = await _db.SalesDebtsTrackers
                .Include(d => d.Sale)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (payment == null) return NotFound();

            using var tran = await _db.Database.BeginTransactionAsync();
            try
            {
                // Reverse the payment from sale
                payment.Sale.PaidAmount -= payment.PaidAmount;
                payment.Sale.OutstandingAmount = payment.Sale.TotalAmount - payment.Sale.PaidAmount;
                payment.Sale.IsPaid = payment.Sale.PaidAmount >= payment.Sale.TotalAmount;

                // Adjust linked account balance if applicable
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
                return StatusCode(500, new { message = ex.Message, innerException = ex.InnerException?.Message });
            }
        }
    }
}
