using System.ComponentModel.DataAnnotations;

namespace ImsServer.Models.FinancialAccountX
{
    public class FinancialAccount : GeneralFields
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string AccountName { get; set; } = string.Empty;

        [Required]
        public AccountType Type { get; set; }

        [MaxLength(50)]
        public string? AccountNumber { get; set; }

        [Required]
        public decimal Balance { get; set; }

        [MaxLength(100)]
        public string? BankName { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsDefault { get; set; } = false;
    }

    public enum AccountType
    {
        BANK,
        CASH,
        MOBILE_MONEY,
        SAVINGS
    }

    // DTOs
    public class CreateFinancialAccountDto
    {
        public Guid Id { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public AccountType Type { get; set; }
        public string? AccountNumber { get; set; }
        public decimal Balance { get; set; }
        public string? BankName { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDefault { get; set; } = false;
    }

    public class UpdateFinancialAccountDto
    {
        public string? AccountName { get; set; }
        public string? AccountNumber { get; set; }
        public decimal? Balance { get; set; }
        public string? BankName { get; set; }
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsDefault { get; set; }
    }
}
