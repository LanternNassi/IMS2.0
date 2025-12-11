using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class make_sales_changes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SalesItems_ProductStorages_ProductStorageId",
                table: "SalesItems");

            migrationBuilder.DropForeignKey(
                name: "FK_SalesItems_ProductVariations_ProductVariationId",
                table: "SalesItems");

            migrationBuilder.DropColumn(
                name: "Tax",
                table: "Sales");

            migrationBuilder.AlterColumn<decimal>(
                name: "OutstandingAmount",
                table: "Sales",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AddColumn<decimal>(
                name: "CostPrice",
                table: "ProductVariations",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddForeignKey(
                name: "FK_SalesItems_ProductStorages_ProductStorageId",
                table: "SalesItems",
                column: "ProductStorageId",
                principalTable: "ProductStorages",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SalesItems_ProductVariations_ProductVariationId",
                table: "SalesItems",
                column: "ProductVariationId",
                principalTable: "ProductVariations",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SalesItems_ProductStorages_ProductStorageId",
                table: "SalesItems");

            migrationBuilder.DropForeignKey(
                name: "FK_SalesItems_ProductVariations_ProductVariationId",
                table: "SalesItems");

            migrationBuilder.DropColumn(
                name: "CostPrice",
                table: "ProductVariations");

            migrationBuilder.AlterColumn<decimal>(
                name: "OutstandingAmount",
                table: "Sales",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Tax",
                table: "Sales",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddForeignKey(
                name: "FK_SalesItems_ProductStorages_ProductStorageId",
                table: "SalesItems",
                column: "ProductStorageId",
                principalTable: "ProductStorages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SalesItems_ProductVariations_ProductVariationId",
                table: "SalesItems",
                column: "ProductVariationId",
                principalTable: "ProductVariations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
