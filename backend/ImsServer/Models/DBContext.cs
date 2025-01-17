using ImsServer.Models.UserX;
using ImsServer.Models.CategoryX;
using ImsServer.Models.StoreX;
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


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            
            modelBuilder.Entity<User>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<Store>().HasQueryFilter(c => !c.DeletedAt.HasValue);
            modelBuilder.Entity<Category>().HasQueryFilter(c => !c.DeletedAt.HasValue);
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