using System.ComponentModel.DataAnnotations.Schema;
using ImsServer.Models.StoreX;
using ImsServer.Models.SupplierX;

namespace ImsServer.Models.ProductX
{

    public class ProductStorage : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid ProductGenericId { get; set; }
        public Guid ProductVariationId { get; set; }
        public decimal Quantity { get; set; }
        public Guid StorageId { get; set; }
        public decimal ReorderLevel { get; set; }

        public virtual ProductGeneric ProductGeneric { get; set; }
        public virtual Store Store { get; set; }
        public virtual ProductVariation ProductVariation { get; set; }

    }

    public class ProductStorageDto : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid ProductGenericId { get; set; }
        public decimal Quantity { get; set; }
        public Guid StorageId { get; set; }
        public decimal ReorderLevel { get; set; }
        public Guid ProductVariationId { get; set; }
        public SimpleProductGenericDto? ProductGeneric { get; set; }
        public SimpleStoreDto? Store { get; set; }
        public SimpleProductVariationDto? ProductVariation { get; set; }
    }

    public class SimpleProductStorageDto
    {
        public Guid Id { get; set; }
        public Guid ProductGenericId { get; set; }
        public Guid ProductVariationId { get; set; }
        public decimal Quantity { get; set; }
        public Guid StorageId { get; set; }
        public decimal ReorderLevel { get; set; }
    }

}