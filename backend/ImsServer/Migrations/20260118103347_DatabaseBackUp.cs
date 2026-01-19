using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class DatabaseBackUp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AutoBackupEnabled",
                table: "SystemConfigs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "BackupFrequency",
                table: "SystemConfigs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastBackupDate",
                table: "SystemConfigs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RetentionDays",
                table: "SystemConfigs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "DatabaseBackups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BackupFileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BackupFilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BackupLocation = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    BackupDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    BackupType = table.Column<int>(type: "int", nullable: false),
                    IsSuccessful = table.Column<bool>(type: "bit", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SystemConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AddedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AddedBy = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastUpdatedBy = table.Column<int>(type: "int", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DatabaseBackups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DatabaseBackups_SystemConfigs_SystemConfigId",
                        column: x => x.SystemConfigId,
                        principalTable: "SystemConfigs",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DatabaseBackups_SystemConfigId",
                table: "DatabaseBackups",
                column: "SystemConfigId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DatabaseBackups");

            migrationBuilder.DropColumn(
                name: "AutoBackupEnabled",
                table: "SystemConfigs");

            migrationBuilder.DropColumn(
                name: "BackupFrequency",
                table: "SystemConfigs");

            migrationBuilder.DropColumn(
                name: "LastBackupDate",
                table: "SystemConfigs");

            migrationBuilder.DropColumn(
                name: "RetentionDays",
                table: "SystemConfigs");
        }
    }
}
