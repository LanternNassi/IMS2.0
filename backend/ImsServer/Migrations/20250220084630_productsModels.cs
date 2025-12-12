using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class productsModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductGeneric_Product_ProductId",
                table: "ProductGeneric");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductGeneric_Suppliers_SupplierId",
                table: "ProductGeneric");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductStorage_ProductGeneric_ProductGenericId",
                table: "ProductStorage");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductStorage_Stores_StorageId",
                table: "ProductStorage");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductVariation_Product_ProductId",
                table: "ProductVariation");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProductVariation",
                table: "ProductVariation");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProductStorage",
                table: "ProductStorage");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProductGeneric",
                table: "ProductGeneric");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Product",
                table: "Product");

            migrationBuilder.RenameTable(
                name: "ProductVariation",
                newName: "ProductVariations");

            migrationBuilder.RenameTable(
                name: "ProductStorage",
                newName: "ProductStorages");

            migrationBuilder.RenameTable(
                name: "ProductGeneric",
                newName: "ProductGenerics");

            migrationBuilder.RenameTable(
                name: "Product",
                newName: "Products");

            migrationBuilder.RenameIndex(
                name: "IX_ProductVariation_ProductId",
                table: "ProductVariations",
                newName: "IX_ProductVariations_ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductStorage_StorageId",
                table: "ProductStorages",
                newName: "IX_ProductStorages_StorageId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductStorage_ProductGenericId",
                table: "ProductStorages",
                newName: "IX_ProductStorages_ProductGenericId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductGeneric_SupplierId",
                table: "ProductGenerics",
                newName: "IX_ProductGenerics_SupplierId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductGeneric_ProductId",
                table: "ProductGenerics",
                newName: "IX_ProductGenerics_ProductId");

            migrationBuilder.AlterColumn<decimal>(
                name: "Discount",
                table: "ProductVariations",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProductVariations",
                table: "ProductVariations",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProductStorages",
                table: "ProductStorages",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProductGenerics",
                table: "ProductGenerics",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Products",
                table: "Products",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductGenerics_Products_ProductId",
                table: "ProductGenerics",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductGenerics_Suppliers_SupplierId",
                table: "ProductGenerics",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductStorages_ProductGenerics_ProductGenericId",
                table: "ProductStorages",
                column: "ProductGenericId",
                principalTable: "ProductGenerics",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductStorages_Stores_StorageId",
                table: "ProductStorages",
                column: "StorageId",
                principalTable: "Stores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductVariations_Products_ProductId",
                table: "ProductVariations",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductGenerics_Products_ProductId",
                table: "ProductGenerics");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductGenerics_Suppliers_SupplierId",
                table: "ProductGenerics");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductStorages_ProductGenerics_ProductGenericId",
                table: "ProductStorages");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductStorages_Stores_StorageId",
                table: "ProductStorages");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductVariations_Products_ProductId",
                table: "ProductVariations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProductVariations",
                table: "ProductVariations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProductStorages",
                table: "ProductStorages");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Products",
                table: "Products");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProductGenerics",
                table: "ProductGenerics");

            migrationBuilder.RenameTable(
                name: "ProductVariations",
                newName: "ProductVariation");

            migrationBuilder.RenameTable(
                name: "ProductStorages",
                newName: "ProductStorage");

            migrationBuilder.RenameTable(
                name: "Products",
                newName: "Product");

            migrationBuilder.RenameTable(
                name: "ProductGenerics",
                newName: "ProductGeneric");

            migrationBuilder.RenameIndex(
                name: "IX_ProductVariations_ProductId",
                table: "ProductVariation",
                newName: "IX_ProductVariation_ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductStorages_StorageId",
                table: "ProductStorage",
                newName: "IX_ProductStorage_StorageId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductStorages_ProductGenericId",
                table: "ProductStorage",
                newName: "IX_ProductStorage_ProductGenericId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductGenerics_SupplierId",
                table: "ProductGeneric",
                newName: "IX_ProductGeneric_SupplierId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductGenerics_ProductId",
                table: "ProductGeneric",
                newName: "IX_ProductGeneric_ProductId");

            migrationBuilder.AlterColumn<decimal>(
                name: "Discount",
                table: "ProductVariation",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProductVariation",
                table: "ProductVariation",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProductStorage",
                table: "ProductStorage",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Product",
                table: "Product",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProductGeneric",
                table: "ProductGeneric",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductGeneric_Product_ProductId",
                table: "ProductGeneric",
                column: "ProductId",
                principalTable: "Product",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductGeneric_Suppliers_SupplierId",
                table: "ProductGeneric",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductStorage_ProductGeneric_ProductGenericId",
                table: "ProductStorage",
                column: "ProductGenericId",
                principalTable: "ProductGeneric",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductStorage_Stores_StorageId",
                table: "ProductStorage",
                column: "StorageId",
                principalTable: "Stores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductVariation_Product_ProductId",
                table: "ProductVariation",
                column: "ProductId",
                principalTable: "Product",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
