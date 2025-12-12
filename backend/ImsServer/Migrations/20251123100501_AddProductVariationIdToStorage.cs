using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class AddProductVariationIdToStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductStorages_Stores_StorageId",
                table: "ProductStorages");

            migrationBuilder.AddColumn<Guid>(
                name: "ProductVariationId",
                table: "ProductStorages",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "StoreId",
                table: "ProductStorages",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductStorages_ProductVariationId",
                table: "ProductStorages",
                column: "ProductVariationId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductStorages_StoreId",
                table: "ProductStorages",
                column: "StoreId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductStorages_ProductVariations_ProductVariationId",
                table: "ProductStorages",
                column: "ProductVariationId",
                principalTable: "ProductVariations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductStorages_Stores_StorageId",
                table: "ProductStorages",
                column: "StorageId",
                principalTable: "Stores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductStorages_Stores_StoreId",
                table: "ProductStorages",
                column: "StoreId",
                principalTable: "Stores",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductStorages_ProductVariations_ProductVariationId",
                table: "ProductStorages");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductStorages_Stores_StorageId",
                table: "ProductStorages");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductStorages_Stores_StoreId",
                table: "ProductStorages");

            migrationBuilder.DropIndex(
                name: "IX_ProductStorages_ProductVariationId",
                table: "ProductStorages");

            migrationBuilder.DropIndex(
                name: "IX_ProductStorages_StoreId",
                table: "ProductStorages");

            migrationBuilder.DropColumn(
                name: "ProductVariationId",
                table: "ProductStorages");

            migrationBuilder.DropColumn(
                name: "StoreId",
                table: "ProductStorages");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductStorages_Stores_StorageId",
                table: "ProductStorages",
                column: "StorageId",
                principalTable: "Stores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
