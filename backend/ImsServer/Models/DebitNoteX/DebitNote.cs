using ImsServer.Models.FinancialAccountX;
using ImsServer.Models.PurchaseX;
using ImsServer.Models.SupplierX;
using ImsServer.Models.CustomerX;
using ImsServer.Models.SaleX;
using ImsServer.Models.UserX;
using System.ComponentModel.DataAnnotations.Schema;

namespace ImsServer.Models.DebitNoteX
{
    public class DebitNote : GeneralFields
    {
        public Guid Id { get; set; }
        public string DebitNoteNumber { get; set; } // e.g., "DN-2024-001"
        public DateTime DebitNoteDate { get; set; }
        
        // Reference to original purchase (if applicable - for supplier debit notes)
        public Guid? PurchaseId { get; set; }
        
        // Reference to original sale (if applicable - for customer debit notes)
        public Guid? SaleId { get; set; }
        
        // Supplier information (for supplier debit notes)
        public Guid? SupplierId { get; set; }
        
        // Customer information (for customer debit notes)
        public Guid? CustomerId { get; set; }
        
        // User who processed the debit note
        public Guid ProcessedById { get; set; }
        
        // Financial details
        public decimal TotalAmount { get; set; } // Total debit amount
        public decimal TaxAmount { get; set; } // Tax/VAT amount if applicable
        public decimal SubTotal { get; set; } // Subtotal before tax
        
        // Reason for debit note
        public DebitNoteReason Reason { get; set; }
        public string? Description { get; set; }
        public string? Notes { get; set; }
        
        // Status
        public DebitNoteStatus Status { get; set; } = DebitNoteStatus.Pending;
        public bool IsApplied { get; set; } = false; // Whether debit has been applied to supplier/customer balance
        
        // Financial account for tracking
        public Guid? LinkedFinancialAccountId { get; set; }
        
        // Application tracking
        public string? ApplicationMessage { get; set; } // Message describing how debit was applied
        public string? AppliedToSalesIds { get; set; } // Comma-separated list of sale IDs (SA-XXXXXXXX format) that debit was applied to (for customer debit notes)
        public string? AppliedToPurchasesIds { get; set; } // Comma-separated list of purchase IDs that debit was applied to (for supplier debit notes)
        
        // Navigation properties
        [ForeignKey("PurchaseId")]
        public virtual Purchase? Purchase { get; set; }
        
        [ForeignKey("SaleId")]
        public virtual Sale? Sale { get; set; }
        
        [ForeignKey("SupplierId")]
        public virtual Supplier? Supplier { get; set; }
        
        [ForeignKey("CustomerId")]
        public virtual Customer? Customer { get; set; }
        
        [ForeignKey("ProcessedById")]
        public virtual User ProcessedBy { get; set; }
        
        [ForeignKey("LinkedFinancialAccountId")]
        public virtual FinancialAccount? LinkedFinancialAccount { get; set; }
        
        // Line items
        public virtual ICollection<DebitNoteItem> DebitNoteItems { get; set; } = new List<DebitNoteItem>();
    }
    
    public class DebitNoteItem : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid DebitNoteId { get; set; }
        
        // Product information (if applicable)
        public Guid? ProductVariationId { get; set; }
        public string? ProductName { get; set; }
        public string? Description { get; set; }
        
        // Quantity and pricing
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal? TaxAmount { get; set; }
        
        // Reference to original purchase item (if applicable - for supplier debit notes)
        public Guid? PurchaseItemId { get; set; }
        
        // Reference to original sale item (if applicable - for customer debit notes)
        public Guid? SaleItemId { get; set; }
        
        // Navigation
        [ForeignKey("DebitNoteId")]
        public virtual DebitNote DebitNote { get; set; }
    }
    
    public enum DebitNoteReason
    {
        ReturnedGoods,        // Goods returned to supplier
        Undercharge,          // Supplier/Customer undercharged
        AdditionalCharge,     // Additional charges (freight, handling, transportation, etc.)
        DamagedGoods,         // Goods damaged on receipt
        WrongItem,            // Wrong item received
        PriceAdjustment,      // Price correction/adjustment
        ShortDelivery,        // Short delivery compensation
        Transportation,       // Transportation/delivery charges to customer
        Other                 // Other reasons
    }
    
    public enum DebitNoteStatus
    {
        Pending,             // Created but not yet applied
        Applied,             // Applied to supplier balance
        Cancelled,           // Cancelled/voided
        Paid                 // Paid to supplier
    }
    
    // DTOs
    public class DebitNoteDto : GeneralFields
    {
        public Guid Id { get; set; }
        public string DebitNoteNumber { get; set; }
        public DateTime DebitNoteDate { get; set; }
        public Guid? PurchaseId { get; set; }
        public Guid? SaleId { get; set; }
        public Guid? SupplierId { get; set; }
        public Guid? CustomerId { get; set; }
        public Guid ProcessedById { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal SubTotal { get; set; }
        public DebitNoteReason Reason { get; set; }
        public string? Description { get; set; }
        public string? Notes { get; set; }
        public DebitNoteStatus Status { get; set; }
        public bool IsApplied { get; set; }
        public Guid? LinkedFinancialAccountId { get; set; }
        public string? ApplicationMessage { get; set; }
        public string? AppliedToSalesIds { get; set; }
        public string? AppliedToPurchasesIds { get; set; }
        public SimpleSupplierDto? Supplier { get; set; }
        public SimpleCustomerDto? Customer { get; set; }
        public SimplePurchaseDto? Purchase { get; set; }
        public SimpleSaleDto? Sale { get; set; }
        public List<DebitNoteItemDto> DebitNoteItems { get; set; } = new List<DebitNoteItemDto>();
    }
    
    public class DebitNoteItemDto : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid DebitNoteId { get; set; }
        public Guid? ProductVariationId { get; set; }
        public string? ProductName { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal? TaxAmount { get; set; }
        public Guid? PurchaseItemId { get; set; }
        public Guid? SaleItemId { get; set; }
    }
    
    public class CreateDebitNoteDto
    {
        public Guid Id { get; set; }
        public string? DebitNoteNumber { get; set; }
        public DateTime DebitNoteDate { get; set; }
        public Guid? PurchaseId { get; set; }
        public Guid? SaleId { get; set; }
        public Guid? SupplierId { get; set; } // Required if creating supplier debit note
        public Guid? CustomerId { get; set; } // Required if creating customer debit note
        public Guid ProcessedById { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal SubTotal { get; set; }
        public DebitNoteReason Reason { get; set; }
        public string? Description { get; set; }
        public string? Notes { get; set; }
        public Guid? LinkedFinancialAccountId { get; set; }
        public bool ApplyToBalance { get; set; } = true; // Whether to immediately apply to supplier/customer balance
        public List<CreateDebitNoteItemDto> Items { get; set; } = new List<CreateDebitNoteItemDto>();
    }
    
    public class CreateDebitNoteItemDto
    {
        public Guid Id { get; set; }
        public Guid? ProductVariationId { get; set; }
        public string? ProductName { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal? TaxAmount { get; set; }
        public Guid? PurchaseItemId { get; set; }
        public Guid? SaleItemId { get; set; }
    }
    
    public class ApplyDebitNoteDto
    {
        public Guid DebitNoteId { get; set; }
        public Guid? PurchaseId { get; set; } // Optional: apply to specific purchase (for supplier debit notes)
        public Guid? SaleId { get; set; } // Optional: apply to specific sale (for customer debit notes)
        public string? Notes { get; set; }
    }
}

