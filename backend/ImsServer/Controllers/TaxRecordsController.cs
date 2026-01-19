using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.TaxRecordX;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TaxRecordsController : ControllerBase
    {
        private readonly DBContext _db;

        public TaxRecordsController(DBContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetTaxRecords(
            [FromQuery] TaxType? type,
            [FromQuery] bool? isPaid,
            [FromQuery] DateTime? dueDateAfter,
            [FromQuery] DateTime? dueDateBefore,
            [FromQuery] DateTime? periodStart,
            [FromQuery] DateTime? periodEnd,
            [FromQuery] decimal? minAmount,
            [FromQuery] decimal? maxAmount,
            [FromQuery] bool includeMetadata = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _db.TaxRecords
                .OrderByDescending(tr => tr.DueDate)
                .AsQueryable();

            // Apply filters
            if (type.HasValue)
            {
                query = query.Where(tr => tr.Type == type.Value);
            }

            if (isPaid.HasValue)
            {
                query = query.Where(tr => tr.IsPaid == isPaid.Value);
            }

            if (dueDateAfter.HasValue)
            {
                query = query.Where(tr => tr.DueDate >= dueDateAfter.Value);
            }

            if (dueDateBefore.HasValue)
            {
                query = query.Where(tr => tr.DueDate <= dueDateBefore.Value);
            }

            if (periodStart.HasValue)
            {
                query = query.Where(tr => tr.PeriodStart >= periodStart.Value);
            }

            if (periodEnd.HasValue)
            {
                query = query.Where(tr => tr.PeriodEnd <= periodEnd.Value);
            }

            if (minAmount.HasValue)
            {
                query = query.Where(tr => tr.Amount >= minAmount.Value);
            }

            if (maxAmount.HasValue)
            {
                query = query.Where(tr => tr.Amount <= maxAmount.Value);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Validate and apply pagination
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 50 : pageSize > 500 ? 500 : pageSize;

            var taxRecords = await query
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
                    TaxRecords = taxRecords
                });
            }

            // Calculate metadata (using all filtered data)
            var allTaxRecords = await query.ToListAsync();
            var today = DateTime.Now;

            var metadata = new
            {
                TotalTaxAmount = allTaxRecords.Sum(tr => tr.Amount),
                TotalPaidAmount = allTaxRecords.Where(tr => tr.IsPaid).Sum(tr => tr.Amount),
                TotalUnpaidAmount = allTaxRecords.Where(tr => !tr.IsPaid).Sum(tr => tr.Amount),
                TotalPenalties = allTaxRecords.Sum(tr => tr.PenaltyAmount ?? 0),
                TotalRecords = allTaxRecords.Count,
                PaidRecords = allTaxRecords.Count(tr => tr.IsPaid),
                UnpaidRecords = allTaxRecords.Count(tr => !tr.IsPaid),
                OverdueRecords = allTaxRecords.Count(tr => !tr.IsPaid && tr.DueDate < today),
                TypeBreakdown = allTaxRecords
                    .GroupBy(tr => tr.Type)
                    .Select(g => new
                    {
                        Type = g.Key.ToString(),
                        Count = g.Count(),
                        TotalAmount = g.Sum(tr => tr.Amount),
                        PaidAmount = g.Where(tr => tr.IsPaid).Sum(tr => tr.Amount),
                        UnpaidAmount = g.Where(tr => !tr.IsPaid).Sum(tr => tr.Amount)
                    })
                    .ToList(),
                OverdueTaxes = allTaxRecords
                    .Where(tr => !tr.IsPaid && tr.DueDate < today)
                    .Select(tr => new
                    {
                        tr.Id,
                        tr.Type,
                        tr.Amount,
                        tr.DueDate,
                        DaysOverdue = (today - tr.DueDate).Days,
                        tr.PenaltyAmount,
                        tr.ReferenceNumber
                    })
                    .OrderBy(tr => tr.DueDate)
                    .ToList()
            };

            return Ok(new
            {
                Pagination = paginationInfo,
                Metadata = metadata,
                TaxRecords = taxRecords
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTaxRecord(Guid id)
        {
            var taxRecord = await _db.TaxRecords
                .FirstOrDefaultAsync(tr => tr.Id == id);

            if (taxRecord == null) return NotFound();

            var daysUntilDue = (taxRecord.DueDate - DateTime.Now).Days;
            var isOverdue = !taxRecord.IsPaid && taxRecord.DueDate < DateTime.Now;

            return Ok(new
            {
                TaxRecord = taxRecord,
                Status = new
                {
                    IsOverdue = isOverdue,
                    DaysUntilDue = taxRecord.IsPaid ? null : (int?)daysUntilDue,
                    DaysOverdue = isOverdue ? Math.Abs(daysUntilDue) : 0
                }
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateTaxRecord([FromBody] CreateTaxRecordDto dto)
        {
            if (dto == null) return BadRequest("Payload required");

            var taxRecord = new TaxRecord
            {
                Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                Type = dto.Type,
                Amount = dto.Amount,
                DueDate = dto.DueDate,
                ReferenceNumber = dto.ReferenceNumber,
                Description = dto.Description,
                PeriodStart = dto.PeriodStart,
                PeriodEnd = dto.PeriodEnd,
                IsPaid = false
            };

            _db.TaxRecords.Add(taxRecord);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTaxRecord), new { id = taxRecord.Id }, taxRecord);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTaxRecord(Guid id, [FromBody] UpdateTaxRecordDto dto)
        {
            var taxRecord = await _db.TaxRecords.FindAsync(id);

            if (taxRecord == null) return NotFound();

            if (dto.Amount.HasValue) taxRecord.Amount = dto.Amount.Value;
            if (dto.DueDate.HasValue) taxRecord.DueDate = dto.DueDate.Value;
            if (dto.IsPaid.HasValue) taxRecord.IsPaid = dto.IsPaid.Value;
            if (dto.PaidDate.HasValue) taxRecord.PaidDate = dto.PaidDate.Value;
            if (dto.ReferenceNumber != null) taxRecord.ReferenceNumber = dto.ReferenceNumber;
            if (dto.Description != null) taxRecord.Description = dto.Description;
            if (dto.PenaltyAmount.HasValue) taxRecord.PenaltyAmount = dto.PenaltyAmount.Value;

            await _db.SaveChangesAsync();

            return Ok(taxRecord);
        }

        [HttpPut("{id}/MarkAsPaid")]
        public async Task<IActionResult> MarkAsPaid(Guid id, [FromQuery] DateTime? paidDate)
        {
            var taxRecord = await _db.TaxRecords.FindAsync(id);

            if (taxRecord == null) return NotFound();

            if (taxRecord.IsPaid)
            {
                return BadRequest("This tax record is already marked as paid.");
            }

            taxRecord.IsPaid = true;
            taxRecord.PaidDate = paidDate ?? DateTime.Now;

            await _db.SaveChangesAsync();

            return Ok(taxRecord);
        }

        [HttpPut("{id}/AddPenalty")]
        public async Task<IActionResult> AddPenalty(Guid id, [FromQuery] decimal penaltyAmount)
        {
            var taxRecord = await _db.TaxRecords.FindAsync(id);

            if (taxRecord == null) return NotFound();

            taxRecord.PenaltyAmount = (taxRecord.PenaltyAmount ?? 0) + penaltyAmount;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                TaxRecord = taxRecord,
                TotalOwed = taxRecord.Amount + (taxRecord.PenaltyAmount ?? 0)
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTaxRecord(Guid id)
        {
            var taxRecord = await _db.TaxRecords.FindAsync(id);

            if (taxRecord == null) return NotFound();

            _db.SoftDelete(taxRecord);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
