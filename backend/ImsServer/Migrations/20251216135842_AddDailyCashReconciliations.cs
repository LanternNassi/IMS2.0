using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class AddDailyCashReconciliations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DailyCashReconciliations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FinancialAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusinessDateUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    OpenedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ClosedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OpeningSystemBalance = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OpeningCountedBalance = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    OpeningVariance = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    OpeningNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ClosingSystemBalance = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ClosingCountedBalance = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ClosingVariance = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ClosingNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    AddedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AddedBy = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastUpdatedBy = table.Column<int>(type: "int", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyCashReconciliations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DailyCashReconciliations_FinancialAccounts_FinancialAccountId",
                        column: x => x.FinancialAccountId,
                        principalTable: "FinancialAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DailyCashReconciliations_FinancialAccountId_BusinessDateUtc",
                table: "DailyCashReconciliations",
                columns: new[] { "FinancialAccountId", "BusinessDateUtc" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DailyCashReconciliations");
        }
    }
}
