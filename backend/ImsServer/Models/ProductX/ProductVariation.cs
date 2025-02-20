using System.ComponentModel.DataAnnotations.Schema;


namespace ImsServer.Models.ProductX
{
    public class ProductVariation : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string Name { get; set; }
        public decimal UnitSize { get; set; }
        public decimal RetailPrice { get; set; }
        public decimal WholeSalePrice { get; set; }
        public decimal? Discount { get; set; }
        public string? UnitofMeasure { get; set; }
        public bool IsActive { get; set; }
        public bool IsMain { get; set; }
        
        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; }

    }

    public class ProductVariationDto : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string Name { get; set; }
        public decimal UnitSize { get; set; }
        public decimal RetailPrice { get; set; }
        public decimal WholeSalePrice { get; set; }
        public decimal? Discount { get; set; }
        public string? UnitofMeasure { get; set; }
        public bool IsActive { get; set; }
        public bool IsMain { get; set; }
    }

    public class SimpleProductVariationDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string Name { get; set; }
        public decimal UnitSize { get; set; }
        public decimal RetailPrice { get; set; }
        public decimal WholeSalePrice { get; set; }
        public decimal? Discount { get; set; }
        public string? UnitofMeasure { get; set; }
        public bool IsActive { get; set; }
        public bool IsMain { get; set; }
    }
}