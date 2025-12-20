using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.FinancialAccountX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly DBContext _db;

        public TransactionsController(DBContext db)
        {
            _db = db;
        }

        // GET: api/Transactions
        [HttpGet]
        public async Task<IActionResult> GetTransactions(
            [FromQuery] Guid? fromAccountId,
            [FromQuery] Guid? toAccountId,
            [FromQuery] AccountTransactionType? type,
            [FromQuery] TransactionStatus? status,
            [FromQuery] Currency? currency,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] decimal? minAmount,
            [FromQuery] decimal? maxAmount,
            [FromQuery] string? searchTerm,
            [FromQuery] bool includeAccounts = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.Transactions
                .OrderByDescending(t => t.MovementDate)
                .AsQueryable();

            // Apply filters
            if (fromAccountId.HasValue)
            {
                query = query.Where(t => t.FromFinancialAccountId == fromAccountId.Value);
            }

            if (toAccountId.HasValue)
            {
                query = query.Where(t => t.ToFinancialAccountId == toAccountId.Value);
            }

            if (type.HasValue)
            {
                query = query.Where(t => t.Type == type.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(t => t.Status == status.Value);
            }

            if (currency.HasValue)
            {
                query = query.Where(t => t.Currency == currency.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(t => t.MovementDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(t => t.MovementDate <= endDate.Value);
            }

            if (minAmount.HasValue)
            {
                query = query.Where(t => t.Amount >= minAmount.Value);
            }

            if (maxAmount.HasValue)
            {
                query = query.Where(t => t.Amount <= maxAmount.Value);
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(t =>
                    (t.ReferenceNumber != null && t.ReferenceNumber.Contains(searchTerm)) ||
                    (t.Description != null && t.Description.Contains(searchTerm)) ||
                    (t.Notes != null && t.Notes.Contains(searchTerm)));
            }

            // Include related accounts if requested
            if (includeAccounts)
            {
                query = query
                    .Include(t => t.FromFinancialAccount)
                    .Include(t => t.ToFinancialAccount);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Validate and apply pagination
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : pageSize > 500 ? 500 : pageSize;

            var transactions = await query
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

            return Ok(new
            {
                Pagination = paginationInfo,
                Transactions = transactions
            });
        }

        // GET: api/Transactions/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTransaction(Guid id, [FromQuery] bool includeAccounts = false)
        {
            var query = _db.Transactions.AsQueryable();

            if (includeAccounts)
            {
                query = query
                    .Include(t => t.FromFinancialAccount)
                    .Include(t => t.ToFinancialAccount);
            }

            var transaction = await query.FirstOrDefaultAsync(t => t.Id == id);

            if (transaction == null)
            {
                return NotFound(new { message = "Transaction not found" });
            }

            return Ok(transaction);
        }

        // GET: api/Transactions/account/{accountId}/history
        [HttpGet("account/{accountId}/history")]
        public async Task<IActionResult> GetAccountTransactionHistory(
            Guid accountId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            // Verify account exists
            var account = await _db.FinancialAccounts.FindAsync(accountId);
            if (account == null)
            {
                return NotFound(new { message = "Financial account not found" });
            }

            var query = _db.Transactions
                .Where(t => t.FromFinancialAccountId == accountId || t.ToFinancialAccountId == accountId)
                .OrderByDescending(t => t.MovementDate)
                .AsQueryable();

            if (startDate.HasValue)
            {
                query = query.Where(t => t.MovementDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(t => t.MovementDate <= endDate.Value);
            }

            var totalCount = await query.CountAsync();

            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : pageSize > 500 ? 500 : pageSize;

            var transactions = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(t => t.FromFinancialAccount)
                .Include(t => t.ToFinancialAccount)
                .ToListAsync();

            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            // Calculate totals
            var allTransactions = await _db.Transactions
                .Where(t => t.FromFinancialAccountId == accountId || t.ToFinancialAccountId == accountId)
                .Where(t => !startDate.HasValue || t.MovementDate >= startDate.Value)
                .Where(t => !endDate.HasValue || t.MovementDate <= endDate.Value)
                .ToListAsync();

            var totalInflow = allTransactions
                .Where(t => t.ToFinancialAccountId == accountId && t.Status == TransactionStatus.COMPLETED)
                .Sum(t => t.Amount);

            var totalOutflow = allTransactions
                .Where(t => t.FromFinancialAccountId == accountId && t.Status == TransactionStatus.COMPLETED)
                .Sum(t => t.Amount);

            return Ok(new
            {
                Pagination = new
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    HasPreviousPage = page > 1,
                    HasNextPage = page < totalPages
                },
                Account = new
                {
                    account.Id,
                    account.AccountName,
                    account.Balance
                },
                Summary = new
                {
                    TotalInflow = totalInflow,
                    TotalOutflow = totalOutflow,
                    NetFlow = totalInflow - totalOutflow
                },
                Transactions = transactions
            });
        }

        // POST: api/Transactions
        [HttpPost]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDto dto)
        {
            // Validate accounts exist
            var fromAccount = await _db.FinancialAccounts.FindAsync(dto.FromFinancialAccountId);
            var toAccount = await _db.FinancialAccounts.FindAsync(dto.ToFinancialAccountId);

            if (fromAccount == null)
            {
                return NotFound(new { message = "Source financial account not found" });
            }

            if (toAccount == null)
            {
                return NotFound(new { message = "Destination financial account not found" });
            }

            // Validate same account transfer
            if (dto.FromFinancialAccountId == dto.ToFinancialAccountId)
            {
                return BadRequest(new { message = "Cannot transfer to the same account" });
            }

            // Validate sufficient balance
            if (dto.Status == TransactionStatus.COMPLETED && fromAccount.Balance < dto.Amount)
            {
                return BadRequest(new { message = "Insufficient balance in source account" });
            }

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                FromFinancialAccountId = dto.FromFinancialAccountId,
                ToFinancialAccountId = dto.ToFinancialAccountId,
                MovementDate = dto.MovementDate,
                Amount = dto.Amount,
                Type = dto.Type,
                Status = dto.Status,
                Currency = dto.Currency,
                ReferenceNumber = dto.ReferenceNumber,
                Description = dto.Description,
                Notes = dto.Notes,
                ExchangeRate = dto.ExchangeRate,
                Fees = dto.Fees,
                AddedAt = DateTime.UtcNow,
                AddedBy = dto.AddedBy,
                UpdatedAt = DateTime.UtcNow,
                LastUpdatedBy = dto.AddedBy
            };

            // Update account balances if transaction is completed
            if (dto.Status == TransactionStatus.COMPLETED)
            {
                fromAccount.Balance -= dto.Amount;
                toAccount.Balance += dto.Amount;
            }

            _db.Transactions.Add(transaction);
            await _db.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetTransaction),
                new { id = transaction.Id },
                transaction);
        }

        // PUT: api/Transactions/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTransaction(Guid id, [FromBody] UpdateTransactionDto dto)
        {
            var transaction = await _db.Transactions
                .Include(t => t.FromFinancialAccount)
                .Include(t => t.ToFinancialAccount)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (transaction == null)
            {
                return NotFound(new { message = "Transaction not found" });
            }

            // Store old values for balance adjustment
            var oldAmount = transaction.Amount;
            var oldStatus = transaction.Status;

            // Reverse old balance changes if status was completed
            if (oldStatus == TransactionStatus.COMPLETED)
            {
                transaction.FromFinancialAccount.Balance += oldAmount;
                transaction.ToFinancialAccount.Balance -= oldAmount;
            }

            // Update fields
            if (dto.MovementDate.HasValue)
                transaction.MovementDate = dto.MovementDate.Value;

            if (dto.Amount.HasValue)
                transaction.Amount = dto.Amount.Value;

            if (dto.Type.HasValue)
                transaction.Type = dto.Type.Value;

            if (dto.Status.HasValue)
                transaction.Status = dto.Status.Value;

            if (dto.Currency.HasValue)
                transaction.Currency = dto.Currency.Value;

            if (dto.ReferenceNumber != null)
                transaction.ReferenceNumber = dto.ReferenceNumber;

            if (dto.Description != null)
                transaction.Description = dto.Description;

            if (dto.Notes != null)
                transaction.Notes = dto.Notes;

            if (dto.ExchangeRate.HasValue)
                transaction.ExchangeRate = dto.ExchangeRate;

            if (dto.Fees.HasValue)
                transaction.Fees = dto.Fees;

            transaction.UpdatedAt = DateTime.UtcNow;
            transaction.LastUpdatedBy = dto.LastUpdatedBy;

            // Apply new balance changes if status is completed
            if (transaction.Status == TransactionStatus.COMPLETED)
            {
                // Check sufficient balance
                if (transaction.FromFinancialAccount.Balance < transaction.Amount)
                {
                    return BadRequest(new { message = "Insufficient balance in source account" });
                }

                transaction.FromFinancialAccount.Balance -= transaction.Amount;
                transaction.ToFinancialAccount.Balance += transaction.Amount;
            }

            await _db.SaveChangesAsync();

            return Ok(transaction);
        }

        // DELETE: api/Transactions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransaction(Guid id, [FromQuery] int deletedBy)
        {
            var transaction = await _db.Transactions
                .Include(t => t.FromFinancialAccount)
                .Include(t => t.ToFinancialAccount)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (transaction == null)
            {
                return NotFound(new { message = "Transaction not found" });
            }

            // Reverse balance changes if transaction was completed
            if (transaction.Status == TransactionStatus.COMPLETED)
            {
                transaction.FromFinancialAccount.Balance += transaction.Amount;
                transaction.ToFinancialAccount.Balance -= transaction.Amount;
            }

            // Soft delete
            transaction.DeletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Transaction deleted successfully" });
        }

        // POST: api/Transactions/{id}/reverse
        [HttpPost("{id}/reverse")]
        public async Task<IActionResult> ReverseTransaction(Guid id, [FromQuery] int reversedBy)
        {
            var transaction = await _db.Transactions
                .Include(t => t.FromFinancialAccount)
                .Include(t => t.ToFinancialAccount)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (transaction == null)
            {
                return NotFound(new { message = "Transaction not found" });
            }

            if (transaction.Status != TransactionStatus.COMPLETED)
            {
                return BadRequest(new { message = "Only completed transactions can be reversed" });
            }

            // Reverse the balances
            transaction.FromFinancialAccount.Balance += transaction.Amount;
            transaction.ToFinancialAccount.Balance -= transaction.Amount;

            // Update transaction status
            transaction.Status = TransactionStatus.REVERSED;
            transaction.UpdatedAt = DateTime.UtcNow;
            transaction.LastUpdatedBy = reversedBy;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Transaction reversed successfully",
                transaction
            });
        }

        // GET: api/Transactions/summary
        [HttpGet("summary")]
        public async Task<IActionResult> GetTransactionSummary(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] Currency? currency)
        {
            var query = _db.Transactions
                .Where(t => t.Status == TransactionStatus.COMPLETED)
                .AsQueryable();

            if (startDate.HasValue)
            {
                query = query.Where(t => t.MovementDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(t => t.MovementDate <= endDate.Value);
            }

            if (currency.HasValue)
            {
                query = query.Where(t => t.Currency == currency.Value);
            }

            var transactions = await query.ToListAsync();

            var summary = new
            {
                TotalTransactions = transactions.Count,
                TotalAmount = transactions.Sum(t => t.Amount),
                TotalFees = transactions.Sum(t => t.Fees ?? 0),
                ByType = transactions
                    .GroupBy(t => t.Type)
                    .Select(g => new
                    {
                        Type = g.Key.ToString(),
                        Count = g.Count(),
                        TotalAmount = g.Sum(t => t.Amount)
                    }),
                ByCurrency = transactions
                    .GroupBy(t => t.Currency)
                    .Select(g => new
                    {
                        Currency = g.Key.ToString(),
                        Count = g.Count(),
                        TotalAmount = g.Sum(t => t.Amount)
                    }),
                DateRange = new
                {
                    StartDate = startDate,
                    EndDate = endDate
                }
            };

            return Ok(summary);
        }
    }
}
