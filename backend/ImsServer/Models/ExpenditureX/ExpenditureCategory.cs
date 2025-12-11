using ImsServer.Models.ExpenditureX;

namespace ImsServer.Models.ExpenditureX
{
    public class ExpenditureCategory : GeneralFields
    {
        public Guid Id { get; set; }
        public String Name { get; set; }
        public String? Description { get; set; }
        public ExpenditureType Type { get; set; } 
        public virtual ICollection<Expenditure>? Expenditures { get; set; }
    }

    public class ExpenditureCategoryDto : GeneralFields
    {
        public Guid Id { get; set; }
        public String Name { get; set; }
        public String? Description { get; set; }
        public ExpenditureType Type { get; set; } 
    }

    public class CreateExpenditureCategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public ExpenditureType Type { get; set; }
    }

    public class UpdateExpenditureCategoryDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public ExpenditureType? Type { get; set; }
    }
}