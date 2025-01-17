using ImsServer.Models.StoreX;


namespace ImsServer.Models.CategoryX
{
    
    public class Category : GeneralFields
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }

        //Associated Stores 
        // public virtual ICollection<Store> Stores { get; set; } = new List<Store>();
    }

    public class SimpleCategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set;}
        public string? Description { get; set;}
    }

    public class CategoryDto : GeneralFields
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }

        // public List<SimpleStoreDto>? Stores {get; set;}
    }

}