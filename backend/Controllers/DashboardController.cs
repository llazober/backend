using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QCScheduler.Api.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace QCScheduler.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly QCSchedulerDbContext _schedulerDb;
        private readonly EpicorDbContext _epicorDb;

        public DashboardController(QCSchedulerDbContext schedulerDb, EpicorDbContext epicorDb)
        {
            _schedulerDb = schedulerDb;
            _epicorDb = epicorDb;
        }

        [HttpGet("metrics")]
        public async Task<IActionResult> GetMetrics()
        {
            var activeJobs = await _schedulerDb.QCJobs.ToListAsync();

            // Total active jobs on board
            int totalIncoming = activeJobs.Count(j => j.CurrentColumn != "Completed");
            int waitingAssignment = activeJobs.Count(j => j.CurrentColumn == "New Incoming");
            int inInspection = activeJobs.Count(j => j.CurrentColumn == "In Inspection");
            
            // Completed today (current local date)
            var localToday = DateTime.UtcNow.Date; // Fallback to Utc Date for simplicity
            int completedToday = activeJobs.Count(j => j.CurrentColumn == "Completed" && j.ModifiedDate.Date == localToday);

            // Compute Late Jobs (active jobs with past due dates in Epicor)
            var activeJobNums = activeJobs
                .Where(j => j.CurrentColumn != "Completed")
                .Select(j => j.EpicorJobNum)
                .Distinct()
                .ToList();

            var lateEpicorJobs = await _epicorDb.JobHeads
                .Where(jh => activeJobNums.Contains(jh.JobNum) && jh.DueDate.Date < DateTime.UtcNow.Date)
                .Select(jh => jh.JobNum)
                .ToListAsync();

            int lateJobsCount = activeJobs.Count(j => j.CurrentColumn != "Completed" && lateEpicorJobs.Contains(j.EpicorJobNum));

            return Ok(new
            {
                TotalIncomingJobs = totalIncoming,
                JobsWaitingAssignment = waitingAssignment,
                JobsInInspection = inInspection,
                JobsCompletedToday = completedToday,
                LateJobs = lateJobsCount
            });
        }
    }
}
