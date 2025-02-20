using ImsServer.Models.ProductX;

namespace ImsServer.Models.ProductX
{
    public class Product : GeneralFields
    {
        public Guid Id { get; set; }
        public string ProductName { get; set; }
        public string? BarCode { get; set; }
        public string? Description { get; set; }
        public decimal BaseCostPrice { get; set; }
        public decimal BaseRetailPrice { get; set; }
        public decimal BaseWholePrice { get; set; }
        public decimal? BaseDiscount { get; set; }
        public decimal StackSize { get; set; }
        public string BasicUnitofMeasure { get; set; }
        public decimal ReorderLevel { get; set; }
        public bool IsTaxable { get; set; }
        public decimal? TaxRate { get; set;}
        public bool IsActive { get; set; }

        public virtual ICollection<ProductVariation>? ProductVariations { get; set; }
        public virtual ICollection<ProductGeneric>? ProductGenerics { get; set; }
         
    }

    
    public class SimpleProductDto : GeneralFields
    {
        public Guid Id { get; set; }
        public string ProductName { get; set; }
        public string? BarCode { get; set; }
        public string? Description { get; set; }
        public decimal BaseCostPrice { get; set; }
        public decimal BaseRetailPrice { get; set; }
        public decimal BaseWholePrice { get; set; }
        public decimal? BaseDiscount { get; set; }
        public decimal StackSize { get; set; }
        public string BasicUnitofMeasure { get; set; }
        public decimal ReorderLevel { get; set; }
        public bool IsTaxable { get; set; }
        public decimal? TaxRate { get; set;}
        public bool IsActive { get; set; }
    }

    public class ProductDto : SimpleProductDto
    {
        public List<ProductVariationDto>? ProductVariations { get; set; }
    }


}