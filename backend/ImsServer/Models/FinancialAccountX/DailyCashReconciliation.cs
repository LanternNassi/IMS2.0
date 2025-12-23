using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ImsServer.Models;

namespace ImsServer.Models.FinancialAccountX
{
    public class DailyCashReconciliation : GeneralFields
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid FinancialAccountId { get; set; }

        public FinancialAccount? FinancialAccount { get; set; }

        /// <summary>
        /// Business date in UTC (normalized to 00:00:00Z).
        /// Note: This reconciliation record can be used for any FinancialAccount type.
        /// </summary>
        [Required]
        public DateTime BusinessDateUtc { get; set; }

        /// <summary>
        /// When the opening balance was captured.
        /// </summary>
        [Required]
        public DateTime OpenedAtUtc { get; set; }

        /// <summary>
        /// When the closing balance was captured.
        /// </summary>
        public DateTime? ClosedAtUtc { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal OpeningSystemBalance { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? OpeningCountedBalance { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? OpeningVariance { get; set; }

        [MaxLength(1000)]
        public string? OpeningNotes { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? ClosingSystemBalance { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? ClosingCountedBalance { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? ClosingVariance { get; set; }

        [MaxLength(1000)]
        public string? ClosingNotes { get; set; }
    }

    public class OpenDailyCashReconciliationDto
    {
        public Guid FinancialAccountId { get; set; }
        public DateTime? BusinessDateUtc { get; set; }
        public decimal? OpeningCountedBalance { get; set; }
        public string? Notes { get; set; }
    }

    public class CloseDailyCashReconciliationDto
    {
        public Guid FinancialAccountId { get; set; }
        public DateTime? BusinessDateUtc { get; set; }
        public decimal? ClosingCountedBalance { get; set; }
        public string? Notes { get; set; }
    }
}
