using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class nameAddproductreconciliation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Sales",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProductAuditTrails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductVariationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductStorageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuantityBefore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    QuantityAfter = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Reason = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedById = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReconciliationSaleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReconciliationPurchaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReconciliationCapitalAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AddedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AddedBy = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastUpdatedBy = table.Column<int>(type: "int", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductAuditTrails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductAuditTrails_CapitalAccounts_ReconciliationCapitalAccountId",
                        column: x => x.ReconciliationCapitalAccountId,
                        principalTable: "CapitalAccounts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProductAuditTrails_ProductStorages_ProductStorageId",
                        column: x => x.ProductStorageId,
                        principalTable: "ProductStorages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductAuditTrails_ProductVariations_ProductVariationId",
                        column: x => x.ProductVariationId,
                        principalTable: "ProductVariations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductAuditTrails_Purchases_ReconciliationPurchaseId",
                        column: x => x.ReconciliationPurchaseId,
                        principalTable: "Purchases",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProductAuditTrails_Sales_ReconciliationSaleId",
                        column: x => x.ReconciliationSaleId,
                        principalTable: "Sales",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProductAuditTrails_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductAuditTrails_CreatedById",
                table: "ProductAuditTrails",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_ProductAuditTrails_ProductStorageId",
                table: "ProductAuditTrails",
                column: "ProductStorageId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductAuditTrails_ProductVariationId",
                table: "ProductAuditTrails",
                column: "ProductVariationId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductAuditTrails_ReconciliationCapitalAccountId",
                table: "ProductAuditTrails",
                column: "ReconciliationCapitalAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductAuditTrails_ReconciliationPurchaseId",
                table: "ProductAuditTrails",
                column: "ReconciliationPurchaseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductAuditTrails_ReconciliationSaleId",
                table: "ProductAuditTrails",
                column: "ReconciliationSaleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductAuditTrails");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Sales");
        }
    }
}
