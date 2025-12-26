using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class FixProductAuditTrailForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductAuditTrails_ProductStorages_ProductStorageId",
                table: "ProductAuditTrails");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductAuditTrails_ProductVariations_ProductVariationId",
                table: "ProductAuditTrails");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductAuditTrails_Users_CreatedById",
                table: "ProductAuditTrails");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductAuditTrails_ProductStorages_ProductStorageId",
                table: "ProductAuditTrails",
                column: "ProductStorageId",
                principalTable: "ProductStorages",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductAuditTrails_ProductVariations_ProductVariationId",
                table: "ProductAuditTrails",
                column: "ProductVariationId",
                principalTable: "ProductVariations",
                onDelete: ReferentialAction.Restrict,
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductAuditTrails_Users_CreatedById",
                table: "ProductAuditTrails",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductAuditTrails_ProductStorages_ProductStorageId",
                table: "ProductAuditTrails");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductAuditTrails_ProductVariations_ProductVariationId",
                table: "ProductAuditTrails");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductAuditTrails_Users_CreatedById",
                table: "ProductAuditTrails");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductAuditTrails_ProductStorages_ProductStorageId",
                table: "ProductAuditTrails",
                column: "ProductStorageId",
                principalTable: "ProductStorages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductAuditTrails_ProductVariations_ProductVariationId",
                table: "ProductAuditTrails",
                column: "ProductVariationId",
                principalTable: "ProductVariations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductAuditTrails_Users_CreatedById",
                table: "ProductAuditTrails",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
