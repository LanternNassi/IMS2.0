

namespace ImsServer.Models.StoreX
{
    public class Store : GeneralFields
    {
        public Guid Id { get; set; }
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
    }
}