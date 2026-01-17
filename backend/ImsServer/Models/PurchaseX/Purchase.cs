using ImsServer.Models.DebitNoteX;
using ImsServer.Models.FinancialAccountX;
using ImsServer.Models.PurchaseX;
using ImsServer.Models.SupplierX;
using ImsServer.Models.UserX;
using System.ComponentModel.DataAnnotations.Schema;


namespace ImsServer.Models.PurchaseX
{
    public class Purchase : GeneralFields
    {
        public Guid Id { get; set; }
        public string PurchaseNumber { get; set; }
        public DateTime PurchaseDate { get; set; }
        public Guid SupplierId { get; set; }
        public Guid ProcessedBy { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal OutstandingAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal GrandTotal { get; set; }
        public string? Notes { get; set; }
        public bool IsPaid { get; set; }
        public bool WasPartialPayment { get; set; }
        public Guid? LinkedFinancialAccountId { get; set; }

        [ForeignKey("SupplierId")]
        public virtual Supplier Supplier { get; set; }

        [ForeignKey("ProcessedBy")]
        public virtual User ProcessedUser { get; set; }

        [ForeignKey("LinkedFinancialAccountId")]
        public virtual FinancialAccount? LinkedFinancialAccount { get; set; }

        public virtual ICollection<PurchaseItem> PurchaseItems { get; set; } = new List<PurchaseItem>();

        public virtual ICollection<DebitNote>? DebitNotes { get; set; } = new List<DebitNote>();

    }

    public class PurchaseDto : GeneralFields
    {
        public Guid Id { get; set; }
        public string PurchaseNumber { get; set; }
        public DateTime PurchaseDate { get; set; }
        public Guid SupplierId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal GrandTotal { get; set; }
        public string? Notes { get; set; }
        public bool IsPaid { get; set; }
        public Guid? LinkedFinancialAccountId { get; set; }
        public SupplierDto Supplier { get; set; }
        public UserDto ProcessedUser { get; set; }
        public List<SimplePurchaseItemDto> PurchaseItems { get; set; } = new List<SimplePurchaseItemDto>();

        public List<CreateDebitNoteDto>? DebitNotes { get; set; } = new List<CreateDebitNoteDto>();

    }

    public class SimplePurchaseDto
    {
        public Guid Id { get; set; }
        public string PurchaseNumber { get; set; }
        public DateTime PurchaseDate { get; set; }
        public Guid SupplierId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal GrandTotal { get; set; }
        public string? Notes { get; set; }
        public bool IsPaid { get; set; }
        public Guid? LinkedFinancialAccountId { get; set; }

        public List<CreateDebitNoteDto>? DebitNotes { get; set; } = new List<CreateDebitNoteDto>();
    }

    public class CreatePurchaseDto
    {
        public Guid Id { get; set; }
        public string? PurchaseNumber { get; set; }
        public DateTime PurchaseDate { get; set; }
        public Guid SupplierId { get; set; }
        public Guid ProcessedBy { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal GrandTotal { get; set; }
        public string? Notes { get; set; }
        public bool IsPaid { get; set; }
        public Guid? LinkedFinancialAccountId { get; set; }
        public List<CreatePurchaseItemDto>? Items { get; set; }
    }

    public class UpdatePurchaseDto
    {
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public bool IsPaid { get; set; }
        public string? Notes { get; set; }
    }
}