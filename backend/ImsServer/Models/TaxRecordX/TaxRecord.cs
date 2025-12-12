using System.ComponentModel.DataAnnotations;

namespace ImsServer.Models.TaxRecordX
{
    public class TaxRecord : GeneralFields
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public TaxType Type { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        public bool IsPaid { get; set; } = false;

        public DateTime? PaidDate { get; set; }

        [MaxLength(100)]
        public string? ReferenceNumber { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public decimal? PenaltyAmount { get; set; }

        public DateTime? PeriodStart { get; set; }

        public DateTime? PeriodEnd { get; set; }
    }

    public enum TaxType
    {
        VAT,
        INCOME_TAX,
        WITHHOLDING_TAX,
        PROPERTY_TAX,
        EXCISE_DUTY,
        OTHER
    }

    // DTOs
    public class CreateTaxRecordDto
    {
        public Guid Id { get; set; }
        public TaxType Type { get; set; }
        public decimal Amount { get; set; }
        public DateTime DueDate { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Description { get; set; }
        public DateTime? PeriodStart { get; set; }
        public DateTime? PeriodEnd { get; set; }
    }

    public class UpdateTaxRecordDto
    {
        public decimal? Amount { get; set; }
        public DateTime? DueDate { get; set; }
        public bool? IsPaid { get; set; }
        public DateTime? PaidDate { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Description { get; set; }
        public decimal? PenaltyAmount { get; set; }
    }
}
