using System;
using System.Collections.Generic;

namespace QCScheduler.Api.Models.Epicor
{
    public class JobHead
    {
        public string JobNum { get; set; } = string.Empty;
        public string PartNum { get; set; } = string.Empty;
        public string PartDescription { get; set; } = string.Empty;
        public decimal ProdQty { get; set; }
        public decimal QtyCompleted { get; set; }
        public DateTime DueDate { get; set; }
        public string JobPriority { get; set; } = "Normal";

        public ICollection<JobOper> Operations { get; set; } = new List<JobOper>();
    }
}
