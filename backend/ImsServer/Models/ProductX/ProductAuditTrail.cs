using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ImsServer.Models.UserX;
using ImsServer.Models.SaleX;
using ImsServer.Models.PurchaseX;
using ImsServer.Models.CapitalAccountX;

namespace ImsServer.Models.ProductX
{
    public class ProductAuditTrail : GeneralFields
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid ProductVariationId { get; set; }

        [Required]
        public Guid ProductStorageId { get; set; }

        [Required]
        public decimal QuantityBefore { get; set; }

        [Required]
        public decimal QuantityAfter { get; set; }

        [Required]
        public ReconciliationReason Reason { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        [Required]
        public Guid CreatedById { get; set; }

        // Links to related transactions
        public Guid? ReconciliationSaleId { get; set; }
        public Guid? ReconciliationPurchaseId { get; set; }
        public Guid? ReconciliationCapitalAccountId { get; set; }

        // Navigation properties
        [ForeignKey("ProductVariationId")]
        public virtual ProductVariation ProductVariation { get; set; } = null!;

        [ForeignKey("ProductStorageId")]
        public virtual ProductStorage ProductStorage { get; set; } = null!;

        [ForeignKey("CreatedById")]
        public virtual User CreatedBy { get; set; } = null!;

        [ForeignKey("ReconciliationSaleId")]
        public virtual Sale? ReconciliationSale { get; set; }

        [ForeignKey("ReconciliationPurchaseId")]
        public virtual Purchase? ReconciliationPurchase { get; set; }

        [ForeignKey("ReconciliationCapitalAccountId")]
        public virtual CapitalAccount? ReconciliationCapitalAccount { get; set; }
    }

    public enum ReconciliationReason
    {
        STOCK_LOSS,           // General stock loss
        STOCK_GAIN,           // General stock gain
        DAMAGE,               // Damaged products
        THEFT,                // Stolen products
        FOUND,                // Found products
        CORRECTION,            // Correction of counting error
        EXPIRY,               // Expired products
        SPOILAGE,             // Spoiled products
        RETURN,               // Returned products
        ADJUSTMENT,           // Manual adjustment
        OTHER                 // Other reasons
    }

    // DTOs
    public class ProductAuditTrailDto
    {
        public Guid Id { get; set; }
        public Guid ProductVariationId { get; set; }
        public Guid ProductStorageId { get; set; }
        public decimal QuantityBefore { get; set; }
        public decimal QuantityAfter { get; set; }
        public ReconciliationReason Reason { get; set; }
        public string? Notes { get; set; }
        public Guid CreatedById { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid? ReconciliationSaleId { get; set; }
        public Guid? ReconciliationPurchaseId { get; set; }
        public Guid? ReconciliationCapitalAccountId { get; set; }
        public string? ProductVariationName { get; set; }
        public string? StoreName { get; set; }
        public string? CreatedByName { get; set; }
    }

    public class CreateReconciliationDto
    {
        [Required]
        public Guid ProductStorageId { get; set; }

        [Required]
        public decimal NewQuantity { get; set; }

        [Required]
        public ReconciliationReason Reason { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        [Required]
        public Guid CreatedById { get; set; }
    }
}

