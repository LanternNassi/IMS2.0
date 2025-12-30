namespace ImsServer.Models
{
    public class GeneralFields
    {
        public DateTime AddedAt { get; set; }
        public int AddedBy {get; set; }
        public DateTime UpdatedAt { get; set; }
        public int LastUpdatedBy {get; set;}
        public DateTime? DeletedAt { get; set; }
    }

    public enum Currency
    {
        Unknown = 0,
        USD,
        EUR,
        GBP,
        JPY,
        AUD,
        CAD,
        CHF,
        CNY,
        INR,
        UGX
    }


    public enum PaymentMethod
    {
        CASH,
        CARD,
        MOBILE_MONEY,
        BANK_TRANSFER,
        CHEQUE,
        BANK,
        SAVINGS,
        OTHER 
    }


    public enum ExpenditureType
    {
        UTILITIES,
        PAYMENTS,
        BENEFITS,
        MISCELLANEOUS
    }

    public enum DebtType
    {
        Payable,
        Receivable
    }

    public class ImportResult
    {
        public string? CustomerName { get; set; } = string.Empty;
        public string? SupplierName { get; set; } = string.Empty;
        public Guid? SaleId { get; set; }
        public Guid? PurchaseId { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

}