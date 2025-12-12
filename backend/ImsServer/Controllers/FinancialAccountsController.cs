using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.FinancialAccountX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FinancialAccountsController : ControllerBase
    {
        private readonly DBContext _db;

        public FinancialAccountsController(DBContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetFinancialAccounts(
            [FromQuery] AccountType? type,
            [FromQuery] bool? isActive,
            [FromQuery] decimal? minBalance,
            [FromQuery] decimal? maxBalance,
            [FromQuery] string? searchTerm,
            [FromQuery] bool includeMetadata = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.FinancialAccounts
                .OrderBy(fa => fa.AccountName)
                .AsQueryable();

            // Apply filters
            if (type.HasValue)
            {
                query = query.Where(fa => fa.Type == type.Value);
            }

            if (isActive.HasValue)
            {
                query = query.Where(fa => fa.IsActive == isActive.Value);
            }

            if (minBalance.HasValue)
            {
                query = query.Where(fa => fa.Balance >= minBalance.Value);
            }

            if (maxBalance.HasValue)
            {
                query = query.Where(fa => fa.Balance <= maxBalance.Value);
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(fa => 
                    fa.AccountName.Contains(searchTerm) || 
                    (fa.BankName != null && fa.BankName.Contains(searchTerm)) ||
                    (fa.AccountNumber != null && fa.AccountNumber.Contains(searchTerm)));
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Validate and apply pagination
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : pageSize > 500 ? 500 : pageSize;

            var accounts = await query
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
                    FinancialAccounts = accounts
                });
            }

            // Calculate metadata (using all filtered data)
            var allAccounts = await query.ToListAsync();
            var metadata = new
            {
                TotalBalance = allAccounts.Sum(fa => fa.Balance),
                TotalAccounts = allAccounts.Count,
                ActiveAccounts = allAccounts.Count(fa => fa.IsActive),
                InactiveAccounts = allAccounts.Count(fa => !fa.IsActive),
                AccountTypeBreakdown = allAccounts
                    .GroupBy(fa => fa.Type)
                    .Select(g => new
                    {
                        Type = g.Key.ToString(),
                        Count = g.Count(),
                        TotalBalance = g.Sum(fa => fa.Balance)
                    })
                    .ToList()
            };

            return Ok(new
            {
                Pagination = paginationInfo,
                Metadata = metadata,
                FinancialAccounts = accounts
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFinancialAccount(Guid id)
        {
            var account = await _db.FinancialAccounts
                .FirstOrDefaultAsync(fa => fa.Id == id);

            if (account == null) return NotFound();

            return Ok(account);
        }

        [HttpPost]
        public async Task<IActionResult> CreateFinancialAccount([FromBody] CreateFinancialAccountDto dto)
        {
            if (dto == null) return BadRequest("Payload required");

            // Check for duplicate account name
            var exists = await _db.FinancialAccounts
                .AnyAsync(fa => fa.AccountName.ToLower() == dto.AccountName.ToLower());

            if (exists)
            {
                return BadRequest("An account with this name already exists.");
            }

            if (dto.IsDefault){
                // Unset existing default account
                var currentDefault = await _db.FinancialAccounts
                    .FirstOrDefaultAsync(fa => fa.IsDefault);

                if (currentDefault != null)
                {
                    currentDefault.IsDefault = false;
                }
            }

            var account = new FinancialAccount
            {
                Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                AccountName = dto.AccountName,
                Type = dto.Type,
                AccountNumber = dto.AccountNumber,
                Balance = dto.Balance,
                BankName = dto.BankName,
                Description = dto.Description,
                IsActive = dto.IsActive,
                IsDefault = dto.IsDefault
            };

            _db.FinancialAccounts.Add(account);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFinancialAccount), new { id = account.Id }, account);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFinancialAccount(Guid id, [FromBody] UpdateFinancialAccountDto dto)
        {
            var account = await _db.FinancialAccounts.FindAsync(id);

            if (account == null) return NotFound();

            if (dto.AccountName != null)
            {
                // Check for duplicate name
                var exists = await _db.FinancialAccounts
                    .AnyAsync(fa => fa.Id != id && fa.AccountName.ToLower() == dto.AccountName.ToLower());

                if (exists)
                {
                    return BadRequest("An account with this name already exists.");
                }

                account.AccountName = dto.AccountName;
            }

            if (dto.AccountNumber != null) account.AccountNumber = dto.AccountNumber;
            if (dto.Balance.HasValue) account.Balance = dto.Balance.Value;
            if (dto.BankName != null) account.BankName = dto.BankName;
            if (dto.Description != null) account.Description = dto.Description;
            if (dto.IsActive.HasValue) account.IsActive = dto.IsActive.Value;
            if (dto.IsDefault.HasValue && dto.IsDefault.Value)
            {
                // Unset existing default account
                var currentDefault = await _db.FinancialAccounts
                    .FirstOrDefaultAsync(fa => fa.IsDefault && fa.Id != id);

                if (currentDefault != null)
                {
                    currentDefault.IsDefault = false;
                }

                account.IsDefault = true;
            }
            else if (dto.IsDefault.HasValue && !dto.IsDefault.Value)
            {
                account.IsDefault = false;
            }

            await _db.SaveChangesAsync();

            return Ok(account);
        }

        [HttpPut("{id}/AdjustBalance")]
        public async Task<IActionResult> AdjustBalance(Guid id, [FromBody] decimal adjustmentAmount, [FromQuery] string? description)
        {
            var account = await _db.FinancialAccounts.FindAsync(id);

            if (account == null) return NotFound();

            account.Balance += adjustmentAmount;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                Account = account,
                AdjustmentAmount = adjustmentAmount,
                Description = description
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFinancialAccount(Guid id)
        {
            var account = await _db.FinancialAccounts.FindAsync(id);

            if (account == null) return NotFound();

            _db.SoftDelete(account);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
