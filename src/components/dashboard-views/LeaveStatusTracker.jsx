import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function LeaveStatusTracker({ leave, approvalChain }) {
  if (!approvalChain || approvalChain.length === 0) {
    return <p className="text-sm text-muted-foreground">No approvals required. (Auto-approve)</p>;
  }

  const pendingIds = leave.pendingAtNodes ? leave.pendingAtNodes.map(n => n.id) : [];
  const currentLevelIndex = approvalChain.findIndex(lvl => lvl.some(node => pendingIds.includes(node.id)));

  return (
    <div className="relative pl-4 space-y-6 before:absolute before:left-[21px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {approvalChain.map((level, i) => {
        let state = 'pending';
        if (leave.status === 'APPROVED') state = 'approved';
        else if (leave.status === 'REJECTED' && currentLevelIndex === i) state = 'rejected';
        else if (leave.status === 'REJECTED' && currentLevelIndex === -1 && i === approvalChain.length - 1) state = 'rejected';
        else if (currentLevelIndex !== -1) {
          if (i < currentLevelIndex) state = 'approved';
          else if (i === currentLevelIndex) state = 'current';
        }

        const nodeIdsInLevel = level.map(n => n.id);
        const actionLog = leave.auditLogs?.find(log => nodeIdsInLevel.includes(log.nodeId) && ['APPROVED', 'REJECTED', 'PROPOSED_DATES'].includes(log.action));

        return (
          <div key={i} className="relative flex items-start gap-4">
            <div className={cn(
              "relative z-10 w-3 h-3 mt-1.5 rounded-full ring-4 ring-background",
              state === 'approved' ? "bg-emerald-500" : state === 'current' ? "bg-primary animate-pulse" : state === 'rejected' ? "bg-destructive" : "bg-muted-foreground/30"
            )} />
            <div className="flex flex-col">
              <span className={cn(
                "text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-2",
                state === 'approved' ? "text-emerald-600" : state === 'current' ? "text-primary" : state === 'rejected' ? "text-destructive" : "text-muted-foreground"
              )}>
                Level {i + 1} {state === 'approved' && '- Approved'} {state === 'rejected' && '- Rejected'} {state === 'current' && '- Pending'}
              </span>
              
              <div className="space-y-1">
                {level.map((node, j) => (
                  <div key={j} className={cn("text-sm", state === 'pending' ? "text-muted-foreground" : "font-medium")}>
                    {node.designation.name} <span className="font-normal opacity-70">({node.department.name})</span>
                  </div>
                ))}
              </div>

              {actionLog && (
                <div className="mt-1 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/50">
                  <span className="font-medium text-foreground">{actionLog.actor.name}</span>
                  {' '}{actionLog.action === 'APPROVED' ? 'approved' : actionLog.action === 'REJECTED' ? 'rejected' : 'proposed dates'}{' on '}
                  {format(new Date(actionLog.createdAt), 'MMM d, yyyy - h:mm a')}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
}
