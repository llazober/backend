using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using QCScheduler.Api.Data;
using QCScheduler.Api.Hubs;
using QCScheduler.Api.Models.Scheduler;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace QCScheduler.Api.Services
{
    public class SyncWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHubContext<QCHub> _hubContext;
        private readonly ILogger<SyncWorker> _logger;
        private readonly ConcurrentDictionary<string, EpicorJobSnapshot> _epicorCache = new();
        private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(30); // 30 seconds for development, default 5 mins in production

        public SyncWorker(IServiceScopeFactory scopeFactory, IHubContext<QCHub> hubContext, ILogger<SyncWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _hubContext = hubContext;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Background Sync Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PerformSyncAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during Epicor synchronization.");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("Background Sync Service is stopping.");
        }

        private async Task PerformSyncAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var epicorDb = scope.ServiceProvider.GetRequiredService<EpicorDbContext>();
            var schedulerDb = scope.ServiceProvider.GetRequiredService<QCSchedulerDbContext>();

            _logger.LogInformation("Performing background sync from Epicor ERP...");

            // 1. Get active QC work centers
            var activeWCs = await schedulerDb.WorkCenters
                .Where(wc => wc.Active)
                .Select(wc => wc.WorkCenterCode)
                .ToListAsync();

            if (!activeWCs.Any())
            {
                _logger.LogWarning("No active QC work centers defined in QCScheduler. Skipping sync.");
                return;
            }

            // 2. Fetch all job operations from Epicor belonging to active QC work centers
            var epicorOpers = await epicorDb.JobOpers
                .Include(jo => jo.JobHead)
                .Where(jo => activeWCs.Contains(jo.WCCode))
                .ToListAsync();

            // 3. Sync Epicor operations to Kanban cards
            foreach (var op in epicorOpers)
            {
                var jobHead = op.JobHead;
                if (jobHead == null) continue;

                // Find matching scheduler card
                var schedulerJob = await schedulerDb.QCJobs
                    .FirstOrDefaultAsync(j => j.EpicorJobNum == op.JobNum 
                                           && j.AssemblySeq == op.AssemblySeq 
                                           && j.OperationSeq == op.OprSeq);

                string cacheKey = $"{op.JobNum}_{op.AssemblySeq}_{op.OprSeq}";

                if (schedulerJob == null)
                {
                    // If operation is already completed in Epicor, don't import it as a new scheduling card
                    if (op.OpComplete)
                    {
                        continue;
                    }

                    // Create new Kanban card automatically
                    var newJob = new QCJob
                        {
                            EpicorJobNum = op.JobNum,
                            AssemblySeq = op.AssemblySeq,
                            OperationSeq = op.OprSeq,
                            CurrentColumn = "New Incoming",
                            Priority = MapPriority(jobHead.JobPriority),
                            CreatedDate = DateTime.UtcNow,
                            ModifiedDate = DateTime.UtcNow
                        };

                    schedulerDb.QCJobs.Add(newJob);
                    await schedulerDb.SaveChangesAsync();

                    // Log history
                    var history = new QCHistory
                    {
                        QCJobId = newJob.QCJobId,
                        ActionType = "Created",
                        NewValue = $"Job imported from Epicor. WorkCenter: {op.WCCode}, Op: {op.OpDesc}",
                        ChangedBy = "SyncWorker",
                        ChangeDate = DateTime.UtcNow
                    };
                    schedulerDb.History.Add(history);
                    await schedulerDb.SaveChangesAsync();

                    // Cache state
                    _epicorCache[cacheKey] = new EpicorJobSnapshot
                    {
                        DueDate = jobHead.DueDate,
                        ProdQty = jobHead.ProdQty,
                        QtyCompleted = jobHead.QtyCompleted,
                        JobPriority = jobHead.JobPriority,
                        OpComplete = op.OpComplete
                    };

                    _logger.LogInformation("Automatically created card for job {JobNum}", op.JobNum);

                    // Broadcast via SignalR
                    await _hubContext.Clients.Group("KanbanBoard").SendAsync("JobCreated", new
                    {
                        newJob.QCJobId,
                        newJob.EpicorJobNum,
                        newJob.AssemblySeq,
                        newJob.OperationSeq,
                        newJob.CurrentColumn,
                        newJob.Priority,
                        newJob.InspectorId,
                        newJob.EstimatedHours,
                        newJob.ActualHours,
                        newJob.Notes,
                        newJob.CreatedDate,
                        newJob.ModifiedDate,
                        PartNum = jobHead.PartNum,
                        PartDescription = jobHead.PartDescription,
                        DueDate = jobHead.DueDate,
                        ProdQty = jobHead.ProdQty,
                        QtyCompleted = jobHead.QtyCompleted,
                        WCCode = op.WCCode,
                        OpDesc = op.OpDesc
                    });
                }
                else
                {
                    // Card already exists, check for changes
                    bool hasChanged = false;
                    var changes = new System.Text.StringBuilder();

                    // Check cached snapshot
                    if (!_epicorCache.TryGetValue(cacheKey, out var snapshot))
                    {
                        // Initialize cache if missing
                        snapshot = new EpicorJobSnapshot
                        {
                            DueDate = jobHead.DueDate,
                            ProdQty = jobHead.ProdQty,
                            QtyCompleted = jobHead.QtyCompleted,
                            JobPriority = jobHead.JobPriority,
                            OpComplete = op.OpComplete
                        };
                        _epicorCache[cacheKey] = snapshot;
                    }

                    // Compare values
                    if (snapshot.DueDate != jobHead.DueDate)
                    {
                        hasChanged = true;
                        changes.Append($"Due Date: {snapshot.DueDate:yyyy-MM-dd} -> {jobHead.DueDate:yyyy-MM-dd}; ");
                        snapshot.DueDate = jobHead.DueDate;
                    }
                    if (snapshot.ProdQty != jobHead.ProdQty)
                    {
                        hasChanged = true;
                        changes.Append($"Qty Required: {snapshot.ProdQty} -> {jobHead.ProdQty}; ");
                        snapshot.ProdQty = jobHead.ProdQty;
                    }
                    if (snapshot.QtyCompleted != jobHead.QtyCompleted)
                    {
                        hasChanged = true;
                        changes.Append($"Qty Completed: {snapshot.QtyCompleted} -> {jobHead.QtyCompleted}; ");
                        snapshot.QtyCompleted = jobHead.QtyCompleted;
                    }
                    if (snapshot.JobPriority != jobHead.JobPriority)
                    {
                        hasChanged = true;
                        changes.Append($"Epicor Priority: {snapshot.JobPriority} -> {jobHead.JobPriority}; ");
                        snapshot.JobPriority = jobHead.JobPriority;

                        // Also update QCJob priority in scheduler
                        var oldPriority = schedulerJob.Priority;
                        var newPriority = MapPriority(jobHead.JobPriority);
                        if (oldPriority != newPriority)
                        {
                            schedulerJob.Priority = newPriority;
                            schedulerJob.ModifiedDate = DateTime.UtcNow;
                            schedulerDb.QCJobs.Update(schedulerJob);

                            var priorityHistory = new QCHistory
                            {
                                QCJobId = schedulerJob.QCJobId,
                                ActionType = "Priority",
                                OldValue = oldPriority,
                                NewValue = newPriority,
                                ChangedBy = "SyncWorker",
                                ChangeDate = DateTime.UtcNow
                            };
                            schedulerDb.History.Add(priorityHistory);
                        }
                    }

                    // Check if operation was marked completed in Epicor
                    if (!snapshot.OpComplete && op.OpComplete)
                    {
                        hasChanged = true;
                        changes.Append("Operation marked Complete in Epicor; ");
                        snapshot.OpComplete = op.OpComplete;

                        // Move card to Completed in Scheduler
                        if (schedulerJob.CurrentColumn != "Completed")
                        {
                            var oldCol = schedulerJob.CurrentColumn;
                            schedulerJob.CurrentColumn = "Completed";
                            schedulerJob.ModifiedDate = DateTime.UtcNow;
                            schedulerDb.QCJobs.Update(schedulerJob);

                            var completionHistory = new QCHistory
                            {
                                QCJobId = schedulerJob.QCJobId,
                                ActionType = "Complete",
                                OldValue = oldCol,
                                NewValue = "Completed",
                                ChangedBy = "SyncWorker",
                                ChangeDate = DateTime.UtcNow
                            };
                            schedulerDb.History.Add(completionHistory);

                            await _hubContext.Clients.Group("KanbanBoard").SendAsync("JobCompleted", new { schedulerJob.QCJobId });
                        }
                    }

                    if (hasChanged)
                    {
                        await schedulerDb.SaveChangesAsync();

                        // Log history log for general update
                        var updateHistory = new QCHistory
                        {
                            QCJobId = schedulerJob.QCJobId,
                            ActionType = "Update",
                            NewValue = $"SyncWorker detected changes: {changes}",
                            ChangedBy = "SyncWorker",
                            ChangeDate = DateTime.UtcNow
                        };
                        schedulerDb.History.Add(updateHistory);
                        await schedulerDb.SaveChangesAsync();

                        _logger.LogInformation("Job {JobNum} updated from Epicor changes.", op.JobNum);

                        // Broadcast via SignalR
                        await _hubContext.Clients.Group("KanbanBoard").SendAsync("JobUpdated", new
                        {
                            schedulerJob.QCJobId,
                            schedulerJob.EpicorJobNum,
                            schedulerJob.AssemblySeq,
                            schedulerJob.OperationSeq,
                            schedulerJob.CurrentColumn,
                            schedulerJob.Priority,
                            schedulerJob.InspectorId,
                            schedulerJob.EstimatedHours,
                            schedulerJob.ActualHours,
                            schedulerJob.Notes,
                            schedulerJob.CreatedDate,
                            schedulerJob.ModifiedDate,
                            PartNum = jobHead.PartNum,
                            PartDescription = jobHead.PartDescription,
                            DueDate = jobHead.DueDate,
                            ProdQty = jobHead.ProdQty,
                            QtyCompleted = jobHead.QtyCompleted,
                            WCCode = op.WCCode,
                            OpDesc = op.OpDesc
                        });
                    }
                }
            }
        }

        private string MapPriority(string epicorPriority)
        {
            return epicorPriority switch
            {
                "Critical" => "Critical",
                "High" => "High",
                "Low" => "Low",
                _ => "Normal"
            };
        }
    }

    public class EpicorJobSnapshot
    {
        public DateTime DueDate { get; set; }
        public decimal ProdQty { get; set; }
        public decimal QtyCompleted { get; set; }
        public string JobPriority { get; set; } = "Normal";
        public bool OpComplete { get; set; }
    }
}
