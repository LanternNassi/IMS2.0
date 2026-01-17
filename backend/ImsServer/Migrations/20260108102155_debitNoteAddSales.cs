using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class debitNoteAddSales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DebitNotes_Suppliers_SupplierId",
                table: "DebitNotes");

            migrationBuilder.AlterColumn<Guid>(
                name: "SupplierId",
                table: "DebitNotes",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<Guid>(
                name: "CustomerId",
                table: "DebitNotes",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SaleId",
                table: "DebitNotes",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SaleItemId",
                table: "DebitNoteItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DebitNotes_CustomerId",
                table: "DebitNotes",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_DebitNotes_SaleId",
                table: "DebitNotes",
                column: "SaleId");

            migrationBuilder.AddForeignKey(
                name: "FK_DebitNotes_Customers_CustomerId",
                table: "DebitNotes",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DebitNotes_Sales_SaleId",
                table: "DebitNotes",
                column: "SaleId",
                principalTable: "Sales",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DebitNotes_Suppliers_SupplierId",
                table: "DebitNotes",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DebitNotes_Customers_CustomerId",
                table: "DebitNotes");

            migrationBuilder.DropForeignKey(
                name: "FK_DebitNotes_Sales_SaleId",
                table: "DebitNotes");

            migrationBuilder.DropForeignKey(
                name: "FK_DebitNotes_Suppliers_SupplierId",
                table: "DebitNotes");

            migrationBuilder.DropIndex(
                name: "IX_DebitNotes_CustomerId",
                table: "DebitNotes");

            migrationBuilder.DropIndex(
                name: "IX_DebitNotes_SaleId",
                table: "DebitNotes");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "DebitNotes");

            migrationBuilder.DropColumn(
                name: "SaleId",
                table: "DebitNotes");

            migrationBuilder.DropColumn(
                name: "SaleItemId",
                table: "DebitNoteItems");

            migrationBuilder.AlterColumn<Guid>(
                name: "SupplierId",
                table: "DebitNotes",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_DebitNotes_Suppliers_SupplierId",
                table: "DebitNotes",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
