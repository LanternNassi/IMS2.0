using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImsServer.Migrations
{
    /// <inheritdoc />
    public partial class make_profit_margin_decimal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add temporary column
            migrationBuilder.AddColumn<decimal>(
                name: "ProfitMargin_New",
                table: "SalesItems",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            // Convert existing data: remove '%' and convert to decimal
            migrationBuilder.Sql(@"
                UPDATE SalesItems 
                SET ProfitMargin_New = TRY_CAST(REPLACE(ProfitMargin, '%', '') AS DECIMAL(18,2))
                WHERE ProfitMargin IS NOT NULL AND ProfitMargin != ''
            ");

            // Drop old column
            migrationBuilder.DropColumn(
                name: "ProfitMargin",
                table: "SalesItems");

            // Rename new column to original name
            migrationBuilder.RenameColumn(
                name: "ProfitMargin_New",
                table: "SalesItems",
                newName: "ProfitMargin");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Add temporary string column
            migrationBuilder.AddColumn<string>(
                name: "ProfitMargin_Old",
                table: "SalesItems",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            // Convert decimal back to string with '%'
            migrationBuilder.Sql(@"
                UPDATE SalesItems 
                SET ProfitMargin_Old = CAST(ProfitMargin AS NVARCHAR(50)) + '%'
            ");

            // Drop decimal column
            migrationBuilder.DropColumn(
                name: "ProfitMargin",
                table: "SalesItems");

            // Rename back
            migrationBuilder.RenameColumn(
                name: "ProfitMargin_Old",
                table: "SalesItems",
                newName: "ProfitMargin");
        }
    }
}
