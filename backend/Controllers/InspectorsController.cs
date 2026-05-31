using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QCScheduler.Api.Data;
using QCScheduler.Api.Models.Scheduler;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace QCScheduler.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class InspectorsController : ControllerBase
    {
        private readonly QCSchedulerDbContext _context;

        public InspectorsController(QCSchedulerDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetInspectors()
        {
            var inspectors = await _context.Inspectors
                .Include(i => i.Jobs)
                .ToListAsync();

            var result = inspectors.Select(i => {
                var activeJobs = i.Jobs.Where(j => j.CurrentColumn != "Completed").ToList();
                var completedJobs = i.Jobs.Where(j => j.CurrentColumn == "Completed").ToList();
                
                int activeCount = activeJobs.Count;
                int completedCount = completedJobs.Count;
                int totalCount = activeCount + completedCount;

                decimal estimatedHours = activeJobs.Sum(j => j.EstimatedHours ?? 0);
                decimal actualHours = activeJobs.Sum(j => j.ActualHours ?? 0);
                decimal completionRate = totalCount > 0 
                    ? (decimal)completedCount / totalCount * 100 
                    : 0;

                return new InspectorWorkloadDto
                {
                    InspectorId = i.InspectorId,
                    FirstName = i.FirstName,
                    LastName = i.LastName,
                    Email = i.Email,
                    Active = i.Active,
                    Shift = i.Shift,
                    SkillLevel = i.SkillLevel,
                    ActiveJobsCount = activeCount,
                    EstimatedHours = estimatedHours,
                    ActualHours = actualHours,
                    CompletionRate = Math.Round(completionRate, 1)
                };
            }).ToList();

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetInspector(int id)
        {
            var inspector = await _context.Inspectors
                .Include(i => i.Jobs)
                .FirstOrDefaultAsync(i => i.InspectorId == id);

            if (inspector == null) return NotFound();

            return Ok(inspector);
        }

        [HttpPost]
        public async Task<IActionResult> CreateInspector([FromBody] CreateInspectorDto dto)
        {
            var inspector = new QCInspector
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Active = true,
                Shift = dto.Shift,
                SkillLevel = dto.SkillLevel
            };

            _context.Inspectors.Add(inspector);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInspector), new { id = inspector.InspectorId }, inspector);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInspector(int id, [FromBody] UpdateInspectorDto dto)
        {
            var inspector = await _context.Inspectors.FindAsync(id);
            if (inspector == null) return NotFound();

            inspector.FirstName = dto.FirstName;
            inspector.LastName = dto.LastName;
            inspector.Email = dto.Email;
            inspector.Active = dto.Active;
            inspector.Shift = dto.Shift;
            inspector.SkillLevel = dto.SkillLevel;

            _context.Inspectors.Update(inspector);
            await _context.SaveChangesAsync();

            return Ok(inspector);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInspector(int id)
        {
            var inspector = await _context.Inspectors.FindAsync(id);
            if (inspector == null) return NotFound();

            // Check if there are active jobs assigned to this inspector
            var hasActiveJobs = await _context.QCJobs.AnyAsync(j => j.InspectorId == id && j.CurrentColumn != "Completed");
            if (hasActiveJobs)
            {
                return BadRequest("Cannot delete an inspector with active inspection jobs. Reassign the jobs first.");
            }

            _context.Inspectors.Remove(inspector);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Inspector deleted successfully" });
        }
    }

    public class InspectorWorkloadDto
    {
        public int InspectorId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool Active { get; set; }
        public string Shift { get; set; } = string.Empty;
        public string SkillLevel { get; set; } = string.Empty;
        public int ActiveJobsCount { get; set; }
        public decimal EstimatedHours { get; set; }
        public decimal ActualHours { get; set; }
        public decimal CompletionRate { get; set; }
    }

    public class CreateInspectorDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Shift { get; set; } = string.Empty;
        public string SkillLevel { get; set; } = string.Empty;
    }

    public class UpdateInspectorDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool Active { get; set; }
        public string Shift { get; set; } = string.Empty;
        public string SkillLevel { get; set; } = string.Empty;
    }
}
