using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class addNotesAudits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApplicationMessage",
                table: "DebitNotes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AppliedToPurchasesIds",
                table: "DebitNotes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AppliedToSalesIds",
                table: "DebitNotes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApplicationMessage",
                table: "CreditNotes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AppliedToSalesIds",
                table: "CreditNotes",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApplicationMessage",
                table: "DebitNotes");

            migrationBuilder.DropColumn(
                name: "AppliedToPurchasesIds",
                table: "DebitNotes");

            migrationBuilder.DropColumn(
                name: "AppliedToSalesIds",
                table: "DebitNotes");

            migrationBuilder.DropColumn(
                name: "ApplicationMessage",
                table: "CreditNotes");

            migrationBuilder.DropColumn(
                name: "AppliedToSalesIds",
                table: "CreditNotes");
        }
    }
}
