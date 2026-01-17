using ImsServer.Models.CustomerX;
using ImsServer.Models.FinancialAccountX;
using ImsServer.Models.SaleX;
using ImsServer.Models.UserX;
using System.ComponentModel.DataAnnotations.Schema;

namespace ImsServer.Models.CreditNoteX
{
    public class CreditNote : GeneralFields
    {
        public Guid Id { get; set; }
        public string CreditNoteNumber { get; set; } // e.g., "CN-2024-001"
        public DateTime CreditNoteDate { get; set; }
        
        // Reference to original sale (if applicable)
        public Guid? SaleId { get; set; }
        
        // Customer information
        public Guid CustomerId { get; set; }
        
        // User who processed the credit note
        public Guid ProcessedById { get; set; }
        
        // Financial details
        public decimal TotalAmount { get; set; } // Total credit amount
        public decimal TaxAmount { get; set; } // Tax/VAT amount if applicable
        public decimal? ProfitAccrued {get; set; }
        public decimal SubTotal { get; set; } // Subtotal before tax
        
        // Reason for credit note
        public CreditNoteReason Reason { get; set; }
        public string? Description { get; set; }
        public string? Notes { get; set; }
        
        // Status
        public CreditNoteStatus Status { get; set; } = CreditNoteStatus.Pending;
        public bool IsApplied { get; set; } = false; // Whether credit has been applied to customer balance
        
        // Financial account for tracking
        public Guid? LinkedFinancialAccountId { get; set; }
        
        // Application tracking
        public string? ApplicationMessage { get; set; } // Message describing how credit was applied
        public string? AppliedToSalesIds { get; set; } // Comma-separated list of sale IDs (SA-XXXXXXXX format) that credit was applied to
        
        // Navigation properties
        [ForeignKey("SaleId")]
        public virtual Sale? Sale { get; set; }
        
        [ForeignKey("CustomerId")]
        public virtual Customer Customer { get; set; }
        
        [ForeignKey("ProcessedById")]
        public virtual User ProcessedBy { get; set; }
        
        [ForeignKey("LinkedFinancialAccountId")]
        public virtual FinancialAccount? LinkedFinancialAccount { get; set; }
        
        // Line items
        public virtual ICollection<CreditNoteItem> CreditNoteItems { get; set; } = new List<CreditNoteItem>();
    }
    
    public class CreditNoteItem : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid CreditNoteId { get; set; }
        
        // Product information (if applicable)
        public Guid? ProductVariationId { get; set; }
        public string? ProductName { get; set; }
        public string? Description { get; set; }
        
        // Quantity and pricing
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal? TaxAmount { get; set; }
        
        // Reference to original sale item (if applicable)
        public Guid? SaleItemId { get; set; }
        
        // Navigation
        [ForeignKey("CreditNoteId")]
        public virtual CreditNote CreditNote { get; set; }
    }
    
    public enum CreditNoteReason
    {
        ReturnedGoods,        // Goods returned by customer
        Overcharge,          // Customer was overcharged
        Discount,            // Post-sale discount/adjustment
        DamagedGoods,        // Goods damaged on delivery
        WrongItem,           // Wrong item delivered
        Cancellation,        // Order cancellation
        Warranty,            // Warranty claim
        Other                // Other reasons
    }
    
    public enum CreditNoteStatus
    {
        Pending,             // Created but not yet applied
        Applied,             // Applied to customer balance
        Cancelled,           // Cancelled/voided
        Refunded             // Refunded to customer
    }
    
    // DTOs
    public class CreditNoteDto : GeneralFields
    {
        public Guid Id { get; set; }
        public string CreditNoteNumber { get; set; }
        public DateTime CreditNoteDate { get; set; }
        public Guid? SaleId { get; set; }
        public Guid CustomerId { get; set; }
        public Guid ProcessedById { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal SubTotal { get; set; }
        public CreditNoteReason Reason { get; set; }
        public string? Description { get; set; }
        public string? Notes { get; set; }
        public CreditNoteStatus Status { get; set; }
        public bool IsApplied { get; set; }
        public Guid? LinkedFinancialAccountId { get; set; }
        public string? ApplicationMessage { get; set; }
        public string? AppliedToSalesIds { get; set; }
        public SimpleCustomerDto? Customer { get; set; }
        public SimpleSaleDto? Sale { get; set; }
        public List<CreditNoteItemDto> CreditNoteItems { get; set; } = new List<CreditNoteItemDto>();
    }
    
    public class CreditNoteItemDto : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid CreditNoteId { get; set; }
        public Guid? ProductVariationId { get; set; }
        public string? ProductName { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal? TaxAmount { get; set; }
        public Guid? SaleItemId { get; set; }
    }
    
    public class CreateCreditNoteDto
    {
        public Guid Id { get; set; }
        public string? CreditNoteNumber { get; set; }
        public DateTime CreditNoteDate { get; set; }
        public Guid? SaleId { get; set; }
        public Guid CustomerId { get; set; }
        public Guid ProcessedById { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal SubTotal { get; set; }
        public CreditNoteReason Reason { get; set; }
        public string? Description { get; set; }
        public string? Notes { get; set; }
        public Guid? LinkedFinancialAccountId { get; set; }
        public bool ApplyToBalance { get; set; } = true; // Whether to immediately apply to customer balance
        public List<CreateCreditNoteItemDto> Items { get; set; } = new List<CreateCreditNoteItemDto>();
    }
    
    public class CreateCreditNoteItemDto
    {
        public Guid Id { get; set; }
        public Guid? ProductVariationId { get; set; }
        public string? ProductName { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal? TaxAmount { get; set; }
        public Guid? SaleItemId { get; set; }
    }
    
    public class ApplyCreditNoteDto
    {
        public Guid CreditNoteId { get; set; }
        public Guid? SaleId { get; set; } // Optional: apply to specific sale
        public string? Notes { get; set; }
    }
}

