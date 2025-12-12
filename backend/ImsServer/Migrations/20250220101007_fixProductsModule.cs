using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class fixProductsModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "BaseWholePrice",
                table: "Products",
                newName: "BaseWholeSalePrice");

            migrationBuilder.AddColumn<bool>(
                name: "IsMain",
                table: "ProductVariations",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsMain",
                table: "ProductVariations");

            migrationBuilder.RenameColumn(
                name: "BaseWholeSalePrice",
                table: "Products",
                newName: "BaseWholePrice");
        }
    }
}
