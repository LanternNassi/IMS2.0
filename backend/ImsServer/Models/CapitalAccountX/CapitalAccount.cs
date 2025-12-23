using System.ComponentModel.DataAnnotations;
using ImsServer.Models.FinancialAccountX;
using ImsServer.Models.UserX;

namespace ImsServer.Models.CapitalAccountX
{
    public class CapitalAccount : GeneralFields
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid OwnerId { get; set; }

        public Guid? LinkedFinancialAccountId { get; set; }

        [Required]
        public TransactionType Type { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public DateTime TransactionDate { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(100)]
        public string? ReferenceNumber { get; set; }

        // Navigation
        public virtual User Owner { get; set; } = null!;

        public virtual FinancialAccount? LinkedFinancialAccount { get; set; }
    }

    public enum TransactionType
    {
        INITIAL_CAPITAL,
        ADDITIONAL_INVESTMENT,
        WITHDRAWAL,
        PROFIT_DISTRIBUTION
    }

    // DTOs
    public class CreateCapitalAccountDto
    {
        public Guid Id { get; set; }
        public Guid OwnerId { get; set; }
        public TransactionType Type { get; set; }
        public decimal Amount { get; set; }
        public DateTime TransactionDate { get; set; }
        public string? Description { get; set; }
        public string? ReferenceNumber { get; set; }
        public Guid? LinkedFinancialAccountId { get; set; }
    }

    public class UpdateCapitalAccountDto
    {
        public decimal? Amount { get; set; }
        public DateTime? TransactionDate { get; set; }
        public string? Description { get; set; }
        public string? ReferenceNumber { get; set; }
        public Guid? LinkedFinancialAccountId { get; set; }
    }
}
