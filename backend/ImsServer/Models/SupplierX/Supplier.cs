using ImsServer.Models.SupplierX;

namespace ImsServer.Models.SupplierX
{
    public class Supplier : GeneralFields
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; }
        public string? ContactPerson { get; set; }
        public string? EmailAddress { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public string? TIN { get; set; }
        public string Status { get; set; } //Active , Disabled

        public virtual ICollection<SupplierTag> SupplierTags {get; set;} = new List<SupplierTag>();
    }

    public class SupplierTag : GeneralFields
    {
        public int Id { get; set;}
        public string Name { get; set; }
        public string? Description { get; set; }

        public virtual ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();
    }

    public class SupplierTagDto : GeneralFields
    {
        public int Id {get; set;}
        public string Name {get; set;}
        public List <SimpleSupplierDto>? Suppliers {get; set;}
    }

    public class SimpleSupplierTagDto
    {
        public int Id {get; set;}
        public string Name {get; set;}
        public string? Description {get; set;}
    }

    public class SimpleSupplierDto
    {
        public Guid Id { get; set;}
        public string CompanyName { get; set; }
        public string? ContactPerson { get; set; }
        public string? EmailAddress { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public string? TIN { get; set; }
        public string Status { get; set; } //Active , Disabled

    }

    public class SupplierDto : GeneralFields
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; }
        public string? ContactPerson { get; set; }
        public string? EmailAddress { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public string? TIN { get; set; }
        public string Status { get; set; } //Active , Disabled

        public List<SimpleSupplierTagDto>? SupplierTags {get; set;}

    }

}