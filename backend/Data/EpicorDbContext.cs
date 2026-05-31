using Microsoft.EntityFrameworkCore;
using QCScheduler.Api.Models.Epicor;

namespace QCScheduler.Api.Data
{
    public class EpicorDbContext : DbContext
    {
        public EpicorDbContext(DbContextOptions<EpicorDbContext> options) : base(options)
        {
        }

        public DbSet<JobHead> JobHeads { get; set; } = null!;
        public DbSet<JobOper> JobOpers { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<JobHead>(entity =>
            {
                entity.ToTable("JobHead");
                entity.HasKey(e => e.JobNum);
            });

            modelBuilder.Entity<JobOper>(entity =>
            {
                entity.ToTable("JobOper");
                entity.HasKey(e => new { e.JobNum, e.AssemblySeq, e.OprSeq });

                entity.HasOne(d => d.JobHead)
                    .WithMany(p => p.Operations)
                    .HasForeignKey(d => d.JobNum)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
