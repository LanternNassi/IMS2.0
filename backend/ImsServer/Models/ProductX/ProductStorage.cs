using System.ComponentModel.DataAnnotations.Schema;
using ImsServer.Models.StoreX;

namespace ImsServer.Models.ProductX
{

    public class ProductStorage : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid ProductGenericId { get; set; }
        public decimal Quantity { get; set; }
        public Guid StorageId { get; set; }
        public decimal ReorderLevel { get; set; }

        [ForeignKey("ProductGenericId")]
        public virtual ProductGeneric ProductGeneric { get; set; }

        [ForeignKey("StorageId")]
        public virtual Store Store { get; set; }

    }

    public class ProductStorageDto : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid ProductGenericId { get; set; }
        public decimal Quantity { get; set; }
        public Guid StorageId { get; set; }
        public decimal ReorderLevel { get; set; }
    }

    public class SimpleProductStorageDto
    {
        public Guid Id { get; set; }
        public Guid ProductGenericId { get; set; }
        public decimal Quantity { get; set; }
        public Guid StorageId { get; set; }
        public decimal ReorderLevel { get; set; }
    }

}