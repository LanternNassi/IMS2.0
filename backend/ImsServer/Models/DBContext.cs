using ImsServer.Models.UserX;
using ImsServer.Models.CategoryX;
using ImsServer.Models.CustomerX;
using ImsServer.Models.StoreX;
using ImsServer.Models.SupplierX;
using ImsServer.Models.ProductX;
using ImsServer.Models.PurchaseX;
using ImsServer.Models.SaleX;
using ImsServer.Models.ExpenditureX;
using ImsServer.Models.SalesDebtsTrackerX;
using ImsServer.Models.FinancialAccountX;
using ImsServer.Models.PurchaseDebtX;
using ImsServer.Models.FixedAssetX;
using ImsServer.Models.CapitalAccountX;
using ImsServer.Models.TaxRecordX;
using ImsServer.Models.SystemConfigX;
    

using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography.X509Certificates;

namespace ImsServer.Models
{
    public class DBContext : DbContext
    {
        public DBContext(DbContextOptions<DBContext> options) : base(options)
        {
            
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Store> Stores { get; set; }
        public DbSet<Category> Categories { get; set; }

        public DbSet<Customer> Customers { get; set; }
        public DbSet<CustomerTag> CustomerTags { get; set; }
        
        public DbSet<Supplier> Suppliers { get; set;}
        public DbSet<SupplierTag> SupplierTags { get; set; }

        public DbSet<Product> Products { get; set;}
        public DbSet<ProductGeneric> ProductGenerics { get; set; }
        public DbSet<ProductVariation> ProductVariations { get; set; }
        public DbSet<ProductStorage> ProductStorages { get; set; }

        public DbSet<Purchase> Purchases { get; set; }
        public DbSet<PurchaseItem> PurchaseItems { get; set; }

        public DbSet<Sale> Sales { get; set; }
        public DbSet<SalesItem> SalesItems { get; set; }
        public DbSet<Expenditure> Expenditures { get; set; }
        public DbSet<ExpenditureCategory> ExpenditureCategories { get; set; }
        public DbSet<SalesDebtsTracker> SalesDebtsTrackers { get; set; }

        public DbSet<FinancialAccount> FinancialAccounts { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<DailyCashReconciliation> DailyCashReconciliations { get; set; }
        public DbSet<PurchaseDebtTracker> PurchaseDebtTrackers { get; set; }
        public DbSet<FixedAsset> FixedAssets { get; set; }
        public DbSet<CapitalAccount> CapitalAccounts { get; set; }
        public DbSet<TaxRecord> TaxRecords { get; set; }
        public DbSet<SystemConfig> SystemConfigs { get; set; }
        public DbSet<Contact> Contacts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            
            modelBuilder.Entity<User>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<Store>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<Category>().HasQueryFilter(c => !c.DeletedAt.HasValue);

            modelBuilder.Entity<Customer>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<CustomerTag>().HasQueryFilter(c => !c.DeletedAt.HasValue);

            modelBuilder.Entity<Supplier>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<SupplierTag>().HasQueryFilter(c => !c.DeletedAt.HasValue);

            modelBuilder.Entity<Product>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<ProductGeneric>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<ProductVariation>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<SalesItem>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<Sale>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<Purchase>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<PurchaseItem>().HasQueryFilter(c => !c.DeletedAt.HasValue);

            modelBuilder.Entity<Expenditure>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<ExpenditureCategory>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<SalesDebtsTracker>().HasQueryFilter(c => !c.DeletedAt.HasValue);

            modelBuilder.Entity<FinancialAccount>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<Transaction>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<DailyCashReconciliation>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<PurchaseDebtTracker>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<FixedAsset>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<CapitalAccount>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<TaxRecord>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<SystemConfig>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<Contact>().HasQueryFilter(c => !c.DeletedAt.HasValue);

            modelBuilder.Entity<DailyCashReconciliation>()
                .HasIndex(x => new { x.FinancialAccountId, x.BusinessDateUtc })
                .IsUnique();

            modelBuilder.Entity<ProductStorage>()
                .HasOne(ps => ps.ProductGeneric)
                .WithMany()
                .HasForeignKey(ps => ps.ProductGenericId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProductStorage>()
                .HasOne(ps => ps.Store)
                .WithMany()
                .HasForeignKey(ps => ps.StorageId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProductStorage>()
                .HasOne(ps => ps.ProductVariation)
                .WithMany(pv => pv.ProductStorages)
                .HasForeignKey(ps => ps.ProductVariationId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProductStorage>().HasQueryFilter(c => !c.DeletedAt.HasValue);

            // Configure SalesItem to prevent cascade delete conflicts
            modelBuilder.Entity<SalesItem>()
                .HasOne(si => si.ProductStorage)
                .WithMany()
                .HasForeignKey(si => si.ProductStorageId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<SalesItem>()
                .HasOne(si => si.ProductVariation)
                .WithMany()
                .HasForeignKey(si => si.ProductVariationId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<SalesItem>()
                .HasOne(si => si.Sale)
                .WithMany(s => s.SaleItems)
                .HasForeignKey(si => si.SaleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Contact>()
                .HasOne(c => c.SystemConfig)
                .WithMany(sc => sc.Contacts)
                .HasForeignKey(c => c.SystemConfigId)
                .OnDelete(DeleteBehavior.Cascade);

            base.OnModelCreating(modelBuilder);

        }

        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is User
                    || e.Entity is Store
                    || e.Entity is Category

                    || e.Entity is Customer
                    || e.Entity is CustomerTag

                    || e.Entity is Supplier
                    || e.Entity is SupplierTag

                    || e.Entity is Product
                    || e.Entity is ProductGeneric
                    || e.Entity is ProductVariation
                    || e.Entity is ProductStorage
                    || e.Entity is Expenditure
                    || e.Entity is ExpenditureCategory

                    || e.Entity is Sale
                    || e.Entity is SalesItem

                    || e.Entity is Purchase
                    || e.Entity is PurchaseItem

                    || e.Entity is SalesDebtsTracker
                    || e.Entity is FinancialAccount
                    || e.Entity is DailyCashReconciliation
                    || e.Entity is PurchaseDebtTracker
                    || e.Entity is FixedAsset
                    || e.Entity is CapitalAccount
                    || e.Entity is TaxRecord
                    || e.Entity is SystemConfig
                    || e.Entity is Contact

                    )
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Property("AddedAt").CurrentValue = DateTime.UtcNow;
                    entry.Property("AddedBy").CurrentValue = 1;
                }
                if (entry.State == EntityState.Modified)
                {
                    var originalValues = entry.OriginalValues;
                    var currentValues = entry.CurrentValues;

                    // You can now access the original and current values of the entity
                    // For example:
                    // var originalValue = originalValues["PropertyName"];
                    // var currentValue = currentValues["PropertyName"];
                }
                entry.Property("UpdatedAt").CurrentValue = DateTime.UtcNow;
                entry.Property("LastUpdatedBy").CurrentValue = 1;
            }
        }

        public void SoftDelete<T>(T entity) where T : class
        {
            var entry = Entry(entity);
            entry.Property("DeletedAt").CurrentValue = DateTime.UtcNow;
            entry.State = EntityState.Modified;
        }

        public void Restore<T>(T entity) where T : class
        {
            var entry = Entry(entity);
            entry.Property("DeletedAt").CurrentValue = null;
            entry.State = EntityState.Modified;
        }


    }

}