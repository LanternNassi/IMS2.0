using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.SystemConfigX;
using AutoMapper;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SystemConfigController : ControllerBase
    {
        private readonly DBContext _db;
        private readonly IMapper _mapper;

        public SystemConfigController(DBContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetSystemConfig()
        {
            var config = await _db.SystemConfigs
                .Include(sc => sc.Contacts)
                .FirstOrDefaultAsync();

            if (config == null)
            {
                return NotFound("System configuration not found");
            }

            return Ok(_mapper.Map<SystemConfigDto>(config));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSystemConfigById(Guid id)
        {
            var config = await _db.SystemConfigs
                .Include(sc => sc.Contacts)
                .FirstOrDefaultAsync(sc => sc.Id == id);

            if (config == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map<SystemConfigDto>(config));
        }

        [HttpPost]
        public async Task<IActionResult> CreateSystemConfig([FromBody] CreateSystemConfigDto dto)
        {
            if (dto == null)
            {
                return BadRequest("System configuration data is required");
            }

            // Check if a system config already exists
            var existingConfig = await _db.SystemConfigs.FirstOrDefaultAsync();
            if (existingConfig != null)
            {
                return BadRequest("System configuration already exists. Use PUT to update.");
            }

            var config = new SystemConfig
            {
                Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                OrgnanisationName = dto.OrgnanisationName,
                OrganisationDescription = dto.OrganisationDescription,
                Currency = dto.Currency,
                RegisteredBusinessName = dto.RegisteredBusinessName,
                RegisteredBusinessContact = dto.RegisteredBusinessContact,
                RegisteredTINumber = dto.RegisteredTINumber,
                RegisteredBusinessAddress = dto.RegisteredBusinessAddress,
                FiscalYearStart = dto.FiscalYearStart,
                FiscalYearEnd = dto.FiscalYearEnd,
                IMSKey = dto.IMSKey,
                IMSVersion = dto.IMSVersion,
                LicenseValidTill = dto.LicenseValidTill,
                Logo = dto.Logo,
                Contacts = new List<Contact>()
            };

            // Add contacts if provided
            if (dto.Contacts != null && dto.Contacts.Any())
            {
                foreach (var contactDto in dto.Contacts)
                {
                    config.Contacts.Add(new Contact
                    {
                        Id = contactDto.Id == Guid.Empty ? Guid.NewGuid() : contactDto.Id,
                        SystemConfigId = config.Id,
                        Email = contactDto.Email,
                        Telephone = contactDto.Telephone
                    });
                }
            }

            _db.SystemConfigs.Add(config);
            await _db.SaveChangesAsync();

            var createdConfig = await _db.SystemConfigs
                .Include(sc => sc.Contacts)
                .FirstOrDefaultAsync(sc => sc.Id == config.Id);

            return CreatedAtAction(nameof(GetSystemConfigById), new { id = config.Id }, _mapper.Map<SystemConfigDto>(createdConfig));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSystemConfig(Guid id, [FromBody] UpdateSystemConfigDto dto)
        {
            if (dto == null)
            {
                return BadRequest("System configuration data is required");
            }

            var config = await _db.SystemConfigs
                .FirstOrDefaultAsync(sc => sc.Id == id);

            if (config == null)
            {
                return NotFound();
            }

            // Update main properties
            config.OrgnanisationName = dto.OrgnanisationName;
            config.OrganisationDescription = dto.OrganisationDescription;
            config.Currency = dto.Currency;
            config.RegisteredBusinessName = dto.RegisteredBusinessName;
            config.RegisteredBusinessContact = dto.RegisteredBusinessContact;
            config.RegisteredTINumber = dto.RegisteredTINumber;
            config.RegisteredBusinessAddress = dto.RegisteredBusinessAddress;
            config.FiscalYearStart = dto.FiscalYearStart;
            config.FiscalYearEnd = dto.FiscalYearEnd;
            config.IMSKey = dto.IMSKey;
            config.IMSVersion = dto.IMSVersion;
            config.LicenseValidTill = dto.LicenseValidTill;
            config.Logo = dto.Logo;

            await _db.SaveChangesAsync();

            var updatedConfig = await _db.SystemConfigs
                .Include(sc => sc.Contacts)
                .FirstOrDefaultAsync(sc => sc.Id == id);

            return Ok(_mapper.Map<SystemConfigDto>(updatedConfig));
        }

        [HttpPut]
        public async Task<IActionResult> UpdateSystemConfig([FromBody] UpdateSystemConfigDto dto)
        {
            if (dto == null)
            {
                return BadRequest("System configuration data is required");
            }

            // Get the first (and should be only) system config
            var config = await _db.SystemConfigs
                .FirstOrDefaultAsync();

            if (config == null)
            {
                return NotFound("System configuration not found");
            }

            // Update main properties
            config.OrgnanisationName = dto.OrgnanisationName;
            config.OrganisationDescription = dto.OrganisationDescription;
            config.Currency = dto.Currency;
            config.RegisteredBusinessName = dto.RegisteredBusinessName;
            config.RegisteredBusinessContact = dto.RegisteredBusinessContact;
            config.RegisteredTINumber = dto.RegisteredTINumber;
            config.RegisteredBusinessAddress = dto.RegisteredBusinessAddress;
            config.FiscalYearStart = dto.FiscalYearStart;
            config.FiscalYearEnd = dto.FiscalYearEnd;
            config.IMSKey = dto.IMSKey;
            config.IMSVersion = dto.IMSVersion;
            config.LicenseValidTill = dto.LicenseValidTill;
            config.Logo = dto.Logo;

            await _db.SaveChangesAsync();

            var updatedConfig = await _db.SystemConfigs
                .Include(sc => sc.Contacts)
                .FirstOrDefaultAsync(sc => sc.Id == config.Id);

            return Ok(_mapper.Map<SystemConfigDto>(updatedConfig));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSystemConfig(Guid id)
        {
            var config = await _db.SystemConfigs.FindAsync(id);

            if (config == null)
            {
                return NotFound();
            }

            _db.SoftDelete(config);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        // Contact endpoints
        [HttpGet("Contacts")]
        public async Task<IActionResult> GetContacts()
        {
            var config = await _db.SystemConfigs
                .Include(sc => sc.Contacts)
                .FirstOrDefaultAsync();

            if (config == null)
            {
                return Ok(new List<ContactDto>());
            }

            var contacts = config.Contacts.Select(c => _mapper.Map<ContactDto>(c)).ToList();
            return Ok(contacts);
        }

        [HttpPost("Contacts")]
        public async Task<IActionResult> CreateContact([FromBody] CreateContactDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Contact data is required");
            }

            // Get the system config
            var config = await _db.SystemConfigs.FirstOrDefaultAsync();
            if (config == null)
            {
                return BadRequest("System configuration not found. Please create system configuration first.");
            }

            var contact = new Contact
            {
                Id = Guid.NewGuid(),
                SystemConfigId = config.Id,
                Email = dto.Email,
                Telephone = dto.Telephone
            };

            _db.Contacts.Add(contact);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetContactById), new { id = contact.Id }, _mapper.Map<ContactDto>(contact));
        }

        [HttpGet("Contacts/{id}")]
        public async Task<IActionResult> GetContactById(Guid id)
        {
            var contact = await _db.Contacts.FindAsync(id);

            if (contact == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map<ContactDto>(contact));
        }

        [HttpPut("Contacts/{id}")]
        public async Task<IActionResult> UpdateContact(Guid id, [FromBody] UpdateContactDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Contact data is required");
            }

            var contact = await _db.Contacts.FindAsync(id);

            if (contact == null)
            {
                return NotFound();
            }

            contact.Email = dto.Email;
            contact.Telephone = dto.Telephone;

            await _db.SaveChangesAsync();

            return Ok(_mapper.Map<ContactDto>(contact));
        }

        [HttpDelete("Contacts/{id}")]
        public async Task<IActionResult> DeleteContact(Guid id)
        {
            var contact = await _db.Contacts.FindAsync(id);

            if (contact == null)
            {
                return NotFound();
            }

            _db.Contacts.Remove(contact);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}

