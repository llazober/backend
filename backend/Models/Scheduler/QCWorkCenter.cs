namespace QCScheduler.Api.Models.Scheduler
{
    public class QCWorkCenter
    {
        public int WorkCenterId { get; set; }
        public string WorkCenterCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool Active { get; set; } = true;
    }
}
