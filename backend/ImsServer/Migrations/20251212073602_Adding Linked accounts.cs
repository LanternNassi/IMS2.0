using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class AddingLinkedaccounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "LinkedFinancialAccountId",
                table: "SalesDebtsTrackers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "LinkedFinancialAccountId",
                table: "PurchaseDebtTrackers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SalesDebtsTrackers_LinkedFinancialAccountId",
                table: "SalesDebtsTrackers",
                column: "LinkedFinancialAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseDebtTrackers_LinkedFinancialAccountId",
                table: "PurchaseDebtTrackers",
                column: "LinkedFinancialAccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseDebtTrackers_FinancialAccounts_LinkedFinancialAccountId",
                table: "PurchaseDebtTrackers",
                column: "LinkedFinancialAccountId",
                principalTable: "FinancialAccounts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SalesDebtsTrackers_FinancialAccounts_LinkedFinancialAccountId",
                table: "SalesDebtsTrackers",
                column: "LinkedFinancialAccountId",
                principalTable: "FinancialAccounts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseDebtTrackers_FinancialAccounts_LinkedFinancialAccountId",
                table: "PurchaseDebtTrackers");

            migrationBuilder.DropForeignKey(
                name: "FK_SalesDebtsTrackers_FinancialAccounts_LinkedFinancialAccountId",
                table: "SalesDebtsTrackers");

            migrationBuilder.DropIndex(
                name: "IX_SalesDebtsTrackers_LinkedFinancialAccountId",
                table: "SalesDebtsTrackers");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseDebtTrackers_LinkedFinancialAccountId",
                table: "PurchaseDebtTrackers");

            migrationBuilder.DropColumn(
                name: "LinkedFinancialAccountId",
                table: "SalesDebtsTrackers");

            migrationBuilder.DropColumn(
                name: "LinkedFinancialAccountId",
                table: "PurchaseDebtTrackers");
        }
    }
}
