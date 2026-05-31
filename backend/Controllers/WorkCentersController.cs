using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QCScheduler.Api.Data;
using QCScheduler.Api.Models.Scheduler;
using System.Threading.Tasks;

namespace QCScheduler.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WorkCentersController : ControllerBase
    {
        private readonly QCSchedulerDbContext _context;

        public WorkCentersController(QCSchedulerDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetWorkCenters()
        {
            var workCenters = await _context.WorkCenters.ToListAsync();
            return Ok(workCenters);
        }

        [HttpPost]
        public async Task<IActionResult> CreateWorkCenter([FromBody] CreateWorkCenterDto dto)
        {
            if (await _context.WorkCenters.AnyAsync(wc => wc.WorkCenterCode == dto.WorkCenterCode))
            {
                return BadRequest("Work Center Code already exists");
            }

            var wc = new QCWorkCenter
            {
                WorkCenterCode = dto.WorkCenterCode.ToUpper(),
                Description = dto.Description,
                Active = true
            };

            _context.WorkCenters.Add(wc);
            await _context.SaveChangesAsync();

            return Ok(wc);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorkCenter(int id, [FromBody] UpdateWorkCenterDto dto)
        {
            var wc = await _context.WorkCenters.FindAsync(id);
            if (wc == null) return NotFound();

            wc.Description = dto.Description;
            wc.Active = dto.Active;

            _context.WorkCenters.Update(wc);
            await _context.SaveChangesAsync();

            return Ok(wc);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorkCenter(int id)
        {
            var wc = await _context.WorkCenters.FindAsync(id);
            if (wc == null) return NotFound();

            _context.WorkCenters.Remove(wc);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Work center deleted successfully" });
        }
    }

    public class CreateWorkCenterDto
    {
        public string WorkCenterCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class UpdateWorkCenterDto
    {
        public string Description { get; set; } = string.Empty;
        public bool Active { get; set; }
    }
}
