using System;

namespace QCScheduler.Api.Models.Scheduler
{
    public class QCHistory
    {
        public int HistoryId { get; set; }
        public int QCJobId { get; set; }
        public string ActionType { get; set; } = string.Empty; // 'Created', 'Move', 'Assign', 'Priority', 'Note', 'Complete', 'Update'
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string ChangedBy { get; set; } = string.Empty;
        public DateTime ChangeDate { get; set; } = DateTime.UtcNow;
    }
}
