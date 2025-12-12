using ImsServer.Models.ExpenditureX;
using System.ComponentModel.DataAnnotations.Schema;

namespace ImsServer.Models.ExpenditureX
{
    public class Expenditure : GeneralFields
    {
        public Guid Id { get; set; }
        public String Name { get; set; }
        public String Description { get; set; }
        public decimal Amount { get; set; }
        public Guid ExpenditureCategoryId { get; set; }

        [ForeignKey("ExpenditureCategoryId")]
        public ExpenditureCategory ExpenditureCategory { get; set; }
        
    }

    public class ExpenditureDto : GeneralFields
    {
        public Guid Id { get; set; }
        public String Name { get; set; }
        public String Description { get; set; }
        public decimal Amount { get; set; }
        public Guid ExpenditureCategoryId { get; set; }
        public ExpenditureCategoryDto? ExpenditureCategory { get; set; }
    }

    public class CreateExpenditureDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public decimal Amount { get; set; }
        public Guid ExpenditureCategoryId { get; set; }
    }

    public class UpdateExpenditureDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public decimal? Amount { get; set; }
        public Guid? ExpenditureCategoryId { get; set; }
    }
}