using System.ComponentModel.DataAnnotations;
using ImsServer.Models.FinancialAccountX;
using ImsServer.Models.PurchaseX;
using ImsServer.Models.SaleX;
using System.ComponentModel.DataAnnotations.Schema;

namespace ImsServer.Models.PurchaseDebtX
{
    public class PurchaseDebtTracker : GeneralFields
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid PurchaseId { get; set; }

        public Guid? LinkedFinancialAccountId { get; set; }

        [Required]
        public decimal PaidAmount { get; set; }

        [Required]
        public PaymentMethod PaymentMethod { get; set; }

        [Required]
        public DateTime PaymentDate { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public Guid? ReceivedById { get; set; }

        [ForeignKey("LinkedFinancialAccountId")]
        public FinancialAccount? LinkedFinancialAccount { get; set; }

        // Navigation
        public virtual Purchase Purchase { get; set; } = null!;
    }

    // DTOs
    public class CreatePurchaseDebtPaymentDto
    {
        public Guid Id { get; set; }
        public Guid PurchaseId { get; set; }
        public decimal PaidAmount { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public DateTime PaymentDate { get; set; }
        public string? Description { get; set; }
        public Guid? ReceivedById { get; set; }
        public Guid? LinkedFinancialAccountId { get; set; }
    }

    public class UpdatePurchaseDebtPaymentDto
    {
        public decimal? PaidAmount { get; set; }
        public PaymentMethod? PaymentMethod { get; set; }
        public DateTime? PaymentDate { get; set; }
        public string? Description { get; set; }
    }
}
