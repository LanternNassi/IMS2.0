using ImsServer.Models;

namespace ImsServer.Models.ReportingX
{
    public class IncomeStatementResponseDto
    {
        public DateTime PeriodUtcStart { get; set; }
        public DateTime PeriodUtcEnd { get; set; }
        public DateTime AsOfUtc { get; set; }

        public Currency ReportingCurrency { get; set; } = Currency.UGX;

        // Revenue
        public decimal SalesRevenue { get; set; }
        public decimal SalesRefunds { get; set; }
        public decimal NetSalesRevenue { get; set; }

        // Cost & gross profit
        // Note: Since the system stores Sale.Profit but not explicit COGS ledger entries,
        // COGS is derived as NetSalesRevenue - GrossProfit.
        public decimal GrossProfit { get; set; }
        public decimal CostOfGoodsSoldEstimated { get; set; }

        // Expenses
        public decimal OperatingExpensesTotal { get; set; }
        public List<IncomeStatementExpenseLineDto> OperatingExpensesByCategory { get; set; } = new();

        // Bottom line
        public decimal NetIncomeEstimated { get; set; }

        public IncomeStatementAssumptions Assumptions { get; set; } = new();
    }

    public class IncomeStatementExpenseLineDto
    {
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public class IncomeStatementAssumptions
    {
        public string RevenueRecognitionNote { get; set; } = "Revenue is based on completed, non-refunded sales within the period (SaleDate).";
        public string CogsNote { get; set; } = "COGS is estimated as NetSalesRevenue - Sum(Sale.Profit) because explicit COGS ledger entries are not stored.";
        public string ExpensesNote { get; set; } = "Operating expenses are based on Expenditures within the period (AddedAt).";
    }
}
