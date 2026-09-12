using api.Models;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace api.Data
{
    public class ApplicationDBContext : IdentityDbContext<AppUser>, IDataProtectionKeyContext
    {
        public ApplicationDBContext(DbContextOptions<ApplicationDBContext> dbContextOptions)
            : base(dbContextOptions) { }

        public DbSet<Stock> Stock { get; set; }

        public DbSet<Comment> Comments { get; set; }

        public DbSet<Portfolio> Portfolios { get; set; }

        public DbSet<Transaction> Transactions { get; set; }

        public DbSet<PriceAlert> PriceAlerts { get; set; }

        public DbSet<AlertNotification> AlertNotifications { get; set; }

        public DbSet<PriceHistoryPoint> PriceHistory { get; set; }

        public DbSet<WatchlistEntry> WatchlistEntries { get; set; }

        public DbSet<Microsoft.AspNetCore.DataProtection.EntityFrameworkCore.DataProtectionKey> DataProtectionKeys { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<AppUser>()
                .Property<uint>("xmin")
                .HasColumnName("xmin")
                .HasColumnType("xid")
                .ValueGeneratedOnAddOrUpdate()
                .IsRowVersion();

            builder.Entity<Portfolio>()
                .Property<uint>("xmin")
                .HasColumnName("xmin")
                .HasColumnType("xid")
                .ValueGeneratedOnAddOrUpdate()
                .IsRowVersion();

            builder.Entity<Stock>()
                .HasIndex(s => s.Symbol)
                .IsUnique();

            builder.Entity<Portfolio>()
                .HasKey(p => p.Id);

            builder.Entity<Portfolio>()
                .HasOne(u => u.AppUser)
                .WithMany(u => u.Portfolios)
                .HasForeignKey(p => p.AppUserId);

            builder.Entity<Portfolio>()
                .HasOne(u => u.Stock)
                .WithMany(u => u.Portfolios)
                .HasForeignKey(p => p.StockId);

            builder.Entity<PriceAlert>().HasIndex(a => a.AppUserId);

            builder
                .Entity<PriceAlert>()
                .HasOne(a => a.AppUser)
                .WithMany()
                .HasForeignKey(a => a.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder
                .Entity<PriceAlert>()
                .HasOne(a => a.Stock)
                .WithMany()
                .HasForeignKey(a => a.StockId)
                .OnDelete(DeleteBehavior.Cascade);

            // The only query against this table asks for a set of stocks and
            // takes the newest rows of each, and the retention sweep deletes by
            // time -- both are served by this one index.
            builder.Entity<PriceHistoryPoint>().HasIndex(p => new { p.StockId, p.RecordedAt });

            builder
                .Entity<PriceHistoryPoint>()
                .HasOne(p => p.Stock)
                .WithMany()
                .HasForeignKey(p => p.StockId)
                .OnDelete(DeleteBehavior.Cascade);

            // Unique per user and stock: following the same company twice is
            // not a thing a list like this can mean, and enforcing it here is
            // what makes the check in the service a race the database still
            // catches.
            builder
                .Entity<WatchlistEntry>()
                .HasIndex(w => new { w.AppUserId, w.StockId })
                .IsUnique();

            builder
                .Entity<WatchlistEntry>()
                .HasOne(w => w.AppUser)
                .WithMany()
                .HasForeignKey(w => w.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder
                .Entity<WatchlistEntry>()
                .HasOne(w => w.Stock)
                .WithMany()
                .HasForeignKey(w => w.StockId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<AlertNotification>().HasIndex(n => n.AppUserId);

            builder
                .Entity<AlertNotification>()
                .HasOne(n => n.PriceAlert)
                .WithMany()
                .HasForeignKey(n => n.PriceAlertId)
                .OnDelete(DeleteBehavior.Cascade);

            List<IdentityRole> roles = new List<IdentityRole>
            {
                new IdentityRole
                {
                    Id = "c89b788a-3642-47df-bc6c-13654b03517c",
                    Name = "Admin",
                    NormalizedName = "ADMIN",
                    ConcurrencyStamp = "180dc409-91b3-4204-ac43-5c253ce4fad3",
                },
                new IdentityRole
                {
                    Id = "e2d83ab9-2bb6-46b6-b8db-4e115fa016b2",
                    Name = "User",
                    NormalizedName = "USER",
                    ConcurrencyStamp = "39972adb-34ed-4c07-967d-9b238e640d87",
                },
            };

            builder.Entity<IdentityRole>().HasData(roles);
        }
    }
}
