namespace ImsServer.Models
{
    public class GeneralFields
    {
        public DateTime AddedAt { get; set; }
        public int AddedBy {get; set; }
        public DateTime UpdatedAt { get; set; }
        public int LastUpdatedBy {get; set;}
        public DateTime? DeletedAt { get; set; }
    }

    public enum Currency
    {
        Unknown = 0,
        USD,
        EUR,
        GBP,
        JPY,
        AUD,
        CAD,
        CHF,
        CNY,
        INR,
        UGX
    }

}