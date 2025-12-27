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

        public bool TaxCompliance { get; set; } = false; // True if the business is compliant with tax laws

        public decimal TaxRate { get; set; } = 18; // Default tax rate percentage
        public bool IsVATRegistered { get; set; } = false; // True if the business is VAT registered
        public string? IMSVersion { get; set;}
        public DateTime? LicenseValidTill { get; set; }

        public string? Logo { get; set; }
    }

    public class ContactDto : GeneralFields
    {
        public Guid Id { get; set; }
        public Guid SystemConfigId { get; set; }
        public string Email { get; set; }
        public string Telephone { get; set; }
    }

    public class SimpleContactDto
    {
        public Guid Id { get; set; }
        public Guid SystemConfigId { get; set; }
        public string Email { get; set; }
        public string Telephone { get; set; }
    }

    public class SystemConfigDto : GeneralFields
    {
        public Guid Id { get; set; }
        public string OrgnanisationName { get; set; }
        public string OrganisationDescription { get; set; }
        public Currency Currency { get; set; }
        public string? RegisteredBusinessName { get; set; }
        public string? RegisteredBusinessContact { get; set; }
        public string? RegisteredTINumber { get; set; }
        public string? RegisteredBusinessAddress { get; set; }
        public string? FiscalYearStart { get; set; }
        public string? FiscalYearEnd { get; set; }
        public string? IMSKey { get; set; }
        public string? IMSVersion { get; set; }
        public bool TaxCompliance { get; set; } = false; // True if the business is compliant with tax laws
        public bool IsVATRegistered { get; set; } = false; // True if the business is VAT registered
        public decimal TaxRate { get; set; } = 18; // Default tax rate percentage
        public DateTime? LicenseValidTill { get; set; }
        public string? Logo { get; set; }
        public List<SimpleContactDto>? Contacts { get; set; }
    }

    public class SimpleSystemConfigDto
    {
        public Guid Id { get; set; }
        public string OrgnanisationName { get; set; }
        public string OrganisationDescription { get; set; }
        public Currency Currency { get; set; }
        public string? RegisteredBusinessName { get; set; }
        public string? RegisteredBusinessContact { get; set; }
        public string? RegisteredTINumber { get; set; }
        public string? RegisteredBusinessAddress { get; set; }
        public string? FiscalYearStart { get; set; }
        public string? FiscalYearEnd { get; set; }
        public string? IMSKey { get; set; }
        public string? IMSVersion { get; set; }
        public bool TaxCompliance { get; set; } = false; // True if the business is compliant with tax laws
        public bool IsVATRegistered { get; set; } = false; // True if the business is VAT registered
        public decimal TaxRate { get; set; } = 18; // Default tax rate percentage
        public DateTime? LicenseValidTill { get; set; }
        public string? Logo { get; set; }
    }

    public class CreateSystemConfigDto
    {
        public Guid Id { get; set; }
        public string OrgnanisationName { get; set; }
        public string OrganisationDescription { get; set; }
        public Currency Currency { get; set; }
        public string? RegisteredBusinessName { get; set; }
        public string? RegisteredBusinessContact { get; set; }
        public string? RegisteredTINumber { get; set; }
        public string? RegisteredBusinessAddress { get; set; }
        public string? FiscalYearStart { get; set; }
        public string? FiscalYearEnd { get; set; }
        public string? IMSKey { get; set; }
        public string? IMSVersion { get; set; }
        public decimal TaxRate { get; set; } = 18; // Default tax rate percentage
        public bool TaxCompliance { get; set; } = false; // True if the business is compliant with tax laws
        public bool IsVATRegistered { get; set; } = false; // True if the business is VAT registered
        public DateTime? LicenseValidTill { get; set; }
        public string? Logo { get; set; }
        public List<SimpleContactDto>? Contacts { get; set; }
    }

    public class UpdateSystemConfigDto
    {
        public string OrgnanisationName { get; set; }
        public string OrganisationDescription { get; set; }
        public Currency Currency { get; set; }
        public string? RegisteredBusinessName { get; set; }
        public string? RegisteredBusinessContact { get; set; }
        public string? RegisteredTINumber { get; set; }
        public string? RegisteredBusinessAddress { get; set; }
        public string? FiscalYearStart { get; set; }
        public string? FiscalYearEnd { get; set; }
        public string? IMSKey { get; set; }
        public string? IMSVersion { get; set; }
        public bool TaxCompliance { get; set; } = false; // True if the business is compliant with tax laws
        public bool IsVATRegistered { get; set; } = false; // True if the business is VAT registered
        public DateTime? LicenseValidTill { get; set; }
        public string? Logo { get; set; }
    }

    public class CreateContactDto
    {
        public string Email { get; set; }
        public string Telephone { get; set; }
    }

    public class UpdateContactDto
    {
        public string Email { get; set; }
        public string Telephone { get; set; }
    }

}