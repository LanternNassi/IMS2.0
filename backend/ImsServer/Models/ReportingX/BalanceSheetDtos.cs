using ImsServer.Models;
using ImsServer.Models.FinancialAccountX;

namespace ImsServer.Models.ReportingX
{
    public class BalanceSheetTodayResponse
    {
        public DateTime AsOfUtc { get; set; }
        public Currency ReportingCurrency { get; set; } = Currency.UGX;

        public BalanceSheetAssets Assets { get; set; } = new();
        public BalanceSheetLiabilities Liabilities { get; set; } = new();
        public BalanceSheetEquity Equity { get; set; } = new();

        public decimal AssetsTotal { get; set; }
        public decimal LiabilitiesTotal { get; set; }
        public decimal EquityTotal { get; set; }

        // Assets - (Liabilities + Equity). Ideally 0.
        public decimal AccountingDifference { get; set; }

        public BalanceSheetAssumptions Assumptions { get; set; } = new();
    }

    public class BalanceSheetAssets
    {
        public decimal CashAndBankTotal { get; set; }
        public List<BalanceSheetCashAccountLine> CashAccounts { get; set; } = new();

        public decimal AccountsReceivableTotal { get; set; }

        public decimal InventoryTotalQuantity { get; set; }
        public decimal InventoryValue { get; set; }

        public decimal FixedAssetsNet { get; set; }
    }

    public class BalanceSheetLiabilities
    {
        public decimal AccountsPayableTotal { get; set; }
        public decimal TaxesPayableTotal { get; set; }
    }

    public class BalanceSheetEquity
    {
        public decimal OwnerContributions { get; set; }
        public decimal OwnerDrawings { get; set; }
        public decimal OwnerCapitalNet { get; set; }

        // Derived from Sales.Profit - Expenditures.Amount (no advanced adjustments).
        public decimal RetainedEarningsEstimated { get; set; }

        // Included so you can show the calculation in the PDF.
        public decimal ProfitToDate { get; set; }
        public decimal ExpensesToDate { get; set; }
    }

    public class BalanceSheetCashAccountLine
    {
        public Guid Id { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public AccountType Type { get; set; }
        public decimal Balance { get; set; }
        public bool IsActive { get; set; }
    }

    public class BalanceSheetAssumptions
    {
        public string CashBasisNote { get; set; } = "Cash & Bank uses FinancialAccount.Balance as of now.";
        public string InventoryValuationNote { get; set; } = "Inventory value is estimated as Sum(ProductStorage.Quantity * ProductVariation.CostPrice).";
        public string ReceivablesNote { get; set; } = "Accounts Receivable uses Sale.OutstandingAmount for completed, non-refunded sales.";
        public string PayablesNote { get; set; } = "Accounts Payable uses Purchase.OutstandingAmount for unpaid purchases.";
        public string RetainedEarningsNote { get; set; } = "Retained earnings is estimated as Sum(Sale.Profit) - Sum(Expenditure.Amount).";
    }
}
