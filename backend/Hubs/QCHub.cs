using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace QCScheduler.Api.Hubs
{
    public class QCHub : Hub
    {
        public async Task JoinBoard()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "KanbanBoard");
        }

        public async Task LeaveBoard()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "KanbanBoard");
        }
    }
}
