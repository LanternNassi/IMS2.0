using ImsServer.Models;
using ImsServer.Models.ReportingX;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IncomeStatementController : ControllerBase
    {
        private readonly DBContext _db;

        public IncomeStatementController(DBContext db)
        {
            _db = db;
        }

        // GET: api/IncomeStatement/today
        // Returns a "today" income statement (P&L) snapshot for the current UTC day.
        [HttpGet("today")]
        public async Task<IActionResult> GetToday()
        {
            var utcNow = DateTime.UtcNow;
            var start = utcNow.Date;
            var end = start.AddDays(1);

            return await GetRangeInternal(start, end);
        }

        // GET: api/IncomeStatement/range?startUtc=...&endUtc=...
        // Returns an income statement (P&L) for an arbitrary UTC period.
        [HttpGet("range")]
        public async Task<IActionResult> GetRange([FromQuery] DateTime? startUtc, [FromQuery] DateTime? endUtc)
        {
            if (!startUtc.HasValue || !endUtc.HasValue)
            {
                return BadRequest("startUtc and endUtc are required (UTC timestamps). ");
            }

            var start = startUtc.Value;
            var end = endUtc.Value;

            if (start == default || end == default)
            {
                return BadRequest("startUtc and endUtc must be valid UTC timestamps.");
            }

            if (end <= start)
            {
                return BadRequest("endUtc must be greater than startUtc.");
            }

            return await GetRangeInternal(start, end);
        }

        private async Task<IActionResult> GetRangeInternal(DateTime startUtc, DateTime endUtc)
        {
            var asOfUtc = DateTime.UtcNow;

            // Revenue (completed, non-refunded)
            var salesRevenue = await _db.Sales
                .AsNoTracking()
                .Where(s => s.SaleDate >= startUtc && s.SaleDate < endUtc)
                .Where(s => s.IsCompleted && !s.IsRefunded)
                .SumAsync(s => (decimal?)s.TotalAmount) ?? 0m;

            // Refunds (for visibility)
            var salesRefunds = await _db.Sales
                .AsNoTracking()
                .Where(s => s.SaleDate >= startUtc && s.SaleDate < endUtc)
                .Where(s => s.IsRefunded)
                .SumAsync(s => (decimal?)s.TotalAmount) ?? 0m;

            var netSalesRevenue = salesRevenue - salesRefunds;

            // Gross profit (completed, non-refunded)
            var grossProfit = await _db.Sales
                .AsNoTracking()
                .Where(s => s.SaleDate >= startUtc && s.SaleDate < endUtc)
                .Where(s => s.IsCompleted && !s.IsRefunded)
                .SumAsync(s => (decimal?)s.Profit) ?? 0m;

            var cogsEstimated = netSalesRevenue - grossProfit;

            // Operating expenses by category
            var expenseLines = await _db.Expenditures
                .AsNoTracking()
                .Where(e => e.AddedAt >= startUtc && e.AddedAt < endUtc)
                .Join(
                    _db.ExpenditureCategories.AsNoTracking(),
                    e => e.ExpenditureCategoryId,
                    c => c.Id,
                    (e, c) => new { c.Id, c.Name, e.Amount })
                .GroupBy(x => new { x.Id, x.Name })
                .Select(g => new IncomeStatementExpenseLineDto
                {
                    CategoryId = g.Key.Id,
                    CategoryName = g.Key.Name,
                    Amount = g.Sum(x => (decimal?)x.Amount) ?? 0m
                })
                .OrderByDescending(x => x.Amount)
                .ThenBy(x => x.CategoryName)
                .ToListAsync();

            var operatingExpensesTotal = expenseLines.Sum(x => x.Amount);

            var netIncomeEstimated = grossProfit - operatingExpensesTotal;

            var response = new IncomeStatementResponseDto
            {
                PeriodUtcStart = startUtc,
                PeriodUtcEnd = endUtc,
                AsOfUtc = asOfUtc,

                SalesRevenue = salesRevenue,
                SalesRefunds = salesRefunds,
                NetSalesRevenue = netSalesRevenue,

                GrossProfit = grossProfit,
                CostOfGoodsSoldEstimated = cogsEstimated,

                OperatingExpensesTotal = operatingExpensesTotal,
                OperatingExpensesByCategory = expenseLines,

                NetIncomeEstimated = netIncomeEstimated
            };

            return Ok(response);
        }
    }
}
