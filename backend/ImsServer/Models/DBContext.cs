using ImsServer.Models.UserX;
using ImsServer.Models.CategoryX;
using ImsServer.Models.CustomerX;
using ImsServer.Models.StoreX;
using ImsServer.Models.SupplierX;
using ImsServer.Models.ProductX;
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
            modelBuilder.Entity<ProductStorage>().HasQueryFilter(c => !c.DeletedAt.HasValue);


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