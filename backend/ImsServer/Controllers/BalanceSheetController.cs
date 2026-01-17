using ImsServer.Models;
using ImsServer.Models.CapitalAccountX;
using ImsServer.Models.ReportingX;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BalanceSheetController : ControllerBase
    {
        private readonly DBContext _db;

        public BalanceSheetController(DBContext db)
        {
            _db = db;
        }

        // GET: api/BalanceSheet/today
        // Returns a "today" balance sheet snapshot using current-state fields.
        [HttpGet("today")]
        public async Task<IActionResult> GetTodayBalanceSheet()
        {
            var asOfUtc = DateTime.UtcNow;

            // Assets - Cash & Bank
            var cashAccounts = await _db.FinancialAccounts
                .AsNoTracking()
                .OrderBy(fa => fa.AccountName)
                .Select(fa => new BalanceSheetCashAccountLine
                {
                    Id = fa.Id,
                    AccountName = fa.AccountName,
                    Type = fa.Type,
                    Balance = fa.Balance,
                    IsActive = fa.IsActive
                })
                .ToListAsync();

            var cashAndBankTotal = cashAccounts.Sum(a => a.Balance);

            // Assets - Accounts Receivable (calculated: TotalAmount - PaidAmount)
            var accountsReceivableTotal = await _db.Sales
                .AsNoTracking()
                .Where(s => s.WasPartialPayment && (s.PaidAmount < s.TotalAmount))
                .SumAsync(s => s.TotalAmount > s.PaidAmount ? (decimal)s.OutstandingAmount : 0m);

            // Assets - Inventory (estimated valuation: Qty * Variation.CostPrice)
            var inventoryTotalQuantity = await _db.ProductStorages
                .AsNoTracking()
                .SumAsync(ps => (decimal?)ps.Quantity) ?? 0m;

            var inventoryValue = await _db.ProductStorages
                .AsNoTracking()
                .SumAsync(ps => (decimal?)(ps.Quantity * ps.ProductVariation.CostPrice)) ?? 0m;

            // Assets - Fixed Assets (net = CurrentValue for active/undisposed)
            var fixedAssetsNet = await _db.FixedAssets
                .AsNoTracking()
                .Where(fa => fa.IsActive && fa.DisposalDate == null)
                .SumAsync(fa => (decimal?)fa.CurrentValue) ?? 0m;

            // Liabilities - Accounts Payable (calculated: GrandTotal - PaidAmount)
            var accountsPayableTotal = await _db.Purchases
                .AsNoTracking()
                .Where(p => p.WasPartialPayment && (p.GrandTotal > p.PaidAmount))
                .SumAsync(p => p.GrandTotal > p.PaidAmount ? (p.GrandTotal - p.PaidAmount) : 0m);

            // Liabilities - Taxes Payable
            var taxesPayableTotal = await _db.TaxRecords
                .AsNoTracking()
                .Where(t => !t.IsPaid)
                .SumAsync(t => (decimal?)(t.Amount + (t.PenaltyAmount ?? 0m))) ?? 0m;

            // Equity - Owner capital movements
            var ownerContributions = await _db.CapitalAccounts
                .AsNoTracking()
                .Where(ca => ca.Type == TransactionType.INITIAL_CAPITAL || ca.Type == TransactionType.ADDITIONAL_INVESTMENT)
                .SumAsync(ca => (decimal?)ca.Amount) ?? 0m;

            var ownerDrawings = await _db.CapitalAccounts
                .AsNoTracking()
                .Where(ca => ca.Type == TransactionType.WITHDRAWAL || ca.Type == TransactionType.PROFIT_DISTRIBUTION)
                .SumAsync(ca => (decimal?)ca.Amount) ?? 0m;

            var ownerCapitalNet = ownerContributions - ownerDrawings;

            // Equity - Retained earnings estimate (Sales.Profit - Expenditures.Amount)
            var profitToDate = await _db.Sales
                .AsNoTracking()
                .Where(s => s.IsCompleted && !s.IsRefunded)
                .SumAsync(s => (decimal?)s.Profit) ?? 0m;

            var profitsfromAccountsReceivables = await _db.Sales
                .AsNoTracking()
                .Where(s => !s.IsCompleted && s.WasPartialPayment)
                .SumAsync(s => (decimal?)s.Profit) ?? 0m;

            var creditNotesLossesToDamagedGoods = await _db.CreditNotes
                .AsNoTracking()
                .Where(c => c.Reason == Models.CreditNoteX.CreditNoteReason.DamagedGoods)
                .SumAsync(c => (decimal?)c.TotalAmount - (decimal?)c.ProfitAccrued) ?? 0m;

            var debitNotes = await _db.DebitNotes
                .AsNoTracking()
                .SumAsync(d => (decimal?)d.TotalAmount) ?? 0m;

            var expensesToDate = await _db.Expenditures
                .AsNoTracking()
                .SumAsync(e => (decimal?)e.Amount) ?? 0m;

            var retainedEarningsEstimated = (profitToDate + profitsfromAccountsReceivables + debitNotes) - expensesToDate - creditNotesLossesToDamagedGoods;

            var assetsTotal = cashAndBankTotal + accountsReceivableTotal + inventoryValue + fixedAssetsNet;
            var liabilitiesTotal = accountsPayableTotal + taxesPayableTotal;
            var equityTotal = ownerCapitalNet + retainedEarningsEstimated;
            var accountingDifference = assetsTotal - (liabilitiesTotal + equityTotal);

            var response = new BalanceSheetTodayResponse
            {
                AsOfUtc = asOfUtc,
                Assets = new BalanceSheetAssets
                {
                    CashAndBankTotal = cashAndBankTotal,
                    CashAccounts = cashAccounts,
                    AccountsReceivableTotal = accountsReceivableTotal,
                    InventoryTotalQuantity = inventoryTotalQuantity,
                    InventoryValue = inventoryValue,
                    FixedAssetsNet = fixedAssetsNet
                },
                Liabilities = new BalanceSheetLiabilities
                {
                    AccountsPayableTotal = accountsPayableTotal,
                    TaxesPayableTotal = taxesPayableTotal,
                    DamagedInventory = creditNotesLossesToDamagedGoods
                },
                Equity = new BalanceSheetEquity
                {
                    OwnerContributions = ownerContributions,
                    OwnerDrawings = ownerDrawings,
                    OwnerCapitalNet = ownerCapitalNet,
                    RetainedEarningsEstimated = retainedEarningsEstimated,
                    ProfitToDate = (profitToDate + profitsfromAccountsReceivables + debitNotes) - creditNotesLossesToDamagedGoods,
                    ExpensesToDate = expensesToDate,
                },
                AssetsTotal = assetsTotal,
                LiabilitiesTotal = liabilitiesTotal,
                EquityTotal = equityTotal,
                AccountingDifference = accountingDifference
            };

            return Ok(response);
        }
    }
}
