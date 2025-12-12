using ImsServer.Models.SaleX;


namespace ImsServer.Models.SalesDebtsTrackerX
{
    
    public class SalesDebtsTracker : GeneralFields
    {
        public Guid Id { get; set; }
        public decimal PaidAmount { get; set; }
        public string? Description { get; set; }
        public DebtType DebtType { get; set; }
        public Guid SaleId { get; set; }
        public virtual Sale Sale { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
    }

    public class SalesDebtsTrackerDto : GeneralFields
    {
        public Guid Id { get; set; }
        public decimal PaidAmount { get; set; }
        public string? Description { get; set; }
        public DebtType DebtType { get; set; }
        public Guid SaleId { get; set; }
        public SimpleSaleDto Sale { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
    }

    public class CreateSalesDebtsTrackerDto
    {
        public Guid Id { get; set; }
        public decimal PaidAmount { get; set; }
        public string? Description { get; set; }
        public DebtType DebtType { get; set; }
        public Guid SaleId { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
    }

    public class UpdateSalesDebtsTrackerDto
    {
        public decimal? PaidAmount { get; set; }
        public string? Description { get; set; }
        public PaymentMethod? PaymentMethod { get; set; }
    }
}