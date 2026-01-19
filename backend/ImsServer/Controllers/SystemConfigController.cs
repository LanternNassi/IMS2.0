using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ImsServer.Models;
using ImsServer.Models.SystemConfigX;
using ImsServer.Models.DatabaseBackupX;
using AutoMapper;
using ImsServer.Utils;
using System.IO;
using Microsoft.Extensions.Configuration;

namespace ImsServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SystemConfigController : ControllerBase
    {
        private readonly DBContext _db;
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;

        public SystemConfigController(DBContext db, IMapper mapper, IConfiguration configuration)
        {
            _db = db;
            _mapper = mapper;
            _configuration = configuration;
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
                TaxCompliance = dto.TaxCompliance,
                IsVATRegistered = dto.IsVATRegistered,
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
            config.TaxCompliance = dto.TaxCompliance;
            config.IsVATRegistered = dto.IsVATRegistered;
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
            config.TaxCompliance = dto.TaxCompliance;
            config.IsVATRegistered = dto.IsVATRegistered;
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

        [HttpPost("Backup")]
        public async Task<IActionResult> CreateBackup([FromBody] CreateBackupDto? dto = null)
        {
            try
            {
                var systemConfig = await _db.SystemConfigs.FirstOrDefaultAsync();
                if (systemConfig == null)
                {
                    return BadRequest("System configuration not found. Please configure the system first.");
                }

                // Get backup locations - use provided locations or system config locations
                var backupLocations = dto?.BackupLocations ?? systemConfig.BackupLocations ?? new List<string>();
                if (!backupLocations.Any())
                {
                    return BadRequest("No backup locations configured. Please add backup locations in system settings.");
                }

                var backupType = dto?.IsManual == true ? BackupType.Manual : BackupType.Automatic;
                var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                var databaseName = "IMS";
                var backupResults = new List<DatabaseBackupDto>();

                foreach (var location in backupLocations)
                {
                    try
                    {
                        // Ensure directory exists
                        if (!Directory.Exists(location))
                        {
                            try
                            {
                                Directory.CreateDirectory(location);
                            }
                            catch (UnauthorizedAccessException ex)
                            {
                                throw new Exception($"Cannot create backup directory '{location}': Access denied. Please ensure the application has write permissions to this location.", ex);
                            }
                        }

                        // Generate backup file name with timestamp
                        var backupFileName = $"{databaseName}_Backup_{timestamp}.bak";
                        var backupFilePath = Path.Combine(location, backupFileName);

                        // Get connection string from configuration
                        var connectionString = _configuration.GetConnectionString("DBCONNECTION") 
                            ?? _db.Database.GetConnectionString();

                        if (string.IsNullOrEmpty(connectionString))
                        {
                            throw new Exception("Database connection string not found");
                        }

                        // Perform backup
                        await Backups.BackupDatabaseAsync(connectionString, backupFilePath);

                        // Get file size
                        var fileInfo = new FileInfo(backupFilePath);
                        var fileSizeBytes = fileInfo.Exists ? fileInfo.Length : 0;

                        // Create backup record
                        var backup = new DatabaseBackup
                        {
                            Id = Guid.NewGuid(),
                            BackupFileName = backupFileName,
                            BackupFilePath = backupFilePath,
                            BackupLocation = location,
                            FileSizeBytes = fileSizeBytes,
                            BackupDate = DateTime.Now,
                            BackupType = backupType,
                            IsSuccessful = true,
                            SystemConfigId = systemConfig.Id
                        };

                        _db.DatabaseBackups.Add(backup);
                        await _db.SaveChangesAsync();

                        backupResults.Add(new DatabaseBackupDto
                        {
                            Id = backup.Id,
                            BackupFileName = backup.BackupFileName,
                            BackupFilePath = backup.BackupFilePath,
                            BackupLocation = backup.BackupLocation,
                            FileSizeBytes = backup.FileSizeBytes,
                            BackupDate = backup.BackupDate,
                            BackupType = backup.BackupType,
                            IsSuccessful = backup.IsSuccessful,
                            FileSizeFormatted = FormatFileSize(backup.FileSizeBytes)
                        });
                    }
                    catch (Exception ex)
                    {
                        // Record failed backup
                        var failedBackup = new DatabaseBackup
                        {
                            Id = Guid.NewGuid(),
                            BackupFileName = $"{databaseName}_Backup_{timestamp}.bak",
                            BackupFilePath = Path.Combine(location, $"{databaseName}_Backup_{timestamp}.bak"),
                            BackupLocation = location,
                            FileSizeBytes = 0,
                            BackupDate = DateTime.Now,
                            BackupType = backupType,
                            IsSuccessful = false,
                            ErrorMessage = ex.Message,
                            SystemConfigId = systemConfig.Id
                        };

                        _db.DatabaseBackups.Add(failedBackup);
                        await _db.SaveChangesAsync();

                        backupResults.Add(new DatabaseBackupDto
                        {
                            Id = failedBackup.Id,
                            BackupFileName = failedBackup.BackupFileName,
                            BackupFilePath = failedBackup.BackupFilePath,
                            BackupLocation = failedBackup.BackupLocation,
                            FileSizeBytes = 0,
                            BackupDate = failedBackup.BackupDate,
                            BackupType = failedBackup.BackupType,
                            IsSuccessful = false,
                            ErrorMessage = ex.Message,
                            FileSizeFormatted = "0 B"
                        });
                    }
                }

                // Update last backup date in system config
                systemConfig.LastBackupDate = DateTime.Now;
                await _db.SaveChangesAsync();

                // Clean up old backups based on retention policy
                await CleanupOldBackupsAsync(systemConfig);

                return Ok(new
                {
                    Message = $"Backup completed. {backupResults.Count(r => r.IsSuccessful)} successful, {backupResults.Count(r => !r.IsSuccessful)} failed.",
                    Backups = backupResults
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Backup failed: {ex.Message}");
            }
        }

        [HttpPost("Restore")]
        public async Task<IActionResult> RestoreDatabase([FromBody] BackupRequestDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.BackupFilePath))
            {
                return BadRequest("Backup file path is required.");
            }

            if (!System.IO.File.Exists(dto.BackupFilePath))
            {
                return BadRequest("Backup file not found at the specified path.");
            }

            try
            {
                // Get connection string from configuration
                var connectionString = _configuration.GetConnectionString("DBCONNECTION") 
                    ?? _db.Database.GetConnectionString();
                
                if (string.IsNullOrEmpty(connectionString))
                {
                    return BadRequest("Database connection string not found");
                }
                
                await Backups.RestoreDatabaseAsync(connectionString, dto.BackupFilePath);
                return Ok("Restore completed successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Restore failed: {ex.Message}");
            }
        }

        [HttpGet("Backups")]
        public async Task<IActionResult> GetBackups(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] bool? isSuccessful = null,
            [FromQuery] BackupType? backupType = null)
        {
            var query = _db.DatabaseBackups.AsQueryable();

            if (isSuccessful.HasValue)
            {
                query = query.Where(b => b.IsSuccessful == isSuccessful.Value);
            }

            if (backupType.HasValue)
            {
                query = query.Where(b => b.BackupType == backupType.Value);
            }

            var totalCount = await query.CountAsync();
            var backups = await query
                .OrderByDescending(b => b.BackupDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var backupDtos = backups.Select(b => new DatabaseBackupDto
            {
                Id = b.Id,
                BackupFileName = b.BackupFileName,
                BackupFilePath = b.BackupFilePath,
                BackupLocation = b.BackupLocation,
                FileSizeBytes = b.FileSizeBytes,
                BackupDate = b.BackupDate,
                BackupType = b.BackupType,
                IsSuccessful = b.IsSuccessful,
                ErrorMessage = b.ErrorMessage,
                FileSizeFormatted = FormatFileSize(b.FileSizeBytes)
            }).ToList();

            return Ok(new
            {
                Backups = backupDtos,
                Pagination = new
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            });
        }

        [HttpGet("BackupConfig")]
        public async Task<IActionResult> GetBackupConfig()
        {
            var systemConfig = await _db.SystemConfigs.FirstOrDefaultAsync();
            if (systemConfig == null)
            {
                return NotFound("System configuration not found");
            }

            var lastBackup = await _db.DatabaseBackups
                .Where(b => b.IsSuccessful)
                .OrderByDescending(b => b.BackupDate)
                .FirstOrDefaultAsync();

            var config = new BackupConfigDto
            {
                AutoBackupEnabled = systemConfig.AutoBackupEnabled,
                BackupFrequency = systemConfig.BackupFrequency ?? "daily",
                RetentionDays = systemConfig.RetentionDays,
                BackupLocations = systemConfig.BackupLocations ?? new List<string>(),
                LastBackupDate = lastBackup?.BackupDate ?? systemConfig.LastBackupDate
            };

            return Ok(config);
        }

        [HttpPut("BackupConfig")]
        public async Task<IActionResult> UpdateBackupConfig([FromBody] BackupConfigDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Backup configuration data is required.");
            }

            var systemConfig = await _db.SystemConfigs.FirstOrDefaultAsync();
            if (systemConfig == null)
            {
                return NotFound("System configuration not found");
            }

            systemConfig.AutoBackupEnabled = dto.AutoBackupEnabled;
            systemConfig.BackupFrequency = dto.BackupFrequency;
            systemConfig.RetentionDays = dto.RetentionDays;
            systemConfig.BackupLocations = dto.BackupLocations ?? new List<string>();

            await _db.SaveChangesAsync();

            return Ok(new { Message = "Backup configuration updated successfully." });
        }

        [HttpDelete("Backups/{id}")]
        public async Task<IActionResult> DeleteBackup(Guid id)
        {
            var backup = await _db.DatabaseBackups.FindAsync(id);
            if (backup == null)
            {
                return NotFound();
            }

            // Delete physical file if it exists
            if (System.IO.File.Exists(backup.BackupFilePath))
            {
                try
                {
                    System.IO.File.Delete(backup.BackupFilePath);
                }
                catch (Exception ex)
                {
                    // Log but don't fail if file deletion fails
                    Console.WriteLine($"Failed to delete backup file: {ex.Message}");
                }
            }

            _db.DatabaseBackups.Remove(backup);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        private async Task CleanupOldBackupsAsync(SystemConfig systemConfig)
        {
            if (systemConfig.RetentionDays <= 0) return;

            var cutoffDate = DateTime.Now.AddDays(-systemConfig.RetentionDays);
            var oldBackups = await _db.DatabaseBackups
                .Where(b => b.BackupDate < cutoffDate)
                .ToListAsync();

            foreach (var backup in oldBackups)
            {
                // Delete physical file if it exists
                if (System.IO.File.Exists(backup.BackupFilePath))
                {
                    try
                    {
                        System.IO.File.Delete(backup.BackupFilePath);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to delete old backup file: {ex.Message}");
                    }
                }

                _db.DatabaseBackups.Remove(backup);
            }

            await _db.SaveChangesAsync();
        }

        private string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }
    }
}

