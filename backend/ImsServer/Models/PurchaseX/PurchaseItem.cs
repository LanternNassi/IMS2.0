using ImsServer.Models.ProductX;
using ImsServer.Models.PurchaseX;
using System.ComponentModel.DataAnnotations.Schema;

namespace ImsServer.Models.PurchaseX
{
    public class PurchaseItem : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid PurchaseId { get; set; }
        public Guid ProductVariationId { get; set; }
        public Guid? ProductGenericId { get; set; }
        public decimal Quantity { get; set; }
        public decimal CostPrice { get; set; }
        public decimal TotalPrice { get; set; }

        [ForeignKey("ProductVariationId")]
        public virtual ProductVariation ProductVariation { get; set; }

        [ForeignKey("ProductGenericId")]
        public virtual ProductGeneric? ProductGeneric { get; set; }

        public bool IsAllocated { get; set; } = false;

        [ForeignKey("PurchaseId")]
        public virtual Purchase Purchase { get; set; }
    }

    public class PurchaseItemDto : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid PurchaseId { get; set; }
        public Guid ProductVariationId { get; set; }
        public Guid? ProductGenericId { get; set; }
        public decimal Quantity { get; set; }
        public decimal CostPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public SimplePurchaseDto Purchase { get; set; }
        public SimpleProductVariationDto ProductVariation { get; set; }
        public SimpleProductGenericDto? ProductGeneric { get; set; }
    }

    public class SimplePurchaseItemDto
    {
        public Guid Id { get; set; }
        public Guid PurchaseId { get; set; }
        public Guid ProductVariationId { get; set; }
        public Guid? ProductGenericId { get; set; }
        public decimal Quantity { get; set; }
        public decimal CostPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class CreatePurchaseItemDto
    {
        public Guid Id { get; set; }
        public Guid ProductVariationId { get; set; }
        public Guid ProductId { get; set; }
        public decimal BaseCostPrice { get; set; }
        public decimal Quantity { get; set; }
        public decimal TotalPrice { get; set; }
        public bool HasGeneric { get; set; }
        public Guid? ProductGenericId { get; set; }
        public string? BatchNumber { get; set; }
        public DateTime? ManufactureDateValue { get; set; }
        public DateTime? ExpiryDateValue { get; set; }
        public Guid StoreId { get; set; }
    }
}