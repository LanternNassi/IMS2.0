using ImsServer.Models;
using ImsServer.Models.CapitalAccountX;
using ImsServer.Models.FixedAssetX;
using ImsServer.Models.FinancialAccountX;
using ImsServer.Models.ReportingX;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CashFlowController : ControllerBase
    {
        private readonly DBContext _db;

        public CashFlowController(DBContext db)
        {
            _db = db;
        }

        // Company cash flow (cash + cash equivalents) for the current UTC day.
        // Note: Internal transfers between included accounts (e.g., BANK -> CASH drawer) are excluded at the company level.
        [HttpGet("company/today")]
        public async Task<IActionResult> GetCompanyToday([FromQuery] Guid? financialAccountId = null)
        {
            return await GetTodayInternal(
                includedTypes: new[] { AccountType.CASH, AccountType.BANK, AccountType.MOBILE_MONEY, AccountType.SAVINGS },
                financialAccountId: financialAccountId,
                enforceCashWhenFilteringById: false,
                missingAccountMessage: "Financial account not found (or not included in company cash/cash-equivalents pool). Provide a valid financialAccountId.");
        }

        // Company cash flow (cash + cash equivalents) for an arbitrary UTC period.
        // Note: Internal transfers between included accounts are excluded at the company level.
        [HttpGet("company/range")]
        public async Task<IActionResult> GetCompanyRange(
            [FromQuery] DateTime? startUtc,
            [FromQuery] DateTime? endUtc,
            [FromQuery] bool includeApproxBalances = false,
            [FromQuery] Guid? financialAccountId = null)
        {
            return await GetRangeInternal(
                startUtc: startUtc,
                endUtc: endUtc,
                includeApproxBalances: includeApproxBalances,
                includedTypes: new[] { AccountType.CASH, AccountType.BANK, AccountType.MOBILE_MONEY, AccountType.SAVINGS },
                financialAccountId: financialAccountId,
                enforceCashWhenFilteringById: false,
                missingAccountMessage: "Financial account not found (or not included in company cash/cash-equivalents pool). Provide a valid financialAccountId.");
        }

        // Unified company cash flow statement for an arbitrary UTC period.
        // Returns per-account detail for ALL financial accounts (including internal transfers per account),
        // while opening/closing balances are populated when DailyCashReconciliations exist for an account.
        [HttpGet("company/statement")]
        public async Task<IActionResult> GetCompanyStatement(
            [FromQuery] DateTime? startUtc,
            [FromQuery] DateTime? endUtc,
            [FromQuery] bool includeApproxBalances = false)
        {
            if (!startUtc.HasValue || !endUtc.HasValue)
            {
                return BadRequest("startUtc and endUtc are required (UTC timestamps). Use startUtc=YYYY-MM-DDT00:00:00Z&endUtc=YYYY-MM-(DD+1)T00:00:00Z for whole-day statements.");
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

            var utcNow = DateTime.UtcNow;

            if (includeApproxBalances && end > utcNow)
            {
                // Allow the common "today" shape when the client requests a whole-day range
                // (00:00 -> next 00:00) even though endUtc is technically in the future.
                // We still reject true future ranges because "approx balances" are based on current balances.
                var startIsDayBoundary = start.TimeOfDay == TimeSpan.Zero;
                var endIsDayBoundary = end.TimeOfDay == TimeSpan.Zero;
                var isTodayWholeDayRange = startIsDayBoundary
                    && endIsDayBoundary
                    && start.Date == utcNow.Date
                    && end.Date == start.Date.AddDays(1);

                if (!isTodayWholeDayRange)
                {
                    return BadRequest("endUtc cannot be in the future when includeApproxBalances=true (except for a whole-day 'today' range: startUtc=00:00Z and endUtc=next 00:00Z). ");
                }
            }

            var accounts = await _db.FinancialAccounts
                .Select(fa => new CashAccountBalanceDto
                {
                    Id = fa.Id,
                    AccountName = fa.AccountName,
                    Type = fa.Type,
                    Balance = fa.Balance
                })
                .ToListAsync();

            var accountIds = accounts.Select(a => a.Id).ToList();
            var cashAccountIds = accounts.Where(a => a.Type == AccountType.CASH).Select(a => a.Id).ToList();

            static decimal GetDictValue(Dictionary<Guid, decimal> dict, Guid key)
                => dict.TryGetValue(key, out var v) ? v : 0m;

            // Linked per-account aggregates
            var salesRealTimeByAccount = await _db.Sales
                .Where(s => s.SaleDate >= start && s.SaleDate < end)
                .Where(s => s.WasPartialPayment != true && s.IsRefunded != true)
                .Where(s => s.LinkedFinancialAccountId.HasValue)
                .GroupBy(s => s.LinkedFinancialAccountId!.Value)
                .Select(g => new { AccountId = g.Key, Amount = g.Sum(x => (decimal?)x.PaidAmount) ?? 0m })
                .ToDictionaryAsync(x => x.AccountId, x => x.Amount);

            var salesCollectionsByAccount = await _db.SalesDebtsTrackers
                .Where(p => p.DebtType == DebtType.Receivable)
                .Where(p => p.AddedAt >= start && p.AddedAt < end && p.Sale.IsRefunded != true)
                .Where(p => p.LinkedFinancialAccountId.HasValue)
                .GroupBy(p => p.LinkedFinancialAccountId!.Value)
                .Select(g => new { AccountId = g.Key, Amount = g.Sum(x => (decimal?)x.PaidAmount) ?? 0m })
                .ToDictionaryAsync(x => x.AccountId, x => x.Amount);

            var purchasePaymentsByAccount = await _db.PurchaseDebtTrackers
                .Where(p => p.PaymentDate >= start && p.PaymentDate < end)
                .Where(p => p.LinkedFinancialAccountId.HasValue)
                .GroupBy(p => p.LinkedFinancialAccountId!.Value)
                .Select(g => new { AccountId = g.Key, Amount = g.Sum(x => (decimal?)x.PaidAmount) ?? 0m })
                .ToDictionaryAsync(x => x.AccountId, x => x.Amount);

            var expendituresByAccount = await _db.Expenditures
                .Where(e => e.AddedAt >= start && e.AddedAt < end)
                .Where(e => e.LinkedFinancialAccountId.HasValue)
                .GroupBy(e => e.LinkedFinancialAccountId!.Value)
                .Select(g => new { AccountId = g.Key, Amount = g.Sum(x => (decimal?)x.Amount) ?? 0m })
                .ToDictionaryAsync(x => x.AccountId, x => x.Amount);

            var fixedAssetsByAccount = await _db.FixedAssets
                .Where(a => a.AddedAt >= start && a.AddedAt < end)
                .Where(a => a.LinkedFinancialAccountId.HasValue)
                .GroupBy(a => a.LinkedFinancialAccountId!.Value)
                .Select(g => new { AccountId = g.Key, Amount = g.Sum(x => (decimal?)x.PurchasePrice) ?? 0m })
                .ToDictionaryAsync(x => x.AccountId, x => x.Amount);

            var capitalContribByAccount = await _db.CapitalAccounts
                .Where(ca => ca.TransactionDate >= start && ca.TransactionDate < end)
                .Where(ca => ca.Type == TransactionType.INITIAL_CAPITAL || ca.Type == TransactionType.ADDITIONAL_INVESTMENT)
                .Where(ca => ca.LinkedFinancialAccountId.HasValue)
                .GroupBy(ca => ca.LinkedFinancialAccountId!.Value)
                .Select(g => new { AccountId = g.Key, Amount = g.Sum(x => (decimal?)x.Amount) ?? 0m })
                .ToDictionaryAsync(x => x.AccountId, x => x.Amount);

            var capitalWithdrawByAccount = await _db.CapitalAccounts
                .Where(ca => ca.TransactionDate >= start && ca.TransactionDate < end)
                .Where(ca => ca.Type == TransactionType.WITHDRAWAL || ca.Type == TransactionType.PROFIT_DISTRIBUTION)
                .Where(ca => ca.LinkedFinancialAccountId.HasValue)
                .GroupBy(ca => ca.LinkedFinancialAccountId!.Value)
                .Select(g => new { AccountId = g.Key, Amount = g.Sum(x => (decimal?)x.Amount) ?? 0m })
                .ToDictionaryAsync(x => x.AccountId, x => x.Amount);

            // Internal transfers per account (Transaction is always between two company accounts)
            var transfersInByAccount = await _db.Transactions
                .Where(t => t.Status == TransactionStatus.COMPLETED)
                .Where(t => t.MovementDate >= start && t.MovementDate < end)
                .GroupBy(t => t.ToFinancialAccountId)
                .Select(g => new { AccountId = g.Key, Amount = g.Sum(x => (decimal?)x.Amount) ?? 0m })
                .ToDictionaryAsync(x => x.AccountId, x => x.Amount);

            var transfersOutByAccount = await _db.Transactions
                .Where(t => t.Status == TransactionStatus.COMPLETED)
                .Where(t => t.MovementDate >= start && t.MovementDate < end)
                .GroupBy(t => t.FromFinancialAccountId)
                .Select(g => new { AccountId = g.Key, Amount = g.Sum(x => (decimal?)x.Amount) ?? 0m })
                .ToDictionaryAsync(x => x.AccountId, x => x.Amount);

            // Unlinked totals (not attributable to a financial account)
            var unlinkedSalesRealTimeCollections = await _db.Sales
                .Where(s => s.SaleDate >= start && s.SaleDate < end)
                .Where(s => s.WasPartialPayment != true && s.IsRefunded != true)
                .Where(s => !s.LinkedFinancialAccountId.HasValue)
                .SumAsync(s => (decimal?)s.PaidAmount) ?? 0m;

            var unlinkedSalesCollections = await _db.SalesDebtsTrackers
                .Where(p => p.DebtType == DebtType.Receivable)
                .Where(p => p.AddedAt >= start && p.AddedAt < end && p.Sale.IsRefunded != true)
                .Where(p => !p.LinkedFinancialAccountId.HasValue)
                .SumAsync(p => (decimal?)p.PaidAmount) ?? 0m;

            var unlinkedPurchasePayments = await _db.PurchaseDebtTrackers
                .Where(p => p.PaymentDate >= start && p.PaymentDate < end)
                .Where(p => !p.LinkedFinancialAccountId.HasValue)
                .SumAsync(p => (decimal?)p.PaidAmount) ?? 0m;

            var unlinkedExpenditures = await _db.Expenditures
                .Where(e => e.AddedAt >= start && e.AddedAt < end)
                .Where(e => !e.LinkedFinancialAccountId.HasValue)
                .SumAsync(e => (decimal?)e.Amount) ?? 0m;

            var unlinkedFixedAssets = await _db.FixedAssets
                .Where(a => a.AddedAt >= start && a.AddedAt < end)
                .Where(a => !a.LinkedFinancialAccountId.HasValue)
                .SumAsync(a => (decimal?)a.PurchasePrice) ?? 0m;

            var unlinkedCapitalContrib = await _db.CapitalAccounts
                .Where(ca => ca.TransactionDate >= start && ca.TransactionDate < end)
                .Where(ca => ca.Type == TransactionType.INITIAL_CAPITAL || ca.Type == TransactionType.ADDITIONAL_INVESTMENT)
                .Where(ca => !ca.LinkedFinancialAccountId.HasValue)
                .SumAsync(ca => (decimal?)ca.Amount) ?? 0m;

            var unlinkedCapitalWithdraw = await _db.CapitalAccounts
                .Where(ca => ca.TransactionDate >= start && ca.TransactionDate < end)
                .Where(ca => ca.Type == TransactionType.WITHDRAWAL || ca.Type == TransactionType.PROFIT_DISTRIBUTION)
                .Where(ca => !ca.LinkedFinancialAccountId.HasValue)
                .SumAsync(ca => (decimal?)ca.Amount) ?? 0m;

            // Company totals (exclude internal transfers)
            var totalSalesCollections = salesCollectionsByAccount.Values.Sum() + salesRealTimeByAccount.Values.Sum();
            var totalCapitalContrib = capitalContribByAccount.Values.Sum();
            var totalPurchasePayments = purchasePaymentsByAccount.Values.Sum();
            var totalExpenditures = expendituresByAccount.Values.Sum();
            var totalFixedAssets = fixedAssetsByAccount.Values.Sum();
            var totalCapitalWithdrawals = capitalWithdrawByAccount.Values.Sum();

            var totalInflows = totalSalesCollections + totalCapitalContrib;
            var totalOutflows = totalPurchasePayments + totalExpenditures + totalFixedAssets + totalCapitalWithdrawals;
            var net = totalInflows - totalOutflows;

            // CASH opening/closing balances (only CASH accounts are reconciled)
            DateTime NormalizeBusinessDateUtc(DateTime utc) => DateTime.SpecifyKind(utc.Date, DateTimeKind.Utc);
            decimal GetOpeningValue(DailyCashReconciliation r) => r.OpeningCountedBalance ?? r.OpeningSystemBalance;
            static bool TryGetClosingValue(DailyCashReconciliation r, out decimal value)
            {
                if (!r.ClosedAtUtc.HasValue)
                {
                    value = 0m;
                    return false;
                }

                if (r.ClosingCountedBalance.HasValue)
                {
                    value = r.ClosingCountedBalance.Value;
                    return true;
                }

                if (r.ClosingSystemBalance.HasValue)
                {
                    value = r.ClosingSystemBalance.Value;
                    return true;
                }

                value = 0m;
                return false;
            }

            async Task<(bool hasExactOpening, decimal opening, bool hasExactClosing, decimal closing)> TryGetExactCashBalancesAsync()
            {
                if (cashAccountIds.Count == 0)
                {
                    return (true, 0m, true, 0m);
                }

                var startIsDayBoundary = start.TimeOfDay == TimeSpan.Zero;
                var endIsDayBoundary = end.TimeOfDay == TimeSpan.Zero;

                DateTime? openingBusinessDate = startIsDayBoundary ? NormalizeBusinessDateUtc(start) : null;
                DateTime? closingBusinessDate = endIsDayBoundary ? NormalizeBusinessDateUtc(end.AddDays(-1)) : null;

                if (!openingBusinessDate.HasValue && !closingBusinessDate.HasValue)
                {
                    return (false, 0m, false, 0m);
                }

                var neededDates = new List<DateTime>();
                if (openingBusinessDate.HasValue) neededDates.Add(openingBusinessDate.Value);
                if (closingBusinessDate.HasValue && (!openingBusinessDate.HasValue || closingBusinessDate.Value != openingBusinessDate.Value))
                {
                    neededDates.Add(closingBusinessDate.Value);
                }

                var recs = await _db.DailyCashReconciliations
                    .Where(r => cashAccountIds.Contains(r.FinancialAccountId))
                    .Where(r => neededDates.Contains(r.BusinessDateUtc))
                    .ToListAsync();

                var hasExactOpening = false;
                var opening = 0m;

                var hasExactClosing = false;
                var closing = 0m;

                if (openingBusinessDate.HasValue)
                {
                    var openingRecs = recs.Where(r => r.BusinessDateUtc == openingBusinessDate.Value).ToList();
                    if (openingRecs.Count == cashAccountIds.Count)
                    {
                        hasExactOpening = true;
                        opening = openingRecs.Sum(GetOpeningValue);
                    }
                }

                if (closingBusinessDate.HasValue)
                {
                    var closingRecs = recs.Where(r => r.BusinessDateUtc == closingBusinessDate.Value).ToList();
                    if (closingRecs.Count == cashAccountIds.Count)
                    {
                        var allHaveClosing = true;
                        var closingSum = 0m;

                        foreach (var r in closingRecs)
                        {
                            if (!TryGetClosingValue(r, out var v))
                            {
                                allHaveClosing = false;
                                break;
                            }

                            closingSum += v;
                        }

                        if (allHaveClosing)
                        {
                            hasExactClosing = true;
                            closing = closingSum;
                        }
                    }
                }

                return (hasExactOpening, opening, hasExactClosing, closing);
            }

            async Task<decimal> ComputeCashNetAsync(List<Guid> cashIds, DateTime fromUtc, DateTime toUtc)
            {
                if (cashIds.Count == 0)
                {
                    return 0m;
                }

                // Inflows into CASH
                var salesRealTimeNet = await _db.Sales
                    .Where(s => s.SaleDate >= fromUtc && s.SaleDate < toUtc)
                    .Where(s => s.WasPartialPayment != true && s.IsRefunded != true)
                    .Where(s => s.LinkedFinancialAccountId.HasValue && cashIds.Contains(s.LinkedFinancialAccountId.Value))
                    .SumAsync(s => (decimal?)s.PaidAmount) ?? 0m;

                var salesCollectionsNet = await _db.SalesDebtsTrackers
                    .Where(p => p.DebtType == DebtType.Receivable)
                    .Where(p => p.AddedAt >= fromUtc && p.AddedAt < toUtc && p.Sale.IsRefunded != true)
                    .Where(p => p.LinkedFinancialAccountId.HasValue && cashIds.Contains(p.LinkedFinancialAccountId.Value))
                    .SumAsync(p => (decimal?)p.PaidAmount) ?? 0m;

                var capitalContributionsNet = await _db.CapitalAccounts
                    .Where(ca => ca.TransactionDate >= fromUtc && ca.TransactionDate < toUtc)
                    .Where(ca => ca.Type == TransactionType.INITIAL_CAPITAL || ca.Type == TransactionType.ADDITIONAL_INVESTMENT)
                    .Where(ca => ca.LinkedFinancialAccountId.HasValue && cashIds.Contains(ca.LinkedFinancialAccountId.Value))
                    .SumAsync(ca => (decimal?)ca.Amount) ?? 0m;

                // Transfers from non-cash accounts into CASH
                var transfersInNet = await _db.Transactions
                    .Where(t => t.Status == TransactionStatus.COMPLETED)
                    .Where(t => t.MovementDate >= fromUtc && t.MovementDate < toUtc)
                    .Where(t => cashIds.Contains(t.ToFinancialAccountId) && !cashIds.Contains(t.FromFinancialAccountId))
                    .SumAsync(t => (decimal?)t.Amount) ?? 0m;

                // Outflows from CASH
                var purchasePaymentsNet = await _db.PurchaseDebtTrackers
                    .Where(p => p.PaymentDate >= fromUtc && p.PaymentDate < toUtc)
                    .Where(p => p.LinkedFinancialAccountId.HasValue && cashIds.Contains(p.LinkedFinancialAccountId.Value))
                    .SumAsync(p => (decimal?)p.PaidAmount) ?? 0m;

                var expendituresNet = await _db.Expenditures
                    .Where(e => e.AddedAt >= fromUtc && e.AddedAt < toUtc)
                    .Where(e => e.LinkedFinancialAccountId.HasValue && cashIds.Contains(e.LinkedFinancialAccountId.Value))
                    .SumAsync(e => (decimal?)e.Amount) ?? 0m;

                var fixedAssetPurchasesNet = await _db.FixedAssets
                    .Where(a => a.AddedAt >= fromUtc && a.AddedAt < toUtc)
                    .Where(a => a.LinkedFinancialAccountId.HasValue && cashIds.Contains(a.LinkedFinancialAccountId.Value))
                    .SumAsync(a => (decimal?)a.PurchasePrice) ?? 0m;

                var capitalWithdrawalsNet = await _db.CapitalAccounts
                    .Where(ca => ca.TransactionDate >= fromUtc && ca.TransactionDate < toUtc)
                    .Where(ca => ca.Type == TransactionType.WITHDRAWAL || ca.Type == TransactionType.PROFIT_DISTRIBUTION)
                    .Where(ca => ca.LinkedFinancialAccountId.HasValue && cashIds.Contains(ca.LinkedFinancialAccountId.Value))
                    .SumAsync(ca => (decimal?)ca.Amount) ?? 0m;

                // Transfers from CASH to non-cash accounts
                var transfersOutNet = await _db.Transactions
                    .Where(t => t.Status == TransactionStatus.COMPLETED)
                    .Where(t => t.MovementDate >= fromUtc && t.MovementDate < toUtc)
                    .Where(t => cashIds.Contains(t.FromFinancialAccountId) && !cashIds.Contains(t.ToFinancialAccountId))
                    .SumAsync(t => (decimal?)t.Amount) ?? 0m;

                return (salesRealTimeNet + salesCollectionsNet + capitalContributionsNet + transfersInNet)
                    - (purchasePaymentsNet + expendituresNet + fixedAssetPurchasesNet + capitalWithdrawalsNet + transfersOutNet);
            }

            var cashClosingNow = accounts.Where(a => a.Type == AccountType.CASH).Sum(a => a.Balance);
            var (hasExactCashOpening, exactCashOpening, hasExactCashClosing, exactCashClosing) = await TryGetExactCashBalancesAsync();

            decimal? openingCashBalance = null;
            decimal? closingCashBalance = null;
            var cashBalancesAreApprox = false;

            if (hasExactCashOpening)
            {
                openingCashBalance = exactCashOpening;
            }

            if (hasExactCashClosing)
            {
                closingCashBalance = exactCashClosing;
            }

            var hasBothExactCash = hasExactCashOpening && hasExactCashClosing;
            if (hasBothExactCash)
            {
                cashBalancesAreApprox = false;
            }
            else if (includeApproxBalances)
            {
                var netFromStartToNow = await ComputeCashNetAsync(cashAccountIds, start, utcNow);
                var netFromEndToNow = await ComputeCashNetAsync(cashAccountIds, end, utcNow);

                openingCashBalance = cashClosingNow - netFromStartToNow;
                closingCashBalance = cashClosingNow - netFromEndToNow;
                cashBalancesAreApprox = true;
            }

            var accountLines = accounts
                .OrderBy(a => a.Type)
                .ThenBy(a => a.AccountName)
                .Select(a =>
                {
                    var sales = GetDictValue(salesCollectionsByAccount, a.Id) + GetDictValue(salesRealTimeByAccount, a.Id);
                    var capIn = GetDictValue(capitalContribByAccount, a.Id);
                    var tIn = GetDictValue(transfersInByAccount, a.Id);

                    var purchases = GetDictValue(purchasePaymentsByAccount, a.Id);
                    var exp = GetDictValue(expendituresByAccount, a.Id);
                    var fa = GetDictValue(fixedAssetsByAccount, a.Id);
                    var capOut = GetDictValue(capitalWithdrawByAccount, a.Id);
                    var tOut = GetDictValue(transfersOutByAccount, a.Id);

                    var inflows = sales + capIn + tIn;
                    var outflows = purchases + exp + fa + capOut + tOut;

                    return new CompanyCashFlowAccountLineDto
                    {
                        AccountId = a.Id,
                        AccountName = a.AccountName,
                        Type = a.Type,
                        CurrentBalance = a.Balance,

                        SalesCollections = sales,
                        CapitalContributions = capIn,
                        TransfersIn = tIn,

                        PurchasePayments = purchases,
                        Expenditures = exp,
                        FixedAssetPurchases = fa,
                        CapitalWithdrawals = capOut,
                        TransfersOut = tOut,

                        TotalInflows = inflows,
                        TotalOutflows = outflows,
                        NetCashFlow = inflows - outflows
                    };
                })
                .ToList();

            var response = new CompanyCashFlowStatementResponseDto
            {
                PeriodUtcStart = start,
                PeriodUtcEnd = end,
                AsOfUtc = utcNow,

                CashBalancesAreApproximate = cashBalancesAreApprox,
                OpeningCashBalance = openingCashBalance,
                ClosingCashBalance = closingCashBalance,

                TotalInflows = totalInflows,
                TotalOutflows = totalOutflows,
                NetCashFlow = net,

                Breakdown = new CashFlowBreakdownDto
                {
                    SalesCollections = totalSalesCollections,
                    TransfersIn = 0m,
                    CapitalContributions = totalCapitalContrib,

                    PurchasePayments = totalPurchasePayments,
                    Expenditures = totalExpenditures,
                    FixedAssetPurchases = totalFixedAssets,
                    CapitalWithdrawals = totalCapitalWithdrawals,
                    TransfersOut = 0m,

                    UnlinkedSalesCollections = unlinkedSalesCollections + unlinkedSalesRealTimeCollections,
                    UnlinkedPurchasePayments = unlinkedPurchasePayments,
                    UnlinkedExpenditures = unlinkedExpenditures,
                    UnlinkedFixedAssetPurchases = unlinkedFixedAssets,
                    UnlinkedCapitalContributions = unlinkedCapitalContrib,
                    UnlinkedCapitalWithdrawals = unlinkedCapitalWithdraw
                },

                Accounts = accountLines
            };

            return Ok(response);
        }

        private async Task<IActionResult> GetTodayInternal(
            AccountType[] includedTypes,
            Guid? financialAccountId,
            bool enforceCashWhenFilteringById,
            string missingAccountMessage)
        {
            var utcNow = DateTime.UtcNow;
            var start = utcNow.Date;
            var end = start.AddDays(1);

            return await GetRangeInternal(
                startUtc: start,
                endUtc: end,
                includeApproxBalances: true,
                includedTypes: includedTypes,
                financialAccountId: financialAccountId,
                enforceCashWhenFilteringById: enforceCashWhenFilteringById,
                missingAccountMessage: missingAccountMessage,
                isTodayResponse: true);
        }

        private async Task<IActionResult> GetRangeInternal(
            DateTime? startUtc,
            DateTime? endUtc,
            bool includeApproxBalances,
            AccountType[] includedTypes,
            Guid? financialAccountId,
            bool enforceCashWhenFilteringById,
            string missingAccountMessage,
            bool isTodayResponse = false)
        {
            if (!startUtc.HasValue || !endUtc.HasValue)
            {
                return BadRequest("startUtc and endUtc are required (UTC timestamps).");
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

            var utcNow = DateTime.UtcNow;

            if (includeApproxBalances && end > utcNow)
            {
                // Allow the common "today" shape when the client requests a whole-day range
                // (00:00 -> next 00:00) even though endUtc is technically in the future.
                // We still reject true future ranges because "approx balances" are based on current balances.
                var startIsDayBoundary = start.TimeOfDay == TimeSpan.Zero;
                var endIsDayBoundary = end.TimeOfDay == TimeSpan.Zero;
                var isTodayWholeDayRange = startIsDayBoundary
                    && endIsDayBoundary
                    && start.Date == utcNow.Date
                    && end.Date == start.Date.AddDays(1);

                if (!isTodayWholeDayRange)
                {
                    return BadRequest("endUtc cannot be in the future when includeApproxBalances=true (except for a whole-day 'today' range: startUtc=00:00Z and endUtc=next 00:00Z). ");
                }
            }

            var accountsQuery = _db.FinancialAccounts
                .Where(fa => includedTypes.Contains(fa.Type));

            if (financialAccountId.HasValue && financialAccountId.Value != Guid.Empty)
            {
                accountsQuery = accountsQuery.Where(fa => fa.Id == financialAccountId.Value);

                if (enforceCashWhenFilteringById)
                {
                    accountsQuery = accountsQuery.Where(fa => fa.Type == AccountType.CASH);
                }
            }

            var accounts = await accountsQuery
                .Select(fa => new CashAccountBalanceDto
                {
                    Id = fa.Id,
                    AccountName = fa.AccountName,
                    Type = fa.Type,
                    Balance = fa.Balance
                })
                .ToListAsync();

            if (financialAccountId.HasValue && financialAccountId.Value != Guid.Empty && accounts.Count == 0)
            {
                return BadRequest(missingAccountMessage);
            }

            var includedAccountIds = accounts.Select(a => a.Id).ToList();

            // For /today with a specific account, the opening balance can come from a reconciliation snapshot
            // taken at OpenedAtUtc. To avoid double-counting movements that occurred before opening (already embedded in the
            // opening balance), we compute flows within the reconciliation window when available.
            var flowStart = start;
            var flowEnd = end;

            var isSingleSelectedAccount = accounts.Count == 1;

            if (isTodayResponse
                && isSingleSelectedAccount
                && includedAccountIds.Count == 1
                && start.TimeOfDay == TimeSpan.Zero
                && end.TimeOfDay == TimeSpan.Zero
                && end == start.AddDays(1))
            {
                var businessDateUtc = DateTime.SpecifyKind(start.Date, DateTimeKind.Utc);
                var rec = await _db.DailyCashReconciliations
                    .Where(r => r.FinancialAccountId == includedAccountIds[0])
                    .Where(r => r.BusinessDateUtc == businessDateUtc)
                    .Select(r => new { r.OpenedAtUtc, r.ClosedAtUtc })
                    .FirstOrDefaultAsync();

                if (rec != null)
                {
                    if (rec.OpenedAtUtc >= start && rec.OpenedAtUtc < end)
                    {
                        flowStart = rec.OpenedAtUtc;
                    }

                    // If the day has been closed, stop counting at Close; otherwise count up to now.
                    flowEnd = rec.ClosedAtUtc ?? utcNow;

                    if (flowEnd > utcNow) flowEnd = utcNow;
                    if (flowEnd > end) flowEnd = end;
                    if (flowEnd < flowStart) flowEnd = flowStart;
                }
            }

            // Closing cash/cash-equivalents is the current balance(s) as-of now.
            var closingCash = accounts.Sum(a => a.Balance);

            // Prefer exact opening/closing balances from DailyCashReconciliations when the range aligns to whole business days.
            // - Opening: startUtc must be 00:00:00Z, using that day's Opening* fields.
            // - Closing: endUtc must be 00:00:00Z, using the previous day's Closing* fields.
            // If any included account is missing a reconciliation record, we fall back to approximate balances (if requested).
            DateTime NormalizeBusinessDateUtc(DateTime utc) => DateTime.SpecifyKind(utc.Date, DateTimeKind.Utc);
            decimal GetOpeningValue(DailyCashReconciliation r) => r.OpeningCountedBalance ?? r.OpeningSystemBalance;
            static bool TryGetClosingValue(DailyCashReconciliation r, out decimal value)
            {
                if (!r.ClosedAtUtc.HasValue)
                {
                    value = 0m;
                    return false;
                }

                if (r.ClosingCountedBalance.HasValue)
                {
                    value = r.ClosingCountedBalance.Value;
                    return true;
                }

                if (r.ClosingSystemBalance.HasValue)
                {
                    value = r.ClosingSystemBalance.Value;
                    return true;
                }

                value = 0m;
                return false;
            }

            async Task<(bool hasExactOpening, decimal opening, bool hasExactClosing, decimal closing)> TryGetExactBalancesAsync()
            {
                if (includedAccountIds.Count == 0)
                {
                    return (true, 0m, true, 0m);
                }

                var hasExactOpening = false;
                var opening = 0m;

                var hasExactClosing = false;
                var closing = 0m;

                var startIsDayBoundary = start.TimeOfDay == TimeSpan.Zero;
                var endIsDayBoundary = end.TimeOfDay == TimeSpan.Zero;

                DateTime? openingBusinessDate = startIsDayBoundary ? NormalizeBusinessDateUtc(start) : null;
                DateTime? closingBusinessDate = endIsDayBoundary ? NormalizeBusinessDateUtc(end.AddDays(-1)) : null;

                if (!openingBusinessDate.HasValue && !closingBusinessDate.HasValue)
                {
                    return (false, 0m, false, 0m);
                }

                var neededDates = new List<DateTime>();
                if (openingBusinessDate.HasValue) neededDates.Add(openingBusinessDate.Value);
                if (closingBusinessDate.HasValue && (!openingBusinessDate.HasValue || closingBusinessDate.Value != openingBusinessDate.Value))
                {
                    neededDates.Add(closingBusinessDate.Value);
                }

                var recs = await _db.DailyCashReconciliations
                    .Where(r => includedAccountIds.Contains(r.FinancialAccountId))
                    .Where(r => neededDates.Contains(r.BusinessDateUtc))
                    .ToListAsync();

                if (openingBusinessDate.HasValue)
                {
                    var openingRecs = recs.Where(r => r.BusinessDateUtc == openingBusinessDate.Value).ToList();
                    if (openingRecs.Count == includedAccountIds.Count)
                    {
                        hasExactOpening = true;
                        opening = openingRecs.Sum(GetOpeningValue);
                    }
                }

                if (closingBusinessDate.HasValue)
                {
                    var closingRecs = recs.Where(r => r.BusinessDateUtc == closingBusinessDate.Value).ToList();
                    if (closingRecs.Count == includedAccountIds.Count)
                    {
                        var allHaveClosing = true;
                        var closingSum = 0m;

                        foreach (var r in closingRecs)
                        {
                            if (!TryGetClosingValue(r, out var v))
                            {
                                allHaveClosing = false;
                                break;
                            }

                            closingSum += v;
                        }

                        if (allHaveClosing)
                        {
                            hasExactClosing = true;
                            closing = closingSum;
                        }
                    }
                }

                return (hasExactOpening, opening, hasExactClosing, closing);
            }

            async Task<decimal> ComputeNetAsync(DateTime fromUtc, DateTime toUtc)
            {
                // Inflows
                var salesRealTimeCollections = await _db.Sales
                    .Where(s => s.SaleDate >= fromUtc && s.SaleDate < toUtc)
                    .Where(s => s.WasPartialPayment != true && s.IsRefunded != true)
                    .Where(s => s.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(s.LinkedFinancialAccountId.Value))
                    .SumAsync(s => (decimal?)s.PaidAmount) ?? 0m;

                var salesCollectionsNet = await _db.SalesDebtsTrackers
                    .Where(p => p.DebtType == DebtType.Receivable)
                    .Where(p => p.AddedAt >= fromUtc && p.AddedAt < toUtc && p.Sale.IsRefunded != true)
                    .Where(p => p.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(p.LinkedFinancialAccountId.Value))
                    .SumAsync(p => (decimal?)p.PaidAmount) ?? 0m;

                var transfersInNet = await _db.Transactions
                    .Where(t => t.Status == TransactionStatus.COMPLETED)
                    .Where(t => t.MovementDate >= fromUtc && t.MovementDate < toUtc)
                    .Where(t => includedAccountIds.Contains(t.ToFinancialAccountId) && !includedAccountIds.Contains(t.FromFinancialAccountId))
                    .SumAsync(t => (decimal?)t.Amount) ?? 0m;

                var capitalContributionsNet = await _db.CapitalAccounts
                    .Where(ca => ca.TransactionDate >= fromUtc && ca.TransactionDate < toUtc)
                    .Where(ca => ca.Type == TransactionType.INITIAL_CAPITAL || ca.Type == TransactionType.ADDITIONAL_INVESTMENT)
                    .Where(ca => ca.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(ca.LinkedFinancialAccountId.Value))
                    .SumAsync(ca => (decimal?)ca.Amount) ?? 0m;

                // Outflows
                var purchasesRealTimePayments = await _db.Purchases
                    .Where(p => p.AddedAt >= fromUtc && p.AddedAt < toUtc)
                    .Where(p => p.WasPartialPayment != true)
                    .Where(p => p.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(p.LinkedFinancialAccountId.Value))
                    .SumAsync(p => (decimal?)p.TotalAmount) ?? 0m;

                var purchasePaymentsNet = await _db.PurchaseDebtTrackers
                    .Where(p => p.PaymentDate >= fromUtc && p.PaymentDate < toUtc)
                    .Where(p => p.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(p.LinkedFinancialAccountId.Value))
                    .SumAsync(p => (decimal?)p.PaidAmount) ?? 0m;

                var expendituresNet = await _db.Expenditures
                    .Where(e => e.AddedAt >= fromUtc && e.AddedAt < toUtc)
                    .Where(e => e.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(e.LinkedFinancialAccountId.Value))
                    .SumAsync(e => (decimal?)e.Amount) ?? 0m;

                var fixedAssetPurchasesNet = await _db.FixedAssets
                    .Where(a => a.AddedAt >= fromUtc && a.AddedAt < toUtc)
                    .Where(a => a.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(a.LinkedFinancialAccountId.Value))
                    .SumAsync(a => (decimal?)a.PurchasePrice) ?? 0m;

                var capitalWithdrawalsNet = await _db.CapitalAccounts
                    .Where(ca => ca.TransactionDate >= fromUtc && ca.TransactionDate < toUtc)
                    .Where(ca => ca.Type == TransactionType.WITHDRAWAL || ca.Type == TransactionType.PROFIT_DISTRIBUTION)
                    .Where(ca => ca.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(ca.LinkedFinancialAccountId.Value))
                    .SumAsync(ca => (decimal?)ca.Amount) ?? 0m;

                var transfersOutNet = await _db.Transactions
                    .Where(t => t.Status == TransactionStatus.COMPLETED)
                    .Where(t => t.MovementDate >= fromUtc && t.MovementDate < toUtc)
                    .Where(t => includedAccountIds.Contains(t.FromFinancialAccountId) && !includedAccountIds.Contains(t.ToFinancialAccountId))
                    .SumAsync(t => (decimal?)t.Amount) ?? 0m;

                return (salesCollectionsNet + salesRealTimeCollections + transfersInNet + capitalContributionsNet)
                    - (purchasePaymentsNet + purchasesRealTimePayments + expendituresNet + fixedAssetPurchasesNet + capitalWithdrawalsNet + transfersOutNet);
            }

            // Inflows: sales collections recorded in SalesDebtsTracker and linked to included accounts.
            var salesRealTimeCollections = await _db.Sales
                .Where(s => s.SaleDate >= flowStart && s.SaleDate < flowEnd)
                .Where(s => s.WasPartialPayment != true && s.IsRefunded != true)
                .Where(s => s.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(s.LinkedFinancialAccountId.Value))
                .SumAsync(s => (decimal?)s.PaidAmount) ?? 0m;

            var unlinkedSalesRealTimeCollections = await _db.Sales
                .Where(s => s.SaleDate >= flowStart && s.SaleDate < flowEnd)
                .Where(s => s.WasPartialPayment != true && s.IsRefunded != true)
                .Where(s => !s.LinkedFinancialAccountId.HasValue)
                .SumAsync(s => (decimal?)s.PaidAmount) ?? 0m;

            var salesCollections = await _db.SalesDebtsTrackers
                .Where(p => p.DebtType == DebtType.Receivable)
                .Where(p => p.AddedAt >= flowStart && p.AddedAt < flowEnd && p.Sale.IsRefunded != true)
                .Where(p => p.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(p.LinkedFinancialAccountId.Value))
                .SumAsync(p => (decimal?)p.PaidAmount) ?? 0m;

            var unlinkedSalesCollections = await _db.SalesDebtsTrackers
                .Where(p => p.DebtType == DebtType.Receivable)
                .Where(p => p.AddedAt >= flowStart && p.AddedAt < flowEnd && p.Sale.IsRefunded != true)
                .Where(p => !p.LinkedFinancialAccountId.HasValue)
                .SumAsync(p => (decimal?)p.PaidAmount) ?? 0m;

            // Outflows: purchase payments recorded in PurchaseDebtTracker and linked to included accounts.
            var purchasesRealTimePayments = await _db.Purchases
                .Where(p => p.AddedAt >= flowStart && p.AddedAt < flowEnd)
                .Where(p => p.WasPartialPayment != true)
                .Where(p => p.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(p.LinkedFinancialAccountId.Value))
                .SumAsync(p => (decimal?)p.TotalAmount) ?? 0m;

            var purchasePayments = await _db.PurchaseDebtTrackers
                .Where(p => p.PaymentDate >= flowStart && p.PaymentDate < flowEnd)
                .Where(p => p.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(p.LinkedFinancialAccountId.Value))
                .SumAsync(p => (decimal?)p.PaidAmount) ?? 0m;

            var unlinkedPurchasePayments = await _db.PurchaseDebtTrackers
                .Where(p => p.PaymentDate >= flowStart && p.PaymentDate < flowEnd)
                .Where(p => !p.LinkedFinancialAccountId.HasValue)
                .SumAsync(p => (decimal?)p.PaidAmount) ?? 0m;

            // Outflows: expenditures linked to included accounts.
            var expenditures = await _db.Expenditures
                .Where(e => e.AddedAt >= flowStart && e.AddedAt < flowEnd)
                .Where(e => e.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(e.LinkedFinancialAccountId.Value))
                .SumAsync(e => (decimal?)e.Amount) ?? 0m;

            var unlinkedExpenditures = await _db.Expenditures
                .Where(e => e.AddedAt >= flowStart && e.AddedAt < flowEnd)
                .Where(e => !e.LinkedFinancialAccountId.HasValue)
                .SumAsync(e => (decimal?)e.Amount) ?? 0m;

            // Outflows: fixed asset purchases linked to included accounts.
            var fixedAssetPurchases = await _db.FixedAssets
                .Where(a => a.AddedAt >= flowStart && a.AddedAt < flowEnd)
                .Where(a => a.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(a.LinkedFinancialAccountId.Value))
                .SumAsync(a => (decimal?)a.PurchasePrice) ?? 0m;

            var unlinkedFixedAssetPurchases = await _db.FixedAssets
                .Where(a => a.AddedAt >= flowStart && a.AddedAt < flowEnd)
                .Where(a => !a.LinkedFinancialAccountId.HasValue)
                .SumAsync(a => (decimal?)a.PurchasePrice) ?? 0m;

            // Capital account movements (owner contributions and withdrawals) linked to included accounts.
            // Inflows: INITIAL_CAPITAL, ADDITIONAL_INVESTMENT
            var capitalContributions = await _db.CapitalAccounts
                .Where(ca => ca.TransactionDate >= flowStart && ca.TransactionDate < flowEnd)
                .Where(ca => ca.Type == TransactionType.INITIAL_CAPITAL || ca.Type == TransactionType.ADDITIONAL_INVESTMENT)
                .Where(ca => ca.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(ca.LinkedFinancialAccountId.Value))
                .SumAsync(ca => (decimal?)ca.Amount) ?? 0m;

            // Outflows: WITHDRAWAL, PROFIT_DISTRIBUTION
            var capitalWithdrawals = await _db.CapitalAccounts
                .Where(ca => ca.TransactionDate >= flowStart && ca.TransactionDate < flowEnd)
                .Where(ca => ca.Type == TransactionType.WITHDRAWAL || ca.Type == TransactionType.PROFIT_DISTRIBUTION)
                .Where(ca => ca.LinkedFinancialAccountId.HasValue && includedAccountIds.Contains(ca.LinkedFinancialAccountId.Value))
                .SumAsync(ca => (decimal?)ca.Amount) ?? 0m;

            var unlinkedCapitalContributions = await _db.CapitalAccounts
                .Where(ca => ca.TransactionDate >= flowStart && ca.TransactionDate < flowEnd)
                .Where(ca => ca.Type == TransactionType.INITIAL_CAPITAL || ca.Type == TransactionType.ADDITIONAL_INVESTMENT)
                .Where(ca => !ca.LinkedFinancialAccountId.HasValue)
                .SumAsync(ca => (decimal?)ca.Amount) ?? 0m;

            var unlinkedCapitalWithdrawals = await _db.CapitalAccounts
                .Where(ca => ca.TransactionDate >= flowStart && ca.TransactionDate < flowEnd)
                .Where(ca => ca.Type == TransactionType.WITHDRAWAL || ca.Type == TransactionType.PROFIT_DISTRIBUTION)
                .Where(ca => !ca.LinkedFinancialAccountId.HasValue)
                .SumAsync(ca => (decimal?)ca.Amount) ?? 0m;

            // Transfers involving included accounts (from Transactions table)
            // Only count movements where the counterparty is NOT in the included pool.
            // This avoids counting internal transfers (e.g., BANK -> CASH drawer) as company inflow/outflow.
            var transfersIn = await _db.Transactions
                .Where(t => t.Status == TransactionStatus.COMPLETED)
                .Where(t => t.MovementDate >= flowStart && t.MovementDate < flowEnd)
                .Where(t => includedAccountIds.Contains(t.ToFinancialAccountId) && !includedAccountIds.Contains(t.FromFinancialAccountId))
                .SumAsync(t => (decimal?)t.Amount) ?? 0m;

            var transfersOut = await _db.Transactions
                .Where(t => t.Status == TransactionStatus.COMPLETED)
                .Where(t => t.MovementDate >= flowStart && t.MovementDate < flowEnd)
                .Where(t => includedAccountIds.Contains(t.FromFinancialAccountId) && !includedAccountIds.Contains(t.ToFinancialAccountId))
                .SumAsync(t => (decimal?)t.Amount) ?? 0m;

            var totalInflows = salesCollections + salesRealTimeCollections + transfersIn + capitalContributions;
            var totalOutflows = purchasePayments + purchasesRealTimePayments + expenditures + fixedAssetPurchases + capitalWithdrawals + transfersOut;
            var net = totalInflows - totalOutflows;

            // Approximate opening balance as-of start-of-day, based on closing-as-of-now minus today's net flow.
            var breakdown = new CashFlowBreakdownDto
            {
                SalesCollections = salesCollections + salesRealTimeCollections,
                TransfersIn = transfersIn,
                CapitalContributions = capitalContributions,

                PurchasePayments = purchasePayments + purchasesRealTimePayments,
                Expenditures = expenditures,
                FixedAssetPurchases = fixedAssetPurchases,
                CapitalWithdrawals = capitalWithdrawals,
                TransfersOut = transfersOut,

                UnlinkedSalesCollections = unlinkedSalesCollections + unlinkedSalesRealTimeCollections,
                UnlinkedPurchasePayments = unlinkedPurchasePayments,
                UnlinkedExpenditures = unlinkedExpenditures,
                UnlinkedFixedAssetPurchases = unlinkedFixedAssetPurchases,
                UnlinkedCapitalContributions = unlinkedCapitalContributions,
                UnlinkedCapitalWithdrawals = unlinkedCapitalWithdrawals
            };

            if (isTodayResponse)
            {
                // For today, prefer an exact opening balance from DailyCashReconciliations if available.
                // If not available, fall back to an approximate opening balance based on current balances and today's net flow.
                var (hasExactOpening, exactOpening, _, _) = await TryGetExactBalancesAsync();
                var openingCash = hasExactOpening ? exactOpening : (closingCash - net);

                var todayResponse = new CashFlowTodayResponseDto
                {
                    DayUtcStart = start,
                    DayUtcEnd = end,
                    AsOfUtc = utcNow,

                    OpeningCashBalance = openingCash,
                    ClosingCashBalance = closingCash,

                    TotalInflows = totalInflows,
                    TotalOutflows = totalOutflows,
                    NetCashFlow = net,

                    Breakdown = breakdown,
                    CashAccounts = accounts
                };

                return Ok(todayResponse);
            }

            var rangeResponse = new CashFlowRangeResponseDto
            {
                PeriodUtcStart = start,
                PeriodUtcEnd = end,
                AsOfUtc = utcNow,

                BalancesAreApproximate = false,

                TotalInflows = totalInflows,
                TotalOutflows = totalOutflows,
                NetCashFlow = net,

                Breakdown = breakdown,
                CashAccounts = accounts
            };

            // Prefer exact balances from DailyCashReconciliations when available.
            var (hasExactOpeningRange, exactOpeningRange, hasExactClosingRange, exactClosingRange) = await TryGetExactBalancesAsync();

            if (hasExactOpeningRange)
            {
                rangeResponse.OpeningCashBalance = exactOpeningRange;
            }

            if (hasExactClosingRange)
            {
                rangeResponse.ClosingCashBalance = exactClosingRange;
            }

            var hasBothExact = hasExactOpeningRange && hasExactClosingRange;

            if (hasBothExact)
            {
                rangeResponse.BalancesAreApproximate = false;
            }
            else if (includeApproxBalances)
            {
                // Approximate balances as-of the requested timestamps.
                // Works best when all balance-affecting events are recorded and linked to financial accounts.
                var netFromStartToNow = await ComputeNetAsync(start, utcNow);
                var netFromEndToNow = await ComputeNetAsync(end, utcNow);

                rangeResponse.OpeningCashBalance = closingCash - netFromStartToNow;
                rangeResponse.ClosingCashBalance = closingCash - netFromEndToNow;
                rangeResponse.BalancesAreApproximate = true;
            }

            return Ok(rangeResponse);
        }
    }
}
