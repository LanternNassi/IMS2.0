using ImsServer.Models.CustomerX;
using ImsServer.Models.FinancialAccountX;
using ImsServer.Models.SaleX;
using ImsServer.Models.UserX;
using System.ComponentModel.DataAnnotations.Schema;
    
namespace ImsServer.Models.SaleX
{
    public class Sale : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid? CustomerId { get; set; }
        public Guid? ProcessedById { get; set; } // Optional field for the user who processed the sale
        public DateTime SaleDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal ChangeAmount { get; set; } // Amount returned to the customer after payment
        public decimal? OutstandingAmount { get; set; } // Amount still owed by the customer
        public decimal Discount { get; set; }
        public decimal FinalAmount { get; set; }
        public decimal Profit { get; set; } // Profit made from the sale
        public bool IsPaid { get; set; } // Indicates if the sale has been paid in full
        public bool IsRefunded { get; set; } // Indicates if the sale has been refunded
        public bool IsTaken { get; set; } // Indicates if the sale is taken or not
        public PaymentMethod PaymentMethod { get; set; } // e.g., Cash, Card, etc.
        public bool IsCompleted { get; set; }
        public bool WasPartialPayment { get; set; } = false; // Indicates if sale had partial payment (debt) at creation

        public Guid? LinkedFinancialAccountId { get; set; }

        [ForeignKey("LinkedFinancialAccountId")]
        public FinancialAccount? LinkedFinancialAccount { get; set; }

        [ForeignKey("CustomerId")]
        public virtual Customer? Customer { get; set; }

        [ForeignKey("ProcessedById")]
        public virtual User ProcessedBy { get; set; }

        public virtual ICollection<SalesItem> SaleItems { get; set; } = new List<SalesItem>();

        public string? Notes { get; set; }
    }

    public class SaleDto : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid? CustomerId { get; set; }
        public Guid? ProcessedById { get; set; }
        public DateTime SaleDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal ChangeAmount { get; set; }
        public decimal OutstandingAmount { get; set; }
        public decimal Discount { get; set; }
        public decimal FinalAmount { get; set; }
        public decimal Profit { get; set; }
        public bool IsPaid { get; set; }
        public bool IsRefunded { get; set; }
        public bool IsTaken { get; set; }
        public bool WasPartialPayment { get; set; }
        public PaymentMethod PaymentMethod { get; set; } 
        public Guid? LinkedFinancialAccountId { get; set; }
        public bool IsCompleted { get; set; }
        public SimpleCustomerDto? Customer { get; set; }
        public UserDto ProcessedBy { get; set; }

        public List<SimpleSalesItemDto> SaleItems { get; set; } = new List<SimpleSalesItemDto>();

        public string? Notes { get; set; }
    }

    public class SimpleSaleDto
    {
        public Guid Id { get; set; }
        public DateTime SaleDate { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class CreateSaleDto
    {
        public Guid Id { get; set; }
        public Guid? CustomerId { get; set; }
        public Guid? ProcessedById { get; set; }
        public DateTime SaleDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal ChangeAmount { get; set; }
        public decimal? OutstandingAmount { get; set; }
        public decimal Discount { get; set; }
        public decimal FinalAmount { get; set; }
        public bool IsPaid { get; set; }
        public bool IsTaken { get; set; }
        public bool WasPartialPayment { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public Guid? LinkedFinancialAccountId { get; set; }
        public bool IsCompleted { get; set; }
        public string? Notes { get; set; }
        public List<CreateSaleItemDto> Items { get; set; } = new List<CreateSaleItemDto>();
    }

    public class CreateSaleItemDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public Guid ProductVariationId { get; set; }
        public string ProductName { get; set; }
        public decimal BasePrice { get; set; }
        public decimal Quantity { get; set; }
        public decimal TotalPrice { get; set; }
        public Guid StorageId { get; set; }
        public decimal? ProfitMargin { get; set; }
    }

    public class UpdateSaleDto
    {
        public bool IsPaid { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal OutstandingAmount { get; set; }
        public bool IsCompleted { get; set; }
        public bool IsTaken { get; set; }
        public bool IsRefunded { get; set; }
    }
}