using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class Addinglinkedfinancialaccounttoothermodels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "LinkedFinancialAccountId",
                table: "Sales",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "LinkedFinancialAccountId",
                table: "Purchases",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sales_LinkedFinancialAccountId",
                table: "Sales",
                column: "LinkedFinancialAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Purchases_LinkedFinancialAccountId",
                table: "Purchases",
                column: "LinkedFinancialAccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_Purchases_FinancialAccounts_LinkedFinancialAccountId",
                table: "Purchases",
                column: "LinkedFinancialAccountId",
                principalTable: "FinancialAccounts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Sales_FinancialAccounts_LinkedFinancialAccountId",
                table: "Sales",
                column: "LinkedFinancialAccountId",
                principalTable: "FinancialAccounts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Purchases_FinancialAccounts_LinkedFinancialAccountId",
                table: "Purchases");

            migrationBuilder.DropForeignKey(
                name: "FK_Sales_FinancialAccounts_LinkedFinancialAccountId",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Sales_LinkedFinancialAccountId",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Purchases_LinkedFinancialAccountId",
                table: "Purchases");

            migrationBuilder.DropColumn(
                name: "LinkedFinancialAccountId",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "LinkedFinancialAccountId",
                table: "Purchases");
        }
    }
}
