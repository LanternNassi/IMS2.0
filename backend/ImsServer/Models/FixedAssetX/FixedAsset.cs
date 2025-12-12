using System.ComponentModel.DataAnnotations;

namespace ImsServer.Models.FixedAssetX
{
    public class FixedAsset : GeneralFields
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public AssetType Type { get; set; }

        [Required]
        public decimal PurchasePrice { get; set; }

        [Required]
        public DateTime PurchaseDate { get; set; }

        [Required]
        public decimal CurrentValue { get; set; }

        [Required]
        public decimal DepreciationRate { get; set; } // Annual depreciation rate as percentage

        [Required]
        public int UsefulLifeYears { get; set; }

        [MaxLength(100)]
        public string? SerialNumber { get; set; }

        [MaxLength(100)]
        public string? Manufacturer { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public DateTime? DisposalDate { get; set; }

        public decimal? DisposalValue { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public enum AssetType
    {
        EQUIPMENT,
        VEHICLE,
        BUILDING,
        FURNITURE,
        COMPUTER,
        OTHER
    }

    // DTOs
    public class CreateFixedAssetDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public AssetType Type { get; set; }
        public decimal PurchasePrice { get; set; }
        public DateTime PurchaseDate { get; set; }
        public decimal DepreciationRate { get; set; }
        public int UsefulLifeYears { get; set; }
        public string? SerialNumber { get; set; }
        public string? Manufacturer { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateFixedAssetDto
    {
        public string? Name { get; set; }
        public string? SerialNumber { get; set; }
        public string? Manufacturer { get; set; }
        public string? Description { get; set; }
        public decimal? DepreciationRate { get; set; }
        public int? UsefulLifeYears { get; set; }
        public DateTime? DisposalDate { get; set; }
        public decimal? DisposalValue { get; set; }
        public bool? IsActive { get; set; }
    }
}
