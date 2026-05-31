using System.Collections.Generic;

namespace QCScheduler.Api.Models.Scheduler
{
    public class QCInspector
    {
        public int InspectorId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool Active { get; set; } = true;
        public string Shift { get; set; } = string.Empty;
        public string SkillLevel { get; set; } = string.Empty;

        public ICollection<QCJob> Jobs { get; set; } = new List<QCJob>();
    }
}
