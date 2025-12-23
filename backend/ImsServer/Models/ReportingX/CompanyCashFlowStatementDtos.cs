using ImsServer.Models.FinancialAccountX;

namespace ImsServer.Models.ReportingX
{
    public class CompanyCashFlowStatementResponseDto
    {
        public DateTime PeriodUtcStart { get; set; }
        public DateTime PeriodUtcEnd { get; set; }
        public DateTime AsOfUtc { get; set; }

        // Opening/closing balances are only reliable for CASH accounts because those are the ones reconciled daily.
        public bool CashBalancesAreApproximate { get; set; }
        public decimal? OpeningCashBalance { get; set; }
        public decimal? ClosingCashBalance { get; set; }

        public decimal TotalInflows { get; set; }
        public decimal TotalOutflows { get; set; }
        public decimal NetCashFlow { get; set; }

        // Company totals (unlinked amounts included in the Unlinked* fields)
        public CashFlowBreakdownDto Breakdown { get; set; } = new();

        // Per-account detail (includes internal transfers per account)
        public List<CompanyCashFlowAccountLineDto> Accounts { get; set; } = new();
    }

    public class CompanyCashFlowAccountLineDto
    {
        public Guid AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public AccountType Type { get; set; }

        // Current balance as-of AsOfUtc.
        public decimal CurrentBalance { get; set; }

        // Inflows
        public decimal SalesCollections { get; set; }
        public decimal CapitalContributions { get; set; }
        public decimal TransfersIn { get; set; }

        // Outflows
        public decimal PurchasePayments { get; set; }
        public decimal Expenditures { get; set; }
        public decimal FixedAssetPurchases { get; set; }
        public decimal CapitalWithdrawals { get; set; }
        public decimal TransfersOut { get; set; }

        public decimal TotalInflows { get; set; }
        public decimal TotalOutflows { get; set; }
        public decimal NetCashFlow { get; set; }
    }
}
