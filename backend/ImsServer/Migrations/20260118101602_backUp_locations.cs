using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class backUp_locations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BackupLocations",
                table: "SystemConfigs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BackupLocations",
                table: "SystemConfigs");
        }
    }
}
