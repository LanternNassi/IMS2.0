using ImsServer.Models.CustomerX;

namespace ImsServer.Models.CustomerX
{
    public class Customer : GeneralFields
    {
        public Guid Id { get; set; }
        public string Name {get; set;}
        public string? Address {get; set;}
        public string? Phone {get; set;}
        public string? Email {get; set;}
        public string? AccountNumber {get; set;}
    }

}