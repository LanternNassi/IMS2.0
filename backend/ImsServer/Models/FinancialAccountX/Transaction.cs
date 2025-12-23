using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ImsServer.Models.FinancialAccountX;

namespace ImsServer.Models.FinancialAccountX
{
    public class Transaction : GeneralFields
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid FromFinancialAccountId { get; set; }

        [Required]
        public Guid ToFinancialAccountId { get; set; }

        [Required]
        public DateTime MovementDate { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public AccountTransactionType Type { get; set; } = AccountTransactionType.TRANSFER;

        [Required]
        public TransactionStatus Status { get; set; } = TransactionStatus.COMPLETED;

        public Currency Currency { get; set; } = Currency.UGX;

        [MaxLength(100)]
        public string? ReferenceNumber { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        public decimal? ExchangeRate { get; set; }
        public decimal? Fees { get; set; }

        [ForeignKey("FromFinancialAccountId")]
        public virtual FinancialAccount? FromFinancialAccount { get; set; }

        [ForeignKey("ToFinancialAccountId")]
        public virtual FinancialAccount? ToFinancialAccount { get; set; }
    }

    public enum AccountTransactionType
    {
        TRANSFER,
        DEPOSIT,
        WITHDRAWAL,
        PAYMENT,
        REFUND,
        ADJUSTMENT
    }

    public enum TransactionStatus
    {
        PENDING,
        COMPLETED,
        FAILED,
        CANCELLED,
        REVERSED
    }

    // DTOs
    public class CreateTransactionDto
    {
        public Guid FromFinancialAccountId { get; set; }
        public Guid ToFinancialAccountId { get; set; }
        public DateTime MovementDate { get; set; }
        public decimal Amount { get; set; }
        public AccountTransactionType Type { get; set; } = AccountTransactionType.TRANSFER;
        public TransactionStatus Status { get; set; } = TransactionStatus.COMPLETED;
        public Currency Currency { get; set; } = Currency.UGX;
        public string? ReferenceNumber { get; set; }
        public string? Description { get; set; }
        public string? Notes { get; set; }
        public decimal? ExchangeRate { get; set; }
        public decimal? Fees { get; set; }
        public int AddedBy { get; set; }
    }

    public class UpdateTransactionDto
    {
        public DateTime? MovementDate { get; set; }
        public decimal? Amount { get; set; }
        public AccountTransactionType? Type { get; set; }
        public TransactionStatus? Status { get; set; }
        public Currency? Currency { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Description { get; set; }
        public string? Notes { get; set; }
        public decimal? ExchangeRate { get; set; }
        public decimal? Fees { get; set; }
        public int LastUpdatedBy { get; set; }
    }
}