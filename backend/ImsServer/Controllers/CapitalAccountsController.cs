using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.CapitalAccountX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CapitalAccountsController : ControllerBase
    {
        private readonly DBContext _db;

        public CapitalAccountsController(DBContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetCapitalAccounts(
            [FromQuery] Guid? ownerId,
            [FromQuery] TransactionType? type,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] decimal? minAmount,
            [FromQuery] decimal? maxAmount,
            [FromQuery] bool includeMetadata = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.CapitalAccounts
                .Include(ca => ca.Owner)
                .Include(ca => ca.LinkedFinancialAccount)
                .OrderByDescending(ca => ca.TransactionDate)
                .AsQueryable();

            // Apply filters
            if (ownerId.HasValue)
            {
                query = query.Where(ca => ca.OwnerId == ownerId.Value);
            }

            if (type.HasValue)
            {
                query = query.Where(ca => ca.Type == type.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(ca => ca.TransactionDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(ca => ca.TransactionDate <= endDate.Value);
            }

            if (minAmount.HasValue)
            {
                query = query.Where(ca => ca.Amount >= minAmount.Value);
            }

            if (maxAmount.HasValue)
            {
                query = query.Where(ca => ca.Amount <= maxAmount.Value);
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

            if (!includeMetadata)
            {
                return Ok(new
                {
                    Pagination = paginationInfo,
                    CapitalTransactions = transactions
                });
            }

            // Calculate metadata (using all filtered data)
            var allTransactions = await query.ToListAsync();
            var metadata = new
            {
                TotalCapital = allTransactions
                    .Where(ca => ca.Type == TransactionType.INITIAL_CAPITAL || ca.Type == TransactionType.ADDITIONAL_INVESTMENT)
                    .Sum(ca => ca.Amount),
                TotalWithdrawals = allTransactions
                    .Where(ca => ca.Type == TransactionType.WITHDRAWAL)
                    .Sum(ca => ca.Amount),
                TotalDistributions = allTransactions
                    .Where(ca => ca.Type == TransactionType.PROFIT_DISTRIBUTION)
                    .Sum(ca => ca.Amount),
                NetEquity = allTransactions
                    .Where(ca => ca.Type == TransactionType.INITIAL_CAPITAL || ca.Type == TransactionType.ADDITIONAL_INVESTMENT)
                    .Sum(ca => ca.Amount) - 
                    allTransactions
                    .Where(ca => ca.Type == TransactionType.WITHDRAWAL || ca.Type == TransactionType.PROFIT_DISTRIBUTION)
                    .Sum(ca => ca.Amount),
                TransactionCount = allTransactions.Count,
                TypeBreakdown = allTransactions
                    .GroupBy(ca => ca.Type)
                    .Select(g => new
                    {
                        Type = g.Key.ToString(),
                        Count = g.Count(),
                        TotalAmount = g.Sum(ca => ca.Amount)
                    })
                    .ToList(),
                OwnerBreakdown = allTransactions
                    .GroupBy(ca => new { ca.OwnerId, ca.Owner.Username })
                    .Select(g => new
                    {
                        OwnerId = g.Key.OwnerId,
                        OwnerName = g.Key.Username,
                        TotalInvested = g.Where(ca => ca.Type == TransactionType.INITIAL_CAPITAL || ca.Type == TransactionType.ADDITIONAL_INVESTMENT)
                            .Sum(ca => ca.Amount),
                        TotalWithdrawn = g.Where(ca => ca.Type == TransactionType.WITHDRAWAL || ca.Type == TransactionType.PROFIT_DISTRIBUTION)
                            .Sum(ca => ca.Amount),
                        NetContribution = g.Where(ca => ca.Type == TransactionType.INITIAL_CAPITAL || ca.Type == TransactionType.ADDITIONAL_INVESTMENT)
                            .Sum(ca => ca.Amount) - 
                            g.Where(ca => ca.Type == TransactionType.WITHDRAWAL || ca.Type == TransactionType.PROFIT_DISTRIBUTION)
                            .Sum(ca => ca.Amount)
                    })
                    .ToList()
            };

            return Ok(new
            {
                Pagination = paginationInfo,
                Metadata = metadata,
                CapitalTransactions = transactions
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCapitalAccount(Guid id)
        {
            var transaction = await _db.CapitalAccounts
                .Include(ca => ca.Owner)
                .Include(ca => ca.LinkedFinancialAccount)
                .FirstOrDefaultAsync(ca => ca.Id == id);

            if (transaction == null) return NotFound();

            return Ok(transaction);
        }

        [HttpGet("ByOwner/{ownerId}")]
        public async Task<IActionResult> GetTransactionsByOwner(Guid ownerId)
        {
            var owner = await _db.Users.FindAsync(ownerId);

            if (owner == null) return NotFound("Owner not found");

            var transactions = await _db.CapitalAccounts
                .Where(ca => ca.OwnerId == ownerId)
                .OrderByDescending(ca => ca.TransactionDate)
                .ToListAsync();

            var totalInvested = transactions
                .Where(ca => ca.Type == TransactionType.INITIAL_CAPITAL || ca.Type == TransactionType.ADDITIONAL_INVESTMENT)
                .Sum(ca => ca.Amount);

            var totalWithdrawn = transactions
                .Where(ca => ca.Type == TransactionType.WITHDRAWAL || ca.Type == TransactionType.PROFIT_DISTRIBUTION)
                .Sum(ca => ca.Amount);

            return Ok(new
            {
                Owner = new
                {
                    owner.Id,
                    Name = owner.Username,
                    owner.Email,
                    Phone = owner.Telephone
                },
                Summary = new
                {
                    TotalInvested = totalInvested,
                    TotalWithdrawn = totalWithdrawn,
                    NetEquity = totalInvested - totalWithdrawn,
                    TransactionCount = transactions.Count,
                    LastTransaction = transactions.FirstOrDefault()?.TransactionDate
                },
                Transactions = transactions
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateCapitalAccount([FromBody] CreateCapitalAccountDto dto)
        {
            if (dto == null) return BadRequest("Payload required");

            // Validate owner exists
            var owner = await _db.Users.FindAsync(dto.OwnerId);
            if (owner == null)
            {
                return BadRequest("Owner not found. Provide a valid OwnerId.");
            }

            var transaction = new CapitalAccount
            {
                Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                OwnerId = dto.OwnerId,
                Type = dto.Type,
                Amount = dto.Amount,
                TransactionDate = dto.TransactionDate == default ? DateTime.Now : dto.TransactionDate,
                Description = dto.Description,
                ReferenceNumber = dto.ReferenceNumber,
                LinkedFinancialAccountId = dto.LinkedFinancialAccountId
            };

            // Also add balance to linked financial account if provided
            if (dto.LinkedFinancialAccountId.HasValue)
            {
                var linkedAccount = await _db.FinancialAccounts.FindAsync(dto.LinkedFinancialAccountId.Value);
                if (linkedAccount != null)
                {
                    // Adjust balance based on transaction type
                    if (dto.Type == TransactionType.INITIAL_CAPITAL || dto.Type == TransactionType.ADDITIONAL_INVESTMENT)
                    {
                        linkedAccount.Balance += dto.Amount;
                    }
                    else if (dto.Type == TransactionType.WITHDRAWAL || dto.Type == TransactionType.PROFIT_DISTRIBUTION)
                    {
                        linkedAccount.Balance -= dto.Amount;
                    }
                }
            }

            _db.CapitalAccounts.Add(transaction);
            await _db.SaveChangesAsync();

            // Reload with navigation properties
            var savedTransaction = await _db.CapitalAccounts
                .Include(ca => ca.Owner)
                .FirstOrDefaultAsync(ca => ca.Id == transaction.Id);

            return CreatedAtAction(nameof(GetCapitalAccount), new { id = transaction.Id }, savedTransaction);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCapitalAccount(Guid id, [FromBody] UpdateCapitalAccountDto dto)
        {
            var transaction = await _db.CapitalAccounts
                .Include(ca => ca.Owner)
                .FirstOrDefaultAsync(ca => ca.Id == id);

            if (transaction == null) return NotFound();

            if (dto.Amount.HasValue) transaction.Amount = dto.Amount.Value;
            if (dto.TransactionDate.HasValue) transaction.TransactionDate = dto.TransactionDate.Value;
            if (dto.Description != null) transaction.Description = dto.Description;
            if (dto.ReferenceNumber != null) transaction.ReferenceNumber = dto.ReferenceNumber;

            await _db.SaveChangesAsync();

            return Ok(transaction);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCapitalAccount(Guid id)
        {
            var transaction = await _db.CapitalAccounts.FindAsync(id);

            if (transaction == null) return NotFound();

            _db.SoftDelete(transaction);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
