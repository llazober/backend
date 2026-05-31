using System;

namespace QCScheduler.Api.Models.Epicor
{
    public class JobOper
    {
        public string JobNum { get; set; } = string.Empty;
        public int AssemblySeq { get; set; }
        public int OprSeq { get; set; }
        public string OpCode { get; set; } = string.Empty;
        public string OpDesc { get; set; } = string.Empty;
        public bool OpComplete { get; set; }
        public string WCCode { get; set; } = string.Empty;

        public JobHead JobHead { get; set; } = null!;
    }
}
