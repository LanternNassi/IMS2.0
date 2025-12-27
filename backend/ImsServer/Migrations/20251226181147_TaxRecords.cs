using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class TaxRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SaleId",
                table: "TaxRecords",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TaxCompliance",
                table: "SystemConfigs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxRate",
                table: "SystemConfigs",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "VATAmount",
                table: "SalesItems",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "TaxRecordId",
                table: "Sales",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaxRecords_SaleId",
                table: "TaxRecords",
                column: "SaleId");

            migrationBuilder.CreateIndex(
                name: "IX_Sales_TaxRecordId",
                table: "Sales",
                column: "TaxRecordId");

            migrationBuilder.AddForeignKey(
                name: "FK_Sales_TaxRecords_TaxRecordId",
                table: "Sales",
                column: "TaxRecordId",
                principalTable: "TaxRecords",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TaxRecords_Sales_SaleId",
                table: "TaxRecords",
                column: "SaleId",
                principalTable: "Sales",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Sales_TaxRecords_TaxRecordId",
                table: "Sales");

            migrationBuilder.DropForeignKey(
                name: "FK_TaxRecords_Sales_SaleId",
                table: "TaxRecords");

            migrationBuilder.DropIndex(
                name: "IX_TaxRecords_SaleId",
                table: "TaxRecords");

            migrationBuilder.DropIndex(
                name: "IX_Sales_TaxRecordId",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "SaleId",
                table: "TaxRecords");

            migrationBuilder.DropColumn(
                name: "TaxCompliance",
                table: "SystemConfigs");

            migrationBuilder.DropColumn(
                name: "TaxRate",
                table: "SystemConfigs");

            migrationBuilder.DropColumn(
                name: "VATAmount",
                table: "SalesItems");

            migrationBuilder.DropColumn(
                name: "TaxRecordId",
                table: "Sales");
        }
    }
}
