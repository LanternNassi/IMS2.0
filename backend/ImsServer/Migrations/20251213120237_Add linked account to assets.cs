using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class Addlinkedaccounttoassets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "LinkedFinancialAccountId",
                table: "FixedAssets",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_FixedAssets_LinkedFinancialAccountId",
                table: "FixedAssets",
                column: "LinkedFinancialAccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_FixedAssets_FinancialAccounts_LinkedFinancialAccountId",
                table: "FixedAssets",
                column: "LinkedFinancialAccountId",
                principalTable: "FinancialAccounts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FixedAssets_FinancialAccounts_LinkedFinancialAccountId",
                table: "FixedAssets");

            migrationBuilder.DropIndex(
                name: "IX_FixedAssets_LinkedFinancialAccountId",
                table: "FixedAssets");

            migrationBuilder.DropColumn(
                name: "LinkedFinancialAccountId",
                table: "FixedAssets");
        }
    }
}
