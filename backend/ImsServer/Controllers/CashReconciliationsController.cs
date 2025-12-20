using ImsServer.Models;
using ImsServer.Models.FinancialAccountX;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CashReconciliationsController : ControllerBase
    {
        private readonly DBContext _db;

        public CashReconciliationsController(DBContext db)
        {
            _db = db;
        }

        // Note: Despite the controller name, reconciliations can be captured for ANY FinancialAccount type
        // (CASH, BANK, MOBILE_MONEY, SAVINGS). We keep the existing route/table to avoid breaking changes.

        [HttpPost("open-all")]
        public async Task<IActionResult> OpenAll(
            [FromQuery] DateTime? businessDateUtc = null,
            [FromQuery] bool includeInactive = false)
        {
            var utcNow = DateTime.UtcNow;
            var businessDate = DateTime.SpecifyKind((businessDateUtc ?? utcNow).Date, DateTimeKind.Utc);

            var accountsQuery = _db.FinancialAccounts.AsNoTracking();
            if (!includeInactive)
            {
                accountsQuery = accountsQuery.Where(a => a.IsActive);
            }

            var accounts = await accountsQuery
                .Select(a => new { a.Id, a.Balance })
                .ToListAsync();

            if (accounts.Count == 0)
            {
                return Ok(new { BusinessDateUtc = businessDate, CreatedCount = 0, Message = "No financial accounts found." });
            }

            var existingAccountIds = await _db.DailyCashReconciliations
                .AsNoTracking()
                .Where(x => x.BusinessDateUtc == businessDate)
                .Select(x => x.FinancialAccountId)
                .ToListAsync();

            var existingSet = existingAccountIds.ToHashSet();
            var toCreate = accounts.Where(a => !existingSet.Contains(a.Id)).ToList();

            if (toCreate.Count == 0)
            {
                return Ok(new { BusinessDateUtc = businessDate, CreatedCount = 0, ExistingCount = existingAccountIds.Count });
            }

            var newRecords = toCreate.Select(a => new DailyCashReconciliation
            {
                Id = Guid.NewGuid(),
                FinancialAccountId = a.Id,
                BusinessDateUtc = businessDate,
                OpenedAtUtc = utcNow,
                OpeningSystemBalance = a.Balance
            }).ToList();

            _db.DailyCashReconciliations.AddRange(newRecords);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                BusinessDateUtc = businessDate,
                OpenedAtUtc = utcNow,
                CreatedCount = newRecords.Count,
                ExistingCount = existingAccountIds.Count
            });
        }
        
        [HttpGet("is-today-open")]
        public async Task<IActionResult> CheckIfTodayIsOpen()
        {
            var utcNow = DateTime.UtcNow;
            var businessDate = DateTime.SpecifyKind(utcNow.Date, DateTimeKind.Utc);

            var openRecs = await _db.DailyCashReconciliations
                .Where(x => x.BusinessDateUtc == businessDate)
                .Where(x => !x.ClosedAtUtc.HasValue)
                .ToListAsync();

            if (openRecs.Count == 0)
            {
                return Ok(new { BusinessDateUtc = businessDate, IsOpen = false, Message = "No open reconciliations found for today." });
            }
            else
            {
                return Ok(new { BusinessDateUtc = businessDate, IsOpen = true, OpenCount = openRecs.Count });
            }
        }

        [HttpPost("close-all")]
        public async Task<IActionResult> CloseAll(
            [FromQuery] DateTime? businessDateUtc = null,
            [FromQuery] bool includeInactive = false)
        {
            var utcNow = DateTime.UtcNow;
            var businessDate = DateTime.SpecifyKind((businessDateUtc ?? utcNow).Date, DateTimeKind.Utc);

            var openRecs = await _db.DailyCashReconciliations
                .Where(x => x.BusinessDateUtc == businessDate)
                .Where(x => !x.ClosedAtUtc.HasValue)
                .ToListAsync();

            if (openRecs.Count == 0)
            {
                return Ok(new { BusinessDateUtc = businessDate, ClosedCount = 0, Message = "No open reconciliations found." });
            }

            var accountsQuery = _db.FinancialAccounts.AsNoTracking();
            if (!includeInactive)
            {
                accountsQuery = accountsQuery.Where(a => a.IsActive);
            }

            var accountBalances = await accountsQuery
                .Select(a => new { a.Id, a.Balance })
                .ToDictionaryAsync(x => x.Id, x => x.Balance);

            var missingAccountIds = openRecs
                .Select(r => r.FinancialAccountId)
                .Where(id => !accountBalances.ContainsKey(id))
                .Distinct()
                .ToList();

            if (missingAccountIds.Count > 0)
            {
                return BadRequest(new
                {
                    Message = "Some reconciliations reference missing/inactive financial accounts (enable includeInactive=true, or restore accounts).",
                    MissingFinancialAccountIds = missingAccountIds
                });
            }

            foreach (var rec in openRecs)
            {
                rec.ClosedAtUtc = utcNow;
                rec.ClosingSystemBalance = accountBalances[rec.FinancialAccountId];
                rec.ClosingCountedBalance = rec.ClosingCountedBalance;
                rec.ClosingVariance = rec.ClosingCountedBalance.HasValue
                    ? rec.ClosingCountedBalance.Value - rec.ClosingSystemBalance
                    : null;
            }

            await _db.SaveChangesAsync();

            return Ok(new { BusinessDateUtc = businessDate, ClosedAtUtc = utcNow, ClosedCount = openRecs.Count });
        }

        [HttpPost("open")]
        public async Task<IActionResult> Open([FromBody] OpenDailyCashReconciliationDto dto)
        {
            if (dto.FinancialAccountId == Guid.Empty)
            {
                return BadRequest("FinancialAccountId is required.");
            }

            var utcNow = DateTime.UtcNow;
            var businessDate = DateTime.SpecifyKind((dto.BusinessDateUtc ?? utcNow).Date, DateTimeKind.Utc);

            var account = await _db.FinancialAccounts
                .FirstOrDefaultAsync(a => a.Id == dto.FinancialAccountId);

            if (account == null)
            {
                return BadRequest("Financial account not found.");
            }

            var existing = await _db.DailyCashReconciliations
                .FirstOrDefaultAsync(x => x.FinancialAccountId == dto.FinancialAccountId && x.BusinessDateUtc == businessDate);

            if (existing == null)
            {
                var openingSystem = account.Balance;
                decimal? openingVariance = dto.OpeningCountedBalance.HasValue
                    ? dto.OpeningCountedBalance.Value - openingSystem
                    : null;

                var record = new DailyCashReconciliation
                {
                    Id = Guid.NewGuid(),
                    FinancialAccountId = dto.FinancialAccountId,
                    BusinessDateUtc = businessDate,
                    OpenedAtUtc = utcNow,

                    OpeningSystemBalance = openingSystem,
                    OpeningCountedBalance = dto.OpeningCountedBalance,
                    OpeningVariance = openingVariance,
                    OpeningNotes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes
                };

                _db.DailyCashReconciliations.Add(record);
                await _db.SaveChangesAsync();

                return Ok(record);
            }

            if (existing.ClosedAtUtc.HasValue)
            {
                return Conflict("This business date is already closed for this account.");
            }

            // Allow updating counted opening / notes without changing the captured system opening.
            if (dto.OpeningCountedBalance.HasValue)
            {
                existing.OpeningCountedBalance = dto.OpeningCountedBalance;
                existing.OpeningVariance = dto.OpeningCountedBalance.Value - existing.OpeningSystemBalance;
            }

            if (!string.IsNullOrWhiteSpace(dto.Notes))
            {
                existing.OpeningNotes = dto.Notes;
            }

            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpPost("close")]
        public async Task<IActionResult> Close([FromBody] CloseDailyCashReconciliationDto dto)
        {
            if (dto.FinancialAccountId == Guid.Empty)
            {
                return BadRequest("FinancialAccountId is required.");
            }

            var utcNow = DateTime.UtcNow;
            var businessDate = DateTime.SpecifyKind((dto.BusinessDateUtc ?? utcNow).Date, DateTimeKind.Utc);

            var account = await _db.FinancialAccounts
                .FirstOrDefaultAsync(a => a.Id == dto.FinancialAccountId);

            if (account == null)
            {
                return BadRequest("Financial account not found.");
            }

            var existing = await _db.DailyCashReconciliations
                .FirstOrDefaultAsync(x => x.FinancialAccountId == dto.FinancialAccountId && x.BusinessDateUtc == businessDate);

            if (existing == null)
            {
                return BadRequest("No opening record found for this business date. Call /open first.");
            }

            if (existing.ClosedAtUtc.HasValue)
            {
                return Conflict("This business date is already closed for this account.");
            }

            var closingSystem = account.Balance;
            decimal? closingVariance = dto.ClosingCountedBalance.HasValue
                ? dto.ClosingCountedBalance.Value - closingSystem
                : null;

            existing.ClosedAtUtc = utcNow;
            existing.ClosingSystemBalance = closingSystem;
            existing.ClosingCountedBalance = dto.ClosingCountedBalance;
            existing.ClosingVariance = closingVariance;
            existing.ClosingNotes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes;

            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] Guid financialAccountId,
            [FromQuery] DateTime businessDateUtc)
        {
            if (financialAccountId == Guid.Empty)
            {
                return BadRequest("financialAccountId is required.");
            }

            if (businessDateUtc == default)
            {
                return BadRequest("businessDateUtc is required.");
            }

            var businessDate = DateTime.SpecifyKind(businessDateUtc.Date, DateTimeKind.Utc);

            var record = await _db.DailyCashReconciliations
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.FinancialAccountId == financialAccountId && x.BusinessDateUtc == businessDate);

            if (record == null)
            {
                return NotFound();
            }

            return Ok(record);
        }

        [HttpGet("range")]
        public async Task<IActionResult> GetRange(
            [FromQuery] DateTime startUtc,
            [FromQuery] DateTime endUtc,
            [FromQuery] Guid? financialAccountId = null)
        {
            if (startUtc == default || endUtc == default)
            {
                return BadRequest("startUtc and endUtc are required.");
            }

            if (endUtc <= startUtc)
            {
                return BadRequest("endUtc must be greater than startUtc.");
            }

            var start = DateTime.SpecifyKind(startUtc.Date, DateTimeKind.Utc);
            var end = DateTime.SpecifyKind(endUtc.Date, DateTimeKind.Utc);

            var q = _db.DailyCashReconciliations
                .AsNoTracking()
                .Where(x => x.BusinessDateUtc >= start && x.BusinessDateUtc < end);

            if (financialAccountId.HasValue && financialAccountId.Value != Guid.Empty)
            {
                q = q.Where(x => x.FinancialAccountId == financialAccountId.Value);
            }

            var records = await q
                .OrderBy(x => x.BusinessDateUtc)
                .ToListAsync();

            return Ok(records);
        }
    }
}
