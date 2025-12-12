using System.ComponentModel.DataAnnotations.Schema;


namespace ImsServer.Models.SystemConfigX
{
    public class Contact : GeneralFields
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string Telephone { get; set; }
    }
}