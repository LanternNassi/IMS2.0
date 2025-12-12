using ImsServer.Models.SupplierX;
using System.ComponentModel.DataAnnotations.Schema;


namespace ImsServer.Models.ProductX
{
    public class ProductGeneric : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public DateTime ExpiryDate { get; set; }
        public DateTime ManufactureDate { get; set; }
        public string? BatchNumber { get; set; }
        public Guid SupplierId { get; set; }  

        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; }

        [ForeignKey("SupplierId")]
        public virtual Supplier Supplier { get; set; }

        public virtual ICollection<ProductStorage> ProductStorages { get; set; } = new List<ProductStorage>();
        
    }

    public class ProductGenericDto : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public DateTime ExpiryDate { get; set; }
        public DateTime ManufactureDate { get; set; }
        public string? BatchNumber { get; set; }
        public Guid SupplierId { get; set; }  
        public List<ProductStorageDto> ProductStorages { get; set; } = new List<ProductStorageDto>();
        public SupplierDto Supplier { get; set; }
    }

    public class SimpleProductGenericDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public DateTime ExpiryDate { get; set; }
        public DateTime ManufactureDate { get; set; }
        public string? BatchNumber { get; set; }
        public Guid SupplierId { get; set; }
        public List<SimpleProductStorageDto>? ProductStorages { get; set; }
    }

}