using Microsoft.Data.SqlClient;

namespace ImsServer.Utils
{
    public static class Backups
    {
        public static async Task BackupDatabaseAsync(string connectionString, string backupPath)
        {
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new ArgumentException("Connection string is required", nameof(connectionString));
            }

            if (string.IsNullOrEmpty(backupPath))
            {
                throw new ArgumentException("Backup path is required", nameof(backupPath));
            }

            try
            {
                // Ensure the directory exists
                var directory = Path.GetDirectoryName(backupPath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                // Check if directory is writable (if directory exists)
                if (!string.IsNullOrEmpty(directory) && Directory.Exists(directory))
                {
                    try
                    {
                        // Try to create a test file to check write permissions
                        var testFile = Path.Combine(directory, $"test_write_{Guid.NewGuid()}.tmp");
                        await File.WriteAllTextAsync(testFile, "test");
                        File.Delete(testFile);
                    }
                    catch (UnauthorizedAccessException)
                    {
                        throw new UnauthorizedAccessException(
                            $"Access denied to backup directory: {directory}. " +
                            "Please ensure the SQL Server service account has write permissions to this directory. " +
                            "You may need to grant 'Full Control' or 'Modify' permissions to the SQL Server service account (usually 'NT AUTHORITY\\SYSTEM' or 'NT SERVICE\\MSSQLSERVER' for LocalDB).");
                    }
                }

                string databaseName = new SqlConnectionStringBuilder(connectionString).InitialCatalog;
                
                if (string.IsNullOrEmpty(databaseName))
                {
                    throw new ArgumentException("Database name not found in connection string", nameof(connectionString));
                }

                string backupQuery = $@"
                    BACKUP DATABASE [{databaseName}] 
                    TO DISK = @backupPath 
                    WITH FORMAT, INIT, 
                    NAME = N'{databaseName}-Full Database Backup', 
                    SKIP, NOREWIND, NOUNLOAD, STATS = 10";
                
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();
                
                using var command = new SqlCommand(backupQuery, connection);
                command.CommandTimeout = 600; // 10 minutes
                command.Parameters.AddWithValue("@backupPath", backupPath);
                
                await command.ExecuteNonQueryAsync();
            }
            catch (SqlException sqlEx)
            {
                // Check for specific SQL Server errors
                if (sqlEx.Number == 3201) // Cannot open backup device
                {
                    var directory = Path.GetDirectoryName(backupPath);
                    throw new Exception(
                        $"Access denied to backup file: {backupPath}. " +
                        $"The SQL Server service account does not have write permissions to the directory: {directory}. " +
                        "Please grant 'Full Control' or 'Modify' permissions to the SQL Server service account. " +
                        "For LocalDB, this is usually 'NT AUTHORITY\\SYSTEM' or your Windows user account.", sqlEx);
                }
                throw new Exception($"SQL Server error during backup: {sqlEx.Message}", sqlEx);
            }
            catch (UnauthorizedAccessException)
            {
                throw; // Re-throw our custom permission error
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to backup database: {ex.Message}", ex);
            }
        }

        public static async Task RestoreDatabaseAsync(string connectionString, string backupPath)
        {
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new ArgumentException("Connection string is required", nameof(connectionString));
            }

            if (string.IsNullOrEmpty(backupPath))
            {
                throw new ArgumentException("Backup path is required", nameof(backupPath));
            }

            if (!File.Exists(backupPath))
            {
                throw new FileNotFoundException($"Backup file not found: {backupPath}", backupPath);
            }

            try
            {
                string databaseName = new SqlConnectionStringBuilder(connectionString).InitialCatalog;
                
                if (string.IsNullOrEmpty(databaseName))
                {
                    throw new ArgumentException("Database name not found in connection string", nameof(connectionString));
                }

                // First, set database to single user mode and close existing connections
                string setSingleUserQuery = $@"
                    ALTER DATABASE [{databaseName}] 
                    SET SINGLE_USER WITH ROLLBACK IMMEDIATE";
                
                // Restore database query
                string restoreQuery = $@"
                    RESTORE DATABASE [{databaseName}] 
                    FROM DISK = @backupPath 
                    WITH REPLACE, 
                    RECOVERY, 
                    STATS = 10";
                
                // Set database back to multi-user mode
                string setMultiUserQuery = $@"
                    ALTER DATABASE [{databaseName}] 
                    SET MULTI_USER";

                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();
                
                // Set single user mode
                using (var command = new SqlCommand(setSingleUserQuery, connection))
                {
                    command.CommandTimeout = 300; // 5 minutes
                    await command.ExecuteNonQueryAsync();
                }

                // Restore database
                using (var command = new SqlCommand(restoreQuery, connection))
                {
                    command.CommandTimeout = 600; // 10 minutes
                    command.Parameters.AddWithValue("@backupPath", backupPath);
                    await command.ExecuteNonQueryAsync();
                }

                // Set multi-user mode
                using (var command = new SqlCommand(setMultiUserQuery, connection))
                {
                    command.CommandTimeout = 300; // 5 minutes
                    await command.ExecuteNonQueryAsync();
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to restore database: {ex.Message}", ex);
            }
        }
    }
}