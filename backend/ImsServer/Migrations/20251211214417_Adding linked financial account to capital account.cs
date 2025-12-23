using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class Addinglinkedfinancialaccounttocapitalaccount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "LinkedFinancialAccountId",
                table: "CapitalAccounts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CapitalAccounts_LinkedFinancialAccountId",
                table: "CapitalAccounts",
                column: "LinkedFinancialAccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_CapitalAccounts_FinancialAccounts_LinkedFinancialAccountId",
                table: "CapitalAccounts",
                column: "LinkedFinancialAccountId",
                principalTable: "FinancialAccounts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CapitalAccounts_FinancialAccounts_LinkedFinancialAccountId",
                table: "CapitalAccounts");

            migrationBuilder.DropIndex(
                name: "IX_CapitalAccounts_LinkedFinancialAccountId",
                table: "CapitalAccounts");

            migrationBuilder.DropColumn(
                name: "LinkedFinancialAccountId",
                table: "CapitalAccounts");
        }
    }
}
