using System.ComponentModel.DataAnnotations.Schema;
using ImsServer.Models.SystemConfigX;

namespace ImsServer.Models.SystemConfigX
{
    
    public class SystemConfig : GeneralFields
    {
        public Guid Id { get; set; }

        public string OrgnanisationName { get; set; }

        public string OrganisationDescription { get; set; }

        public virtual ICollection<Contact> Contacts { get; set; }

        public Currency Currency { get; set; }

        // Official properties 
        public string? RegisteredBusinessName { get; set; }
        public string? RegisteredBusinessContact { get; set; }
        public string? RegisteredTINumber { get; set; }
        public string? RegisteredBusinessAddress { get; set; }
        public string? FiscalYearStart { get; set; }
        public string? FiscalYearEnd { get; set; }

        public string? IMSKey {get; set;}

        public string? IMSVersion { get; set;}
        public DateTime? LicenseValidTill { get; set; }

    }

}