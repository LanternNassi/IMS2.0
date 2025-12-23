using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.ExpenditureX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExpendituresController : ControllerBase
    {
        private readonly DBContext _db;

        public ExpendituresController(DBContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetExpenditures(
            [FromQuery] string? name,
            [FromQuery] Guid? categoryId,
            [FromQuery] ExpenditureType? type,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] decimal? minAmount,
            [FromQuery] decimal? maxAmount,
            [FromQuery] bool includeMetadata = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.Expenditures
                .Include(e => e.ExpenditureCategory)
                .Where(e => !e.DeletedAt.HasValue)
                .OrderByDescending(e => e.AddedAt)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(name))
            {
                query = query.Where(e => e.Name.Contains(name));
            }

            if (categoryId.HasValue)
            {
                query = query.Where(e => e.ExpenditureCategoryId == categoryId.Value);
            }

            if (type.HasValue)
            {
                query = query.Where(e => e.ExpenditureCategory.Type == type.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(e => e.AddedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(e => e.AddedAt <= endDate.Value);
            }

            if (minAmount.HasValue)
            {
                query = query.Where(e => e.Amount >= minAmount.Value);
            }

            if (maxAmount.HasValue)
            {
                query = query.Where(e => e.Amount <= maxAmount.Value);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Validate and apply pagination
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : pageSize > 500 ? 500 : pageSize;

            var expenditures = await query
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
                    Expenditures = expenditures
                });
            }

            // Calculate metadata (using all filtered data, not just current page)
            var allExpenditures = await query.ToListAsync();
            var metadata = new
            {
                TotalAmount = allExpenditures.Sum(e => e.Amount),
                TotalExpenditures = allExpenditures.Count,
                CategoryBreakdown = allExpenditures
                    .GroupBy(e => new { e.ExpenditureCategoryId, e.ExpenditureCategory.Name })
                    .Select(g => new
                    {
                        CategoryId = g.Key.ExpenditureCategoryId,
                        CategoryName = g.Key.Name,
                        Count = g.Count(),
                        TotalAmount = g.Sum(e => e.Amount)
                    })
                    .OrderByDescending(c => c.TotalAmount)
                    .ToList(),
                TypeBreakdown = allExpenditures
                    .GroupBy(e => e.ExpenditureCategory.Type)
                    .Select(g => new
                    {
                        Type = g.Key.ToString(),
                        Count = g.Count(),
                        TotalAmount = g.Sum(e => e.Amount)
                    })
                    .ToList()
            };

            return Ok(new
            {
                Pagination = paginationInfo,
                Metadata = metadata,
                Expenditures = expenditures
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetExpenditure(Guid id)
        {
            var expenditure = await _db.Expenditures
                .Include(e => e.ExpenditureCategory)
                .FirstOrDefaultAsync(e => e.Id == id && !e.DeletedAt.HasValue);

            if (expenditure == null) return NotFound();

            return Ok(expenditure);
        }

        [HttpPost]
        public async Task<IActionResult> CreateExpenditure([FromBody] CreateExpenditureDto dto)
        {
            if (dto == null) return BadRequest("Payload required");

            // Validate category
            var category = await _db.ExpenditureCategories.FindAsync(dto.ExpenditureCategoryId);
            if (category == null)
            {
                return BadRequest("Expenditure category not found. Provide a valid ExpenditureCategoryId.");
            }

            var expenditure = new Expenditure
            {
                Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                Name = dto.Name,
                Description = dto.Description ?? string.Empty,
                Amount = dto.Amount,
                ExpenditureCategoryId = dto.ExpenditureCategoryId,
                LinkedFinancialAccountId = dto.LinkedFinancialAccountId
            };

            if (dto.LinkedFinancialAccountId.HasValue)
            {

                // Update the linked financial account's balance
                var financialAccount = await _db.FinancialAccounts.FindAsync(dto.LinkedFinancialAccountId.Value);
                if (financialAccount == null)
                {
                    return BadRequest("Linked financial account not found.");
                }
                financialAccount.Balance -= dto.Amount;
            }

            _db.Expenditures.Add(expenditure);
            await _db.SaveChangesAsync();

            // Reload with category
            var created = await _db.Expenditures
                .Include(e => e.ExpenditureCategory)
                .FirstOrDefaultAsync(e => e.Id == expenditure.Id);

            return CreatedAtAction(nameof(GetExpenditure), new { id = expenditure.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateExpenditure(Guid id, [FromBody] UpdateExpenditureDto dto)
        {
            var expenditure = await _db.Expenditures.FindAsync(id);
            if (expenditure == null) return NotFound();

            // Validate category if changed
            if (dto.ExpenditureCategoryId.HasValue && dto.ExpenditureCategoryId.Value != expenditure.ExpenditureCategoryId)
            {
                var category = await _db.ExpenditureCategories.FindAsync(dto.ExpenditureCategoryId.Value);
                if (category == null)
                {
                    return BadRequest("Expenditure category not found.");
                }
                expenditure.ExpenditureCategoryId = dto.ExpenditureCategoryId.Value;
            }

            if (!string.IsNullOrEmpty(dto.Name))
            {
                expenditure.Name = dto.Name;
            }

            if (dto.Description != null)
            {
                expenditure.Description = dto.Description;
            }

            if (dto.Amount.HasValue)
            {
                expenditure.Amount = dto.Amount.Value;
            }

            await _db.SaveChangesAsync();

            // Reload with category
            var updated = await _db.Expenditures
                .Include(e => e.ExpenditureCategory)
                .FirstOrDefaultAsync(e => e.Id == id);

            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExpenditure(Guid id)
        {
            var expenditure = await _db.Expenditures.FindAsync(id);
            if (expenditure == null) return NotFound();

            _db.SoftDelete(expenditure);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
