using System.ComponentModel.DataAnnotations.Schema;
using ImsServer.Models.SystemConfigX;

namespace ImsServer.Models.DatabaseBackupX
{
    public class DatabaseBackup : GeneralFields
    {
        public Guid Id { get; set; }
        public string BackupFileName { get; set; }
        public string BackupFilePath { get; set; }
        public string BackupLocation { get; set; } // The location/path where backup is stored
        public long FileSizeBytes { get; set; }
        public DateTime BackupDate { get; set; }
        public BackupType BackupType { get; set; } // Manual or Automatic
        public bool IsSuccessful { get; set; }
        public string? ErrorMessage { get; set; }
        public Guid? SystemConfigId { get; set; }

        [ForeignKey("SystemConfigId")]
        public virtual SystemConfig? SystemConfig { get; set; }
    }

    public enum BackupType
    {
        Manual = 0,
        Automatic = 1
    }

    public class DatabaseBackupDto
    {
        public Guid Id { get; set; }
        public string BackupFileName { get; set; }
        public string BackupFilePath { get; set; }
        public string BackupLocation { get; set; }
        public long FileSizeBytes { get; set; }
        public DateTime BackupDate { get; set; }
        public BackupType BackupType { get; set; }
        public bool IsSuccessful { get; set; }
        public string? ErrorMessage { get; set; }
        public string FileSizeFormatted { get; set; }
    }

    public class CreateBackupDto
    {
        public List<string>? BackupLocations { get; set; } // Optional: specific locations, otherwise uses SystemConfig locations
        public bool IsManual { get; set; } = true;
    }

    public class BackupConfigDto
    {
        public bool AutoBackupEnabled { get; set; }
        public string BackupFrequency { get; set; } // "daily", "weekly", "monthly"
        public int RetentionDays { get; set; }
        public List<string> BackupLocations { get; set; } = new List<string>();
        public DateTime? LastBackupDate { get; set; }
    }
}

