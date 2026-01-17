using ImsServer.Models.FinancialAccountX;

namespace ImsServer.Models.ReportingX
{
    public class CashFlowTodayResponseDto
    {
        public DateTime DayUtcStart { get; set; }
        public DateTime DayUtcEnd { get; set; }
        public DateTime AsOfUtc { get; set; }

        public decimal OpeningCashBalance { get; set; }
        public decimal ClosingCashBalance { get; set; }

        public decimal TotalInflows { get; set; }
        public decimal TotalOutflows { get; set; }
        public decimal NetCashFlow { get; set; }

        public decimal NetNotes { get; set; }
        public CashFlowBreakdownDto Breakdown { get; set; } = new();
        public List<CashAccountBalanceDto> CashAccounts { get; set; } = new();
    }

    public class CashFlowRangeResponseDto
    {
        public DateTime PeriodUtcStart { get; set; }
        public DateTime PeriodUtcEnd { get; set; }
        public DateTime AsOfUtc { get; set; }

        // These are optional and only populated when requested.
        // They are approximate unless you have a complete ledger of all balance-affecting events.
        public bool BalancesAreApproximate { get; set; }
        public decimal? OpeningCashBalance { get; set; }
        public decimal? ClosingCashBalance { get; set; }

        public decimal TotalInflows { get; set; }
        public decimal TotalOutflows { get; set; }
        public decimal NetCashFlow { get; set; }

        public decimal NetNotes {get; set; }

        public CashFlowBreakdownDto Breakdown { get; set; } = new();
        public List<CashAccountBalanceDto> CashAccounts { get; set; } = new();
    }

    public class CashFlowBreakdownDto
    {
        // Inflows
        public decimal SalesCollections { get; set; }
        public decimal TransfersIn { get; set; }
        public decimal CapitalContributions { get; set; }

        // Outflows
        public decimal PurchasePayments { get; set; }
        public decimal Expenditures { get; set; }
        public decimal FixedAssetPurchases { get; set; }
        public decimal CapitalWithdrawals { get; set; }
        public decimal TransfersOut { get; set; }
        public decimal CreditNotes { get; set; }
        public decimal DebitNotes { get; set; }

        // Unlinked (not attributable to a CASH financial account)
        public decimal UnlinkedSalesCollections { get; set; }
        public decimal UnlinkedPurchasePayments { get; set; }
        public decimal UnlinkedExpenditures { get; set; }
        public decimal UnlinkedFixedAssetPurchases { get; set; }
        public decimal UnlinkedCapitalContributions { get; set; }
        public decimal UnlinkedCapitalWithdrawals { get; set; }
    }

    public class CashAccountBalanceDto
    {
        public Guid Id { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public AccountType Type { get; set; }
        public decimal Balance { get; set; }
    }
}
