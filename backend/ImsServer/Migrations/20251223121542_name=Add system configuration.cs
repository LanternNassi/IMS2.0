using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class nameAddsystemconfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SystemConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrgnanisationName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OrganisationDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Currency = table.Column<int>(type: "int", nullable: false),
                    RegisteredBusinessName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RegisteredBusinessContact = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RegisteredTINumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RegisteredBusinessAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FiscalYearStart = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FiscalYearEnd = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IMSKey = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IMSVersion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LicenseValidTill = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Logo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AddedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AddedBy = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastUpdatedBy = table.Column<int>(type: "int", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Contacts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SystemConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Telephone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AddedBy = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastUpdatedBy = table.Column<int>(type: "int", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contacts_SystemConfigs_SystemConfigId",
                        column: x => x.SystemConfigId,
                        principalTable: "SystemConfigs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_SystemConfigId",
                table: "Contacts",
                column: "SystemConfigId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Contacts");

            migrationBuilder.DropTable(
                name: "SystemConfigs");
        }
    }
}
