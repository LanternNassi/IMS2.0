using ImsServer.Models.ProductX;
using ImsServer.Models.SaleX;
using System.ComponentModel.DataAnnotations.Schema;

namespace ImsServer.Models.SaleX
{
    public class SalesItem : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid SaleId { get; set; }
        public Guid ProductVariationId { get; set; }
        public Guid ProductStorageId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal? VATAmount { get; set; }
        public decimal  ProfitMargin { get; set; }

        [ForeignKey("SaleId")]
        public virtual Sale Sale { get; set; }
        
        [ForeignKey("ProductStorageId")]
        public virtual ProductStorage ProductStorage { get; set; }

        [ForeignKey("ProductVariationId")]
        public virtual ProductVariation ProductVariation { get; set; }
    }

    public class SalesItemDto : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid SaleId { get; set; }
        public Guid ProductVariationId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal? VATAmount { get; set; }
        public decimal  ProfitMargin { get; set; }
        public SimpleSaleDto Sale { get; set; }
        public SimpleProductStorageDto ProductStorage { get; set; }
        public SimpleProductVariationDto ProductVariation { get; set; }
    }

    public class SimpleSalesItemDto
    {
        public Guid Id { get; set; }
        public Guid SaleId { get; set; }
        public Guid ProductVariationId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal? VATAmount { get; set; }
        public decimal  ProfitMargin { get; set; }
    }

}