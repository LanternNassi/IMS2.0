using ImsServer.Models.CategoryX;

namespace ImsServer.Models.StoreX
{
    public class Store : GeneralFields
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? Address { get; set; }
        public string? Description { get; set; }

        //Lazy load access the connected categories
        // public virtual ICollection<Category> Categories { get; set; } = new List<Category>();
    }

    public class SimpleStoreDto
    {
        public Guid Id {get; set;}
        public string Name { get; set; }
        public string? Address { get; set; }
        public string? Description { get; set; }
    }

    public class StoreDto : GeneralFields
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? Address { get; set; }
        public string? Description { get; set; }
        
        // public List<SimpleCategoryDto>? Categories { get; set; }
    }
}