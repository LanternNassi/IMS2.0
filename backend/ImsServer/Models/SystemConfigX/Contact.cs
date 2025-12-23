using System.ComponentModel.DataAnnotations.Schema;


namespace ImsServer.Models.SystemConfigX
{
    public class Contact : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid SystemConfigId { get; set; }
        public string Email { get; set; }
        public string Telephone { get; set; }

        [ForeignKey("SystemConfigId")]
        public virtual SystemConfig SystemConfig { get; set; }
    }
}