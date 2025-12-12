using ImsServer.Models.CustomerX;

namespace ImsServer.Models.CustomerX
{
    public class Customer : GeneralFields
    {
        public Guid Id { get; set; }
        public string Name {get; set;}
        public string CustomerType {get; set;}
        public string? Address {get; set;}
        public string? Phone {get; set;}
        public string? Email {get; set;}
        public string? AccountNumber {get; set;}
        public string? MoreInfo {get; set;}

        public virtual ICollection<CustomerTag> CustomerTags {get; set;} = new List<CustomerTag>();


    }

    public class CustomerTag : GeneralFields 
    {
        public int Id {get; set;}
        public string Name {get; set;}
        public string? Description {get; set;}

        public virtual ICollection<Customer> Customers {get; set;} = new List<Customer>();
    }

    public class CustomerTagDto : GeneralFields
    {
        public int Id {get; set;}
        public string Name {get; set;}
        public string? Description {get; set;}

        public List <SimpleCustomerDto>? Customers {get; set;}
    } 

    public class SimpleCustomerTagDto
    {
        public int Id {get; set;}
        public string Name {get; set;}
        public string? Description {get; set;}
    }

    public class SimpleCustomerDto
    {
        public Guid Id { get; set; }
        public string Name {get; set;}
        public string CustomerType {get; set;}
        public string? Address {get; set;}
        public string? Phone {get; set;}
        public string? Email {get; set;}
        public string? AccountNumber {get; set;}
        public string? MoreInfo {get; set;}
    }

    public class CustomerDto : GeneralFields
    {
        public Guid Id { get; set; }
        public string Name {get; set;}
        public string CustomerType {get; set;}
        public string? Address {get; set;}
        public string? Phone {get; set;}
        public string? Email {get; set;}
        public string? AccountNumber {get; set;}
        public string? MoreInfo {get; set;}

        public List<SimpleCustomerTagDto>? CustomerTags {get; set;}
    }

}