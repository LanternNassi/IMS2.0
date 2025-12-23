using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class add_financial_account_expenditures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "LinkedFinancialAccountId",
                table: "Expenditures",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Expenditures_LinkedFinancialAccountId",
                table: "Expenditures",
                column: "LinkedFinancialAccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_Expenditures_FinancialAccounts_LinkedFinancialAccountId",
                table: "Expenditures",
                column: "LinkedFinancialAccountId",
                principalTable: "FinancialAccounts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Expenditures_FinancialAccounts_LinkedFinancialAccountId",
                table: "Expenditures");

            migrationBuilder.DropIndex(
                name: "IX_Expenditures_LinkedFinancialAccountId",
                table: "Expenditures");

            migrationBuilder.DropColumn(
                name: "LinkedFinancialAccountId",
                table: "Expenditures");
        }
    }
}
