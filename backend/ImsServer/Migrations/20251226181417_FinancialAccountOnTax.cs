using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class FinancialAccountOnTax : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PaidUsingFinancialAccountId",
                table: "TaxRecords",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaxRecords_PaidUsingFinancialAccountId",
                table: "TaxRecords",
                column: "PaidUsingFinancialAccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaxRecords_FinancialAccounts_PaidUsingFinancialAccountId",
                table: "TaxRecords",
                column: "PaidUsingFinancialAccountId",
                principalTable: "FinancialAccounts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaxRecords_FinancialAccounts_PaidUsingFinancialAccountId",
                table: "TaxRecords");

            migrationBuilder.DropIndex(
                name: "IX_TaxRecords_PaidUsingFinancialAccountId",
                table: "TaxRecords");

            migrationBuilder.DropColumn(
                name: "PaidUsingFinancialAccountId",
                table: "TaxRecords");
        }
    }
}
