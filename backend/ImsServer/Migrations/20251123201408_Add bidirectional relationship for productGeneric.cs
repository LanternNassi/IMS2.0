using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class AddbidirectionalrelationshipforproductGeneric : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ProductGenericId1",
                table: "ProductStorages",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductStorages_ProductGenericId1",
                table: "ProductStorages",
                column: "ProductGenericId1");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductStorages_ProductGenerics_ProductGenericId1",
                table: "ProductStorages",
                column: "ProductGenericId1",
                principalTable: "ProductGenerics",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductStorages_ProductGenerics_ProductGenericId1",
                table: "ProductStorages");

            migrationBuilder.DropIndex(
                name: "IX_ProductStorages_ProductGenericId1",
                table: "ProductStorages");

            migrationBuilder.DropColumn(
                name: "ProductGenericId1",
                table: "ProductStorages");
        }
    }
}
