using System;

namespace QCScheduler.Api.Models.Scheduler
{
    public class QCJob
    {
        public int QCJobId { get; set; }
        public string EpicorJobNum { get; set; } = string.Empty;
        public int AssemblySeq { get; set; }
        public int OperationSeq { get; set; }
        public string CurrentColumn { get; set; } = "New Incoming"; // 'New Incoming', 'Assigned', 'In Inspection', 'Completed'
        public string Priority { get; set; } = "Normal"; // 'Critical', 'High', 'Normal', 'Low'
        public int? InspectorId { get; set; }
        public decimal? EstimatedHours { get; set; }
        public decimal? ActualHours { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;

        public QCInspector? Inspector { get; set; }
    }
}
