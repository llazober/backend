using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using QCScheduler.Api.Data;
using QCScheduler.Api.Hubs;
using QCScheduler.Api.Models.Scheduler;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace QCScheduler.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class JobsController : ControllerBase
    {
        private readonly QCSchedulerDbContext _schedulerDb;
        private readonly EpicorDbContext _epicorDb;
        private readonly IHubContext<QCHub> _hubContext;

        public JobsController(
            QCSchedulerDbContext schedulerDb, 
            EpicorDbContext epicorDb, 
            IHubContext<QCHub> hubContext)
        {
            _schedulerDb = schedulerDb;
            _epicorDb = epicorDb;
            _hubContext = hubContext;
        }

        private string GetCurrentUsername()
        {
            return User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        }

        [HttpGet]
        public async Task<IActionResult> GetJobs()
        {
            // 1. Fetch scheduler jobs
            var qcJobs = await _schedulerDb.QCJobs
                .Include(j => j.Inspector)
                .ToListAsync();

            if (!qcJobs.Any())
            {
                return Ok(new List<QCJobDto>());
            }

            // 2. Fetch Epicor details in-memory
            var jobNums = qcJobs.Select(j => j.EpicorJobNum).Distinct().ToList();
            var epicorHeads = await _epicorDb.JobHeads
                .Include(jh => jh.Operations)
                .Where(jh => jobNums.Contains(jh.JobNum))
                .ToListAsync();

            // 3. Merge data
            var result = new List<QCJobDto>();
            foreach (var qj in qcJobs)
            {
                var eh = epicorHeads.FirstOrDefault(h => h.JobNum == qj.EpicorJobNum);
                var op = eh?.Operations.FirstOrDefault(o => o.AssemblySeq == qj.AssemblySeq && o.OprSeq == qj.OperationSeq);

                result.Add(new QCJobDto
                {
                    QCJobId = qj.QCJobId,
                    EpicorJobNum = qj.EpicorJobNum,
                    AssemblySeq = qj.AssemblySeq,
                    OperationSeq = qj.OperationSeq,
                    CurrentColumn = qj.CurrentColumn,
                    Priority = qj.Priority,
                    InspectorId = qj.InspectorId,
                    InspectorName = qj.Inspector != null ? $"{qj.Inspector.FirstName} {qj.Inspector.LastName}" : string.Empty,
                    EstimatedHours = qj.EstimatedHours,
                    ActualHours = qj.ActualHours,
                    Notes = qj.Notes,
                    CreatedDate = qj.CreatedDate,
                    ModifiedDate = qj.ModifiedDate,
                    PartNum = eh?.PartNum ?? "UNKNOWN",
                    PartDescription = eh?.PartDescription ?? "UNKNOWN",
                    ProdQty = eh?.ProdQty ?? 0,
                    QtyCompleted = eh?.QtyCompleted ?? 0,
                    DueDate = eh?.DueDate ?? DateTime.UtcNow,
                    WCCode = op?.WCCode ?? string.Empty,
                    OpDesc = op?.OpDesc ?? string.Empty
                });
            }

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetJob(int id)
        {
            var qj = await _schedulerDb.QCJobs
                .Include(j => j.Inspector)
                .FirstOrDefaultAsync(j => j.QCJobId == id);

            if (qj == null) return NotFound();

            var eh = await _epicorDb.JobHeads
                .Include(h => h.Operations)
                .FirstOrDefaultAsync(h => h.JobNum == qj.EpicorJobNum);
            
            var op = eh?.Operations.FirstOrDefault(o => o.AssemblySeq == qj.AssemblySeq && o.OprSeq == qj.OperationSeq);

            var dto = new QCJobDto
            {
                QCJobId = qj.QCJobId,
                EpicorJobNum = qj.EpicorJobNum,
                AssemblySeq = qj.AssemblySeq,
                OperationSeq = qj.OperationSeq,
                CurrentColumn = qj.CurrentColumn,
                Priority = qj.Priority,
                InspectorId = qj.InspectorId,
                InspectorName = qj.Inspector != null ? $"{qj.Inspector.FirstName} {qj.Inspector.LastName}" : string.Empty,
                EstimatedHours = qj.EstimatedHours,
                ActualHours = qj.ActualHours,
                Notes = qj.Notes,
                CreatedDate = qj.CreatedDate,
                ModifiedDate = qj.ModifiedDate,
                PartNum = eh?.PartNum ?? "UNKNOWN",
                PartDescription = eh?.PartDescription ?? "UNKNOWN",
                ProdQty = eh?.ProdQty ?? 0,
                QtyCompleted = eh?.QtyCompleted ?? 0,
                DueDate = eh?.DueDate ?? DateTime.UtcNow,
                WCCode = op?.WCCode ?? string.Empty,
                OpDesc = op?.OpDesc ?? string.Empty
            };

            return Ok(dto);
        }

        [HttpPut("{id}/move")]
        public async Task<IActionResult> MoveJob(int id, [FromBody] MoveJobDto request)
        {
            var job = await _schedulerDb.QCJobs.FindAsync(id);
            if (job == null) return NotFound();

            string oldCol = job.CurrentColumn;
            if (oldCol == request.CurrentColumn) return Ok(job);

            job.CurrentColumn = request.CurrentColumn;
            job.ModifiedDate = DateTime.UtcNow;
            _schedulerDb.QCJobs.Update(job);

            var history = new QCHistory
            {
                QCJobId = job.QCJobId,
                ActionType = request.CurrentColumn == "Completed" ? "Complete" : "Move",
                OldValue = oldCol,
                NewValue = request.CurrentColumn,
                ChangedBy = GetCurrentUsername(),
                ChangeDate = DateTime.UtcNow
            };
            _schedulerDb.History.Add(history);
            await _schedulerDb.SaveChangesAsync();

            // Broadcast to other users
            await _hubContext.Clients.Group("KanbanBoard").SendAsync("JobMoved", new
            {
                job.QCJobId,
                job.CurrentColumn,
                job.ModifiedDate
            });

            if (request.CurrentColumn == "Completed")
            {
                await _hubContext.Clients.Group("KanbanBoard").SendAsync("JobCompleted", new { job.QCJobId });
            }

            return Ok(job);
        }

        [HttpPut("{id}/assign")]
        public async Task<IActionResult> AssignJob(int id, [FromBody] AssignJobDto request)
        {
            var job = await _schedulerDb.QCJobs
                .Include(j => j.Inspector)
                .FirstOrDefaultAsync(j => j.QCJobId == id);
            if (job == null) return NotFound();

            string oldInspector = job.Inspector != null ? $"{job.Inspector.FirstName} {job.Inspector.LastName}" : "Unassigned";
            
            QCInspector? newInspector = null;
            if (request.InspectorId.HasValue)
            {
                newInspector = await _schedulerDb.Inspectors.FindAsync(request.InspectorId.Value);
                if (newInspector == null) return BadRequest("Inspector not found");
            }

            job.InspectorId = request.InspectorId;
            if (request.EstimatedHours.HasValue)
            {
                job.EstimatedHours = request.EstimatedHours.Value;
            }
            
            // Auto-move to "Assigned" column if it was in "New Incoming" and has a new inspector assigned
            string oldCol = job.CurrentColumn;
            if (job.InspectorId.HasValue && job.CurrentColumn == "New Incoming")
            {
                job.CurrentColumn = "Assigned";
            }

            job.ModifiedDate = DateTime.UtcNow;
            _schedulerDb.QCJobs.Update(job);

            string newInspectorName = newInspector != null ? $"{newInspector.FirstName} {newInspector.LastName}" : "Unassigned";

            var history = new QCHistory
            {
                QCJobId = job.QCJobId,
                ActionType = "Assign",
                OldValue = oldInspector,
                NewValue = newInspectorName,
                ChangedBy = GetCurrentUsername(),
                ChangeDate = DateTime.UtcNow
            };
            _schedulerDb.History.Add(history);

            if (oldCol != job.CurrentColumn)
            {
                var moveHistory = new QCHistory
                {
                    QCJobId = job.QCJobId,
                    ActionType = "Move",
                    OldValue = oldCol,
                    NewValue = job.CurrentColumn,
                    ChangedBy = GetCurrentUsername(),
                    ChangeDate = DateTime.UtcNow
                };
                _schedulerDb.History.Add(moveHistory);
            }

            await _schedulerDb.SaveChangesAsync();

            // Broadcast to other users
            await _hubContext.Clients.Group("KanbanBoard").SendAsync("JobAssigned", new
            {
                job.QCJobId,
                job.InspectorId,
                InspectorName = newInspectorName,
                job.EstimatedHours,
                job.CurrentColumn,
                job.ModifiedDate
            });

            return Ok(job);
        }

        [HttpPut("{id}/priority")]
        public async Task<IActionResult> UpdatePriority(int id, [FromBody] UpdatePriorityDto request)
        {
            var job = await _schedulerDb.QCJobs.FindAsync(id);
            if (job == null) return NotFound();

            string oldPriority = job.Priority;
            if (oldPriority == request.Priority) return Ok(job);

            job.Priority = request.Priority;
            job.ModifiedDate = DateTime.UtcNow;
            _schedulerDb.QCJobs.Update(job);

            var history = new QCHistory
            {
                QCJobId = job.QCJobId,
                ActionType = "Priority",
                OldValue = oldPriority,
                NewValue = request.Priority,
                ChangedBy = GetCurrentUsername(),
                ChangeDate = DateTime.UtcNow
            };
            _schedulerDb.History.Add(history);
            await _schedulerDb.SaveChangesAsync();

            // Broadcast update
            await _hubContext.Clients.Group("KanbanBoard").SendAsync("JobUpdated", new
            {
                job.QCJobId,
                job.Priority,
                job.ModifiedDate
            });

            return Ok(job);
        }

        [HttpPut("{id}/details")]
        public async Task<IActionResult> UpdateDetails(int id, [FromBody] UpdateDetailsDto request)
        {
            var job = await _schedulerDb.QCJobs.FindAsync(id);
            if (job == null) return NotFound();

            bool changed = false;
            if (job.Notes != request.Notes)
            {
                var history = new QCHistory
                {
                    QCJobId = job.QCJobId,
                    ActionType = "Note",
                    OldValue = job.Notes,
                    NewValue = request.Notes,
                    ChangedBy = GetCurrentUsername(),
                    ChangeDate = DateTime.UtcNow
                };
                _schedulerDb.History.Add(history);
                job.Notes = request.Notes;
                changed = true;
            }

            if (job.ActualHours != request.ActualHours)
            {
                var history = new QCHistory
                {
                    QCJobId = job.QCJobId,
                    ActionType = "Update",
                    OldValue = job.ActualHours?.ToString() ?? "null",
                    NewValue = request.ActualHours?.ToString() ?? "null",
                    ChangedBy = GetCurrentUsername(),
                    ChangeDate = DateTime.UtcNow
                };
                _schedulerDb.History.Add(history);
                job.ActualHours = request.ActualHours;
                changed = true;
            }

            if (changed)
            {
                job.ModifiedDate = DateTime.UtcNow;
                _schedulerDb.QCJobs.Update(job);
                await _schedulerDb.SaveChangesAsync();

                // Broadcast update
                await _hubContext.Clients.Group("KanbanBoard").SendAsync("JobUpdated", new
                {
                    job.QCJobId,
                    job.Notes,
                    job.ActualHours,
                    job.ModifiedDate
                });
            }

            return Ok(job);
        }

        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetJobHistory(int id)
        {
            var history = await _schedulerDb.History
                .Where(h => h.QCJobId == id)
                .OrderByDescending(h => h.ChangeDate)
                .ToListAsync();
            return Ok(history);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJob(int id)
        {
            var job = await _schedulerDb.QCJobs.FindAsync(id);
            if (job == null) return NotFound();

            _schedulerDb.QCJobs.Remove(job);
            
            // Clean up history
            var history = await _schedulerDb.History.Where(h => h.QCJobId == id).ToListAsync();
            _schedulerDb.History.RemoveRange(history);

            await _schedulerDb.SaveChangesAsync();

            // Broadcast delete
            await _hubContext.Clients.Group("KanbanBoard").SendAsync("JobDeleted", new { QCJobId = id });

            return Ok(new { message = "Job deleted successfully" });
        }
    }

    public class QCJobDto
    {
        public int QCJobId { get; set; }
        public string EpicorJobNum { get; set; } = string.Empty;
        public int AssemblySeq { get; set; }
        public int OperationSeq { get; set; }
        public string CurrentColumn { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public int? InspectorId { get; set; }
        public string InspectorName { get; set; } = string.Empty;
        public decimal? EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        // Epicor Fields
        public string PartNum { get; set; } = string.Empty;
        public string PartDescription { get; set; } = string.Empty;
        public decimal ProdQty { get; set; }
        public decimal QtyCompleted { get; set; }
        public DateTime DueDate { get; set; }
        public string WCCode { get; set; } = string.Empty;
        public string OpDesc { get; set; } = string.Empty;
    }

    public class MoveJobDto
    {
        public string CurrentColumn { get; set; } = string.Empty;
    }

    public class AssignJobDto
    {
        public int? InspectorId { get; set; }
        public decimal? EstimatedHours { get; set; }
    }

    public class UpdatePriorityDto
    {
        public string Priority { get; set; } = string.Empty;
    }

    public class UpdateDetailsDto
    {
        public string? Notes { get; set; }
        public decimal? ActualHours { get; set; }
    }
}
