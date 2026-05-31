using Microsoft.EntityFrameworkCore;
using QCScheduler.Api.Models.Scheduler;

namespace QCScheduler.Api.Data
{
    public class QCSchedulerDbContext : DbContext
    {
        public QCSchedulerDbContext(DbContextOptions<QCSchedulerDbContext> options) : base(options)
        {
        }

        public DbSet<QCInspector> Inspectors { get; set; } = null!;
        public DbSet<QCWorkCenter> WorkCenters { get; set; } = null!;
        public DbSet<QCJob> QCJobs { get; set; } = null!;
        public DbSet<QCHistory> History { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<QCInspector>(entity =>
            {
                entity.ToTable("QCInspectors");
                entity.HasKey(e => e.InspectorId);
            });

            modelBuilder.Entity<QCWorkCenter>(entity =>
            {
                entity.ToTable("QCWorkCenters");
                entity.HasKey(e => e.WorkCenterId);
            });

            modelBuilder.Entity<QCJob>(entity =>
            {
                entity.ToTable("QCJobs");
                entity.HasKey(e => e.QCJobId);

                entity.HasOne(d => d.Inspector)
                    .WithMany(p => p.Jobs)
                    .HasForeignKey(d => d.InspectorId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<QCHistory>(entity =>
            {
                entity.ToTable("QCHistory");
                entity.HasKey(e => e.HistoryId);
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(e => e.UserId);
            });
        }
    }
}
